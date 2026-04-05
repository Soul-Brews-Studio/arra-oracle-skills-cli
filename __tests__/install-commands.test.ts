import { describe, it, expect, beforeAll, afterAll, beforeEach } from "bun:test";
import { readdir, readFile, rm, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { tmpdir } from "os";
import { agents } from "../src/cli/agents";
import { installSkills, discoverSkills } from "../src/cli/installer";
import type { AgentConfig } from "../src/cli/types";

const TEST_DIR = join(tmpdir(), `arra-install-cmds-${Date.now()}`);
const SKILLS_DIR = join(TEST_DIR, "skills");
const COMMANDS_DIR = join(TEST_DIR, "commands");
const TEST_AGENT = "test-cmds" as any;

const testAgentConfig: AgentConfig = {
  name: "test-cmds",
  displayName: "Test Commands",
  skillsDir: "test-skills",
  globalSkillsDir: SKILLS_DIR,
  commandsDir: "test-commands",
  globalCommandsDir: COMMANDS_DIR,
  useFlatFiles: true,
  detectInstalled: () => true,
};

async function listCommandFiles(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  return (await readdir(dir)).filter((f) => f.endsWith(".md")).sort();
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

describe("command stubs", () => {
  beforeEach(cleanup);

  it("installs command stubs for non-hidden skills with --commands", async () => {
    const allSkills = await discoverSkills();
    await installSkills([TEST_AGENT], { global: true, yes: true, commands: true });

    const commands = await listCommandFiles(COMMANDS_DIR);
    const hiddenNames = new Set(allSkills.filter((s) => s.hidden).map((s) => s.name));

    for (const skill of allSkills) {
      if (hiddenNames.has(skill.name)) {
        expect(commands).not.toContain(`${skill.name}.md`);
      } else {
        expect(commands).toContain(`${skill.name}.md`);
      }
    }
  });

  it("does NOT install command stubs without --commands for commandsOptIn agents", async () => {
    const optInAgent = "test-optin" as any;
    const optInConfig: AgentConfig = {
      ...testAgentConfig,
      name: "test-optin",
      displayName: "Test OptIn",
      commandsOptIn: true,
      globalCommandsDir: join(TEST_DIR, "optin-commands"),
    };
    (agents as any)[optInAgent] = optInConfig;
    await mkdir(join(TEST_DIR, "optin-commands"), { recursive: true });

    await installSkills([optInAgent], { global: true, yes: true });

    const commands = await listCommandFiles(join(TEST_DIR, "optin-commands"));
    expect(commands.length).toBe(0);

    delete (agents as any)[optInAgent];
  });

  it("command stubs have correct frontmatter", async () => {
    await installSkills([TEST_AGENT], { global: true, yes: true, commands: true });

    const commands = await listCommandFiles(COMMANDS_DIR);
    expect(commands.length).toBeGreaterThan(0);

    const content = await readFile(join(COMMANDS_DIR, commands[0]), "utf-8");
    expect(content).toMatch(/^---/);
    expect(content).toMatch(/description:/);
    expect(content).toContain("$ARGUMENTS");
  });
});
