/**
 * Shared fixture for installer tests.
 *
 * Every install-*.test.ts used to re-declare the same boilerplate: a temp
 * TEST_DIR, a synthetic AgentConfig pointed at it, register/unregister into the
 * live `agents` map, and a per-test cleanup(). This factory owns that pattern so
 * the consolidated suites only describe *behaviour*.
 *
 * Faithful to the originals it replaces:
 *   - `useFlatFiles` is only set when passed (omitted → installer default, the
 *     dir-based layout the thclaws/e2e suites assert on).
 *   - `withCommands: false` omits the commands dir entirely (thclaws had no
 *     commandsDir), so skills land at <skillsDir>/<name>/SKILL.md.
 */
import { rm, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { agents } from "../../src/cli/agents";
import type { AgentConfig } from "../../src/cli/types";

export interface InstallFixture {
  /** agent key to pass to installSkills/uninstallSkills */
  agent: any;
  dir: string;
  skillsDir: string;
  commandsDir: string;
  config: AgentConfig;
  /** mkdir the temp dir + register the synthetic agent (use in beforeAll) */
  register(): Promise<void>;
  /** unregister the agent + remove the temp dir (use in afterAll) */
  unregister(): Promise<void>;
  /** wipe + recreate skills (and commands, if present) — use in beforeEach */
  cleanup(): Promise<void>;
}

export interface FixtureOpts {
  /** set the AgentConfig.useFlatFiles flag; omit to leave it unset (installer default) */
  useFlatFiles?: boolean;
  /** give the agent a commands dir (default true); false → skills-only target */
  withCommands?: boolean;
}

export function makeInstallFixture(name: string, opts: FixtureOpts = {}): InstallFixture {
  const withCommands = opts.withCommands ?? true;
  const dir = join(tmpdir(), `arra-${name}-${Date.now()}`);
  const skillsDir = join(dir, "skills");
  const commandsDir = join(dir, "commands");
  const agent = `test-${name}` as any;

  const config: AgentConfig = {
    name: `test-${name}`,
    displayName: `Test ${name}`,
    skillsDir: `test-skills-${name}`,
    globalSkillsDir: skillsDir,
    detectInstalled: () => true,
    ...(opts.useFlatFiles !== undefined ? { useFlatFiles: opts.useFlatFiles } : {}),
    ...(withCommands
      ? { commandsDir: `test-commands-${name}`, globalCommandsDir: commandsDir }
      : {}),
  };

  return {
    agent,
    dir,
    skillsDir,
    commandsDir,
    config,
    async register() {
      await mkdir(dir, { recursive: true });
      (agents as any)[agent] = config;
    },
    async unregister() {
      delete (agents as any)[agent];
      if (existsSync(dir)) await rm(dir, { recursive: true });
    },
    async cleanup() {
      if (existsSync(skillsDir)) await rm(skillsDir, { recursive: true });
      await mkdir(skillsDir, { recursive: true });
      if (withCommands) {
        if (existsSync(commandsDir)) await rm(commandsDir, { recursive: true });
        await mkdir(commandsDir, { recursive: true });
      }
    },
  };
}

/** List non-dotfile skill directories in a skills dir, sorted. */
export async function listSkillDirs(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  const { readdir } = await import("fs/promises");
  const entries = await readdir(dir, { withFileTypes: true });
  return entries
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name)
    .sort();
}
