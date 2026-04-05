import type { Command } from 'commander';
import * as p from '@clack/prompts';
import { agents, detectInstalledAgents } from '../agents.js';
import { uninstallSkills } from '../installer.js';
import type { ShellMode } from '../fs-utils.js';

export function registerUninstall(program: Command, version: string) {
  program
    .command('uninstall')
    .description('Remove installed Oracle skills')
    .option('-g, --global', 'Uninstall from user directory')
    .option('-a, --agent <agents...>', 'Target specific agents')
    .option('-s, --skill <skills...>', 'Remove specific skills only')
    .option('-y, --yes', 'Skip confirmation prompts')
    .option('--shell', 'Force Bun.$ shell commands')
    .option('--no-shell', 'Force Node.js fs operations')
    .action(async (options) => {
      p.intro(`🔮 Oracle Skills Uninstaller v${version}`);

      try {
        let targetAgents: string[] = options.agent ? [...options.agent] : [];

        if (targetAgents.length > 0) {
          p.log.info(`Using specified agents: ${targetAgents.join(', ')}`);
        } else {
          const detected = detectInstalledAgents();
          if (detected.length > 0) {
            p.log.info(`Detected agents: ${detected.map((a) => agents[a as keyof typeof agents]?.displayName).join(', ')}`);
            targetAgents = detected;
          }
        }

        if (targetAgents.length === 0) {
          p.log.error('No agents detected. Use --agent to specify.');
          return;
        }

        if (!options.yes) {
          const skillInfo = options.skill ? `skills: ${options.skill.join(', ')}` : 'all Oracle skills';
          const confirmed = await p.confirm({
            message: `Remove ${skillInfo} from ${targetAgents.length} agent(s)?`,
          });

          if (p.isCancel(confirmed) || !confirmed) {
            p.log.info('Cancelled');
            return;
          }
        }

        const spinner = p.spinner();
        spinner.start('Removing skills');

        const shellMode: ShellMode = options.shell ? 'shell'
          : options.noShell ? 'no-shell'
          : 'auto';

        const result = await uninstallSkills(targetAgents, {
          global: options.global,
          skills: options.skill,
          yes: options.yes,
          shellMode,
        });

        spinner.stop(`Removed ${result.removed} skills from ${result.agents} agent(s)`);
        p.outro('✨ Skills removed. Restart your agent to apply changes.');
      } catch (error) {
        p.log.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });
}
