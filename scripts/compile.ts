import { readdir, readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import pkg from '../package.json' with { type: 'json' };

// compile.ts — validate skill frontmatter + generate the marketplace manifest.
//
// Command stubs are NOT generated here anymore: nothing consumed the old
// src/commands/*.md output. The installer writes agent-specific stubs inline
// at install time (src/cli/installer.ts), and Claude Code invokes SKILL.md
// directly as /name. Skills are the only source of truth.

const SKILLS_DIR = join(process.cwd(), 'src', 'skills');
const MARKETPLACE_PATH = join(process.cwd(), '.claude-plugin', 'marketplace.json');

// ── Frontmatter validation (official Agent Skills spec) ────────────────
// name: ≤64 chars, lowercase/digits/hyphens, no reserved words
// description: non-empty, ≤1024 chars, no XML tags
// body: >500 lines is a warning (official guidance, not a hard limit)
// Ref: platform.claude.com/docs/en/agents-and-tools/agent-skills/overview

interface ValidationIssue {
  skill: string;
  message: string;
}

function validateSkill(
  skillName: string,
  frontmatter: string,
  fullContent: string,
  errors: ValidationIssue[],
  warnings: ValidationIssue[],
): void {
  const nameMatch = frontmatter.match(/^name:\s*(.+)$/m);
  const name = nameMatch ? nameMatch[1].trim() : skillName;

  if (name.length > 64) {
    errors.push({ skill: skillName, message: `name is ${name.length} chars (max 64)` });
  }
  if (!/^[a-z0-9-]+$/.test(name)) {
    errors.push({ skill: skillName, message: `name "${name}" must be lowercase letters, numbers, and hyphens only` });
  }
  if (/claude|anthropic/i.test(name)) {
    errors.push({ skill: skillName, message: `name "${name}" contains a reserved word (claude/anthropic)` });
  }
  if (nameMatch && name !== skillName) {
    warnings.push({ skill: skillName, message: `frontmatter name "${name}" doesn't match directory name` });
  }

  const descMatch = frontmatter.match(/description:\s*(.+)$/m);
  const description = descMatch ? descMatch[1].trim() : '';
  if (!description) {
    errors.push({ skill: skillName, message: 'description is missing or empty' });
  } else {
    if (description.length > 1024) {
      errors.push({ skill: skillName, message: `description is ${description.length} chars (max 1024)` });
    }
    if (/<[a-zA-Z][^>]*>/.test(description)) {
      errors.push({ skill: skillName, message: 'description contains XML/HTML tags' });
    }
  }

  const lineCount = fullContent.split('\n').length;
  if (lineCount > 500) {
    warnings.push({ skill: skillName, message: `SKILL.md is ${lineCount} lines (official guidance: keep under 500 — move detail to references/)` });
  }
}

async function compile() {
  console.log(`🔮 Validating skills + generating manifest (v${pkg.version})...`);

  const skills = await readdir(SKILLS_DIR, { withFileTypes: true });

  let count = 0;
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  // Curated entries for .claude-plugin/marketplace.json — the explicit
  // allowlist external ecosystems read. secret/hidden/zombie skills are
  // simply never listed here.
  const marketplaceSkills: { name: string; description: string }[] = [];

  for (const dirent of skills) {
    if (!dirent.isDirectory() || dirent.name.startsWith('.') || dirent.name === '_template') continue;

    const skillName = dirent.name;
    const skillPath = join(SKILLS_DIR, skillName, 'SKILL.md');

    if (existsSync(skillPath)) {
      const content = await readFile(skillPath, 'utf-8');
      const parts = content.split(/^---\s*$/m);

      if (parts.length >= 3) {
        const frontmatter = parts[1];

        validateSkill(skillName, frontmatter, content, errors, warnings);

        const descMatch = frontmatter.match(/description:\s*(.+)$/m);
        const rawDescription = descMatch ? descMatch[1].trim() : `${skillName} skill`;

        // Curation flags — same regexes as discoverSkills() in src/cli/skill-source.ts
        const isSecret = /secret:\s*(true|yes)/i.test(frontmatter);
        const isHidden = /hidden:\s*(true|yes)/i.test(frontmatter);
        const isZombie = /zombie:\s*(true|yes)/i.test(frontmatter);
        if (!isSecret && !isHidden && !isZombie) {
          marketplaceSkills.push({ name: skillName, description: rawDescription });
        }

        console.log(`✓ ${skillName}`);
        count++;
      } else {
        errors.push({ skill: skillName, message: 'SKILL.md has no frontmatter block (--- ... ---)' });
      }
    }
  }

  // ── Archive integrity gate ─────────────────────────────────────────────
  // Every skill parked under src/skills/.archive/ MUST carry a curation flag
  // (zombie/secret/hidden) in its frontmatter. That flag is the ONLY zombie
  // signal that survives into the compiled binary: the VFS (scripts/generate-vfs.ts)
  // flattens active + archived skills into one name→files map with NO .archive/
  // path info, so discoverSkills() in compiled mode can't tell them apart by
  // location. A skill moved to .archive/ but left unflagged therefore silently
  // leaks back into the `full`/`lab` install profiles. This gate fails the
  // build the moment that happens (regression: 2026-07 zombie round 2 moved 11
  // skills to .archive/ but forgot the frontmatter flag → they kept installing).
  const archiveDir = join(SKILLS_DIR, '.archive');
  if (existsSync(archiveDir)) {
    for (const dirent of await readdir(archiveDir, { withFileTypes: true })) {
      if (!dirent.isDirectory() || dirent.name.startsWith('.')) continue;
      const md = join(archiveDir, dirent.name, 'SKILL.md');
      if (!existsSync(md)) continue;
      const fm = (await readFile(md, 'utf-8')).split(/^---\s*$/m)[1] ?? '';
      if (!/(zombie|secret|hidden):\s*(true|yes)/i.test(fm)) {
        errors.push({
          skill: `.archive/${dirent.name}`,
          message: 'archived skill lacks a zombie/secret/hidden frontmatter flag — it would leak into full/lab install (the compiled VFS has no .archive/ path signal). Add `zombie: true` to its frontmatter.',
        });
      }
    }
  }

  // ── .claude-plugin/marketplace.json — explicit allowlist manifest ──────
  // The only curation mechanism external ecosystems honor (Claude Code
  // plugin marketplaces read this; nothing scans for unlisted skills).
  // Descriptions are raw (no version prefix) to keep the committed file
  // stable across version bumps.
  marketplaceSkills.sort((a, b) => a.name.localeCompare(b.name));
  const marketplace = {
    name: 'oracle-skills',
    owner: {
      name: 'Nat Weerawan',
      url: 'https://github.com/Soul-Brews-Studio',
    },
    // No version field here on purpose: version lives ONLY in package.json,
    // always computed by /calver (date+time → v{yy}.{m}.{d}-alpha.{HMM}).
    // Embedding it would go stale on every calver bump (calver writes
    // package.json directly, bypassing the npm version hook) and trip the
    // CI drift gate. Keeping the manifest version-free = byte-stable across
    // releases; it only changes when skills actually change.
    metadata: {
      description: 'Oracle Skills — symbiotic-intelligence skills for Claude Code and friends',
    },
    plugins: [
      {
        name: 'oracle-skills',
        source: '.',
        description: 'Curated Oracle skill set (secret/archived tiers are intentionally not listed)',
        strict: false,
        skills: marketplaceSkills.map((s) => `./src/skills/${s.name}`),
      },
    ],
  };
  if (!existsSync(join(process.cwd(), '.claude-plugin'))) {
    await mkdir(join(process.cwd(), '.claude-plugin'));
  }
  await writeFile(MARKETPLACE_PATH, JSON.stringify(marketplace, null, 2) + '\n');
  console.log(`📦 marketplace.json: ${marketplaceSkills.length} curated skills listed`);

  for (const w of warnings) {
    console.warn(`⚠️  ${w.skill}: ${w.message}`);
  }
  if (errors.length > 0) {
    for (const e of errors) {
      console.error(`❌ ${e.skill}: ${e.message}`);
    }
    console.error(`\n💥 ${errors.length} validation error(s) — fix frontmatter before compiling.`);
    process.exit(1);
  }

  console.log(`\n✨ Validated ${count} skills — ${marketplaceSkills.length} curated in marketplace.json`);
}

compile().catch((err) => {
  console.error(err);
  process.exit(1);
});
