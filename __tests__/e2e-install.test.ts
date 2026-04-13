import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { readdir, readFile, rm, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { tmpdir } from "os";
import { agents } from "../src/cli/agents";
import { installSkills, uninstallSkills, discoverSkills } from "../src/cli/installer";
import { profiles, labOnly } from "../src/profiles";
import type { AgentConfig } from "../src/cli/types";

const TEST_DIR = join(tmpdir(), `arra-oracle-skills-e2e-${Date.now()}`);
const SKILLS_DIR = join(TEST_DIR, "skills");
const COMMANDS_DIR = join(TEST_DIR, "commands");
const TEST_AGENT = "test-e2e" as any;

const testAgentConfig: AgentConfig = {
  name: "test-e2e",
  displayName: "Test E2E",
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

async function listCommandFiles(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const entries = await readdir(dir);
  return entries.filter((f) => f.endsWith(".md")).sort();
}

describe("e2e: install with standard profile", () => {
  it("installs standard profile skills + commands", async () => {
    await installSkills([TEST_AGENT], {
      global: true,
      profile: "standard",
      yes: true,
      commands: true,
    });

    const skills = await listSkillDirs(SKILLS_DIR);
    const standardSkills = profiles.standard.include!;

    for (const name of standardSkills) {
      expect(skills).toContain(name);
    }
    expect(skills.length).toBe(standardSkills.length);
  });

  it("each skill has SKILL.md with installer marker", async () => {
    const skills = await listSkillDirs(SKILLS_DIR);

    for (const name of skills) {
      const skillMd = join(SKILLS_DIR, name, "SKILL.md");
      expect(existsSync(skillMd)).toBe(true);

      const content = await readFile(skillMd, "utf-8");
      expect(content).toContain("installer: arra-oracle-skills-cli");
    }
  });

  it("each skill has version-prefixed description", async () => {
    const skills = await listSkillDirs(SKILLS_DIR);

    for (const name of skills) {
      const content = await readFile(join(SKILLS_DIR, name, "SKILL.md"), "utf-8");
      expect(content).toMatch(/v\d+\.\d+\.\d+(-[\w.]+)? G-SKLL(\s\[\w+\])? \|/);
    }
  });

  it("command stubs exist for each non-hidden skill", async () => {
    const commands = await listCommandFiles(COMMANDS_DIR);
    const allSkills = await discoverSkills();
    const hiddenNames = new Set(allSkills.filter((s) => s.hidden).map((s) => s.name));
    const standardSkills = profiles.standard.include!;

    for (const name of standardSkills) {
      if (hiddenNames.has(name)) {
        expect(commands).not.toContain(`${name}.md`);
      } else {
        expect(commands).toContain(`${name}.md`);
      }
    }
  });

  it("manifest has correct structure", async () => {
    const manifestPath = join(SKILLS_DIR, ".arra-oracle-skills.json");
    expect(existsSync(manifestPath)).toBe(true);

    const manifest = JSON.parse(await readFile(manifestPath, "utf-8"));
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+(-[\w.]+)?$/);
    expect(manifest.agent).toBe(TEST_AGENT);
    expect(manifest.skills).toBeArray();
    expect(manifest.skills.length).toBe(profiles.standard.include!.length);
    expect(manifest.installedAt).toBeTruthy();
  });

  it("VERSION.md exists", async () => {
    expect(existsSync(join(SKILLS_DIR, "VERSION.md"))).toBe(true);
  });
});

describe("e2e: uninstall after standard", () => {
  it("removes all skills and commands", async () => {
    const result = await uninstallSkills([TEST_AGENT], {
      global: true,
      yes: true,
    });

    expect(result.removed).toBe(profiles.standard.include!.length);
    expect(result.agents).toBe(1);

    const skills = await listSkillDirs(SKILLS_DIR);
    expect(skills.length).toBe(0);

    const commands = await listCommandFiles(COMMANDS_DIR);
    expect(commands.length).toBe(0);
  });
});

describe("e2e: install full profile", () => {
  it("installs all stable skills (excludes lab-only)", async () => {
    const allSkills = await discoverSkills();

    await installSkills([TEST_AGENT], {
      global: true,
      profile: "full",
      yes: true,
      commands: true,
    });

    const installed = await listSkillDirs(SKILLS_DIR);
    const fullSkills = allSkills.filter(s => !labOnly.includes(s.name) && !s.secret && !s.zombie);
    expect(installed.length).toBe(fullSkills.length);
  });

  it("every full-profile skill has a directory", async () => {
    const allSkills = await discoverSkills();
    const installed = await listSkillDirs(SKILLS_DIR);
    const fullSkills = allSkills.filter(s => !labOnly.includes(s.name) && !s.secret && !s.zombie);

    for (const skill of fullSkills) {
      expect(installed).toContain(skill.name);
    }
  });

  it("command stubs match installed non-hidden skills", async () => {
    const allSkills = await discoverSkills();
    const installed = await listSkillDirs(SKILLS_DIR);
    const commands = await listCommandFiles(COMMANDS_DIR);

    for (const skill of allSkills.filter(s => installed.includes(s.name))) {
      if (skill.hidden) {
        expect(commands).not.toContain(`${skill.name}.md`);
      } else {
        expect(commands).toContain(`${skill.name}.md`);
      }
    }
  });
});

describe("e2e: uninstall full", () => {
  it("removes everything cleanly", async () => {
    const installed = await listSkillDirs(SKILLS_DIR);

    const result = await uninstallSkills([TEST_AGENT], {
      global: true,
      yes: true,
    });

    expect(result.removed).toBe(installed.length);

    const skills = await listSkillDirs(SKILLS_DIR);
    expect(skills.length).toBe(0);

    const commands = await listCommandFiles(COMMANDS_DIR);
    expect(commands.length).toBe(0);
  });
});

describe("e2e: uninstall preserves external skills", () => {
  it("skips skills without installer marker", async () => {
    await installSkills([TEST_AGENT], {
      global: true,
      profile: "standard",
      yes: true,
    });

    const externalDir = join(SKILLS_DIR, "external-skill");
    await mkdir(externalDir, { recursive: true });
    await writeFile(join(externalDir, "SKILL.md"), "# External Skill\n\nInstalled by another tool.");

    const result = await uninstallSkills([TEST_AGENT], {
      global: true,
      yes: true,
    });

    expect(existsSync(externalDir)).toBe(true);
    const remaining = await listSkillDirs(SKILLS_DIR);
    expect(remaining).toEqual(["external-skill"]);

    await rm(externalDir, { recursive: true });
  });

  it("removes explicitly named external skills with -s flag", async () => {
    await installSkills([TEST_AGENT], {
      global: true,
      profile: "standard",
      yes: true,
    });

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

describe("e2e: profile switch (full → standard)", () => {
  it("installs full then switches to standard, removes extras", async () => {
    await installSkills([TEST_AGENT], {
      global: true,
      profile: "full",
      yes: true,
      commands: true,
    });

    const allSkills = await discoverSkills();
    const fullSkills = allSkills.filter(s => !labOnly.includes(s.name) && !s.secret && !s.zombie);
    let skills = await listSkillDirs(SKILLS_DIR);
    expect(skills.length).toBe(fullSkills.length);

    await installSkills([TEST_AGENT], {
      global: true,
      profile: "standard",
      yes: true,
      commands: true,
    });

    skills = await listSkillDirs(SKILLS_DIR);
    const standardSkills = profiles.standard.include!;

    expect(skills.length).toBe(standardSkills.length);
    for (const name of standardSkills) {
      expect(skills).toContain(name);
    }

    const standardOnly = fullSkills.map(s => s.name).filter(
      (s) => !standardSkills.includes(s)
    );
    for (const name of standardOnly) {
      expect(skills).not.toContain(name);
    }
  });

  afterAll(async () => {
    await uninstallSkills([TEST_AGENT], { global: true, yes: true });
  });
});
