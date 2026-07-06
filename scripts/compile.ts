import { readdir, readFile, writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import pkg from '../package.json' with { type: 'json' };

const SKILLS_DIR = join(process.cwd(), 'src', 'skills');
const COMMANDS_DIR = join(process.cwd(), 'src', 'commands');
const MARKETPLACE_PATH = join(process.cwd(), '.claude-plugin', 'marketplace.json');

/** Quote YAML description values that start with [ to prevent YAML sequence parsing */
function yamlQuote(desc: string): string {
  return desc.startsWith('[') ? `'${desc.replace(/'/g, "''")}'` : desc;
}

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
  console.log(`🔮 Compiling skills to commands (v${pkg.version})...`);

  if (!existsSync(COMMANDS_DIR)) {
    await mkdir(COMMANDS_DIR);
  }

  const skills = await readdir(SKILLS_DIR, { withFileTypes: true });

  let count = 0;
  const written = new Set<string>();
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

      // Parse frontmatter
      const parts = content.split(/^---\s*$/m);

      if (parts.length >= 3) {
        const frontmatter = parts[1];

        validateSkill(skillName, frontmatter, content, errors, warnings);

        // Extract description
        const descMatch = frontmatter.match(/description:\s*(.+)$/m);
        const rawDescription = descMatch ? descMatch[1].trim() : `${skillName} skill`;

        // Curation flags — same regexes as discoverSkills() in src/cli/skill-source.ts
        const isSecret = /secret:\s*(true|yes)/i.test(frontmatter);
        const isHidden = /hidden:\s*(true|yes)/i.test(frontmatter);
        const isZombie = /zombie:\s*(true|yes)/i.test(frontmatter);
        if (!isSecret && !isHidden && !isZombie) {
          marketplaceSkills.push({ name: skillName, description: rawDescription });
        }

        // Extract argument-hint (optional)
        const hintMatch = frontmatter.match(/argument-hint:\s*"(.+)"$/m);
        const argumentHint = hintMatch ? hintMatch[1] : null;

        // Inject version
        const description = `${pkg.skillTag ? pkg.skillTag + ' ' : ''}v${pkg.version} | ${rawDescription}`;

        // Create stub command that tells agent to execute skill with args
        const hintLine = argumentHint ? `\nargument-hint: "${argumentHint}"` : '';
        const commandContent = `---
description: ${yamlQuote(description)}${hintLine}
---

# /${skillName}

Execute the \`${skillName}\` skill with the provided arguments.

## Instructions

**If you have a Skill tool available**: Use it directly with \`skill: "${skillName}"\` instead of reading the file manually.

**Otherwise**:
1. Read the skill file at this exact path: \`~/.claude/skills/${skillName}/SKILL.md\`
2. Follow all instructions in the skill file
3. Pass these arguments to the skill: \`$ARGUMENTS\`

**WARNING**: Do NOT use Glob, find, or search for this skill. The path above is the ONLY correct location. Other files with "${skillName}" in the name are NOT this skill.

---
*🧬 Nat Weerawan × Oracle · Symbiotic Intelligence · v${pkg.version}*
*Digitized from Nat Weerawan's brain — thousands of hours working alongside AI, captured as code*
`;

        await writeFile(join(COMMANDS_DIR, `${skillName}.md`), commandContent);
        written.add(`${skillName}.md`);
        console.log(`✓ ${skillName} (v${pkg.version})`);
        count++;
      } else {
        errors.push({ skill: skillName, message: 'SKILL.md has no frontmatter block (--- ... ---)' });
      }
    }
  }

  // Aliases: alternative names pointing to existing skills
  const aliases: Record<string, string> = {
    // retrospective is now a standalone skill, not an alias
  };

  for (const [alias, target] of Object.entries(aliases)) {
    const targetPath = join(SKILLS_DIR, target, 'SKILL.md');
    if (existsSync(targetPath)) {
      const content = await readFile(targetPath, 'utf-8');
      const parts = content.split(/^---\s*$/m);
      const frontmatter = parts.length >= 3 ? parts[1] : '';
      const descMatch = frontmatter.match(/description:\s*(.+)$/m);
      const rawDescription = descMatch ? descMatch[1].trim() : `${target} skill`;

      const aliasContent = `---
description: ${yamlQuote(`v${pkg.version} | Alias for /${target}. ${rawDescription}`)}
---

# /${alias}

This is an alias for \`/${target}\`. Use the Skill tool with \`skill: "${target}"\`.

---
*oracle-skills-cli v${pkg.version}*
`;
      await writeFile(join(COMMANDS_DIR, `${alias}.md`), aliasContent);
      written.add(`${alias}.md`);
    }
  }

  // Prune stale stubs: any .md in COMMANDS_DIR that wasn't (re)written this run
  // means its source skill was renamed/archived/removed — delete the leftover.
  let pruned = 0;
  for (const f of await readdir(COMMANDS_DIR)) {
    if (f.endsWith('.md') && !written.has(f)) {
      await unlink(join(COMMANDS_DIR, f));
      console.log(`✗ pruned stale stub: ${f}`);
      pruned++;
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
    metadata: {
      description: 'Oracle Skills — symbiotic-intelligence skills for Claude Code and friends',
      version: pkg.version,
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

  console.log(`\n✨ Compiled ${count} skill stubs + ${Object.keys(aliases).length} alias(es) to ${COMMANDS_DIR}${pruned > 0 ? ` (pruned ${pruned} stale stub${pruned === 1 ? '' : 's'})` : ''}`);
}

compile().catch((err) => {
  console.error(err);
  process.exit(1);
});
