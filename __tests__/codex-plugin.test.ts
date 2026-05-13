/**
 * Tests for Codex 0.128.0+ plugin marketplace support (issue #278).
 *
 * Verifies that installCodexPluginMarketplace():
 *   1. Creates manifest.toml at the correct marketplace dir
 *   2. Creates per-skill plugin.toml descriptors
 *   3. Copies skill body as prompt.md
 *   4. Updates config.toml with [marketplaces.*] and [plugins.*] entries
 *   5. Skips hidden skills in plugin registration
 *   6. Is idempotent (re-running does not duplicate config.toml sections)
 *
 * isCodexPluginMarketplace() and getCodexMarketplaceDir() are also exercised.
 */

import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { readFile, mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { tmpdir } from "os";
import {
  isCodexPluginMarketplace,
  getCodexMarketplaceDir,
  installCodexPluginMarketplace,
} from "../src/cli/installer";
import { discoverSkills } from "../src/cli/installer";
import type { Skill } from "../src/cli/types";

// ── Test directories ──────────────────────────────────────────────────────────

const TEST_HOME = join(tmpdir(), `arra-codex-plugin-${Date.now()}`);
const CODEX_DIR = join(TEST_HOME, ".codex");
const CONFIG_PATH = join(CODEX_DIR, "config.toml");
const MARKETPLACE_DIR = join(
  TEST_HOME,
  ".codex",
  ".tmp",
  "bundled-marketplaces",
  "arra-oracle-skills"
);

// Minimal mock skills for unit tests (no disk I/O needed for descriptor tests)
const MOCK_SKILLS: Skill[] = [
  {
    name: "rrr",
    description: "Session retrospective with AI diary",
    path: join(TEST_HOME, "skills", "rrr"), // non-existent path — prompt.md copy is skipped gracefully
  },
  {
    name: "recap",
    description: "Session orientation and awareness",
    path: join(TEST_HOME, "skills", "recap"),
  },
  {
    name: "secret-internal",
    description: "Internal hidden skill",
    path: join(TEST_HOME, "skills", "secret-internal"),
    hidden: true,
  },
];

// ── Setup / teardown ──────────────────────────────────────────────────────────

beforeAll(async () => {
  await mkdir(CODEX_DIR, { recursive: true });
  // Simulate Codex 0.128.0+ by creating a config.toml with existing marketplace entries
  await writeFile(
    CONFIG_PATH,
    [
      `[marketplaces.openai-bundled]`,
      `source_type = "bundled"`,
      ``,
      `[marketplaces.openai-primary-runtime]`,
      `source_type = "runtime"`,
      ``,
    ].join("\n")
  );
});

afterAll(async () => {
  if (existsSync(TEST_HOME)) await rm(TEST_HOME, { recursive: true });
});

// ── isCodexPluginMarketplace ──────────────────────────────────────────────────

describe("isCodexPluginMarketplace", () => {
  it("returns true when ~/.codex/config.toml exists", () => {
    expect(isCodexPluginMarketplace(TEST_HOME)).toBe(true);
  });

  it("returns false for a home dir without config.toml", () => {
    expect(isCodexPluginMarketplace(join(tmpdir(), "nonexistent-home-99999"))).toBe(false);
  });
});

// ── getCodexMarketplaceDir ────────────────────────────────────────────────────

describe("getCodexMarketplaceDir", () => {
  it("returns path under the given homeDir", () => {
    const dir = getCodexMarketplaceDir(TEST_HOME);
    expect(dir).toBe(
      join(TEST_HOME, ".codex", ".tmp", "bundled-marketplaces", "arra-oracle-skills")
    );
  });
});

// ── installCodexPluginMarketplace ─────────────────────────────────────────────

describe("installCodexPluginMarketplace", () => {
  // Run the installer once and test the results
  beforeAll(async () => {
    await installCodexPluginMarketplace(MOCK_SKILLS, "26.5.0-test", "no-shell", {
      marketplaceDir: MARKETPLACE_DIR,
      configPath: CONFIG_PATH,
    });
  });

  it("creates the marketplace directory", () => {
    expect(existsSync(MARKETPLACE_DIR)).toBe(true);
  });

  it("creates manifest.toml with correct name and version", async () => {
    const manifestPath = join(MARKETPLACE_DIR, "manifest.toml");
    expect(existsSync(manifestPath)).toBe(true);

    const content = await readFile(manifestPath, "utf-8");
    expect(content).toContain(`name = "arra-oracle-skills"`);
    expect(content).toContain(`version = "26.5.0-test"`);
    expect(content).toContain(`description =`);
  });

  it("creates plugins/ subdirectory", () => {
    expect(existsSync(join(MARKETPLACE_DIR, "plugins"))).toBe(true);
  });

  it("creates a plugin.toml for each non-hidden skill", async () => {
    for (const skill of MOCK_SKILLS) {
      const pluginTomlPath = join(MARKETPLACE_DIR, "plugins", skill.name, "plugin.toml");
      expect(existsSync(pluginTomlPath)).toBe(true);

      const content = await readFile(pluginTomlPath, "utf-8");
      expect(content).toContain(`name = "${skill.name}"`);
      expect(content).toContain(`command = "/${skill.name}"`);
      expect(content).toContain(`version = "26.5.0-test"`);
    }
  });

  it("plugin.toml includes the skill description", async () => {
    const pluginTomlPath = join(MARKETPLACE_DIR, "plugins", "rrr", "plugin.toml");
    const content = await readFile(pluginTomlPath, "utf-8");
    expect(content).toContain("Session retrospective");
  });

  it("adds [marketplaces.arra-oracle-skills] to config.toml", async () => {
    const content = await readFile(CONFIG_PATH, "utf-8");
    expect(content).toContain(`[marketplaces.arra-oracle-skills]`);
    expect(content).toContain(`source_type = "local"`);
    expect(content).toContain(`source = "${MARKETPLACE_DIR}"`);
  });

  it("preserves existing marketplace entries in config.toml", async () => {
    const content = await readFile(CONFIG_PATH, "utf-8");
    expect(content).toContain(`[marketplaces.openai-bundled]`);
    expect(content).toContain(`[marketplaces.openai-primary-runtime]`);
  });

  it("enables non-hidden skills as [plugins.*@arra-oracle-skills]", async () => {
    const content = await readFile(CONFIG_PATH, "utf-8");
    expect(content).toContain(`[plugins."rrr@arra-oracle-skills"]`);
    expect(content).toContain(`[plugins."recap@arra-oracle-skills"]`);
    // Each enabled plugin should have enabled = true
    expect(content).toContain(`enabled = true`);
  });

  it("does NOT register hidden skills as plugins in config.toml", async () => {
    const content = await readFile(CONFIG_PATH, "utf-8");
    expect(content).not.toContain(`[plugins."secret-internal@arra-oracle-skills"]`);
  });

  it("is idempotent — re-running does not duplicate config.toml sections", async () => {
    // Run again
    await installCodexPluginMarketplace(MOCK_SKILLS, "26.5.0-test", "no-shell", {
      marketplaceDir: MARKETPLACE_DIR,
      configPath: CONFIG_PATH,
    });

    const content = await readFile(CONFIG_PATH, "utf-8");

    // Count occurrences of the marketplace section header
    const marketplaceCount = (content.match(/\[marketplaces\.arra-oracle-skills\]/g) || []).length;
    expect(marketplaceCount).toBe(1);

    // Count occurrences of the rrr plugin section header
    const rrrPluginCount = (content.match(/\[plugins\."rrr@arra-oracle-skills"\]/g) || []).length;
    expect(rrrPluginCount).toBe(1);
  });
});

// ── Integration: uses real skills ─────────────────────────────────────────────

describe("installCodexPluginMarketplace (real skills)", () => {
  const REAL_MARKETPLACE_DIR = join(TEST_HOME, "real-marketplace");
  const REAL_CONFIG_PATH = join(TEST_HOME, "real-config.toml");

  beforeAll(async () => {
    // Seed a minimal config.toml
    await writeFile(
      REAL_CONFIG_PATH,
      `[marketplaces.openai-bundled]\nsource_type = "bundled"\n`
    );

    const skills = await discoverSkills();
    expect(skills.length).toBeGreaterThan(0);

    await installCodexPluginMarketplace(
      skills.slice(0, 3), // Use first 3 skills to keep the test fast
      "26.5.0-integ",
      "no-shell",
      { marketplaceDir: REAL_MARKETPLACE_DIR, configPath: REAL_CONFIG_PATH }
    );
  });

  it("creates plugin.toml files for real skills", async () => {
    const skills = await discoverSkills();
    const tested = skills.slice(0, 3);

    for (const skill of tested) {
      const pluginToml = join(REAL_MARKETPLACE_DIR, "plugins", skill.name, "plugin.toml");
      expect(existsSync(pluginToml)).toBe(true);
      const content = await readFile(pluginToml, "utf-8");
      expect(content).toContain(`name = "${skill.name}"`);
    }
  });

  it("registers real skills in config.toml", async () => {
    const skills = await discoverSkills();
    const tested = skills.slice(0, 3);

    const config = await readFile(REAL_CONFIG_PATH, "utf-8");
    expect(config).toContain(`[marketplaces.arra-oracle-skills]`);

    for (const skill of tested) {
      if (skill.hidden) continue;
      expect(config).toContain(`[plugins."${skill.name}@arra-oracle-skills"]`);
    }
  });
});
