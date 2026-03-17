/**
 * Skill profiles + features — data-driven from 1,013 sessions (Mar 2026).
 *
 * Profiles = base tiers (how much you need)
 * Features = add-on modules (what domain)
 *
 * - `include` = only install these skills
 * - `exclude` = install all EXCEPT these
 * - Both empty = install everything (same as current default)
 */

// --- Profiles (tiers) ---

export const profiles: Record<string, { include?: string[]; exclude?: string[] }> = {
  // minimal: the daily ritual — standup → recap → work → rrr → forward
  // go is always included so users can switch profiles
  seed: {
    include: ['forward', 'rrr', 'recap', 'standup', 'go', 'about-oracle', 'oracle-family-scan', 'oracle-soul-sync-update'],
  },
  minimal: {
    include: ['forward', 'rrr', 'recap', 'standup', 'go', 'about-oracle', 'oracle-family-scan', 'oracle-soul-sync-update'],
  },
  // standard: daily driver + discovery (covers 96% of actual usage)
  standard: {
    include: [
      'forward', 'rrr', 'recap', 'standup',
      'trace', 'dig', 'learn', 'talk-to', 'oracle-family-scan',
      'go', 'about-oracle', 'oracle-soul-sync-update',
    ],
  },
  // full: everything
  full: {},
};

// --- Features (add-on modules) ---

export const features: Record<string, string[]> = {
  // soul: birth/awaken new oracles + wizard v2 demographics (awaken↔learn 95%, awaken↔philosophy 74%)
  // wizard v2: gender, team, memory consent, fast/full mode, system check
  soul: ['awaken', 'philosophy', 'who-are-you', 'about-oracle', 'birth', 'feel'],
  // network: multi-oracle communication (talk-to↔trace 87%, family-scan↔forward 62%)
  network: ['talk-to', 'oracle-family-scan', 'oracle-soul-sync-update', 'oracle', 'oraclenet'],
  // workspace: parallel work + ops (path↔worktree 100%)
  workspace: ['worktree', 'workon', 'physical', 'schedule'],
  // creator: content + research + speech
  creator: ['speak', 'deep-research', 'watch', 'gemini'],
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

/**
 * Resolve a profile + features into a combined skill list.
 * profile = base tier, featureNames = add-on modules
 */
export function resolveProfileWithFeatures(
  profileName: string,
  featureNames: string[],
  allSkillNames: string[]
): string[] {
  // Start with profile
  const base = resolveProfile(profileName, allSkillNames) || [...allSkillNames];

  // Add features
  const result = new Set(base);
  for (const feat of featureNames) {
    const skills = features[feat];
    if (skills) {
      for (const s of skills) result.add(s);
    }
  }

  return [...result];
}
