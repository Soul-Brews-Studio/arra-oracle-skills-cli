/**
 * Skill profiles — 3 tiers, single source of truth.
 *
 * minimal: newcomer essentials — 7 skills (lifecycle + trace + update + upgrade)
 * standard: daily driver — 13 essential skills (data-driven, session 8+9)
 * full: all stable skills (excludes lab-only experiments AND minimal-only lite variants)
 * lab: everything including experimental / bleeding edge (still excludes minimal-only lite variants)
 *
 * Profile audit: 120 sessions mined (2026-04-15). Skills earning standard
 * must have 10+ session appearances. Demoted: about-oracle (5), create-shortcut (6),
 * oracle-soul-sync-update (6), standup (10), skills-list (3), oracle-family-scan (8).
 * These move to full (still installable, not lab-gated).
 *
 * MINIMAL_ONLY classification (#285): forward-lite, recap-lite, rrr-lite are token-
 * optimized replacements for full versions. They have value in minimal only —
 * elsewhere they duplicate functionality of forward/recap/rrr. Excluded from full+lab.
 */

/** Minimal profile — lite lifecycle + trace + update + upgrade (token-optimized) */
export const MINIMAL_SKILLS = [
  'about-oracle', 'forward-lite', 'go', 'oracle-soul-sync-update', 'recap-lite', 'rrr-lite', 'trace',
] as const;

/** Standard profile — daily driver skills (always installed) */
export const STANDARD_SKILLS = [
  'awaken', 'bampenpien', 'bud', 'dig', 'forward', 'go',
  'learn', 'recap', 'rrr', 'talk-to', 'team-agents', 'trace',
] as const;

/** Lab-only skills — experimental, not in standard or full */
export const LAB_SKILLS = [
  'contacts', 'dream', 'feel', 'fyi', 'hey', 'inbox', 'mailbox',
  'schedule', 'watch', 'worktree', 'xray',
] as const;

/** Minimal-only skills — token-optimized lite variants that replace the full
 *  version when in `minimal` profile. They have no value outside minimal because
 *  the full versions (`forward`, `recap`, `rrr`) are present in higher tiers.
 *  Excluded from `full` and `lab` profiles. Closes #285. */
export const MINIMAL_ONLY_SKILLS = [
  'forward-lite', 'recap-lite', 'rrr-lite',
] as const;

/** Zombie skills — internal development candidates from arra-symbiosis-skills.
 *  Excluded from ALL profiles. Install by name only: `arra install -s workon`
 *  These are dormant — available for development, not for users.
 *
 *  Storage: each zombie lives under `src/skills/.archive/<name>/SKILL.md`
 *  (moved out of the active skill listing for cognitive + visual cleanup).
 *  The installer + VFS generator know to also scan `.archive/` so the `-s`
 *  opt-in path keeps working unchanged. Nothing-is-Deleted preserved. */
export const ZOMBIE_SKILLS = [
  // Original 13 (from arra-symbiosis-skills)
  'alpha-feature', 'birth', 'deep-research', 'gemini', 'handover',
  'list-issues-pr-pulse', 'mine', 'new-issue', 'oracle-manage',
  'speak', 'what-we-done', 'whats-next', 'workon',
  // 2026-05-13 cull (#327): 13 zombies based on usage audit (3,685 sessions).
  // Kept active by explicit user request: bampenpien (standard), feel + morpheus (lab),
  // fyi (lab, imported from oracle-proof-of-concept-skills), resonance (implicit-full).
  'i-believed', 'work-with', 'morpheus',
  'retrospective', 'skills-list',
  'fleet', 'machines', 'warp', 'release',
  'philosophy', 'wormhole', 'harden', 'vault',
  // 2026-05-14 (#333 content correction): original simple /dream body
  // preserved as zombie after /dream absorbed the evolved morpheus body.
  'dream-original',
] as const;

/** Return the source directory for a skill by name — `.archive/` for zombies,
 *  plain `src/skills/<name>` for everything else. Pure-function helper used by
 *  installer + VFS generator + any future tooling that needs to resolve a skill
 *  source path. Falls back to the active path so callers can still test
 *  existence via fs.existsSync. */
export function skillDirFor(name: string, skillsRoot: string): string {
  const isZombie = (ZOMBIE_SKILLS as readonly string[]).includes(name);
  // Use string concatenation here to avoid a node:path import in this pure module.
  const sep = skillsRoot.endsWith('/') ? '' : '/';
  return isZombie
    ? `${skillsRoot}${sep}.archive/${name}`
    : `${skillsRoot}${sep}${name}`;
}

// Backwards-compatible aliases
export const labOnly = [...LAB_SKILLS] as string[];
export const minimalOnly = [...MINIMAL_ONLY_SKILLS] as string[];

export const profiles: Record<string, { include?: string[]; exclude?: string[] }> = {
  minimal: {
    include: [...MINIMAL_SKILLS],
  },
  standard: {
    include: [...STANDARD_SKILLS],
  },
  full: {
    exclude: [...labOnly, ...minimalOnly],  // all skills except lab-only + minimal-only lite variants
  },
  lab: {
    exclude: minimalOnly,                    // everything except minimal-only lite variants (full versions present)
  },
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
