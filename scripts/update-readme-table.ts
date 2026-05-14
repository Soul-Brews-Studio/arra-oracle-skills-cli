import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { profiles, ZOMBIE_SKILLS, skillDirFor } from '../src/profiles.js';

const README_PATH = join(process.cwd(), 'README.md');

function generateProfileTable(totalSkills: number): string {
  const lines: string[] = [
    '| Profile | Count | Skills |',
    '|---------|-------|--------|',
  ];

  for (const [name, profile] of Object.entries(profiles)) {
    const skills = profile.include;
    if (skills && skills.length > 0) {
      lines.push(`| **${name}** | ${skills.length} | ${skills.map(s => `\`${s}\``).join(', ')} |`);
    } else {
      lines.push(`| **${name}** | ${totalSkills} | all |`);
    }
  }

  return lines.join('\n');
}

async function generateZombieTable(): Promise<string> {
  const skillsRoot = join(process.cwd(), 'src', 'skills');
  const rows: string[] = [];

  for (const name of ZOMBIE_SKILLS) {
    const dir = skillDirFor(name, skillsRoot);
    const skillFile = join(dir, 'SKILL.md');
    if (!existsSync(skillFile)) continue;

    const content = await readFile(skillFile, 'utf-8');
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (!frontmatterMatch) continue;

    const fm = frontmatterMatch[1];
    const descMatch = fm.match(/^description:\s*['"]?(.*?)['"]?\s*$/m);
    let desc = descMatch ? descMatch[1] : name;
    // Strip [core]/[lab] markers and version prefixes from description
    desc = desc.replace(/^\[.*?\]\s*/g, '').replace(/^v[\d.]+-?\S*\s*\|\s*/, '');
    if (desc.length > 60) desc = desc.substring(0, 57) + '...';

    rows.push(`| \`/${name}\` | ${desc} |`);
  }

  return rows.join('\n');
}

async function updateReadmeTable() {
  // Generate new skills table
  const table = execSync('bun run scripts/generate-table.ts', { encoding: 'utf-8' }).trim();

  // Read current README
  let readme = await readFile(README_PATH, 'utf-8');

  // --- Update skills table ---
  const skillsStart = readme.indexOf('<!-- skills:start -->');
  const skillsEnd = readme.indexOf('<!-- skills:end -->');

  if (skillsStart === -1 || skillsEnd === -1) {
    console.log('Could not find skills table markers in README');
    process.exit(1);
  }

  const before = readme.substring(0, skillsStart + '<!-- skills:start -->'.length);
  const after = readme.substring(skillsEnd);

  // --- Count total skills (used in both summary + profile table) ---
  const skillCount = (table.match(/^\| \d+/gm) || []).length;

  // Wrap the long skills table in <details> so it collapses by default.
  // GitHub Markdown requires a blank line between <summary> and the table
  // for the table to render correctly inside the collapsed block.
  const collapsibleTable = [
    '<details>',
    `<summary>📚 <strong>${skillCount} skills installed</strong> — click to expand</summary>`,
    '',
    table,
    '',
    '</details>',
  ].join('\n');

  readme = `${before}\n\n${collapsibleTable}\n\n${after}`;

  // --- Update profiles section ---
  const profileStart = readme.indexOf('<!-- profiles:start -->');
  const profileEnd = readme.indexOf('<!-- profiles:end -->');

  if (profileStart !== -1 && profileEnd !== -1) {
    const profileBefore = readme.substring(0, profileStart + '<!-- profiles:start -->'.length);
    const profileAfter = readme.substring(profileEnd);

    const profileTable = generateProfileTable(skillCount);

    readme = `${profileBefore}\n\n${profileTable}\n\nSwitch anytime: \`/go standard\`, \`/go full\`, \`/go lab\`\n\n${profileAfter}`;
  }

  // --- Update header skill count ---
  readme = readme.replace(
    /\d+ skills for AI coding agents/,
    `${skillCount} skills for AI coding agents`
  );

  // --- Update version in install commands ---
  const pkg = JSON.parse(await readFile(join(process.cwd(), 'package.json'), 'utf-8'));
  const version = pkg.version;
  readme = readme.replaceAll(
    /arra-oracle-skills@[\w.\-]+ install/g,
    `arra-oracle-skills@${version} install`
  );

  // --- Update zombie skills section ---
  const secretStart = readme.indexOf('<!-- secret-skills:start -->');
  const secretEnd = readme.indexOf('<!-- secret-skills:end -->');

  if (secretStart !== -1 && secretEnd !== -1) {
    const secretBefore = readme.substring(0, secretStart + '<!-- secret-skills:start -->'.length);
    const secretAfter = readme.substring(secretEnd);

    const zombieTable = await generateZombieTable();
    const zombieCount = zombieTable.split('\n').filter(l => l.startsWith('|')).length;

    const secretSection = [
      '',
      `## Zombie Skills`,
      '',
      `${zombieCount} skills excluded from all profiles. Install by name:`,
      '',
      '```bash',
      'npx arra-oracle-skills install -g -y -s <name>',
      '```',
      '',
      '| Skill | What |',
      '|-------|------|',
      zombieTable,
      '',
    ].join('\n');

    readme = `${secretBefore}\n${secretSection}${secretAfter}`;
  }

  // Check if changed
  const original = await readFile(README_PATH, 'utf-8');
  if (readme === original) {
    console.log('README is up to date');
    process.exit(0);
  }

  // Write updated README
  await writeFile(README_PATH, readme);
  console.log('README updated (skills table + profiles)');

  // Stage the change
  execSync('git add README.md');
  console.log('README.md staged');
}

updateReadmeTable().catch(console.error);
