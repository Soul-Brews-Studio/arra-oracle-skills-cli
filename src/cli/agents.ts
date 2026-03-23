import { homedir } from 'os';
import { join } from 'path';
import { existsSync } from 'fs';
import type { AgentConfig, AgentType } from './types.js';

const home = homedir();

export const agents: Record<AgentType, AgentConfig> = {
  opencode: {
    name: 'opencode',
    displayName: 'OpenCode',
    skillsDir: '.opencode/skills', // skills/<name>/SKILL.md (agent skills)
    globalSkillsDir: join(home, '.config/opencode/skills'),
    commandsDir: '.opencode/commands', // commands/<name>.md (slash commands)
    globalCommandsDir: join(home, '.config/opencode/commands'),
    useFlatFiles: true, // Commands use flat <name>.md files
    detectInstalled: () => existsSync(join(home, '.config/opencode')),
  },
  'claude-code': {
    name: 'claude-code',
    displayName: 'Claude Code',
    skillsDir: '.claude/skills',
    globalSkillsDir: join(home, '.claude/skills'),
    commandsDir: '.claude/commands',
    globalCommandsDir: join(home, '.claude/commands'),
    useFlatFiles: true,
    commandsOptIn: true, // Only install commands with --commands flag
    detectInstalled: () => existsSync(join(home, '.claude')),
  },
  codex: {
    name: 'codex',
    displayName: 'Codex',
    skillsDir: '.codex/skills',
    globalSkillsDir: join(home, '.codex/skills'),
    commandsDir: '.codex/prompts',
    globalCommandsDir: join(home, '.codex/prompts'),
    useFlatFiles: true,
    detectInstalled: () => existsSync(join(home, '.codex')),
  },
  cursor: {
    name: 'cursor',
    displayName: 'Cursor',
    skillsDir: '.cursor/skills',
    globalSkillsDir: join(home, '.cursor/skills'),
    detectInstalled: () => existsSync(join(home, '.cursor')),
  },
  amp: {
    name: 'amp',
    displayName: 'Amp',
    skillsDir: '.agents/skills',
    globalSkillsDir: join(home, '.config/agents/skills'),
    detectInstalled: () => existsSync(join(home, '.config/amp')),
  },
  kilo: {
    name: 'kilo',
    displayName: 'Kilo Code',
    skillsDir: '.kilocode/skills',
    globalSkillsDir: join(home, '.kilocode/skills'),
    detectInstalled: () => existsSync(join(home, '.kilocode')),
  },
  roo: {
    name: 'roo',
    displayName: 'Roo Code',
    skillsDir: '.roo/skills',
    globalSkillsDir: join(home, '.roo/skills'),
    detectInstalled: () => existsSync(join(home, '.roo')),
  },
  goose: {
    name: 'goose',
    displayName: 'Goose',
    skillsDir: '.goose/skills',
    globalSkillsDir: join(home, '.config/goose/skills'),
    detectInstalled: () => existsSync(join(home, '.config/goose')),
  },
  gemini: {
    name: 'gemini',
    displayName: 'Gemini CLI',
    skillsDir: '.gemini/skills',
    globalSkillsDir: join(home, '.gemini/skills'),
    commandsDir: '.gemini/commands',
    globalCommandsDir: join(home, '.gemini/commands'),
    useFlatFiles: true,
    commandFormat: 'toml',
    detectInstalled: () => existsSync(join(home, '.gemini')),
  },
  antigravity: {
    name: 'antigravity',
    displayName: 'Antigravity',
    skillsDir: '.agent/skills',
    globalSkillsDir: join(home, '.gemini/antigravity/skills'),
    detectInstalled: () => existsSync(join(home, '.gemini/antigravity')),
  },
  copilot: {
    name: 'copilot',
    displayName: 'GitHub Copilot',
    skillsDir: '.github/skills',
    globalSkillsDir: join(home, '.copilot/skills'),
    detectInstalled: () => existsSync(join(home, '.copilot')),
  },
  openclaw: {
    name: 'openclaw',
    displayName: 'OpenClaw',
    skillsDir: 'skills',
    globalSkillsDir: join(home, '.openclaw/skills'),
    detectInstalled: () => existsSync(join(home, '.openclaw')),
  },
  droid: {
    name: 'droid',
    displayName: 'Droid',
    skillsDir: '.factory/skills',
    globalSkillsDir: join(home, '.factory/skills'),
    detectInstalled: () => existsSync(join(home, '.factory')),
  },
  windsurf: {
    name: 'windsurf',
    displayName: 'Windsurf',
    skillsDir: '.windsurf/skills',
    globalSkillsDir: join(home, '.codeium/windsurf/skills'),
    detectInstalled: () => existsSync(join(home, '.codeium/windsurf')),
  },
  cline: {
    name: 'cline',
    displayName: 'Cline',
    skillsDir: '.cline/skills',
    globalSkillsDir: join(home, '.cline/skills'),
    detectInstalled: () => existsSync(join(home, '.cline')),
  },
  aider: {
    name: 'aider',
    displayName: 'Aider',
    skillsDir: '.aider/skills',
    globalSkillsDir: join(home, '.aider/skills'),
    detectInstalled: () => existsSync(join(home, '.aider')),
  },
  continue: {
    name: 'continue',
    displayName: 'Continue',
    skillsDir: '.continue/skills',
    globalSkillsDir: join(home, '.continue/skills'),
    detectInstalled: () => existsSync(join(home, '.continue')),
  },
  zed: {
    name: 'zed',
    displayName: 'Zed',
    skillsDir: '.zed/skills',
    globalSkillsDir: join(home, '.zed/skills'),
    detectInstalled: () => existsSync(join(home, '.zed')),
  },
};

/** Default agents to install to (unless --agent overrides) */
export const defaultAgentNames = ['claude-code', 'codex'];

export function detectInstalledAgents(): string[] {
  return Object.entries(agents)
    .filter(([_, config]) => config.detectInstalled())
    .map(([name]) => name);
}

/** Get default agents (installed subset of defaultAgentNames, fallback to all) */
export function getDefaultAgents(): string[] {
  const installed = detectInstalledAgents();
  const defaults = defaultAgentNames.filter((a) => installed.includes(a));
  return defaults.length > 0 ? defaults : installed;
}

export function getAgentNames(): string[] {
  return Object.keys(agents);
}
