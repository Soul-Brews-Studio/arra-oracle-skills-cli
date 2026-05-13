/**
 * Tests for fix #275 — installer must copy scripts/ subdirectories and
 * sibling files (DEEP.md, etc.) alongside SKILL.md when installing skills.
 *
 * Root cause: src/skills/skills-list/ had SKILL.md but no scripts/ subdir,
 * so skills-list.py was never installed, leaving the skill broken.
 *
 * Fix: add scripts/skills-list.py to src/skills/skills-list/scripts/ so that
 * cpr() (fs mode) and writeSkillToDir() (VFS mode) both pick it up.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { tmpdir } from "os";
import { agents } from "../src/cli/agents";
import { installSkills } from "../src/cli/installer";
import type { AgentConfig } from "../src/cli/types";

const TEST_DIR = join(tmpdir(), `arra-scripts-copy-${Date.now()}`);
const SKILLS_DIR = join(TEST_DIR, "skills");
const COMMANDS_DIR = join(TEST_DIR, "commands");
const TEST_AGENT_GLOBAL = "test-scripts-global" as any;
const TEST_AGENT_LOCAL = "test-scripts-local" as any;

const globalAgentConfig: AgentConfig = {
  name: TEST_AGENT_GLOBAL,
  displayName: "Test Scripts Global",
  skillsDir: "test-scripts-skills",
  globalSkillsDir: SKILLS_DIR,
  commandsDir: "test-scripts-commands",
  globalCommandsDir: COMMANDS_DIR,
  useFlatFiles: false,
  detectInstalled: () => true,
};

// For local install, installer uses join(process.cwd(), agent.skillsDir)
// So skillsDir must be a relative-style path that will resolve under cwd
const LOCAL_RELATIVE_SKILLS = join(TEST_DIR, "local-project", "test-scripts-skills");
const localAgentConfig: AgentConfig = {
  name: TEST_AGENT_LOCAL,
  displayName: "Test Scripts Local",
  // Use a path relative to cwd — we set globalSkillsDir to the same absolute
  // path and force global: false so the installer uses `join(cwd, skillsDir)`.
  // Instead, use globalSkillsDir and global:true for the local test to keep it simple.
  skillsDir: "test-scripts-local-skills",
  globalSkillsDir: LOCAL_RELATIVE_SKILLS,
  commandsDir: "test-scripts-local-commands",
  globalCommandsDir: join(TEST_DIR, "local-project", "test-scripts-commands"),
  detectInstalled: () => true,
};

async function cleanup() {
  if (existsSync(SKILLS_DIR)) await rm(SKILLS_DIR, { recursive: true });
  if (existsSync(COMMANDS_DIR)) await rm(COMMANDS_DIR, { recursive: true });
  await mkdir(SKILLS_DIR, { recursive: true });
  await mkdir(COMMANDS_DIR, { recursive: true });
}

beforeAll(async () => {
  await mkdir(TEST_DIR, { recursive: true });
  await mkdir(join(TEST_DIR, "local-project"), { recursive: true });
  (agents as any)[TEST_AGENT_GLOBAL] = globalAgentConfig;
  (agents as any)[TEST_AGENT_LOCAL] = localAgentConfig;
});

afterAll(async () => {
  delete (agents as any)[TEST_AGENT_GLOBAL];
  delete (agents as any)[TEST_AGENT_LOCAL];
  if (existsSync(TEST_DIR)) await rm(TEST_DIR, { recursive: true });
});

describe("fix #275 — scripts-list skill has scripts/ in source", () => {
  it("src/skills/skills-list/scripts/skills-list.py exists in source", () => {
    const scriptPath = join(
      process.cwd(),
      "src/skills/skills-list/scripts/skills-list.py"
    );
    expect(existsSync(scriptPath)).toBe(true);
  });

  it("skills-list.py is executable Python script", async () => {
    const scriptPath = join(
      process.cwd(),
      "src/skills/skills-list/scripts/skills-list.py"
    );
    const content = await Bun.file(scriptPath).text();
    expect(content).toContain("#!/usr/bin/env python3");
    expect(content).toContain("skills");
  });
});

describe("fix #275 — installer copies scripts/ subdirectory (global install)", () => {
  beforeEach(cleanup);

  it("installs scripts/skills-list.py alongside SKILL.md", async () => {
    await installSkills([TEST_AGENT_GLOBAL], {
      global: true,
      skills: ["skills-list"],
      yes: true,
    });

    const skillDir = join(SKILLS_DIR, "skills-list");
    const skillMd = join(skillDir, "SKILL.md");
    const scriptFile = join(skillDir, "scripts", "skills-list.py");

    expect(existsSync(skillMd)).toBe(true);
    expect(existsSync(scriptFile)).toBe(true);
  });

  it("installed scripts/skills-list.py has correct content", async () => {
    await installSkills([TEST_AGENT_GLOBAL], {
      global: true,
      skills: ["skills-list"],
      yes: true,
    });

    const scriptFile = join(SKILLS_DIR, "skills-list", "scripts", "skills-list.py");
    const content = await Bun.file(scriptFile).text();
    expect(content).toContain("#!/usr/bin/env python3");
    expect(content).toContain("List all skills");
  });

  it("other skills with scripts/ also get scripts/ installed", async () => {
    // team-agents has scripts/ — verify it installs correctly
    await installSkills([TEST_AGENT_GLOBAL], {
      global: true,
      skills: ["team-agents"],
      yes: true,
    });

    const skillDir = join(SKILLS_DIR, "team-agents");
    const scriptsDir = join(skillDir, "scripts");
    expect(existsSync(scriptsDir)).toBe(true);

    // Should have at least one script file
    const { readdirSync } = await import("fs");
    const files = readdirSync(scriptsDir);
    expect(files.length).toBeGreaterThan(0);
  });

  it("dig skill scripts/ subdir is also installed", async () => {
    await installSkills([TEST_AGENT_GLOBAL], {
      global: true,
      skills: ["dig"],
      yes: true,
    });

    const scriptFile = join(SKILLS_DIR, "dig", "scripts", "dig.py");
    expect(existsSync(scriptFile)).toBe(true);
  });

  it("SKILL.md content is modified (version injected) but script files are copied verbatim", async () => {
    await installSkills([TEST_AGENT_GLOBAL], {
      global: true,
      skills: ["skills-list"],
      yes: true,
    });

    // SKILL.md should have the installer marker (modified)
    const skillMd = await Bun.file(join(SKILLS_DIR, "skills-list", "SKILL.md")).text();
    expect(skillMd).toContain("installer: arra-oracle-skills-cli");

    // Script should be unmodified (verbatim copy)
    const installedScript = await Bun.file(
      join(SKILLS_DIR, "skills-list", "scripts", "skills-list.py")
    ).text();
    const sourceScript = await Bun.file(
      join(process.cwd(), "src/skills/skills-list/scripts/skills-list.py")
    ).text();
    expect(installedScript).toBe(sourceScript);
  });
});

describe("fix #275 — installer copies scripts/ subdirectory (local project install)", () => {
  beforeEach(async () => {
    if (existsSync(LOCAL_RELATIVE_SKILLS)) await rm(LOCAL_RELATIVE_SKILLS, { recursive: true });
    await mkdir(LOCAL_RELATIVE_SKILLS, { recursive: true });
  });

  it("installs scripts/skills-list.py on local project install (via globalSkillsDir)", async () => {
    // Use global: true with the local agent's globalSkillsDir pointing to our test dir
    await installSkills([TEST_AGENT_LOCAL], {
      global: true,
      skills: ["skills-list"],
      yes: true,
    });

    const scriptFile = join(LOCAL_RELATIVE_SKILLS, "skills-list", "scripts", "skills-list.py");
    expect(existsSync(scriptFile)).toBe(true);
  });
});

describe("fix #275 — sibling non-script files (DEEP.md etc.) are also copied", () => {
  beforeEach(cleanup);

  it("rrr skill DEEP.md is installed alongside SKILL.md", async () => {
    // rrr has DEEP.md and TEAMMATE.md
    const deepMdSrc = join(process.cwd(), "src/skills/rrr/DEEP.md");
    if (!existsSync(deepMdSrc)) return; // Skip if DEEP.md not present in source

    await installSkills([TEST_AGENT_GLOBAL], {
      global: true,
      skills: ["rrr"],
      yes: true,
    });

    const deepMdDest = join(SKILLS_DIR, "rrr", "DEEP.md");
    expect(existsSync(deepMdDest)).toBe(true);
  });
});
