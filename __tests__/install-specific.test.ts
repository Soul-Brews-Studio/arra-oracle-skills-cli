import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { readdir, readFile, rm, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { tmpdir } from "os";
import { agents } from "../src/cli/agents";
import { installSkills, discoverSkills } from "../src/cli/installer";
import type { AgentConfig } from "../src/cli/types";

const TEST_DIR = join(tmpdir(), `arra-install-specific-${Date.now()}`);
const SKILLS_DIR = join(TEST_DIR, "skills");
const COMMANDS_DIR = join(TEST_DIR, "commands");
const TEST_AGENT = "test-specific" as any;

const testAgentConfig: AgentConfig = {
  name: "test-specific",
  displayName: "Test Specific",
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

describe("install specific skills (--skill)", () => {
  beforeEach(cleanup);

  it("installs only named skills", async () => {
    await installSkills([TEST_AGENT], {
      global: true,
      skills: ["recap", "rrr"],
      yes: true,
    });

    const installed = await listSkillDirs(SKILLS_DIR);
    expect(installed).toEqual(["recap", "rrr"]);
  });

  it("installs single skill", async () => {
    await installSkills([TEST_AGENT], {
      global: true,
      skills: ["trace"],
      yes: true,
    });

    const installed = await listSkillDirs(SKILLS_DIR);
    expect(installed).toEqual(["trace"]);
    const content = await readFile(join(SKILLS_DIR, "trace", "SKILL.md"), "utf-8");
    expect(content).toContain("installer: arra-oracle-skills-cli");
  });

  it("ignores unknown skill names gracefully", async () => {
    await installSkills([TEST_AGENT], {
      global: true,
      skills: ["recap", "nonexistent-skill"],
      yes: true,
    });

    const installed = await listSkillDirs(SKILLS_DIR);
    expect(installed).toEqual(["recap"]);
  });

  it("does not remove existing skills when adding specific ones", async () => {
    // Install all first
    await installSkills([TEST_AGENT], { global: true, yes: true });
    const allSkills = await discoverSkills();
    let installed = await listSkillDirs(SKILLS_DIR);
    expect(installed.length).toBe(allSkills.length);

    // Install specific — should NOT remove others
    await installSkills([TEST_AGENT], {
      global: true,
      skills: ["recap"],
      yes: true,
    });

    installed = await listSkillDirs(SKILLS_DIR);
    // Still has all skills (specific install is additive, not destructive)
    expect(installed.length).toBe(allSkills.length);
  });

  it("manifest lists only installed skills", async () => {
    await installSkills([TEST_AGENT], {
      global: true,
      skills: ["recap", "rrr", "trace"],
      yes: true,
    });

    const manifest = JSON.parse(await readFile(join(SKILLS_DIR, ".arra-oracle-skills.json"), "utf-8"));
    expect(manifest.skills.sort()).toEqual(["recap", "rrr", "trace"]);
  });
});
