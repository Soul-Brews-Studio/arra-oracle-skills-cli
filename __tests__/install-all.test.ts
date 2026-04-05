import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { readdir, readFile, rm, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { tmpdir } from "os";
import { agents } from "../src/cli/agents";
import { installSkills, uninstallSkills, discoverSkills } from "../src/cli/installer";
import type { AgentConfig } from "../src/cli/types";

const TEST_DIR = join(tmpdir(), `arra-install-all-${Date.now()}`);
const SKILLS_DIR = join(TEST_DIR, "skills");
const COMMANDS_DIR = join(TEST_DIR, "commands");
const TEST_AGENT = "test-all" as any;

const testAgentConfig: AgentConfig = {
  name: "test-all",
  displayName: "Test All",
  skillsDir: "test-skills",
  globalSkillsDir: SKILLS_DIR,
  commandsDir: "test-commands",
  globalCommandsDir: COMMANDS_DIR,
  useFlatFiles: true,
  detectInstalled: () => true,
};

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

beforeAll(async () => {
  await mkdir(TEST_DIR, { recursive: true });
  (agents as any)[TEST_AGENT] = testAgentConfig;
});

afterAll(async () => {
  delete (agents as any)[TEST_AGENT];
  if (existsSync(TEST_DIR)) await rm(TEST_DIR, { recursive: true });
});

describe("install all (default)", () => {
  beforeEach(cleanup);

  it("installs ALL skills when no --skill filter", async () => {
    const allSkills = await discoverSkills();

    await installSkills([TEST_AGENT], { global: true, yes: true });

    const installed = await listSkillDirs(SKILLS_DIR);
    expect(installed.length).toBe(allSkills.length);
    for (const skill of allSkills) {
      expect(installed).toContain(skill.name);
    }
  });

  it("each skill has SKILL.md with installer marker", async () => {
    await installSkills([TEST_AGENT], { global: true, yes: true });

    const installed = await listSkillDirs(SKILLS_DIR);
    for (const name of installed) {
      const content = await readFile(join(SKILLS_DIR, name, "SKILL.md"), "utf-8");
      expect(content).toContain("installer: arra-oracle-skills-cli");
    }
  });

  it("each skill has version-prefixed description", async () => {
    await installSkills([TEST_AGENT], { global: true, yes: true });

    const installed = await listSkillDirs(SKILLS_DIR);
    for (const name of installed) {
      const content = await readFile(join(SKILLS_DIR, name, "SKILL.md"), "utf-8");
      expect(content).toMatch(/v\d+\.\d+\.\d+(-[\w.]+)? G-SKLL(\s\[\w+\])? \|/);
    }
  });

  it("creates manifest with all skills", async () => {
    const allSkills = await discoverSkills();
    await installSkills([TEST_AGENT], { global: true, yes: true });

    const manifest = JSON.parse(await readFile(join(SKILLS_DIR, ".arra-oracle-skills.json"), "utf-8"));
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+(-[\w.]+)?$/);
    expect(manifest.skills.length).toBe(allSkills.length);
    expect(manifest.agent).toBe(TEST_AGENT);
  });

  it("creates VERSION.md", async () => {
    await installSkills([TEST_AGENT], { global: true, yes: true });
    expect(existsSync(join(SKILLS_DIR, "VERSION.md"))).toBe(true);
  });

  it("reinstall overwrites existing skills", async () => {
    await installSkills([TEST_AGENT], { global: true, yes: true });
    const first = await readFile(join(SKILLS_DIR, ".arra-oracle-skills.json"), "utf-8");

    await installSkills([TEST_AGENT], { global: true, yes: true });
    const second = await readFile(join(SKILLS_DIR, ".arra-oracle-skills.json"), "utf-8");

    // Timestamps should differ
    expect(JSON.parse(first).installedAt).not.toBe(JSON.parse(second).installedAt);
  });
});
