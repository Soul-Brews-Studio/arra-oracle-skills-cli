import type { Command } from 'commander';
import * as p from '@clack/prompts';
import { existsSync } from 'fs';
import { join } from 'path';
import { agents, detectInstalledAgents, thClawsAvailable } from '../agents.js';
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
    .option('--no-thclaws', 'Skip thClaws target during uninstall')
    .option('--thclaws-only', 'Uninstall ONLY from thClaws paths')
    .option('--shell', 'Force Bun.$ shell commands')
    .option('--no-shell', 'Force Node.js fs operations')
    .action(async (options) => {
      p.intro(`🔮 Oracle Skills Uninstaller v${version}`);

      try {
        let targetAgents: string[] = options.agent ? [...options.agent] : [];

        if (options.thclawsOnly) {
          targetAgents = ['thclaws'];
        } else if (targetAgents.length > 0) {
          p.log.info(`Using specified agents: ${targetAgents.join(', ')}`);
        } else {
          const detected = detectInstalledAgents();
          if (detected.length > 0) {
            p.log.info(`Detected agents: ${detected.map((a) => agents[a as keyof typeof agents]?.displayName).join(', ')}`);
            targetAgents = detected;
          }
        }

        // --no-thclaws → strip thclaws from the target set
        if (options.thclaws === false && !options.thclawsOnly) {
          targetAgents = targetAgents.filter((a) => a !== 'thclaws');
        }

        if (targetAgents.length === 0) {
          p.log.error('No agents detected. Use --agent to specify.');
          return;
        }

        // Target-display: report which targets we will (or won't) clean up.
        const skillLabel = options.skill ? options.skill.join(', ') : 'all Oracle skills';
        const reportLines: string[] = [`Uninstalling ${skillLabel} from:`];
        const allDefault = ['claude-code', 'codex', 'thclaws'] as const;
        for (const name of allDefault) {
          const agent = agents[name as keyof typeof agents];
          if (!agent) continue;
          const dir = options.global ? agent.globalSkillsDir : join(process.cwd(), agent.skillsDir);
          if (targetAgents.includes(name)) {
            if (existsSync(dir)) {
              reportLines.push(`  ✓ ${agent.displayName.padEnd(12)} (will clean ${dir})`);
            } else {
              reportLines.push(`  ✗ ${agent.displayName.padEnd(12)} (no install dir — skipping)`);
            }
          } else {
            let reason = 'not selected';
            if (name === 'thclaws') {
              if (options.thclaws === false) reason = '--no-thclaws';
              else if (!thClawsAvailable()) reason = 'no binary detected — skipping';
            }
            reportLines.push(`  ✗ ${agent.displayName.padEnd(12)} (${reason})`);
          }
        }
        for (const name of targetAgents) {
          if ((allDefault as readonly string[]).includes(name)) continue;
          const agent = agents[name as keyof typeof agents];
          if (!agent) continue;
          const dir = options.global ? agent.globalSkillsDir : join(process.cwd(), agent.skillsDir);
          reportLines.push(`  ✓ ${agent.displayName.padEnd(12)} (${dir})`);
        }
        p.log.info(reportLines.join('\n'));

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
