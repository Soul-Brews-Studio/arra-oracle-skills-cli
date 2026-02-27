/**
 * Skill profiles — named sets of skills for bulk install/uninstall.
 *
 * - `include` = only install these skills
 * - `exclude` = install all EXCEPT these
 * - Both empty = install everything (same as current default)
 */
export const profiles: Record<string, { include?: string[]; exclude?: string[] }> = {
  seed: {
    include: ['trace', 'dig', 'recap', 'learn', 'rrr', 'who-are-you'],
  },
  minimal: {
    include: ['trace', 'dig', 'recap', 'learn', 'rrr', 'who-are-you'],
  },
  standard: {
    include: [
      'trace', 'dig', 'recap', 'learn', 'rrr', 'who-are-you',
      'worktree', 'oracle', 'standup', 'forward', 'fyi', 'merged',
      'talk-to',
    ],
  },
  full: {}, // all skills (default behavior)
};

/**
 * Resolve a profile to a filtered list of skill names.
 * Returns null if no filtering should happen (full profile / unknown).
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

  // Both empty — install everything
  return null;
}
