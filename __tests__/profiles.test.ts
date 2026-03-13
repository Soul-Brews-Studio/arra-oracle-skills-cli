import { describe, it, expect } from "bun:test";
import { profiles, features, resolveProfile, resolveProfileWithFeatures } from "../src/profiles";

const ALL_SKILLS = [
  'forward', 'retrospective', 'recap', 'standup', 'go', 'about-oracle',
  'trace', 'dig', 'learn', 'talk-to', 'oracle-family-scan',
  'awaken', 'philosophy', 'who-are-you', 'birth', 'feel',
  'oraclenet', 'oracle-soul-sync-update', 'oracle',
  'worktree', 'physical', 'schedule',
  'speak', 'deep-research', 'watch', 'gemini',
  'merged', 'fyi', 'where-we-are', 'rrr', 'project',
];

describe("profiles", () => {
  it("minimal has 7 skills (4 ritual + go + about-oracle + oracle-family-scan)", () => {
    const result = resolveProfile("minimal", ALL_SKILLS);
    expect(result).toEqual(['forward', 'retrospective', 'recap', 'standup', 'go', 'about-oracle', 'oracle-family-scan']);
    expect(result?.length).toBe(7);
  });

  it("seed is alias for minimal", () => {
    const seed = resolveProfile("seed", ALL_SKILLS);
    const minimal = resolveProfile("minimal", ALL_SKILLS);
    expect(seed).toEqual(minimal);
  });

  it("standard has 11 skills (minimal + discovery)", () => {
    const result = resolveProfile("standard", ALL_SKILLS);
    expect(result?.length).toBe(11);
    // includes minimal
    expect(result).toContain('forward');
    expect(result).toContain('retrospective');
    expect(result).toContain('recap');
    expect(result).toContain('standup');
    // includes discovery
    expect(result).toContain('trace');
    expect(result).toContain('dig');
    expect(result).toContain('learn');
    expect(result).toContain('talk-to');
    expect(result).toContain('oracle-family-scan');
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
  it("soul has 6 identity skills", () => {
    expect(features.soul.length).toBe(6);
    expect(features.soul).toContain('awaken');
    expect(features.soul).toContain('philosophy');
    expect(features.soul).toContain('who-are-you');
    expect(features.soul).toContain('about-oracle');
    expect(features.soul).toContain('birth');
    expect(features.soul).toContain('feel');
  });

  it("network has 5 comms skills", () => {
    expect(features.network.length).toBe(5);
    expect(features.network).toContain('talk-to');
    expect(features.network).toContain('oraclenet');
  });

  it("workspace has 3 skills (merged/fyi deprecated)", () => {
    expect(features.workspace.length).toBe(3);
    expect(features.workspace).toContain('worktree');
    expect(features.workspace).toContain('physical');
    expect(features.workspace).toContain('schedule');
    expect(features.workspace).not.toContain('merged');
    expect(features.workspace).not.toContain('fyi');
  });

  it("creator has 4 content skills", () => {
    expect(features.creator.length).toBe(4);
    expect(features.creator).toContain('speak');
    expect(features.creator).toContain('deep-research');
    expect(features.creator).toContain('watch');
    expect(features.creator).toContain('gemini');
  });
});

describe("resolveProfileWithFeatures", () => {
  it("minimal + soul = 12 skills", () => {
    const result = resolveProfileWithFeatures("minimal", ["soul"], ALL_SKILLS);
    // 7 minimal + 6 soul - 1 overlap (about-oracle) = 12
    expect(result.length).toBe(12);
    // has minimal
    expect(result).toContain('forward');
    expect(result).toContain('standup');
    // has soul
    expect(result).toContain('awaken');
    expect(result).toContain('philosophy');
  });

  it("standard + network deduplicates talk-to and oracle-family-scan", () => {
    const result = resolveProfileWithFeatures("standard", ["network"], ALL_SKILLS);
    // standard(11) + network(5) - 2 overlap (talk-to, oracle-family-scan) = 14
    expect(result.length).toBe(14);
    // no duplicates
    const unique = new Set(result);
    expect(unique.size).toBe(result.length);
  });

  it("minimal + creator = 11 skills", () => {
    const result = resolveProfileWithFeatures("minimal", ["creator"], ALL_SKILLS);
    expect(result.length).toBe(11);
    expect(result).toContain('speak');
    expect(result).toContain('gemini');
  });

  it("full + any feature = all skills", () => {
    const result = resolveProfileWithFeatures("full", ["soul", "network"], ALL_SKILLS);
    expect(result.length).toBe(ALL_SKILLS.length);
  });

  it("multiple features stack", () => {
    const result = resolveProfileWithFeatures("minimal", ["soul", "creator"], ALL_SKILLS);
    // 7 + 6 + 4 - 1 (about-oracle overlap) = 16
    expect(result.length).toBe(16);
    expect(result).toContain('awaken');
    expect(result).toContain('speak');
  });

  it("empty features = just profile", () => {
    const result = resolveProfileWithFeatures("minimal", [], ALL_SKILLS);
    expect(result.length).toBe(7);
  });
});
