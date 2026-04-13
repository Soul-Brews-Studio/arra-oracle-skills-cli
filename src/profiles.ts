/**
 * Skill profiles — 3 tiers, no features.
 *
 * standard: daily driver (default) — 14 essential skills
 * full: all stable skills (excludes lab-only experiments)
 * lab: everything including experimental / bleeding edge
 */

// Skills that are lab-only (experimental, not in standard or full)
export const labOnly = ['bampenpien', 'contacts', 'dream', 'feel', 'fleet', 'harden', 'i-believed', 'inbox', 'machines', 'mailbox', 'morpheus', 'release', 'schedule', 'team-agents', 'vault', 'warp', 'watch', 'wormhole'];

export const profiles: Record<string, { include?: string[]; exclude?: string[] }> = {
  standard: {
    include: [
      'about-oracle', 'awaken', 'create-shortcut', 'dig', 'forward', 'go',
      'learn', 'oracle-family-scan', 'oracle-soul-sync-update',
      'recap', 'rrr', 'standup', 'talk-to', 'trace', 'xray',
    ],
  },
  full: {
    exclude: labOnly,  // all skills except lab-only experiments
  },
  lab: {},             // everything — all discovered skills
};

/**
 * Resolve a profile to a filtered list of skill names.
 * Returns null for profiles that mean "all skills" (lab) — unless secrets exist.
 * Secret skills are excluded from ALL profiles; install by name only (-s flag).
 */
export function resolveProfile(
  profileName: string,
  allSkillNames: string[],
  secretSkillNames?: string[]
): string[] | null {
  const secrets = new Set(secretSkillNames || []);
  const profile = profiles[profileName];
  if (!profile) return null;

  if (profile.include && profile.include.length > 0) {
    return profile.include.filter((s) => !secrets.has(s));
  }

  if (profile.exclude && profile.exclude.length > 0) {
    return allSkillNames.filter((s) => !profile.exclude!.includes(s) && !secrets.has(s));
  }

  // Empty = all skills (lab) — but still exclude secrets
  return secretSkillNames && secretSkillNames.length > 0
    ? allSkillNames.filter((s) => !secrets.has(s))
    : null;
}
