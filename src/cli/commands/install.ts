import type { Command } from 'commander';
import * as p from '@clack/prompts';
import { agents, getDefaultAgents, getAgentNames, thClawsAvailable } from '../agents.js';
import { listSkills, installSkills } from '../installer.js';
import { profiles } from '../../profiles.js';
import type { ShellMode } from '../fs-utils.js';

export function registerInstall(program: Command, version: string) {
  program
    .command('install', { isDefault: true })
    .description('Install Oracle skills to agents')
    .option('-g, --global', 'Install to user directory instead of project')
    .option('-a, --agent <agents...>', 'Target specific agents (e.g., claude-code, opencode)')
    .option('-s, --skill <skills...>', 'Install specific skills by name')
    .option('-p, --profile <name>', 'Install a skill profile (minimal, standard, full, lab)', 'minimal')
    .option('-l, --list', 'List available skills without installing')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('--with-commands', 'Also install command stubs to ~/.claude/commands/')
    .option('--force-global', 'Install global skills even if a same-named local skill exists (#230)')
    .option('--no-thclaws', 'Skip thClaws install target even if the thclaws binary is detected')
    .option('--thclaws-only', 'Install ONLY to thClaws paths (skips Claude Code, Codex, OpenCode, etc.)')
    .option('--shell', 'Force Bun.$ shell commands (use on Windows to test shell compatibility)')
    .option('--no-shell', 'Force Node.js fs operations (use on Unix if Bun.$ causes issues)')
    .action(async (options, cmd) => {
      p.intro(`🔮 Oracle Skills Installer v${version}`);

      try {
        if (options.list) {
          await listSkills();
          p.outro('Use --skill <name> to install specific skills');
          return;
        }

        let targetAgents: string[] = options.agent || [];

        // --thclaws-only short-circuits everything: write ONLY to thClaws.
        // Useful for testing the thClaws path in isolation.
        if (options.thclawsOnly) {
          targetAgents = ['thclaws'];
        } else if (targetAgents.length === 0) {
          const detected = getDefaultAgents();

          if (detected.length > 0) {
            p.log.info(`Detected agents: ${detected.map((a) => agents[a as keyof typeof agents]?.displayName).join(', ')}`);

            if (!options.yes) {
              const useDetected = await p.confirm({
                message: 'Install to detected agents?',
              });

              if (p.isCancel(useDetected)) {
                p.log.info('Cancelled');
                return;
              }

              if (useDetected) {
                targetAgents = detected;
              }
            } else {
              targetAgents = detected;
            }
          }

          if (targetAgents.length === 0) {
            const selected = await p.multiselect({
              message: 'Select agents to install to:',
              options: Object.entries(agents).map(([key, config]) => ({
                value: key,
                label: config.displayName,
                hint: options.global ? config.globalSkillsDir : config.skillsDir,
              })),
              required: true,
            });

            if (p.isCancel(selected)) {
              p.log.info('Cancelled');
              return;
            }

            targetAgents = selected as string[];
          }
        }

        // --no-thclaws: opt out of thClaws install even when auto-detected.
        // commander stores the negated boolean as options.thclaws === false.
        if (options.thclaws === false && !options.thclawsOnly) {
          targetAgents = targetAgents.filter((a) => a !== 'thclaws');
        }

        const validAgents = getAgentNames();
        const invalidAgents = targetAgents.filter((a) => !validAgents.includes(a));
        if (invalidAgents.length > 0) {
          p.log.error(`Unknown agents: ${invalidAgents.join(', ')}`);
          p.log.info(`Valid agents: ${validAgents.join(', ')}`);
          return;
        }

        // Target-display: show user which targets are active vs skipped.
        // Makes the auto-detection of thClaws visible rather than silent.
        const allDefault = ['claude-code', 'codex', 'thclaws'] as const;
        const reportLines: string[] = [`Installing skills to detected targets:`];
        for (const name of allDefault) {
          const agent = agents[name as keyof typeof agents];
          if (!agent) continue;
          const dir = options.global ? agent.globalSkillsDir : agent.skillsDir;
          if (targetAgents.includes(name)) {
            reportLines.push(`  ✓ ${agent.displayName.padEnd(12)} (${dir})`);
          } else {
            // Explain why it was skipped
            let reason = 'not selected';
            if (name === 'thclaws') {
              if (options.thclaws === false) reason = '--no-thclaws';
              else if (!thClawsAvailable()) reason = 'no binary detected — skipping';
              else reason = 'skipped';
            } else if (!agent.detectInstalled()) {
              reason = 'no install detected — skipping';
            }
            reportLines.push(`  ✗ ${agent.displayName.padEnd(12)} (${reason})`);
          }
        }
        // Also list any non-default targets that were explicitly chosen
        for (const name of targetAgents) {
          if ((allDefault as readonly string[]).includes(name)) continue;
          const agent = agents[name as keyof typeof agents];
          if (!agent) continue;
          const dir = options.global ? agent.globalSkillsDir : agent.skillsDir;
          reportLines.push(`  ✓ ${agent.displayName.padEnd(12)} (${dir})`);
        }
        p.log.info(reportLines.join('\n'));

        const shellMode: ShellMode = options.shell ? 'shell'
          : options.noShell ? 'no-shell'
          : 'auto';

        if (options.profile && !profiles[options.profile]) {
          p.log.error(`Unknown profile: ${options.profile}`);
          p.log.info(`Available profiles: ${Object.keys(profiles).join(', ')}`);
          return;
        }

        // Detect whether --profile was explicitly passed on CLI or came from the default value.
        // Commander exposes this via getOptionValueSource: 'cli' = user typed it, 'default' = default.
        const profileSource = (cmd as any).getOptionValueSource?.('profile') ?? 'default';
        const profileExplicit = profileSource === 'cli';

        await installSkills(targetAgents, {
          global: options.global,
          skills: options.skill,
          profile: options.profile,
          profileExplicit,
          yes: options.yes,
          commands: options.withCommands,
          forceGlobal: options.forceGlobal,
          shellMode,
          noThclaws: options.thclaws === false,
          thclawsOnly: !!options.thclawsOnly,
        });

        p.outro('✨ Oracle skills installed!');

        // Awakening — show CLI commands on first install
        console.log(`
  🔮 Oracle Skills v${version} — Awakened

  CLI Commands:
    arra-oracle-skills agents             # list supported agents
    arra-oracle-skills about              # prereqs + system status
    arra-oracle-skills list -g            # show installed skills
    arra-oracle-skills select -g          # interactive skill picker
    arra-oracle-skills install -g -y      # reinstall all skills
    arra-oracle-skills uninstall -g -y    # remove all skills

  Restart your agent to activate skills.
`);
      } catch (error) {
        p.log.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });
}
