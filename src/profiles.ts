/**
 * Skill profiles — 3 tiers, no features.
 *
 * standard: daily driver (default) — 16 essential skills
 * full: all stable skills (excludes lab-only experiments)
 * lab: everything including experimental / bleeding edge
 */

// Skills that are lab-only (experimental, not in standard or full)
export const labOnly = ['create-shortcut', 'dream', 'feel'];

export const profiles: Record<string, { include?: string[]; exclude?: string[] }> = {
  standard: {
    include: [
      'about-oracle', 'awaken', 'contacts', 'dig', 'forward', 'go',
      'inbox', 'learn', 'oracle-family-scan', 'oracle-soul-sync-update',
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
 * Returns null for profiles that mean "all skills" (lab).
 */
export function resolveProfile(
  profileName: string,
  allSkillNames: string[]
): string[] | null {
  const profile = profiles[profileName];
  if (!profile) return null;

  if (profile.include && profile.include.length > 0) {
    return profile.include;
  }

  if (profile.exclude && profile.exclude.length > 0) {
    return allSkillNames.filter((s) => !profile.exclude!.includes(s));
  }

  // Empty = all skills (lab)
  return null;
}
