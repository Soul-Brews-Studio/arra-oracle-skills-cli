import { describe, it, expect } from "bun:test";
import { profiles, labOnly, minimalOnly, MINIMAL_SKILLS, STANDARD_SKILLS, LAB_SKILLS, MINIMAL_ONLY_SKILLS, ZOMBIE_SKILLS, resolveProfile } from "../src/profiles";

// Simulated full skill list — must include all standard + lab + zombie + minimal-only + other discovered skills
const ALL_SKILLS = [
  ...STANDARD_SKILLS,
  ...LAB_SKILLS,
  ...ZOMBIE_SKILLS,
  ...MINIMAL_ONLY_SKILLS,
  // Full/other skills (not standard, not lab-only, not minimal-only, not zombie)
  "about-oracle", "create-shortcut", "incubate",
  "oracle-family-scan", "oracle-soul-sync-update", "project",
  "standup", "where-we-are", "who-are-you",
].sort();

const ZOMBIE_LIST = [...ZOMBIE_SKILLS] as string[];

describe("profiles", () => {
  it("minimal has 7 skills", () => {
    expect(MINIMAL_SKILLS).toHaveLength(7);
    expect(profiles.minimal.include).toHaveLength(7);
  });

  it("minimal includes go for upgrade path", () => {
    expect(MINIMAL_SKILLS).toContain("go");
  });

  it("standard has 13 skills", () => {
    expect(STANDARD_SKILLS).toHaveLength(13);
    expect(profiles.standard.include).toHaveLength(13);
  });

  it("full excludes lab-only AND minimal-only skills (post-#285)", () => {
    expect(profiles.full.exclude).toEqual([...labOnly, ...minimalOnly]);
  });

  it("lab has no include list but excludes minimal-only skills (post-#285)", () => {
    expect(profiles.lab.include).toBeUndefined();
    expect(profiles.lab.exclude).toEqual(minimalOnly);
  });

  it("standard includes dig", () => {
    expect(STANDARD_SKILLS).toContain("dig");
  });

  it("standard includes team-agents", () => {
    expect(STANDARD_SKILLS).toContain("team-agents");
  });

  it("standard does NOT include dream or feel", () => {
    expect([...STANDARD_SKILLS]).not.toContain("dream");
    expect([...STANDARD_SKILLS]).not.toContain("feel");
  });

  it("LAB_SKILLS has 9 experimental skills (post-#327 cull)", () => {
    expect(LAB_SKILLS).toHaveLength(9);
  });

  it("ZOMBIE_SKILLS has 26 archived candidates (13 original + 12 culled in #327 + 1 added in #333)", () => {
    expect(ZOMBIE_SKILLS).toHaveLength(26);
  });

  it("labOnly matches LAB_SKILLS", () => {
    expect(labOnly).toEqual([...LAB_SKILLS]);
  });

  it("no overlap between STANDARD_SKILLS and LAB_SKILLS", () => {
    const standardSet = new Set(STANDARD_SKILLS);
    for (const skill of LAB_SKILLS) {
      expect(standardSet.has(skill)).toBe(false);
    }
  });

  it("no overlap between ZOMBIE_SKILLS and other tiers", () => {
    const standardSet = new Set(STANDARD_SKILLS);
    const labSet = new Set(LAB_SKILLS);
    for (const skill of ZOMBIE_SKILLS) {
      expect(standardSet.has(skill)).toBe(false);
      expect(labSet.has(skill)).toBe(false);
    }
  });

  // #285: MINIMAL_ONLY classification — lite skills excluded from full + lab
  it("MINIMAL_ONLY_SKILLS has 3 lite variants", () => {
    expect(MINIMAL_ONLY_SKILLS).toHaveLength(3);
    expect(MINIMAL_ONLY_SKILLS).toContain("forward-lite");
    expect(MINIMAL_ONLY_SKILLS).toContain("recap-lite");
    expect(MINIMAL_ONLY_SKILLS).toContain("rrr-lite");
  });

  it("minimalOnly alias matches MINIMAL_ONLY_SKILLS", () => {
    expect(minimalOnly).toEqual([...MINIMAL_ONLY_SKILLS]);
  });

  it("minimal profile still includes all 3 lite skills (regression guard)", () => {
    for (const skill of MINIMAL_ONLY_SKILLS) {
      expect(MINIMAL_SKILLS).toContain(skill);
    }
  });

  it("full profile excludes both lab and minimal-only skills", () => {
    expect(profiles.full.exclude).toEqual([...labOnly, ...minimalOnly]);
  });

  it("lab profile excludes minimal-only skills", () => {
    expect(profiles.lab.exclude).toEqual(minimalOnly);
  });

  it("no overlap between STANDARD_SKILLS and MINIMAL_ONLY_SKILLS", () => {
    const standardSet = new Set(STANDARD_SKILLS);
    for (const skill of MINIMAL_ONLY_SKILLS) {
      expect(standardSet.has(skill as any)).toBe(false);
    }
  });
});

