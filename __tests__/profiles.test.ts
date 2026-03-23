import { describe, it, expect } from "bun:test";
import { profiles, features, resolveProfile, resolveProfileWithFeatures } from "../src/profiles";

const ALL_SKILLS = [
  'forward', 'retrospective', 'recap', 'standup', 'go', 'about-oracle',
  'trace', 'learn', 'talk-to', 'oracle-family-scan',
  'awaken', 'philosophy', 'who-are-you',
  'oracle-soul-sync-update',
  'schedule', 'project',
  'where-we-are', 'auto-retrospective',
  'inbox', 'memory', 'create-shortcut', 'rrr',
];

describe("profiles", () => {
  it("has 3 profiles: seed, standard, full", () => {
    expect(Object.keys(profiles)).toEqual(['seed', 'standard', 'full']);
  });

  it("seed has 11 skills", () => {
    const result = resolveProfile("seed", ALL_SKILLS);
    expect(result).toEqual(['forward', 'retrospective', 'rrr', 'recap', 'standup', 'go', 'about-oracle', 'oracle-family-scan', 'oracle-soul-sync-update', 'inbox', 'memory']);
    expect(result?.length).toBe(11);
  });

  it("standard has 15 skills", () => {
    const result = resolveProfile("standard", ALL_SKILLS);
    expect(result?.length).toBe(16);
    expect(result).toContain('forward');
    expect(result).toContain('retrospective');
    expect(result).toContain('recap');
    expect(result).toContain('trace');
    expect(result).toContain('learn');
    expect(result).toContain('talk-to');
    expect(result).toContain('awaken');
    expect(result).toContain('inbox');
    expect(result).toContain('memory');
  });

  it("full returns null (no filtering)", () => {
    const result = resolveProfile("full", ALL_SKILLS);
    expect(result).toBeNull();
  });

  it("unknown profile returns null", () => {
    const result = resolveProfile("nonexistent", ALL_SKILLS);
    expect(result).toBeNull();
  });
});

describe("features", () => {
  it("soul has 4 skills", () => {
    expect(features.soul.length).toBe(4);
    expect(features.soul).toContain('awaken');
    expect(features.soul).toContain('philosophy');
    expect(features.soul).toContain('who-are-you');
    expect(features.soul).toContain('about-oracle');
  });

  it("network has 3 comms skills", () => {
    expect(features.network.length).toBe(3);
    expect(features.network).toContain('talk-to');
  });

  it("workspace has 2 skills", () => {
    expect(features.workspace.length).toBe(2);
    expect(features.workspace).toContain('schedule');
    expect(features.workspace).toContain('project');
  });
});

describe("resolveProfileWithFeatures", () => {
  it("seed + soul = 14 skills", () => {
    const result = resolveProfileWithFeatures("seed", ["soul"], ALL_SKILLS);
    // 11 seed + 4 soul - 1 overlap (about-oracle) = 14
    expect(result.length).toBe(14);
    expect(result).toContain('forward');
    expect(result).toContain('awaken');
    expect(result).toContain('philosophy');
  });

  it("standard + network deduplicates", () => {
    const result = resolveProfileWithFeatures("standard", ["network"], ALL_SKILLS);
    // standard(16) + network(3) - 3 overlap = 16
    expect(result.length).toBe(16);
    const unique = new Set(result);
    expect(unique.size).toBe(result.length);
  });

  it("seed + workspace = 13 skills", () => {
    const result = resolveProfileWithFeatures("seed", ["workspace"], ALL_SKILLS);
    // 11 + 2 = 13
    expect(result.length).toBe(13);
    expect(result).toContain('schedule');
    expect(result).toContain('project');
  });

  it("full + any feature = all skills", () => {
    const result = resolveProfileWithFeatures("full", ["soul", "network"], ALL_SKILLS);
    expect(result.length).toBe(ALL_SKILLS.length);
  });

  it("multiple features stack", () => {
    const result = resolveProfileWithFeatures("seed", ["soul", "workspace"], ALL_SKILLS);
    // 11 + 4 + 2 - 1 (about-oracle overlap) = 16
    expect(result.length).toBe(16);
    expect(result).toContain('awaken');
    expect(result).toContain('schedule');
  });

  it("empty features = just profile", () => {
    const result = resolveProfileWithFeatures("seed", [], ALL_SKILLS);
    expect(result.length).toBe(11);
  });
});
