import { describe, it, expect } from "bun:test";
import { profiles, resolveProfile } from "../src/profiles";

const ALL_SKILLS = [
  "about-oracle", "auto-retrospective", "awaken", "contacts", "create-shortcut",
  "dig", "forward", "go", "inbox", "learn", "oracle-family-scan",
  "oracle-soul-sync-update", "philosophy", "project", "recap", "resonance",
  "rrr", "schedule", "standup", "talk-to", "trace", "where-we-are",
  "who-are-you", "xray",
];

describe("profiles", () => {
  it("standard has 16 skills", () => {
    expect(profiles.standard.include).toHaveLength(16);
  });

  it("full has no include (means all)", () => {
    expect(profiles.full.include).toBeUndefined();
  });

  it("lab exists", () => {
    expect(profiles.lab).toBeDefined();
  });

  it("standard includes dig", () => {
    expect(profiles.standard.include).toContain("dig");
  });

  it("standard does NOT include create-shortcut", () => {
    expect(profiles.standard.include).not.toContain("create-shortcut");
  });

  it("lab includes create-shortcut", () => {
    expect(profiles.lab.include).toContain("create-shortcut");
  });
});

describe("resolveProfile", () => {
  it("standard returns 16 skills", () => {
    const result = resolveProfile("standard", ALL_SKILLS);
    expect(result).toHaveLength(16);
  });

  it("full returns null (all skills)", () => {
    const result = resolveProfile("full", ALL_SKILLS);
    expect(result).toBeNull();
  });

  it("lab returns null (all skills)", () => {
    const result = resolveProfile("lab", ALL_SKILLS);
    expect(result).toBeNull();
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
});
