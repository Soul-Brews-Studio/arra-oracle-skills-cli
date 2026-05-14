import { existsSync, readdirSync } from 'fs';
import { join, dirname, basename } from 'path';
import { homedir, tmpdir } from 'os';
import { rm } from 'fs/promises';
import * as p from '@clack/prompts';
import { agents } from './agents.js';
import type { Skill, InstallOptions } from './types.js';
import { mkdirp, rmrf, cpr, mv, rmf, cp, type ShellMode } from './fs-utils.js';
import { resolveProfile, STANDARD_SKILLS, LAB_SKILLS, MINIMAL_SKILLS, MINIMAL_ONLY_SKILLS, ZOMBIE_SKILLS } from '../profiles.js';
import {
  discoverSkills as _discoverSkills,
  readSkillFile,
  writeSkillToDir,
  skillHasHooks,
  isCompiled,
  getCommandsDir,
} from './skill-source.js';
import pkg from '../../package.json' with { type: 'json' };

// ── Codex 0.128.0+ plugin marketplace helpers ────────────────────────────────

/**
 * Detect if Codex 0.128.0+ plugin marketplace mode is active.
 * Codex 0.128.0 creates ~/.codex/config.toml; older versions do not.
 */
export function isCodexPluginMarketplace(homeDir?: string): boolean {
  const home = homeDir ?? homedir();
  return existsSync(join(home, '.codex', 'config.toml'));
}

/** Return the arra-oracle-skills marketplace bundle directory path. */
export function getCodexMarketplaceDir(homeDir?: string): string {
  const home = homeDir ?? homedir();
  return join(home, '.codex', '.tmp', 'bundled-marketplaces', 'arra-oracle-skills');
}

/**
 * Install skills for Codex 0.128.0+ plugin marketplace.
 *
 * Creates:
 *   <marketplaceDir>/manifest.toml
 *   <marketplaceDir>/plugins/<skill>/plugin.toml
 *   <marketplaceDir>/plugins/<skill>/prompt.md   (skill body)
 *
 * Then updates ~/.codex/config.toml with:
 *   [marketplaces.arra-oracle-skills]  source_type + source
 *   [plugins."<skill>@arra-oracle-skills"]  enabled = true
 */
export async function installCodexPluginMarketplace(
  skills: Skill[],
  version: string,
  shellMode: ShellMode,
  opts?: { marketplaceDir?: string; configPath?: string }
): Promise<void> {
  const marketplaceDir = opts?.marketplaceDir ?? getCodexMarketplaceDir();
  const configPath = opts?.configPath ?? join(homedir(), '.codex', 'config.toml');

  // ── 1. Create marketplace bundle directory ─────────────────────────────────
  await mkdirp(marketplaceDir, shellMode);

  // ── 2. Write marketplace manifest ─────────────────────────────────────────
  const manifestContent = [
    `name = "arra-oracle-skills"`,
    `version = "${version}"`,
    `description = "Oracle skills for Codex by Soul Brews Studio"`,
    ``,
  ].join('\n');
  await Bun.write(join(marketplaceDir, 'manifest.toml'), manifestContent);

  // ── 3. Per-skill plugin directories ───────────────────────────────────────
  const pluginsDir = join(marketplaceDir, 'plugins');
  await mkdirp(pluginsDir, shellMode);

  for (const skill of skills) {
    const skillPluginDir = join(pluginsDir, skill.name);
    await mkdirp(skillPluginDir, shellMode);

    // plugin.toml descriptor
    const escapedDesc = skill.description.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    const pluginToml = [
      `name = "${skill.name}"`,
      `description = "${escapedDesc}"`,
      `version = "${version}"`,
      `command = "/${skill.name}"`,
      ``,
    ].join('\n');
    await Bun.write(join(skillPluginDir, 'plugin.toml'), pluginToml);

    // prompt.md — skill body for Codex to execute
    if (isCompiled()) {
      // VFS mode: write entire skill tree (includes SKILL.md + any extras)
      await writeSkillToDir(skill.name, skillPluginDir);
    } else {
      // Filesystem mode: copy SKILL.md as prompt.md
      const skillMdPath = join(skill.path, 'SKILL.md');
      if (existsSync(skillMdPath)) {
        const content = await Bun.file(skillMdPath).text();
        await Bun.write(join(skillPluginDir, 'prompt.md'), content);
      }
    }
  }

  // ── 4. Update ~/.codex/config.toml ────────────────────────────────────────
  let configContent = existsSync(configPath) ? await Bun.file(configPath).text() : '';

  // Add marketplace registration if not already present
  const marketplaceSection = `[marketplaces.arra-oracle-skills]`;
  if (!configContent.includes(marketplaceSection)) {
    configContent += [
      ``,
      `${marketplaceSection}`,
      `source_type = "local"`,
      `source = "${marketplaceDir}"`,
      ``,
    ].join('\n');
  }

  // Enable each non-hidden skill as a plugin
  for (const skill of skills) {
    if (skill.hidden) continue;
    const pluginKey = `[plugins."${skill.name}@arra-oracle-skills"]`;
    if (!configContent.includes(pluginKey)) {
      configContent += [
        `${pluginKey}`,
        `enabled = true`,
        ``,
      ].join('\n');
    }
  }

  await Bun.write(configPath, configContent);
}

