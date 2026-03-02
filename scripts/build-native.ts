#!/usr/bin/env bun
/**
 * Build native binaries for oracle-skills-cli
 *
 * 1. Generate VFS from skills
 * 2. Generate command stubs
 * 3. Cross-compile for 4 targets
 */

import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const ROOT = join(import.meta.dir, '..');

// Step 1: Generate VFS
console.log('Step 1: Generating VFS...');
const vfsResult = Bun.spawnSync(['bun', join(ROOT, 'scripts/generate-vfs.ts')], {
  cwd: ROOT,
  stdout: 'inherit',
  stderr: 'inherit',
});
if (vfsResult.exitCode !== 0) {
  console.error('VFS generation failed');
  process.exit(1);
}

// Step 2: Generate command stubs
console.log('\nStep 2: Generating command stubs...');
const compileResult = Bun.spawnSync(['bun', join(ROOT, 'scripts/compile.ts')], {
  cwd: ROOT,
  stdout: 'inherit',
  stderr: 'inherit',
});
if (compileResult.exitCode !== 0) {
  console.error('Command stub generation failed');
  process.exit(1);
}

// Step 3: Compile for each target
const targets = [
  { target: 'bun-darwin-arm64', name: 'oracle-skills-darwin-arm64' },
  { target: 'bun-darwin-x64', name: 'oracle-skills-darwin-x64' },
  { target: 'bun-linux-x64', name: 'oracle-skills-linux-x64' },
  { target: 'bun-linux-arm64', name: 'oracle-skills-linux-arm64' },
];

// Allow building a single target via CLI arg
const targetArg = process.argv[2];
const filteredTargets = targetArg
  ? targets.filter((t) => t.name.includes(targetArg) || t.target.includes(targetArg))
  : targets;

if (filteredTargets.length === 0) {
  console.error(`No matching target for: ${targetArg}`);
  console.error(`Available: ${targets.map((t) => t.name).join(', ')}`);
  process.exit(1);
}

const distDir = join(ROOT, 'dist');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

console.log(`\nStep 3: Compiling ${filteredTargets.length} target(s)...\n`);

for (const { target, name } of filteredTargets) {
  const outfile = join(distDir, name);
  console.log(`  Compiling ${name}...`);

  const args = [
    'build',
    '--compile',
    '--minify',
    `--target=${target}`,
    `--outfile=${outfile}`,
    '--define', 'IS_COMPILED=true',
    join(ROOT, 'src/cli/index.ts'),
  ];

  const result = Bun.spawnSync(['bun', ...args], {
    cwd: ROOT,
    stdout: 'inherit',
    stderr: 'inherit',
  });

  if (result.exitCode !== 0) {
    console.error(`  Failed to compile ${name}`);
    process.exit(1);
  }
  console.log(`  Done: ${outfile}`);
}

console.log('\nAll targets compiled successfully.');
