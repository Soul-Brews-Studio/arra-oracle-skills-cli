/**
 * Skill profiles — 3 tiers, no features.
 *
 * standard: daily driver (default)
 * full: everything
 * lab: full + experimental / bleeding edge
 */

export const profiles: Record<string, { include?: string[] }> = {
  standard: {
    include: [
      'about-oracle', 'awaken', 'contacts', 'dig', 'forward', 'go',
      'inbox', 'learn', 'oracle-family-scan', 'oracle-soul-sync-update',
      'recap', 'rrr', 'standup', 'talk-to', 'trace', 'xray',
    ],
  },
  full: {},          // all skills
  lab: {
    include: [
      // full + experimental skills
      'create-shortcut',
      // future: 'dream', 'feel'
    ],
  },
};

/**
 * Resolve a profile to a filtered list of skill names.
 * Returns null for profiles that mean "all skills" (full).
 * Lab = all skills + lab-only skills (superset of full).
 */
export function resolveProfile(
  profileName: string,
  allSkillNames: string[]
): string[] | null {
  const profile = profiles[profileName];
  if (!profile) return null;

  if (profileName === 'lab') {
    // Lab = everything (all discovered skills are included)
    return null;
  }

  if (profile.include && profile.include.length > 0) {
    return profile.include;
  }

  // Empty include = all skills (full)
  return null;
}
