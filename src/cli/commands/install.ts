import type { Command } from 'commander';
import * as p from '@clack/prompts';
import { agents, getDefaultAgents, getAgentNames } from '../agents.js';
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
    .option('--shell', 'Force Bun.$ shell commands (use on Windows to test shell compatibility)')
    .option('--no-shell', 'Force Node.js fs operations (use on Unix if Bun.$ causes issues)')
    .action(async (options) => {
      p.intro(`🔮 Oracle Skills Installer v${version}`);

      try {
        if (options.list) {
          await listSkills();
          p.outro('Use --skill <name> to install specific skills');
          return;
        }

        let targetAgents: string[] = options.agent || [];

        if (targetAgents.length === 0) {
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

        const validAgents = getAgentNames();
        const invalidAgents = targetAgents.filter((a) => !validAgents.includes(a));
        if (invalidAgents.length > 0) {
          p.log.error(`Unknown agents: ${invalidAgents.join(', ')}`);
          p.log.info(`Valid agents: ${validAgents.join(', ')}`);
          return;
        }

        const shellMode: ShellMode = options.shell ? 'shell'
          : options.noShell ? 'no-shell'
          : 'auto';

        if (options.profile && !profiles[options.profile]) {
          p.log.error(`Unknown profile: ${options.profile}`);
          p.log.info(`Available profiles: ${Object.keys(profiles).join(', ')}`);
          return;
        }

        await installSkills(targetAgents, {
          global: options.global,
          skills: options.skill,
          profile: options.profile,
          yes: options.yes,
          commands: options.withCommands,
          shellMode,
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
