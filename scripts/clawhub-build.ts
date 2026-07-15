import { readdirSync, existsSync, rmSync } from 'fs';
import { readFile, writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { $ } from 'bun';
import pkg from '../package.json' with { type: 'json' };

// Public shelf (skills/) once the move lands; vault (src/skills/) pre-move.
const SKILLS_DIR = existsSync('skills') ? 'skills' : 'src/skills';
const OUT_DIR = 'dist/clawhub';
const PUBLISHER = 'soul-brews-studio';

const EXCLUDES = [
  'ψ/',
  'psi/',
  '.git/',
  'node_modules/',
  '__tests__/',
  '*.test.ts',
  '.DS_Store',
];

// Clean output directory
if (existsSync(OUT_DIR)) {
  rmSync(OUT_DIR, { recursive: true });
}
await mkdir(OUT_DIR, { recursive: true });

// Discover skills (skip _template)
const skills = readdirSync(SKILLS_DIR).filter(
  (name) =>
    !name.startsWith('_') &&
    existsSync(join(SKILLS_DIR, name, 'SKILL.md'))
);

let totalSize = 0;

for (const name of skills) {
  const src = join(SKILLS_DIR, name) + '/';
  const dest = join(OUT_DIR, name) + '/';

  // rsync with excludes, preserving permissions
  const excludeArgs = EXCLUDES.flatMap((e) => ['--exclude', e]);
  await $`rsync -a ${excludeArgs} ${src} ${dest}`.quiet();

  // Inject frontmatter into SKILL.md
  const skillMd = join(dest, 'SKILL.md');
  if (existsSync(skillMd)) {
    let content = await readFile(skillMd, 'utf-8');
    if (content.startsWith('---')) {
      content = content.replace(
        /^---\n/,
        `---\nversion: ${pkg.version}\npublisher: ${PUBLISHER}\n`
      );
      await writeFile(skillMd, content);
    }
  }

  // Tally size
  const du = await $`du -sk ${dest}`.text();
  const kb = parseInt(du.split('\t')[0], 10);
  totalSize += kb;

  console.log(`  ${name}`);
}

console.log(`\n✓ ${skills.length} skills → ${OUT_DIR}/ (${(totalSize / 1024).toFixed(1)} MB)`);