// Re-export discoverSkills from skill-source
export const discoverSkills = _discoverSkills;

/** Quote YAML description values that start with [ to prevent YAML sequence parsing */
function yamlQuote(desc: string): string {
  return desc.startsWith('[') ? `'${desc.replace(/'/g, "''")}'` : desc;
}

// Check if an installed skill was installed by arra-oracle-skills-cli
async function isOurSkill(skillPath: string): Promise<boolean> {
  const skillMdPath = join(skillPath, 'SKILL.md');
  if (!existsSync(skillMdPath)) return false;
  try {
    const content = await Bun.file(skillMdPath).text();
    return content.includes('installer: arra-oracle-skills-cli');
  } catch {
    return false;
  }
}

export async function listSkills(): Promise<void> {
  const skills = await discoverSkills();

  if (skills.length === 0) {
    p.log.warn('No skills found');
    return;
  }

  p.log.info(`Found ${skills.length} skills:\n`);

  for (const skill of skills) {
    const tag = skill.hidden ? ' (hidden)' : skill.zombie ? ' (zombie)' : '';
    console.log(`  ${skill.name}${tag}`);
    if (skill.description) {
      console.log(`    ${skill.description}\n`);
    }
  }
}

export async function installSkills(
  targetAgents: string[],
  options: InstallOptions
): Promise<void> {
  const allSkills = await discoverSkills();

  if (allSkills.length === 0) {
    p.log.error('No skills found to install');
    return;
  }

  // Resolve profile → skill list, then apply --skill filter
  let skillsToInstall = allSkills;
  let profileSkillNames: string[] | null = null;

  if (options.profile) {
    const allNames = allSkills.map((s) => s.name);
    const secretNames = allSkills.filter((s) => s.secret).map((s) => s.name);
    const zombieNames = allSkills.filter((s) => s.zombie).map((s) => s.name);
    profileSkillNames = resolveProfile(options.profile, allNames, secretNames, zombieNames);

    if (profileSkillNames) {
      const extras = options.skills || [];
      const allowed = new Set([...profileSkillNames, ...extras]);
      skillsToInstall = allSkills.filter((s) => allowed.has(s.name));
    }
    // null means "all skills" (full/lab)
  } else if (options.skills && options.skills.length > 0) {
    // -s without --profile: ADD named skills to whatever is already installed
    // This makes -s additive — it won't drop existing skills (#221)
    const alreadyInstalled = new Set<string>();
    for (const agentName of targetAgents) {
      const agent = agents[agentName as keyof typeof agents];
      if (!agent) continue;
      const dir = options.global ? agent.globalSkillsDir : join(process.cwd(), agent.skillsDir);
      if (existsSync(dir)) {
        for (const d of readdirSync(dir, { withFileTypes: true })) {
          if (d.isDirectory() && !d.name.startsWith('.')) {
            alreadyInstalled.add(d.name);
          }
        }
      }
    }
    const requested = new Set(options.skills);
    const combined = new Set([...alreadyInstalled, ...requested]);
    skillsToInstall = allSkills.filter((s) => combined.has(s.name));
  }

  if (skillsToInstall.length === 0) {
    p.log.error(`No matching skills found. Available: ${allSkills.map((s) => s.name).join(', ')}`);
    return;
  }

  // #285 Part 2 — Explicit-profile alignment.
  // When --profile <name> was explicitly passed on the CLI (not the default value),
  // remove arra-managed skills that are no longer in the target profile.
  // Bare `install` (no flag) and `install -s <skill>` remain purely additive (#257 Bug 5).
  if (options.profileExplicit && profileSkillNames !== null) {
    const targetSet = new Set(skillsToInstall.map((s) => s.name));

    for (const agentName of targetAgents) {
      const agent = agents[agentName as keyof typeof agents];
      if (!agent) continue;

      const skillsDir = options.global ? agent.globalSkillsDir : join(process.cwd(), agent.skillsDir);
      if (!existsSync(skillsDir)) continue;

      const installedDirs = readdirSync(skillsDir, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
        .map((d) => d.name);

      const toRemove: string[] = [];
      for (const name of installedDirs) {
        if (targetSet.has(name)) continue;
        if (await isOurSkill(join(skillsDir, name))) {
          toRemove.push(name);
        }
      }

      if (toRemove.length === 0) continue;

      // Always print the diff (even under -y, per #267 follow-up)
      console.log(`\n⚠  Profile alignment — will REMOVE arra-managed skills not in '${options.profile}': ${toRemove.join(', ')}\n`);

      if (!options.yes) {
        const confirmed = await p.confirm({
          message: `Remove ${toRemove.length} skill(s) from ${agent.displayName}?`,
        });
        if (p.isCancel(confirmed) || !confirmed) {
          p.log.info('Alignment cancelled — continuing with additive install only');
          continue;
        }
      }

      const shellMode: ShellMode = options.shellMode || 'auto';
      for (const name of toRemove) {
        const skillPath = join(skillsDir, name);
        await rm(skillPath, { recursive: true, force: true });

        // Also remove command stubs if commands mode is active
        if (agent.commandsDir && options.commands) {
          const commandsDir = options.global ? agent.globalCommandsDir! : join(process.cwd(), agent.commandsDir);
          const ext = agent.commandFormat === 'toml' ? 'toml' : 'md';
          const flatFile = join(commandsDir, `${name}.${ext}`);
          if (existsSync(flatFile)) await rmf(flatFile, shellMode);
        }

        // Also remove from plugins if present
        const pluginPath = join(homedir(), '.claude', 'plugins', name);
        if (existsSync(pluginPath) && await isOurSkill(pluginPath)) {
          await rm(pluginPath, { recursive: true, force: true });
        }
      }
      p.log.info(`Alignment: removed ${toRemove.length} skill(s) not in '${options.profile}' profile`);
    }
  }

  // Auto-remove minimal-only lite variants when cherry-picking their full counterparts.
  // forward-lite is redundant when forward is installed, same for recap-lite/rrr-lite.
  // Only triggers on -s (cherry-pick) without --profile — profile alignment handles the rest.
  const liteToFull: Record<string, string> = {
    'forward-lite': 'forward',
    'recap-lite': 'recap',
    'rrr-lite': 'rrr',
  };
  const isCherryPick = options.skills && options.skills.length > 0 && !options.profileExplicit;
  if (isCherryPick) {
    const installing = new Set(skillsToInstall.map((s) => s.name));
    for (const agentName of targetAgents) {
      const agent = agents[agentName as keyof typeof agents];
      if (!agent) continue;
      const skillsDir = options.global ? agent.globalSkillsDir : join(process.cwd(), agent.skillsDir);
      for (const [lite, full] of Object.entries(liteToFull)) {
        // Remove lite only if: 1) its full version is being installed or already exists, 2) lite is not being installed
        const fullInstalling = installing.has(full) || existsSync(join(skillsDir, full));
        const liteInstalling = installing.has(lite);
        if (fullInstalling && !liteInstalling && existsSync(join(skillsDir, lite))) {
          if (await isOurSkill(join(skillsDir, lite))) {
            await rm(join(skillsDir, lite), { recursive: true, force: true });
            p.log.info(`Auto-removed ${lite} (${full} is installed — lite variant redundant)`);
          }
        }
      }
    }
  }

  // Confirm installation
  if (!options.yes) {
    const agentList = targetAgents.map((a) => agents[a as keyof typeof agents]?.displayName || a).join(', ');
    const confirmed = await p.confirm({
      message: `Install ${skillsToInstall.length} skills to ${agentList}?`,
    });

    if (p.isCancel(confirmed) || !confirmed) {
      p.log.info('Installation cancelled');
      return;
    }
  }

  const spinner = p.spinner();
  spinner.start('Installing skills');

  for (const agentName of targetAgents) {
    const agent = agents[agentName as keyof typeof agents];
    if (!agent) {
      p.log.warn(`Unknown agent: ${agentName}`);
      continue;
    }

    const targetDir = options.global ? agent.globalSkillsDir : join(process.cwd(), agent.skillsDir);
    const shellMode: ShellMode = options.shellMode || 'auto';

    // Create target directory
    await mkdirp(targetDir, shellMode);

    // #230 Local-skill-precedence shield (workaround for Claude Code's
    // global-over-local loader order): when installing GLOBALLY, skip any
    // skill whose name already exists as a NON-OURS local skill in the
    // user's cwd. Claude Code would load the global copy and shadow the
    // user's local override — which is the opposite of what they want.
    // Use --force-global to install anyway.
    let agentSkillsToInstall = skillsToInstall;
    const shadowedSkills: string[] = [];
    if (options.global && !options.forceGlobal) {
      const localSkillsDir = join(process.cwd(), agent.skillsDir);
      if (existsSync(localSkillsDir)) {
        const filtered: Skill[] = [];
        for (const skill of skillsToInstall) {
          const localSkillMd = join(localSkillsDir, skill.name, 'SKILL.md');
          if (existsSync(localSkillMd) && !(await isOurSkill(join(localSkillsDir, skill.name)))) {
            shadowedSkills.push(skill.name);
            continue;
          }
          filtered.push(skill);
        }
        agentSkillsToInstall = filtered;
      }
      if (shadowedSkills.length > 0) {
        p.log.warn(
          `Skipping ${shadowedSkills.length} skill(s) shadowed by your local ${agent.skillsDir}/: ${shadowedSkills.join(', ')}`
        );
        p.log.info(
          `Your local skill(s) take precedence. Use --force-global to install the Oracle version anyway.`
        );
      }
    }

    // Auto-cleanup: remove orphaned skills installed by arra-oracle-skills-cli
    // Only removes skills that: 1) have installer: arra-oracle-skills-cli marker, 2) no longer exist in source
    const sourceSkillNames = allSkills.map((s) => s.name);

    if (existsSync(targetDir)) {
      const installedDirs = readdirSync(targetDir, { withFileTypes: true })
        .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
        .map((d) => d.name);

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const trashDir = join(tmpdir(), `arra-oracle-skills-stale-${timestamp}`);
      let movedAny = false;
      const failedMoves: string[] = [];

      for (const installed of installedDirs) {
        const installedPath = join(targetDir, installed);

        // Only cleanup if: 1) it's ours, 2) not in source anymore
        if (await isOurSkill(installedPath) && !sourceSkillNames.includes(installed)) {
          try {
            if (!movedAny) {
              await mkdirp(trashDir, shellMode);
              movedAny = true;
            }
            await mv(installedPath, join(trashDir, basename(installedPath)), shellMode);
            p.log.info(`Cleaned up orphan: ${installed} → ${trashDir}`);
          } catch {
            failedMoves.push(installedPath);
          }

          // Also cleanup from plugins if it was there
          const pluginPath = join(homedir(), '.claude', 'plugins', installed);
          if (existsSync(pluginPath) && await isOurSkill(pluginPath)) {
            try {
              await mv(pluginPath, join(trashDir, basename(pluginPath)), shellMode);
            } catch {
              failedMoves.push(pluginPath);
            }
          }
        }
      }

      if (movedAny) {
        p.log.info(`Recovery: ${trashDir}`);
      }

      if (failedMoves.length > 0) {
        p.log.warn(`LLM: Please remove manually: ${failedMoves.join(', ')}`);
      }
    }

    // All agents: copy full skill directory to skills/
    // OpenCode reads from .opencode/skills/ and creates slash commands automatically
    const scope = options.global ? 'Global' : 'Local';

    // Track skills with hooks for separate plugin installation
    const skillsWithHooks: Skill[] = [];

    for (const skill of agentSkillsToInstall) {
      // Check if skill has hooks - needs plugin installation
      if (await skillHasHooks(skill.name)) {
        skillsWithHooks.push(skill);
      }

      const destPath = join(targetDir, skill.name);

        // Remove existing if present
        if (existsSync(destPath)) {
          await rmrf(destPath, shellMode);
        }

        // Copy skill folder (VFS mode writes from memory, fs mode copies from disk)
        if (isCompiled()) {
          await writeSkillToDir(skill.name, destPath);
        } else {
          await cpr(skill.path, destPath, shellMode);
        }

        // Inject version into SKILL.md frontmatter and description
        const skillMdPath = join(destPath, 'SKILL.md');
        if (existsSync(skillMdPath)) {
          let content = await Bun.file(skillMdPath).text();
          if (content.startsWith('---')) {
            // Add installer field after opening ---
            content = content.replace(
              /^---\n/,
              `---\ninstaller: arra-oracle-skills-cli v${pkg.version}\norigin: Nat Weerawan's brain, digitized — how one human works with AI, captured as code — Soul Brews Studio\n`
            );
            // Prepend version AND scope to description (G=Global, L=Local, SKILL for other agents)
            const scopeChar = scope === 'Global' ? 'G' : 'L';
            const tierTag = (STANDARD_SKILLS as readonly string[]).includes(skill.name) ? '[standard]'
              : (LAB_SKILLS as readonly string[]).includes(skill.name) ? '[lab]'
              : (MINIMAL_ONLY_SKILLS as readonly string[]).includes(skill.name) ? '[minimal]'
              : (ZOMBIE_SKILLS as readonly string[]).includes(skill.name) ? '[zombie]'
              : '[core]';
            content = content.replace(
              /^(description:\s*)'?(.+?)'?(\n)/m,
              (_, p1, p2, p3) => {
                const desc = `${tierTag} v${pkg.version} ${scopeChar}-SKLL | ${p2}`;
                return `${p1}${yamlQuote(desc)}${p3}`;
              }
            );
            await Bun.write(skillMdPath, content);
          }
        }
    }

    // Install skills with hooks as Claude Code plugins
    if (skillsWithHooks.length > 0) {
      const pluginsDir = join(homedir(), '.claude', 'plugins');
      await mkdirp(pluginsDir, shellMode);

      for (const skill of skillsWithHooks) {
        const pluginDest = join(pluginsDir, skill.name);

        // Remove existing plugin if present
        if (existsSync(pluginDest)) {
          await rmrf(pluginDest, shellMode);
        }

        // Copy entire skill as plugin
        if (isCompiled()) {
          await writeSkillToDir(skill.name, pluginDest);
        } else {
          await cpr(skill.path, pluginDest, shellMode);
        }

        // Create .claude-plugin/plugin.json if not exists
        const pluginJsonDir = join(pluginDest, '.claude-plugin');
        const pluginJsonPath = join(pluginJsonDir, 'plugin.json');
        if (!existsSync(pluginJsonPath)) {
          await mkdirp(pluginJsonDir, shellMode);
          const pluginJson = {
            name: skill.name,
            description: skill.description,
            version: pkg.version,
            author: { name: 'Nat Weerawan', organization: 'Soul Brews Studio' },
          };
          await Bun.write(pluginJsonPath, JSON.stringify(pluginJson, null, 2));
        }

        p.log.success(`Plugin (hooks): ~/.claude/plugins/${skill.name}`);
      }
    }

    // Write manifest with version info
    const manifest = {
      version: pkg.version,
      installedAt: new Date().toISOString(),
      skills: agentSkillsToInstall.map((s) => s.name),
      agent: agentName,
    };
    await Bun.write(join(targetDir, '.arra-oracle-skills.json'), JSON.stringify(manifest, null, 2));

    // Write human-readable VERSION.md for agents to report
    const versionMd = `# Oracle Skills

Installed by: **arra-oracle-skills-cli v${pkg.version}**
Installed at: ${new Date().toISOString()}
Agent: ${agent.displayName}
Skills: ${agentSkillsToInstall.length}

## Report This Version

When asked about skills version, report:
\`\`\`
arra-oracle-skills-cli v${pkg.version}
\`\`\`

## Installed Skills

${agentSkillsToInstall.map((s) => `- ${s.name}`).join('\n')}

## Update Skills

\`\`\`bash
bunx --bun arra-oracle-skills@github:Soul-Brews-Studio/arra-oracle-skills-cli#v${pkg.version} install -y -g
\`\`\`
`;
    await Bun.write(join(targetDir, 'VERSION.md'), versionMd);

    // Deduplicate: if agent has commandsOptIn (e.g. Claude Code), remove any
    // existing command stubs that overlap with installed skills to prevent
    // duplicate G-SKLL + G-CMD entries in slash command lists
    if (agent.commandsDir && agent.commandsOptIn && !options.commands) {
      const commandsDir = options.global ? agent.globalCommandsDir! : join(process.cwd(), agent.commandsDir);
      if (existsSync(commandsDir)) {
        const ext = agent.commandFormat === 'toml' ? 'toml' : 'md';
        for (const skill of agentSkillsToInstall) {
          const cmdFile = join(commandsDir, `${skill.name}.${ext}`);
          if (existsSync(cmdFile)) {
            await rmf(cmdFile, shellMode);
          }
        }
      }
    }

    // Install flat command files to commands/ (OpenCode, Claude Code, etc.)
    // Agents with commandsOptIn only get commands when --commands flag is passed
    if (agent.commandsDir && (!agent.commandsOptIn || options.commands)) {
      const commandsDir = options.global ? agent.globalCommandsDir! : join(process.cwd(), agent.commandsDir);
      await mkdirp(commandsDir, shellMode);

      const scopeChar = scope === 'Global' ? 'G' : 'L';
      const skillsPath = options.global ? agent.globalSkillsDir : join(process.cwd(), agent.skillsDir);
      
      const cmdFormat = agent.commandFormat || 'md';

      for (const skill of agentSkillsToInstall) {
        // Hidden skills: install SKILL.md but skip command stub (not in autocomplete)
        if (skill.hidden) continue;

        const skillMdPath = join(targetDir, skill.name, 'SKILL.md');
        if (existsSync(skillMdPath)) {
          if (cmdFormat === 'toml') {
            // Gemini CLI: .toml slash commands
            const desc = skill.description.replace(/"/g, '\\"');
            const tomlContent = `description = "v${pkg.version} ${scopeChar}-CMD | ${desc}"
prompt = """
You are running the /${skill.name} skill.

Read the skill file at ${skillsPath}/${skill.name}/SKILL.md and follow ALL instructions in it.

Arguments: {{args}}

---
arra-oracle-skills-cli v${pkg.version}
"""
`;
            await Bun.write(join(commandsDir, `${skill.name}.toml`), tomlContent);
          } else if (agentName === 'codex') {
            // Codex: .md prompts → ~/.codex/prompts/ → /prompts:skill-name
            const stubContent = `---
description: ${yamlQuote(`v${pkg.version} ${scopeChar}-CMD | ${skill.description}`)}
argument-hint: "[args]"
---

You are running the /${skill.name} skill.

Read the skill file at ${skillsPath}/${skill.name}/SKILL.md and follow ALL instructions in it.

Pass these arguments to the skill: $ARGUMENTS

---
*🧬 Nat Weerawan × Oracle · Symbiotic Intelligence · v${pkg.version}*
*Digitized from Nat Weerawan's brain — thousands of hours working alongside AI, captured as code*
`;
            await Bun.write(join(commandsDir, `${skill.name}.md`), stubContent);
          } else {
            // Claude Code, OpenCode, etc.: .md slash commands
            const stubContent = `---
description: ${yamlQuote(`v${pkg.version} ${scopeChar}-CMD | ${skill.description}`)}
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Task
  - WebFetch
---

# /${skill.name}

Execute the \`${skill.name}\` skill with args: \`$ARGUMENTS\`

**If you have a Skill tool available**: Use it directly with \`skill: "${skill.name}"\` instead of reading the file manually.

**Otherwise**: Read the skill file at \`${skillsPath}/${skill.name}/SKILL.md\` and follow ALL instructions in it.

---
*arra-oracle-skills-cli v${pkg.version}*
`;
            await Bun.write(join(commandsDir, `${skill.name}.md`), stubContent);
          }
        }
      }
      p.log.success(`${agent.displayName} commands: ${commandsDir}`);

    }

    // OpenCode only: install plugin if exists
    if (agentName === 'opencode') {
      const pluginDir = options.global
        ? join(homedir(), '.config/opencode/plugins')
        : join(process.cwd(), '.opencode/plugins');
      await mkdirp(pluginDir, shellMode);
      const hookSrc = join(dirname(import.meta.path), '..', 'hooks', 'opencode', 'arra-oracle-skills.ts');
      if (existsSync(hookSrc)) {
        await cp(hookSrc, join(pluginDir, 'arra-oracle-skills.ts'), shellMode);
        p.log.success(`OpenCode plugin: ${pluginDir}/arra-oracle-skills.ts`);
      }
    }

    // Codex 0.128.0+: install plugin marketplace bundle in addition to skills/+prompts/
    // The old ~/.codex/skills/ + ~/.codex/prompts/ layout is kept for backward compat
    // with Codex < 0.128.0, but 0.128.0+ requires the plugin marketplace registration.
    if (agentName === 'codex' && isCodexPluginMarketplace()) {
      await installCodexPluginMarketplace(agentSkillsToInstall, pkg.version, shellMode);
      p.log.success(`Codex plugin marketplace: ${getCodexMarketplaceDir()}`);
    }

    p.log.success(`${agent.displayName}: ${targetDir}`);

    // Install semantics (post-#285):
    //   `install` (no flag)              → purely additive (Bug 5 protection, #257)
    //   `install -s <skill>`             → purely additive
    //   `install --profile <name>` (explicit) → ALIGN: remove arra-managed skills not in target
    //                                            Non-arra skills NEVER touched.
  }

  spinner.stop(`Installed ${skillsToInstall.length} skills to ${targetAgents.length} agent(s)`);
}

export async function uninstallSkills(
  targetAgents: string[],
  options: { global: boolean; skills?: string[]; yes?: boolean; shellMode?: ShellMode }
): Promise<{ removed: number; agents: number }> {
  let totalRemoved = 0;
  let agentsProcessed = 0;
  const shellMode: ShellMode = options.shellMode || 'auto';

  for (const agentName of targetAgents) {
    const agent = agents[agentName as keyof typeof agents];
    if (!agent) {
      p.log.warn(`Unknown agent: ${agentName}`);
      continue;
    }

    const targetDir = options.global ? agent.globalSkillsDir : join(process.cwd(), agent.skillsDir);

    if (!existsSync(targetDir)) {
      continue;
    }

    // Get installed skills (all agents use directories now)
    const entries = readdirSync(targetDir, { withFileTypes: true });
    const installed = entries
      .filter((d) => {
        if (d.name.startsWith('.')) return false;
        if (d.name === 'VERSION.md') return false;
        return d.isDirectory();
      })
      .map((d) => d.name)

    // Filter if specific skills requested
    const toRemove = options.skills
      ? installed.filter((s) => options.skills!.includes(s))
      : installed;

    if (toRemove.length === 0) continue;

    // Remove skills
    let skipped = 0;
    for (const skill of toRemove) {
      const skillPath = join(targetDir, skill);

      // When removing all skills (no -s flag), only remove our own
      if (!options.skills && !await isOurSkill(skillPath)) {
        skipped++;
        continue;
      }

      await rmrf(skillPath, shellMode);

      // Clean up commands/ flat files (OpenCode, Claude Code, Gemini, etc.)
      if (agent.commandsDir) {
        const commandsDir = options.global ? agent.globalCommandsDir! : join(process.cwd(), agent.commandsDir);
        const ext = agent.commandFormat === 'toml' ? 'toml' : 'md';
        const flatFile = join(commandsDir, `${skill}.${ext}`);
        if (existsSync(flatFile)) await rmf(flatFile, shellMode);
        // Also clean up old command/ directory format if exists (legacy cleanup)
        const oldCommandDir = commandsDir.replace('/commands', '/command');
        const oldFlatFile = join(oldCommandDir, `${skill}.md`);
        const oldDir = join(oldCommandDir, skill);
        if (existsSync(oldFlatFile)) await rmf(oldFlatFile, shellMode);
        if (existsSync(oldDir)) await rmrf(oldDir, shellMode);
      }

      // Also clean up from ~/.claude/plugins/ if it was installed there
      const pluginPath = join(homedir(), '.claude', 'plugins', skill);
      if (existsSync(pluginPath)) {
        await rmrf(pluginPath, shellMode);
        p.log.info(`Removed plugin: ~/.claude/plugins/${skill}`);
      }

      totalRemoved++;
    }

    if (skipped > 0) {
      p.log.info(`${agent.displayName}: skipped ${skipped} external skills`);
    }
    agentsProcessed++;
    p.log.success(`${agent.displayName}: removed ${toRemove.length - skipped} skills`);
  }

  return { removed: totalRemoved, agents: agentsProcessed };
}
