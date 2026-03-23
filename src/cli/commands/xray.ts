import type { Command } from 'commander';
import * as p from '@clack/prompts';
import { agents, detectInstalledAgents } from '../agents.js';
import { discoverSkills } from '../installer.js';
import { profiles, features } from '../../profiles.js';

/** Decode Claude Code project dir name, stripping $HOME prefix */
function decodeProjName(encoded: string, home: string): string {
  const homeEncoded = home.replace(/^\//, '-').replace(/[/.]/g, '-');
  let name = encoded;
  if (name.startsWith(homeEncoded)) name = name.slice(homeEncoded.length);
  return name.replace(/^-+/, '').replace(/-/g, '/');
}

// ── Skill inspect ─────────────────────────────────────────

async function inspectSkill(skillName?: string) {
  const { existsSync, readFileSync, readdirSync, statSync } = await import('fs');
  const { join } = await import('path');

  const allSkills = await discoverSkills();

  if (!skillName) {
    const choice = await p.select({
      message: 'Select a skill to inspect:',
      options: allSkills.map((s) => ({
        value: s.name,
        label: s.hidden ? `${s.name} (hidden)` : s.name,
        hint: s.description.slice(0, 60),
      })),
    });
    if (p.isCancel(choice)) return;
    skillName = choice as string;
  }

  const skill = allSkills.find((s) => s.name === skillName);
  if (!skill) {
    p.log.error(`Skill not found: ${skillName}`);
    p.log.info(`Available: ${allSkills.map((s) => s.name).join(', ')}`);
    return;
  }

  console.log(`\n  ╔══════════════════════════════════════╗`);
  console.log(`  ║  🔬 Inspect: ${skill.name.padEnd(23)}║`);
  console.log(`  ╚══════════════════════════════════════╝\n`);

  console.log(`  Description:`);
  const words = skill.description.split(' ');
  let line = '    ';
  for (const word of words) {
    if (line.length + word.length > 74) { console.log(line); line = '    ' + word; }
    else { line += (line.trim() ? ' ' : '') + word; }
  }
  if (line.trim()) console.log(line);
  console.log('');

  console.log(`  ⚡ Hidden: ${skill.hidden ? 'yes (agent-callable only)' : 'no (visible in autocomplete)'}`);
  console.log(`  📁 Source: ${skill.path}`);

  const inProfiles: string[] = [];
  for (const [name, profile] of Object.entries(profiles)) {
    if (!profile.include) inProfiles.push(`${name} (all)`);
    else if (profile.include.includes(skill.name)) inProfiles.push(name);
  }
  console.log(`  📦 Profiles: ${inProfiles.join(', ') || 'none'}`);

  const inFeatures: string[] = [];
  for (const [name, skills] of Object.entries(features)) {
    if (skills.includes(skill.name)) inFeatures.push(name);
  }
  if (inFeatures.length > 0) console.log(`  🧩 Features: ${inFeatures.join(', ')}`);

  console.log(`\n  Agents:\n`);
  const detected = detectInstalledAgents();
  for (const agentName of detected) {
    const agent = agents[agentName as keyof typeof agents];
    if (!agent) continue;
    const hasSkill = existsSync(join(agent.globalSkillsDir, skill.name, 'SKILL.md'));
    let hasCmd = false;
    if (agent.globalCommandsDir) {
      const ext = agent.commandFormat === 'toml' ? 'toml' : 'md';
      hasCmd = existsSync(join(agent.globalCommandsDir, `${skill.name}.${ext}`));
    }
    console.log(`    ${hasSkill ? '✓' : '✗'} ${agent.displayName.padEnd(18)} ${hasSkill ? 'installed' : 'not installed'}  ${hasCmd ? '✓ cmd' : '✗ cmd'}`);
  }

  if (!skill.path.startsWith('vfs://')) {
    const skillMd = join(skill.path, 'SKILL.md');
    if (existsSync(skillMd)) {
      const content = readFileSync(skillMd, 'utf-8');
      console.log(`\n  📊 SKILL.md:`);
      console.log(`    Lines:       ${content.split('\n').length}`);
      console.log(`    Size:        ${(statSync(skillMd).size / 1024).toFixed(1)}KB`);
      console.log(`    Phases:      ${(content.match(/^## Phase/gm) || []).length}`);
      console.log(`    Code blocks: ${Math.floor((content.match(/```/g) || []).length / 2)}`);
    }
    const hooksPath = join(skill.path, 'hooks', 'hooks.json');
    if (existsSync(hooksPath)) {
      try {
        const hooks = JSON.parse(readFileSync(hooksPath, 'utf-8'));
        console.log(`    Hooks:       ${Array.isArray(hooks) ? hooks.length : Object.keys(hooks).length}`);
      } catch { console.log(`    Hooks:       yes`); }
    }
    const files = readdirSync(skill.path, { withFileTypes: true });
    const extra = files.filter((f) => f.name !== 'SKILL.md' && !f.name.startsWith('.'));
    if (extra.length > 0) console.log(`    Extra files: ${extra.map((f) => f.name).join(', ')}`);
  }
  console.log('');
}

// ── Memory x-ray ──────────────────────────────────────────

async function xrayMemory(project?: string, showAll?: boolean) {
  const { existsSync, readdirSync, readFileSync, statSync } = await import('fs');
  const { join } = await import('path');
  const { homedir } = await import('os');

  const home = homedir();
  const projectsDir = join(home, '.claude', 'projects');
  if (!existsSync(projectsDir)) { console.log('\n  No Claude Code projects found.\n'); return; }

  const allProjects = readdirSync(projectsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => existsSync(join(projectsDir, name, 'memory')));

  if (allProjects.length === 0) { console.log('\n  No projects with memory found.\n'); return; }

  if (showAll) {
    console.log(`\n  ╔══════════════════════════════════════════╗`);
    console.log(`  ║  🧠 X-Ray Memory — All Projects           ║`);
    console.log(`  ╚══════════════════════════════════════════╝\n`);

    let totalMemories = 0, totalSize = 0;
    for (const proj of allProjects) {
      const memDir = join(projectsDir, proj, 'memory');
      const files = readdirSync(memDir).filter((f) => f.endsWith('.md') && f !== 'MEMORY.md');
      if (files.length === 0) continue;
      const size = files.reduce((sum, f) => { try { return sum + statSync(join(memDir, f)).size; } catch { return sum; } }, 0);
      console.log(`    ${String(files.length).padStart(3)} memories  ${((size / 1024).toFixed(1) + 'KB').padStart(8)}  ${decodeProjName(proj, home)}`);
      totalMemories += files.length;
      totalSize += size;
    }
    const projCount = allProjects.filter((p) => readdirSync(join(projectsDir, p, 'memory')).filter((f) => f.endsWith('.md') && f !== 'MEMORY.md').length > 0).length;
    console.log(`\n    Total: ${totalMemories} memories across ${projCount} projects (${(totalSize / 1024).toFixed(1)}KB)\n`);
    return;
  }

  // Single project — default to cwd
  let targetProject: string | undefined;

  if (project) {
    // Normalize: convert slashes/dots to dashes for matching
    const needle = project.replace(/[/.]/g, '-');
    // Prefer exact end match, then shortest substring match
    const matches = allProjects.filter((p) => p.includes(needle));
    targetProject = matches.find((p) => p.endsWith(needle)) || matches.sort((a, b) => a.length - b.length)[0];
  } else {
    const encoded = process.cwd().replace(/^\//, '-').replace(/[/.]/g, '-');
    targetProject = allProjects.find((p) => p === encoded);
    if (!targetProject) {
      targetProject = allProjects
        .filter((p) => encoded.startsWith(p) || p.startsWith(encoded))
        .sort((a, b) => b.length - a.length)[0];
    }
  }

  if (!targetProject) {
    const withMemories = allProjects.filter((p) => readdirSync(join(projectsDir, p, 'memory')).filter((f) => f.endsWith('.md') && f !== 'MEMORY.md').length > 0);
    const choice = await p.select({
      message: 'Select a project:',
      options: withMemories.map((p) => ({ value: p, label: decodeProjName(p, home) })),
    });
    if (p.isCancel(choice)) return;
    targetProject = choice as string;
  }

  const memDir = join(projectsDir, targetProject, 'memory');
  const files = readdirSync(memDir).filter((f) => f.endsWith('.md') && f !== 'MEMORY.md');
  const shortName = decodeProjName(targetProject, home);

  console.log(`\n  ╔══════════════════════════════════════════╗`);
  console.log(`  ║  🧠 X-Ray Memory                          ║`);
  console.log(`  ╚══════════════════════════════════════════╝`);
  console.log(`  📁 ${shortName}`);
  console.log(`  📂 ${memDir}\n`);

  if (files.length === 0) { console.log('    (no memories)\n'); return; }

  interface MemEntry { file: string; name: string; type: string; description: string; age: string; ageMs: number; size: number; snippet: string; }
  const entries: MemEntry[] = [];
  const now = Date.now();

  for (const file of files) {
    try {
      const content = readFileSync(join(memDir, file), 'utf-8');
      const stat = statSync(join(memDir, file));
      const ageMs = now - stat.mtimeMs;
      const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
      let name = file.replace('.md', ''), type = 'unknown', description = '';
      if (fmMatch) {
        const fm = fmMatch[1];
        const n = fm.match(/name:\s*(.+)/); if (n) name = n[1].trim();
        const t = fm.match(/type:\s*(.+)/); if (t) type = t[1].trim();
        const d = fm.match(/description:\s*(.+)/); if (d) description = d[1].trim();
      }
      // Extract body snippet (first 3 non-empty lines after frontmatter)
      const body = fmMatch ? content.slice(fmMatch[0].length) : content;
      const bodyLines = body.split('\n').filter((l) => l.trim()).slice(0, 3);
      const snippet = bodyLines.map((l) => l.trim()).join(' ').slice(0, 120);

      const days = Math.floor(ageMs / 86400000);
      entries.push({ file, name, type, description, age: days > 0 ? `${days}d` : `${Math.floor(ageMs / 3600000)}h`, ageMs, size: stat.size, snippet });
    } catch {}
  }

  entries.sort((a, b) => a.type.localeCompare(b.type) || a.ageMs - b.ageMs);
  const icon: Record<string, string> = { feedback: '📝', reference: '📚', user: '👤', project: '📋', unknown: '❓' };

  for (const e of entries) {
    console.log(`  ${icon[e.type] || '❓'} ${e.type.padEnd(10)} ${e.name}  (${e.age})`);
    console.log(`    📄 ${join(memDir, e.file)}`);
    console.log(`    ${e.description}`);
    if (e.snippet) {
      const snip = e.snippet.length > 100 ? e.snippet.slice(0, 97) + '...' : e.snippet;
      console.log(`    ▸ ${snip}`);
    }
    console.log('');
  }

  const typeCounts: Record<string, number> = {};
  let totalSize = 0;
  for (const e of entries) { typeCounts[e.type] = (typeCounts[e.type] || 0) + 1; totalSize += e.size; }

  console.log(`\n  Total: ${entries.length} memories (${(totalSize / 1024).toFixed(1)}KB)`);
  const maxCount = Math.max(...Object.values(typeCounts));
  for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    const barLen = Math.round((count / maxCount) * 16);
    console.log(`    ${icon[type] || '❓'} ${type.padEnd(12)} ${'█'.repeat(barLen)}${'░'.repeat(16 - barLen)}  ${count}`);
  }

  const indexPath = join(memDir, 'MEMORY.md');
  if (existsSync(indexPath)) console.log(`\n  📑 Index: MEMORY.md (${readFileSync(indexPath, 'utf-8').split('\n').length} lines)`);
  console.log('');
}

// ── Register commands ─────────────────────────────────────

export function registerXray(program: Command, version: string) {
  // oracle-skills inspect [skill]
  program
    .command('inspect [skill]')
    .description('Inspect a skill — profiles, agents, hooks, hidden status')
    .action(async (skillName?: string) => inspectSkill(skillName));

  // oracle-skills xray memory [project] | oracle-skills xray memory --all
  program
    .command('xray <target> [project]')
    .description('X-ray deep scan (e.g., xray memory)')
    .option('-a, --all', 'Show all projects')
    .action(async (target: string, project?: string, options?: { all?: boolean }) => {
      if (target === 'memory' || target === 'mem') {
        return xrayMemory(project, options?.all);
      }
      console.log(`\n  Unknown target: ${target}`);
      console.log('  Available: oracle-skills xray memory [project] [--all]\n');
    });
}
