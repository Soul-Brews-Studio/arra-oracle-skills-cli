/**
 * Skill profiles — 3 tiers, single source of truth.
 *
 * starter: newcomer essentials — 5 skills (session lifecycle + upgrade path)
 * standard: daily driver (default) — 13 essential skills (data-driven, session 8+9)
 * full: all stable skills (excludes lab-only experiments)
 * lab: everything including experimental / bleeding edge
 *
 * Profile audit: 120 sessions mined (2026-04-15). Skills earning standard
 * must have 10+ session appearances. Demoted: about-oracle (5), create-shortcut (6),
 * oracle-soul-sync-update (6), standup (10), skills-list (3), oracle-family-scan (8).
 * These move to full (still installable, not lab-gated).
 */

/** Starter profile — session lifecycle + upgrade path (Nat's pick, debated session 9) */
export const STARTER_SKILLS = [
  'about-oracle', 'forward', 'go', 'recap', 'rrr',
] as const;

/** Standard profile — daily driver skills (always installed) */
export const STANDARD_SKILLS = [
  'awaken', 'bampenpien', 'bud', 'dig', 'forward', 'go',
  'learn', 'recap', 'rrr', 'talk-to', 'team-agents', 'trace', 'xray',
] as const;

/** Lab-only skills — experimental, not in standard or full */
export const LAB_SKILLS = [
  'contacts', 'dream', 'feel', 'fleet', 'harden',
  'i-believed', 'inbox', 'machines', 'mailbox', 'morpheus',
  'release', 'schedule', 'vault', 'warp', 'watch', 'work-with', 'worktree', 'wormhole',
] as const;

/** Zombie skills — internal development candidates from arra-symbiosis-skills.
 *  Excluded from ALL profiles. Install by name only: `arra install -s workon`
 *  These are dormant — available for development, not for users. */
export const ZOMBIE_SKILLS = [
  'alpha-feature', 'birth', 'deep-research', 'gemini', 'handover',
  'list-issues-pr-pulse', 'mine', 'new-issue', 'oracle-manage',
  'speak', 'what-we-done', 'whats-next', 'workon',
] as const;

// Backwards-compatible aliases
export const labOnly = [...LAB_SKILLS] as string[];

export const profiles: Record<string, { include?: string[]; exclude?: string[] }> = {
  starter: {
    include: [...STARTER_SKILLS],
  },
  standard: {
    include: [...STANDARD_SKILLS],
  },
  full: {
    exclude: labOnly,  // all skills except lab-only experiments
  },
  lab: {},             // everything — all discovered skills
};

/**
 * Resolve a profile to a filtered list of skill names.
 * Returns null for profiles that mean "all skills" (lab) — unless secrets/zombies exist.
 * Secret and zombie skills are excluded from ALL profiles; install by name only (-s flag).
 */
export function resolveProfile(
  profileName: string,
  allSkillNames: string[],
  secretSkillNames?: string[],
  zombieSkillNames?: string[]
): string[] | null {
  const excluded = new Set([...(secretSkillNames || []), ...(zombieSkillNames || [])]);
  const profile = profiles[profileName];
  if (!profile) return null;

  if (profile.include && profile.include.length > 0) {
    return profile.include.filter((s) => !excluded.has(s));
  }

  if (profile.exclude && profile.exclude.length > 0) {
    return allSkillNames.filter((s) => !profile.exclude!.includes(s) && !excluded.has(s));
  }

  // Empty = all skills (lab) — but still exclude secrets + zombies
  return excluded.size > 0
    ? allSkillNames.filter((s) => !excluded.has(s))
    : null;
}
