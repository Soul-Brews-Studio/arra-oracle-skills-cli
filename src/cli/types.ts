export interface AgentConfig {
  name: string;
  displayName: string;
  skillsDir: string;
  globalSkillsDir: string;
  commandsDir?: string; // Separate commands directory (OpenCode uses .opencode/command/)
  globalCommandsDir?: string;
  useFlatFiles?: boolean; // Use skillname.md instead of skillname/SKILL.md (OpenCode commands)
  commandsOptIn?: boolean; // Only install commands with --commands flag (default: false = always install)
  commandFormat?: 'md' | 'toml'; // Command stub format (default: 'md')
  detectInstalled: () => boolean;
}

export type AgentType =
  | 'opencode'
  | 'claude-code'
  | 'codex'
  | 'cursor'
  | 'amp'
  | 'kilo'
  | 'roo'
  | 'goose'
  | 'gemini'
  | 'antigravity'
  | 'copilot'
  | 'openclaw'
  | 'droid'
  | 'windsurf'
  | 'cline'
  | 'aider'
  | 'continue'
  | 'zed';

export interface Skill {
  name: string;
  description: string;
  path: string;
  hidden?: boolean; // If true, install SKILL.md but skip command stub (hidden from autocomplete)
  secret?: boolean; // If true, excluded from ALL profiles — install only by name (-s flag)
  zombie?: boolean; // If true, excluded from ALL profiles — internal development candidates, not for users
}

import type { ShellMode } from './fs-utils.js';

export interface InstallOptions {
  global?: boolean;
  skills?: string[];
  profile?: string;
  yes?: boolean;
  agents?: string[];
  commands?: boolean; // Also install command stubs (for agents with commandsOptIn)
  shellMode?: ShellMode;
}
