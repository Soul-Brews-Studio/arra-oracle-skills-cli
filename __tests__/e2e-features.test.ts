import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { readdir, rm, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { tmpdir } from "os";
import { agents } from "../src/cli/agents";
import { installSkills, discoverSkills } from "../src/cli/installer";
import { profiles, labOnly, resolveProfile } from "../src/profiles";
import type { AgentConfig } from "../src/cli/types";

const TEST_DIR = join(tmpdir(), `arra-oracle-skills-profile-${Date.now()}`);
const SKILLS_DIR = join(TEST_DIR, "skills");
const COMMANDS_DIR = join(TEST_DIR, "commands");
const TEST_AGENT = "test-profile" as any;

const testAgentConfig: AgentConfig = {
  name: "test-profile",
  displayName: "Test Profile",
  skillsDir: "test-skills",
  globalSkillsDir: SKILLS_DIR,
  commandsDir: "test-commands",
  globalCommandsDir: COMMANDS_DIR,
  useFlatFiles: true,
  detectInstalled: () => true,
};

beforeAll(async () => {
  await mkdir(TEST_DIR, { recursive: true });
  (agents as any)[TEST_AGENT] = testAgentConfig;
});

afterAll(async () => {
  delete (agents as any)[TEST_AGENT];
  if (existsSync(TEST_DIR)) await rm(TEST_DIR, { recursive: true });
});

async function listSkillDirs(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir, { withFileTypes: true });
  return entries.filter((d) => d.isDirectory() && !d.name.startsWith(".")).map((d) => d.name).sort();
}

async function cleanup() {
  if (existsSync(SKILLS_DIR)) await rm(SKILLS_DIR, { recursive: true });
  if (existsSync(COMMANDS_DIR)) await rm(COMMANDS_DIR, { recursive: true });
  await mkdir(SKILLS_DIR, { recursive: true });
  await mkdir(COMMANDS_DIR, { recursive: true });
}

describe("e2e: install with standard profile", () => {
  beforeEach(cleanup);

  it("standard installs 16 skills", async () => {
    await installSkills([TEST_AGENT], {
      global: true,
      profile: "standard",
      yes: true,
    });

    const installed = await listSkillDirs(SKILLS_DIR);
    expect(installed.length).toBe(profiles.standard.include!.length);
    for (const name of profiles.standard.include!) {
      expect(installed).toContain(name);
    }
  });
});

describe("e2e: install with full profile", () => {
  beforeEach(cleanup);

  it("full installs all stable skills (excludes lab-only)", async () => {
    const allSkills = await discoverSkills();
    await installSkills([TEST_AGENT], {
      global: true,
      profile: "full",
      yes: true,
    });

    const installed = await listSkillDirs(SKILLS_DIR);
    const excludedCount = allSkills.filter(s => s.secret || s.zombie).length;
    const expectedCount = allSkills.length - labOnly.filter(s => allSkills.some(sk => sk.name === s)).length - excludedCount;
    expect(installed.length).toBe(expectedCount);
    for (const name of labOnly) {
      expect(installed).not.toContain(name);
    }
  });
});

describe("e2e: install with lab profile", () => {
  beforeEach(cleanup);

  it("lab installs all skills (excludes secrets + zombies)", async () => {
    const allSkills = await discoverSkills();
    await installSkills([TEST_AGENT], {
      global: true,
      profile: "lab",
      yes: true,
    });

    const installed = await listSkillDirs(SKILLS_DIR);
    const excludedCount = allSkills.filter(s => s.secret || s.zombie).length;
    expect(installed.length).toBe(allSkills.length - excludedCount);
  });
});

describe("e2e: profile switch (full → standard)", () => {
  beforeEach(cleanup);

  it("switching from full to standard removes extra skills", async () => {
    // Install full first
    await installSkills([TEST_AGENT], {
      global: true,
      profile: "full",
      yes: true,
    });

    const allSkills = await discoverSkills();
    let installed = await listSkillDirs(SKILLS_DIR);
    const excludedCount = allSkills.filter(s => s.secret || s.zombie).length;
    const fullCount = allSkills.length - labOnly.filter(s => allSkills.some(sk => sk.name === s)).length - excludedCount;
    expect(installed.length).toBe(fullCount);

    // Switch to standard
    await installSkills([TEST_AGENT], {
      global: true,
      profile: "standard",
      yes: true,
    });

    installed = await listSkillDirs(SKILLS_DIR);
    expect(installed.length).toBe(profiles.standard.include!.length);

    // Full-only skills should be gone
    const allNames = allSkills.map((s) => s.name);
    const standardSet = new Set(profiles.standard.include!);
    const fullOnly = allNames.filter((s) => !standardSet.has(s));
    for (const name of fullOnly) {
      expect(installed).not.toContain(name);
    }
  });
});
