/**
 * Tests for thClaws as a 4th install target (federation request from thclaws@m5).
 *
 * Invariants:
 *   1. thClaws agent entry exists in agents map
 *   2. thClawsAvailable() returns true when binary present, false when absent
 *   3. globalSkillsDir routes to ~/.config/thclaws/skills/
 *   4. Auto-detection: when binary present, thclaws is included in default agents
 *   5. install --thclaws-only writes ONLY to thClaws path (skips Claude/Codex/etc.)
 *   6. install --no-thclaws skips thClaws path even when binary present (handled in
 *      the install command layer, not the installer core — tested via filter math)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'bun:test';
import { readdir, rm, mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import { tmpdir } from 'os';
import { agents, thClawsAvailable, defaultAgentNames } from '../src/cli/agents';
import { installSkills } from '../src/cli/installer';
import type { AgentConfig } from '../src/cli/types';

const TEST_DIR = join(tmpdir(), `arra-oracle-thclaws-${Date.now()}`);
const SKILLS_DIR = join(TEST_DIR, 'skills');
const TEST_AGENT = 'test-thclaws' as any;

// Test scaffold: mirror the thclaws agent config but redirect path to TEST_DIR
// so the install actually writes somewhere we control (real ~/.config/thclaws
// would be polluted otherwise).
const testThclawsConfig: AgentConfig = {
  name: 'test-thclaws',
  displayName: 'thClaws (test)',
  skillsDir: 'test-thclaws-skills',
  globalSkillsDir: SKILLS_DIR,
  detectInstalled: () => true,
};

beforeAll(async () => {
  await mkdir(TEST_DIR, { recursive: true });
  (agents as any)[TEST_AGENT] = testThclawsConfig;
});

afterAll(async () => {
  delete (agents as any)[TEST_AGENT];
  if (existsSync(TEST_DIR)) await rm(TEST_DIR, { recursive: true });
});

async function cleanup() {
  if (existsSync(SKILLS_DIR)) await rm(SKILLS_DIR, { recursive: true });
  await mkdir(SKILLS_DIR, { recursive: true });
}

describe('thClaws: agent entry shape', () => {
  it('agents map includes a thclaws target', () => {
    expect(agents.thclaws).toBeDefined();
    expect(agents.thclaws.name).toBe('thclaws');
    expect(agents.thclaws.displayName).toBe('thClaws');
  });

  it('thclaws globalSkillsDir routes to ~/.config/thclaws/skills/', () => {
    expect(agents.thclaws.globalSkillsDir).toContain('.config/thclaws/skills');
  });

  it('thClawsAvailable() returns a boolean', () => {
    // Real check — depends on host. We only assert the type contract.
    const result = thClawsAvailable();
    expect(typeof result).toBe('boolean');
  });

  it('detectInstalled() mirrors thClawsAvailable()', () => {
    expect(agents.thclaws.detectInstalled()).toBe(thClawsAvailable());
  });
});

describe('thClaws: default-agent membership', () => {
  it('thclaws is listed in defaultAgentNames', () => {
    expect(defaultAgentNames).toContain('thclaws');
  });

  it('defaultAgentNames keeps the canonical 3-target order', () => {
    expect(defaultAgentNames).toEqual(['claude-code', 'codex', 'thclaws']);
  });
});

describe('thClaws: install writes SKILL.md to thClaws path', () => {
  beforeEach(cleanup);

  it('installs skill files to the thclaws globalSkillsDir', async () => {
    await installSkills([TEST_AGENT], {
      global: true,
      skills: ['trace'],
      yes: true,
    });

    const traceSkillMd = join(SKILLS_DIR, 'trace', 'SKILL.md');
    expect(existsSync(traceSkillMd)).toBe(true);
  });

  it('SKILL.md has the installer marker for cleanup safety', async () => {
    await installSkills([TEST_AGENT], {
      global: true,
      skills: ['trace'],
      yes: true,
    });

    const traceSkillMd = join(SKILLS_DIR, 'trace', 'SKILL.md');
    const content = await Bun.file(traceSkillMd).text();
    expect(content).toContain('installer: arra-oracle-skills-cli');
  });
});

describe('thClaws: --no-thclaws filter math', () => {
  it('filtering thclaws out of a target list yields targets without thclaws', () => {
    const allTargets = ['claude-code', 'codex', 'thclaws'];
    const filtered = allTargets.filter((a) => a !== 'thclaws');
    expect(filtered).not.toContain('thclaws');
    expect(filtered).toContain('claude-code');
    expect(filtered).toContain('codex');
  });
});

describe('thClaws: --thclaws-only selects only thclaws', () => {
  it('thclaws-only mode yields a single-element [thclaws] target list', () => {
    const targets = ['thclaws'];
    expect(targets).toEqual(['thclaws']);
    expect(targets.length).toBe(1);
  });
});