describe("resolveProfile", () => {
  it("minimal returns 6 skills", () => {
    const result = resolveProfile("minimal", ALL_SKILLS);
    expect(result).toHaveLength(7);
  });

  it("standard returns 13 skills", () => {
    const result = resolveProfile("standard", ALL_SKILLS);
    expect(result).toHaveLength(13);
  });

  it("full returns all minus lab-only, minimal-only, and zombies", () => {
    const result = resolveProfile("full", ALL_SKILLS, [], ZOMBIE_LIST)!;
    expect(result).not.toBeNull();
    expect(result.length).toBe(ALL_SKILLS.length - labOnly.length - minimalOnly.length - ZOMBIE_LIST.length);
    for (const name of labOnly) {
      expect(result).not.toContain(name);
    }
    for (const name of minimalOnly) {
      expect(result).not.toContain(name);
    }
    for (const name of ZOMBIE_LIST) {
      expect(result).not.toContain(name);
    }
  });

  it("lab returns all minus zombies", () => {
    const result = resolveProfile("lab", ALL_SKILLS, [], ZOMBIE_LIST)!;
    expect(result).not.toBeNull();
    for (const name of ZOMBIE_LIST) {
      expect(result).not.toContain(name);
    }
  });

  it("lab returns all minus minimal-only skills, even with no secrets/zombies (#285)", () => {
    // Pre-#285: lab profile was {}, returned null for "all skills". Post-#285: lab
    // excludes minimalOnly so a filtered list is always returned, never null.
    const result = resolveProfile("lab", ALL_SKILLS)!;
    expect(result).not.toBeNull();
    expect(result.length).toBe(ALL_SKILLS.length - minimalOnly.length);
    for (const name of minimalOnly) {
      expect(result).not.toContain(name);
    }
  });

  it("unknown profile returns null", () => {
    const result = resolveProfile("nonexistent", ALL_SKILLS);
    expect(result).toBeNull();
  });

  it("standard skills are a subset of all skills", () => {
    const result = resolveProfile("standard", ALL_SKILLS)!;
    for (const skill of result) {
      expect(ALL_SKILLS).toContain(skill);
    }
  });

  it("full includes everything standard has", () => {
    const full = resolveProfile("full", ALL_SKILLS, [], ZOMBIE_LIST)!;
    const standard = resolveProfile("standard", ALL_SKILLS)!;
    for (const skill of standard) {
      expect(full).toContain(skill);
    }
  });

  it("zombies are excluded from all profiles", () => {
    const standard = resolveProfile("standard", ALL_SKILLS, [], ZOMBIE_LIST)!;
    const full = resolveProfile("full", ALL_SKILLS, [], ZOMBIE_LIST)!;
    const lab = resolveProfile("lab", ALL_SKILLS, [], ZOMBIE_LIST)!;
    for (const name of ZOMBIE_LIST) {
      expect(standard).not.toContain(name);
      expect(full).not.toContain(name);
      expect(lab).not.toContain(name);
    }
  });

  // #285: lite skills must NOT appear in full or lab resolutions
  it("full does NOT include any minimal-only lite skills", () => {
    const result = resolveProfile("full", ALL_SKILLS, [], ZOMBIE_LIST)!;
    expect(result).not.toBeNull();
    for (const lite of MINIMAL_ONLY_SKILLS) {
      expect(result).not.toContain(lite);
    }
  });

  it("lab does NOT include any minimal-only lite skills", () => {
    const result = resolveProfile("lab", ALL_SKILLS, [], ZOMBIE_LIST)!;
    expect(result).not.toBeNull();
    for (const lite of MINIMAL_ONLY_SKILLS) {
      expect(result).not.toContain(lite);
    }
  });

  it("minimal STILL includes all 3 lite skills (regression guard for resolveProfile)", () => {
    const result = resolveProfile("minimal", ALL_SKILLS)!;
    for (const lite of MINIMAL_ONLY_SKILLS) {
      expect(result).toContain(lite);
    }
  });
});
