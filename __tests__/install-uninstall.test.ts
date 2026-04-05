import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { readdir, rm, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { tmpdir } from "os";
import { agents } from "../src/cli/agents";
import { installSkills, uninstallSkills, discoverSkills } from "../src/cli/installer";
import type { AgentConfig } from "../src/cli/types";

const TEST_DIR = join(tmpdir(), `arra-uninstall-${Date.now()}`);
const SKILLS_DIR = join(TEST_DIR, "skills");
const COMMANDS_DIR = join(TEST_DIR, "commands");
const TEST_AGENT = "test-uninstall" as any;

const testAgentConfig: AgentConfig = {
  name: "test-uninstall",
  displayName: "Test Uninstall",
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

describe("uninstall all", () => {
  beforeEach(cleanup);

  it("removes all oracle skills", async () => {
    const allSkills = await discoverSkills();
    await installSkills([TEST_AGENT], { global: true, yes: true });

    const result = await uninstallSkills([TEST_AGENT], { global: true, yes: true });
    expect(result.removed).toBe(allSkills.length);

    const remaining = await listSkillDirs(SKILLS_DIR);
    expect(remaining.length).toBe(0);
  });
});

describe("uninstall specific skills", () => {
  beforeEach(cleanup);

  it("removes only named skills", async () => {
    await installSkills([TEST_AGENT], { global: true, yes: true });
    const allSkills = await discoverSkills();

    await uninstallSkills([TEST_AGENT], {
      global: true,
      skills: ["recap", "trace"],
      yes: true,
    });

    const remaining = await listSkillDirs(SKILLS_DIR);
    expect(remaining).not.toContain("recap");
    expect(remaining).not.toContain("trace");
    expect(remaining.length).toBe(allSkills.length - 2);
  });
});

describe("uninstall preserves external skills", () => {
  beforeEach(cleanup);

  it("skips skills without installer marker", async () => {
    await installSkills([TEST_AGENT], { global: true, yes: true });

    // Create external skill (no marker)
    const externalDir = join(SKILLS_DIR, "external-skill");
    await mkdir(externalDir, { recursive: true });
    await writeFile(join(externalDir, "SKILL.md"), "# External\n\nNo marker.");

    await uninstallSkills([TEST_AGENT], { global: true, yes: true });

    expect(existsSync(externalDir)).toBe(true);
    const remaining = await listSkillDirs(SKILLS_DIR);
    expect(remaining).toEqual(["external-skill"]);

    await rm(externalDir, { recursive: true });
  });

  it("removes explicitly named external skills with --skill", async () => {
    await installSkills([TEST_AGENT], { global: true, yes: true });

    const externalDir = join(SKILLS_DIR, "my-custom-skill");
    await mkdir(externalDir, { recursive: true });
    await writeFile(join(externalDir, "SKILL.md"), "# Custom\n\nNo marker.");

    await uninstallSkills([TEST_AGENT], {
      global: true,
      skills: ["my-custom-skill"],
      yes: true,
    });

    expect(existsSync(externalDir)).toBe(false);

    await uninstallSkills([TEST_AGENT], { global: true, yes: true });
  });
});

describe("orphan cleanup on install", () => {
  beforeEach(cleanup);

  it("moves orphaned oracle skills to trash on reinstall", async () => {
    // Install all skills
    await installSkills([TEST_AGENT], { global: true, yes: true });

    // Simulate an orphan: a skill that has our marker but doesn't exist in source
    const orphanDir = join(SKILLS_DIR, "deleted-skill");
    await mkdir(orphanDir, { recursive: true });
    await writeFile(
      join(orphanDir, "SKILL.md"),
      "---\ninstaller: arra-oracle-skills-cli v1.0.0\n---\n# Deleted\n"
    );

    // Reinstall — orphan should be cleaned up
    await installSkills([TEST_AGENT], { global: true, yes: true });

    expect(existsSync(orphanDir)).toBe(false);
  });
});
