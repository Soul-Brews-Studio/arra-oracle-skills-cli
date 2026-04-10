import { describe, it, expect } from "bun:test";
import { profiles, labOnly, resolveProfile } from "../src/profiles";

const ALL_SKILLS = [
  "about-oracle", "auto-retrospective", "awaken", "contacts", "create-shortcut",
  "dig", "dream", "feel", "forward", "go", "i-believe", "inbox", "incubate", "learn",
  "oracle-family-scan", "oracle-soul-sync-update", "philosophy", "project", "recap",
  "resonance", "rrr", "schedule", "standup", "talk-to", "team-agents", "trace",
  "vault", "where-we-are", "who-are-you", "xray",
];

describe("profiles", () => {
  it("standard has 14 skills", () => {
    expect(profiles.standard.include).toHaveLength(14);
  });

  it("full excludes lab-only skills", () => {
    expect(profiles.full.exclude).toEqual(labOnly);
  });

  it("lab has no include or exclude (means all)", () => {
    expect(profiles.lab.include).toBeUndefined();
    expect(profiles.lab.exclude).toBeUndefined();
  });

  it("standard includes dig", () => {
    expect(profiles.standard.include).toContain("dig");
  });

  it("standard does NOT include create-shortcut", () => {
    expect(profiles.standard.include).not.toContain("create-shortcut");
  });

  it("standard does NOT include dream or feel", () => {
    expect(profiles.standard.include).not.toContain("dream");
    expect(profiles.standard.include).not.toContain("feel");
  });

  it("labOnly contains contacts, create-shortcut, dream, feel, i-believe, inbox, schedule, team-agents, vault", () => {
    expect(labOnly).toContain("contacts");
    expect(labOnly).toContain("create-shortcut");
    expect(labOnly).toContain("dream");
    expect(labOnly).toContain("feel");
    expect(labOnly).toContain("i-believe");
    expect(labOnly).toContain("inbox");
    expect(labOnly).toContain("schedule");
    expect(labOnly).toContain("team-agents");
    expect(labOnly).toContain("vault");
  });
});

describe("resolveProfile", () => {
  it("standard returns 14 skills", () => {
    const result = resolveProfile("standard", ALL_SKILLS);
    expect(result).toHaveLength(14);
  });

  it("full returns all minus lab-only", () => {
    const result = resolveProfile("full", ALL_SKILLS)!;
    expect(result).not.toBeNull();
    expect(result.length).toBe(ALL_SKILLS.length - labOnly.length);
    for (const name of labOnly) {
      expect(result).not.toContain(name);
    }
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

  it("full includes everything standard has", () => {
    const full = resolveProfile("full", ALL_SKILLS)!;
    const standard = resolveProfile("standard", ALL_SKILLS)!;
    for (const skill of standard) {
      expect(full).toContain(skill);
    }
  });
});
