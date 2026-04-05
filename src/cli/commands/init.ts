import type { Command } from 'commander';
import * as p from '@clack/prompts';
import { agents, getDefaultAgents } from '../agents.js';
import { installSkills } from '../installer.js';
import { profiles } from '../../profiles.js';

export function registerInit(program: Command, version: string) {
  program
    .command('init')
    .description('First-time setup: install standard profile globally')
    .option('-p, --profile <name>', 'Profile to install (default: standard)', 'standard')
    .option('-y, --yes', 'Skip confirmation prompts')
    .action(async (options) => {
      p.intro(`🔮 Oracle Skills Init v${version}`);

      try {
        const profileName = options.profile;
        if (!profiles[profileName]) {
          p.log.error(`Unknown profile: ${profileName}`);
          p.log.info(`Available: ${Object.keys(profiles).join(', ')}`);
          return;
        }

        const detected = getDefaultAgents();
        if (detected.length === 0) {
          p.log.error('No agents detected. Install Claude Code, Codex, or another supported agent first.');
          return;
        }

        p.log.info(`Detected: ${detected.map((a) => agents[a as keyof typeof agents]?.displayName).join(', ')}`);
        p.log.info(`Profile: ${profileName}`);

        if (!options.yes) {
          const confirmed = await p.confirm({
            message: `Install ${profileName} profile globally?`,
          });

          if (p.isCancel(confirmed) || !confirmed) {
            p.log.info('Cancelled');
            return;
          }
        }

        await installSkills(detected, {
          global: true,
          profile: profileName,
          yes: true,
          commands: false,
        });

        p.outro(`✨ Initialized with ${profileName} profile! Restart your agent to activate.`);
      } catch (error) {
        p.log.error(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        process.exit(1);
      }
    });
}
