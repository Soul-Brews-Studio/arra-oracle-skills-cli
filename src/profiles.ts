/**
 * Skill profiles + features — core skills only (v4.0).
 * Extended skills in arra-symbiosis-skills repo.
 */

// --- Profiles (tiers) ---

export const profiles: Record<string, { include?: string[]; exclude?: string[] }> = {
  seed: {
    include: ['forward', 'retrospective', 'rrr', 'recap', 'standup', 'go', 'about-oracle', 'oracle-family-scan', 'oracle-soul-sync-update', 'inbox', 'memory'],
  },
  standard: {
    include: [
      'forward', 'retrospective', 'rrr', 'recap', 'standup',
      'trace', 'learn', 'talk-to', 'oracle-family-scan',
      'go', 'about-oracle', 'oracle-soul-sync-update', 'awaken', 'inbox', 'memory', 'create-shortcut', 'contacts',
    ],
  },
  full: {},
};

// --- Features (add-on modules) ---

export const features: Record<string, string[]> = {
  soul: ['awaken', 'philosophy', 'who-are-you', 'about-oracle'],
  network: ['talk-to', 'oracle-family-scan', 'oracle-soul-sync-update'],
  workspace: ['schedule', 'project'],
};

/**
 * Resolve a profile to a filtered list of skill names.
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

  return null;
}

/**
 * Resolve a profile + features into a combined skill list.
 */
export function resolveProfileWithFeatures(
  profileName: string,
  featureNames: string[],
  allSkillNames: string[]
): string[] {
  const base = resolveProfile(profileName, allSkillNames) || [...allSkillNames];

  const result = new Set(base);
  for (const feat of featureNames) {
    const skills = features[feat];
    if (skills) {
      for (const s of skills) result.add(s);
    }
  }

  return [...result];
}
