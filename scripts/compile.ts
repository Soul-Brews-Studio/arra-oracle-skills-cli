import { readdir, readFile, writeFile, mkdir, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import pkg from '../package.json' with { type: 'json' };

const SKILLS_DIR = join(process.cwd(), 'src', 'skills');
const COMMANDS_DIR = join(process.cwd(), 'src', 'commands');

/** Quote YAML description values that start with [ to prevent YAML sequence parsing */
function yamlQuote(desc: string): string {
  return desc.startsWith('[') ? `'${desc.replace(/'/g, "''")}'` : desc;
}

async function compile() {
  console.log(`🔮 Compiling skills to commands (v${pkg.version})...`);

  if (!existsSync(COMMANDS_DIR)) {
    await mkdir(COMMANDS_DIR);
  }

  const skills = await readdir(SKILLS_DIR, { withFileTypes: true });

  let count = 0;
  const written = new Set<string>();

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
        
        // Extract description
        const descMatch = frontmatter.match(/description:\s*(.+)$/m);
        const rawDescription = descMatch ? descMatch[1].trim() : `${skillName} skill`;

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

  console.log(`\n✨ Compiled ${count} skill stubs + ${Object.keys(aliases).length} alias(es) to ${COMMANDS_DIR}${pruned > 0 ? ` (pruned ${pruned} stale stub${pruned === 1 ? '' : 's'})` : ''}`);
}

compile().catch(console.error);
