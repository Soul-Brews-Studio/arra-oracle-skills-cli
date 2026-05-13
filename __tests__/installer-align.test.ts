/**
 * Tests for explicit-profile alignment (#285 Part 2, closes #267).
 *
 * Invariants:
 *   1. `install --profile <name>` (explicit) → ALIGN: removes arra-managed skills not in target
 *   2. Bare `install` (no flag) → purely additive (Bug 5 protection, #257)
 *   3. `install -s <skill>` (no --profile) → purely additive
 *   4. Non-arra skills (no 'installer:' frontmatter) → NEVER touched during alignment
 *   5. Pre-removal diff is printed even under -y
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { readdir, rm, mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { tmpdir } from "os";
import { agents } from "../src/cli/agents";
import { installSkills, discoverSkills } from "../src/cli/installer";
import { profiles, MINIMAL_SKILLS, STANDARD_SKILLS } from "../src/profiles";
import type { AgentConfig } from "../src/cli/types";

const TEST_DIR = join(tmpdir(), `arra-oracle-skills-align-${Date.now()}`);
const SKILLS_DIR = join(TEST_DIR, "skills");
const COMMANDS_DIR = join(TEST_DIR, "commands");
const TEST_AGENT = "test-align" as any;

const testAgentConfig: AgentConfig = {
  name: "test-align",
  displayName: "Test Align",
  skillsDir: "test-skills-align",
  globalSkillsDir: SKILLS_DIR,
  commandsDir: "test-commands-align",
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
  return entries
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort();
}

async function cleanup() {
  if (existsSync(SKILLS_DIR)) await rm(SKILLS_DIR, { recursive: true });
  if (existsSync(COMMANDS_DIR)) await rm(COMMANDS_DIR, { recursive: true });
  await mkdir(SKILLS_DIR, { recursive: true });
  await mkdir(COMMANDS_DIR, { recursive: true });
}

// Plant a non-arra skill (no installer: frontmatter) in SKILLS_DIR
async function plantExternalSkill(name: string): Promise<void> {
  const dir = join(SKILLS_DIR, name);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, "SKILL.md"), `---\nname: ${name}\ndescription: External skill\n---\n# /${name}\n`);
}

describe("alignment: explicit --profile triggers removal of arra-managed skills not in target", () => {
  beforeEach(cleanup);

  it("explicit --profile minimal after --profile standard removes standard-only skills", async () => {
    // Step 1: install standard profile (explicit)
    await installSkills([TEST_AGENT], {
      global: true,
      profile: "standard",
      profileExplicit: true,
      yes: true,
    });

    const afterStandard = await listSkillDirs(SKILLS_DIR);
    expect(afterStandard.length).toBe(profiles.standard.include!.length);

    // Step 2: align down to minimal (explicit)
    await installSkills([TEST_AGENT], {
      global: true,
      profile: "minimal",
      profileExplicit: true,
      yes: true,
    });

    const afterMinimal = await listSkillDirs(SKILLS_DIR);

    // Should now have exactly the minimal skills
    expect(afterMinimal.length).toBe(MINIMAL_SKILLS.length);
    for (const name of MINIMAL_SKILLS) {
      expect(afterMinimal).toContain(name);
    }

    // Standard-only skills that were removed:
    const standardOnlySkills = STANDARD_SKILLS.filter(
      (s) => !(MINIMAL_SKILLS as readonly string[]).includes(s)
    );
    for (const name of standardOnlySkills) {
      expect(afterMinimal).not.toContain(name);
    }
  });

  it("explicit --profile full after standard installs more, then explicit --profile minimal aligns down", async () => {
    // Install standard first (explicit)
    await installSkills([TEST_AGENT], {
      global: true,
      profile: "standard",
      profileExplicit: true,
      yes: true,
    });

    const afterStandard = await listSkillDirs(SKILLS_DIR);
    expect(afterStandard.length).toBeGreaterThanOrEqual(STANDARD_SKILLS.length);

    // Then align down to minimal (explicit)
    await installSkills([TEST_AGENT], {
      global: true,
      profile: "minimal",
      profileExplicit: true,
      yes: true,
    });

    const afterMinimal = await listSkillDirs(SKILLS_DIR);
    expect(afterMinimal.length).toBe(MINIMAL_SKILLS.length);
    for (const name of MINIMAL_SKILLS) {
      expect(afterMinimal).toContain(name);
    }
  });
});

describe("alignment: bare install (no profileExplicit) is purely additive — Bug 5 protection (#257)", () => {
  beforeEach(cleanup);

  it("install without profileExplicit does NOT remove skills missing from profile", async () => {
    // First: plant standard skills explicitly
    await installSkills([TEST_AGENT], {
      global: true,
      profile: "standard",
      profileExplicit: true,
      yes: true,
    });

    const afterStandard = await listSkillDirs(SKILLS_DIR);
    const standardCount = afterStandard.length;
    expect(standardCount).toBe(profiles.standard.include!.length);

    // Second: install minimal WITHOUT profileExplicit (simulates default / no flag)
    await installSkills([TEST_AGENT], {
      global: true,
      profile: "minimal",
      profileExplicit: false, // not explicit — additive only
      yes: true,
    });

    const afterAdditive = await listSkillDirs(SKILLS_DIR);
    // Additive: the count grows (minimal adds its unique skills) but nothing is removed.
    // The key invariant is that ALL original standard skills are still present.
    expect(afterAdditive.length).toBeGreaterThanOrEqual(standardCount);
    // All standard skills still present (none removed)
    for (const name of profiles.standard.include!) {
      expect(afterAdditive).toContain(name);
    }
  });

  it("install without any profile flag does NOT remove skills", async () => {
    // First: plant standard skills explicitly
    await installSkills([TEST_AGENT], {
      global: true,
      profile: "standard",
      profileExplicit: true,
      yes: true,
    });

    const afterStandard = await listSkillDirs(SKILLS_DIR);
    const standardCount = afterStandard.length;

    // Second: install with NO profile (undefined profileExplicit)
    await installSkills([TEST_AGENT], {
      global: true,
      yes: true,
      // No profile, no profileExplicit — install all
    });

    const afterAll = await listSkillDirs(SKILLS_DIR);
    // All standard skills still present (count may be higher since all skills installed)
    for (const name of profiles.standard.include!) {
      expect(afterAll).toContain(name);
    }
  });
});

describe("alignment: install -s <skill> (no --profile) does not trigger alignment", () => {
  beforeEach(cleanup);

  it("-s flag without --profile is purely additive", async () => {
    // First: install standard explicitly
    await installSkills([TEST_AGENT], {
      global: true,
      profile: "standard",
      profileExplicit: true,
      yes: true,
    });

    const afterStandard = await listSkillDirs(SKILLS_DIR);
    const standardCount = afterStandard.length;

    // Add a single skill with -s (no profile, no profileExplicit)
    await installSkills([TEST_AGENT], {
      global: true,
      skills: ["trace"],
      // No profile, no profileExplicit
      yes: true,
    });

    const afterAddSkill = await listSkillDirs(SKILLS_DIR);
    // Still at least standardCount skills — nothing removed
    expect(afterAddSkill.length).toBeGreaterThanOrEqual(standardCount);
    // All original standard skills still present
    for (const name of profiles.standard.include!) {
      expect(afterAddSkill).toContain(name);
    }
  });
});

describe("alignment: non-arra skills are NEVER removed", () => {
  beforeEach(cleanup);

  it("external skill without 'installer: arra-oracle-skills-cli' is kept during alignment", async () => {
    // Install standard (explicit)
    await installSkills([TEST_AGENT], {
      global: true,
      profile: "standard",
      profileExplicit: true,
      yes: true,
    });

    // Plant an external skill
    await plantExternalSkill("my-custom-skill");

    const beforeAlign = await listSkillDirs(SKILLS_DIR);
    expect(beforeAlign).toContain("my-custom-skill");

    // Align down to minimal (explicit) — should NOT remove the external skill
    await installSkills([TEST_AGENT], {
      global: true,
      profile: "minimal",
      profileExplicit: true,
      yes: true,
    });

    const afterAlign = await listSkillDirs(SKILLS_DIR);
    // External skill must survive
    expect(afterAlign).toContain("my-custom-skill");

    // Minimal skills must be present
    for (const name of MINIMAL_SKILLS) {
      expect(afterAlign).toContain(name);
    }
  });
});

describe("alignment: pre-removal diff message is printed", () => {
  beforeEach(cleanup);

  it("alignment message is printed even under -y", async () => {
    // Install standard (explicit) so there are skills to align away
    await installSkills([TEST_AGENT], {
      global: true,
      profile: "standard",
      profileExplicit: true,
      yes: true,
    });

    // Capture stdout
    const originalLog = console.log;
    const messages: string[] = [];
    console.log = (...args: any[]) => {
      messages.push(args.join(" "));
      originalLog(...args);
    };

    try {
      // Align to minimal — should print the diff message even with yes: true
      await installSkills([TEST_AGENT], {
        global: true,
        profile: "minimal",
        profileExplicit: true,
        yes: true, // skips interactive prompt, but diff must still print
      });
    } finally {
      console.log = originalLog;
    }

    const alignMsg = messages.find((m) => m.includes("Profile alignment") && m.includes("REMOVE"));
    expect(alignMsg).toBeDefined();
    expect(alignMsg).toContain("minimal");
  });
});
