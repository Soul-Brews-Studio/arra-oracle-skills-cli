import type { Command } from 'commander';
import { discoverSkills } from '../installer.js';
import { profiles, resolveProfile } from '../../profiles.js';

export function registerProfiles(program: Command) {
  program
    .command('profiles [name]')
    .description('List available profiles')
    .action(async (name?: string) => {
      const allSkills = await discoverSkills();
      const allNames = allSkills.map((s) => s.name);

      if (name) {
        if (!profiles[name]) {
          console.log(`\n  Unknown profile: ${name}`);
          console.log(`  Available: ${Object.keys(profiles).join(', ')}\n`);
          return;
        }
        const skills = resolveProfile(name, allNames) || allNames;
        console.log(`\n  Profile: ${name} (${skills.length} skills)`);
        console.log(`  Skills: ${skills.join(', ')}\n`);
        return;
      }

      console.log('\n  Available profiles:\n');
      for (const [pName, profile] of Object.entries(profiles)) {
        const skills = resolveProfile(pName, allNames);
        const count = skills ? skills.length : allNames.length;
        console.log(`    ${pName.padEnd(12)} ${count} skills`);
      }
      console.log(`\n  Usage: arra-oracle-skills install -g -y -p <profile>\n`);
    });
}
