# oracle-skills

[![CI](https://github.com/Soul-Brews-Studio/oracle-skills-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/Soul-Brews-Studio/oracle-skills-cli/actions/workflows/ci.yml)
[![Version](https://img.shields.io/github/v/tag/Soul-Brews-Studio/oracle-skills-cli?label=version)](https://github.com/Soul-Brews-Studio/oracle-skills-cli/releases)

Install Oracle skills to Claude Code, OpenCode, Cursor, and 11+ AI coding agents.

> **Note**: This repo supersedes the following archived repositories:
> - ~~[oracle-philosophy](https://github.com/Soul-Brews-Studio/oracle-philosophy)~~ → Now `/philosophy` skill
> - ~~[oracle-starter-kit](https://github.com/laris-co/oracle-starter-kit)~~ → Now `curl | bash` installer
>
> Use this repo as the **single entry point** for Oracle installation.

## Quick Start for AI Agents

If you're an AI agent and a user asked you to install oracle-skills, run this:

```bash
# Install for specific agents (pick the ones the user asked for)
bunx --bun oracle-skills@github:Soul-Brews-Studio/oracle-skills-cli install -g -y --agent claude-code opencode gemini antigravity

# Or install for all detected agents
bunx --bun oracle-skills@github:Soul-Brews-Studio/oracle-skills-cli install -g -y
```

After install, restart your session and run `/learn` on this repo to understand the skills you just installed.

**What this does**: Installs Oracle skills (slash commands like `/learn`, `/trace`, `/recap`, `/rrr`) into your agent's skills directory. Skills are markdown + scripts that extend your capabilities with session awareness, codebase exploration, retrospectives, and more.

See [Supported Agents](#supported-agents) for the full list of compatible agents and their skill paths.

---

## Install

### macOS / Linux — Pre-built binary (recommended)

No Bun or Node.js required. Downloads a self-contained ~59MB binary:

```bash
curl -fsSL https://raw.githubusercontent.com/Soul-Brews-Studio/oracle-skills-cli/main/install.sh | bash
```

| Platform | Binary | Startup |
|----------|--------|---------|
| macOS Apple Silicon | `oracle-skills-darwin-arm64` | ~37ms |
| macOS Intel | `oracle-skills-darwin-x64` | ~37ms |
| Linux x64 | `oracle-skills-linux-x64` | ~37ms |
| Linux ARM64 | `oracle-skills-linux-arm64` | ~37ms |

### Windows / fallback — bunx

Requires [Bun](https://bun.sh) installed:

```bash
bunx --bun oracle-skills@github:Soul-Brews-Studio/oracle-skills-cli#main install -g -y
```

### After install

```bash
# Setup permissions in your Oracle repo
mkdir -p .claude && cat > .claude/settings.local.json << 'EOF'
{
  "permissions": {
    "allow": [
      "Bash(gh:*)", "Bash(ghq:*)", "Bash(git:*)",
      "Bash(bun:*)", "Bash(bunx:*)", "Bash(mkdir:*)", "Bash(ln:*)",
      "Bash(rg:*)", "Bash(date:*)", "Bash(ls:*)", "Bash(tree:*)",
      "Bash(curl:*)", "Bash(du:*)", "Bash(wc:*)",
      "Bash(*ψ/*)", "Bash(*psi/*)",
      "Skill(learn)", "Skill(trace)", "Skill(awaken)",
      "Skill(rrr)", "Skill(recap)", "Skill(project)"
    ]
  }
}
EOF
```

Then restart Claude Code and run `/awaken` ([example](https://github.com/Soul-Brews-Studio/phukhao-oracle)).

## Skills

Oracle skills extend your agent's capabilities with specialized workflows:

| # | Skill | Type | Description |
|---|-------|------|-------------|
| 1 | **learn** | skill + subagent | Explore a codebase |
| 2 | **rrr** | skill + subagent | Create session retrospective with AI diary |
| 3 | **trace** | skill + subagent | Find projects across git history, repos |
| - |  |  |  |
| 4 | **deep-research** | skill + code | Deep Research via Gemini |
| 5 | **gemini** | skill + code | Control Gemini via MQTT WebSocket |
| 6 | **oracle-family-scan** | skill + code | Manage Oracle family |
| 7 | **oraclenet** | skill + code | OracleNet — claim identity, post, comment |
| 8 | **physical** | skill + code | Physical location awareness from FindMy |
| 9 | **project** | skill + code | Clone and track external repos |
| 10 | **recap** | skill + code | Session orientation and awareness |
| 11 | **schedule** | skill + code | Query schedule via Oracle API (Drizzle DB) |
| 12 | **speak** | skill + code | Text-to-speech using edge-tts or macOS say |
| 13 | **watch** | skill + code | Learn from YouTube videos |
| - |  |  |  |
| 14 | **awaken** | skill | Guided Oracle birth |
| 15 | **birth** | skill | Prepare birth props for a new Oracle repo |
| 16 | **dig** | skill | Mine Claude Code sessions |
| 17 | **feel** | skill | Log emotions with optional structure |
| 18 | **forward** | skill | Create handoff + enter plan mode for next |
| 19 | **fyi** | skill | Log information for future reference |
| 20 | **merged** | skill | Post-Merge Cleanup |
| 21 | **oracle** | skill | Manage Oracle skills and profiles |
| 22 | **oracle-soul-sync-update** | skill | Sync Oracle instruments with the family |
| 23 | **philosophy** | skill | Display Oracle philosophy principles |
| 24 | **retrospective** | skill | Create session retrospective with AI diary |
| 25 | **standup** | skill | Daily standup check |
| 26 | **talk-to** | skill | Talk to an agent via Oracle threads |
| 27 | **where-we-are** | skill | Session awareness - alias for /recap --now |
| 28 | **who-are-you** | skill | Know ourselves |
| 29 | **worktree** | skill | Git worktree for parallel work |

*Generated: 2026-03-02 04:05:06 UTC*

## Supported Agents

| Agent | Project Path | Global Path |
|-------|--------------|-------------|
| Claude Code | `.claude/skills/` | `~/.claude/skills/` |
| OpenCode | `.opencode/skills/` | `~/.config/opencode/skills/` |
| Codex | `.codex/skills/` | `~/.codex/skills/` |
| Cursor | `.cursor/skills/` | `~/.cursor/skills/` |
| Amp | `.agents/skills/` | `~/.config/agents/skills/` |
| Kilo Code | `.kilocode/skills/` | `~/.kilocode/skills/` |
| Roo Code | `.roo/skills/` | `~/.roo/skills/` |
| Goose | `.goose/skills/` | `~/.config/goose/skills/` |
| Gemini CLI | `.gemini/skills/` | `~/.gemini/skills/` |
| Antigravity | `.agent/skills/` | `~/.gemini/antigravity/skills/` |
| GitHub Copilot | `.github/skills/` | `~/.copilot/skills/` |
| OpenClaw | `skills/` | `~/.openclaw/skills/` |
| Droid | `.factory/skills/` | `~/.factory/skills/` |
| Windsurf | `.windsurf/skills/` | `~/.codeium/windsurf/skills/` |
| Cline | `.cline/skills/` | `~/.cline/skills/` |
| Aider | `.aider/skills/` | `~/.aider/skills/` |
| Continue | `.continue/skills/` | `~/.continue/skills/` |
| Zed | `.zed/skills/` | `~/.zed/skills/` |

## Philosophy

> "The Oracle Keeps the Human Human"

Oracle skills follow the Oracle Philosophy — AI as external brain, not commander. These skills help AI assistants understand context, maintain session awareness, and build knowledge over time.

## Related

- [oracle-v2](https://github.com/Soul-Brews-Studio/oracle-v2) - MCP Memory Layer (Oracle brain)
- [Soul Brews Plugin Marketplace](https://github.com/Soul-Brews-Studio/plugin-marketplace) - Source of Oracle skills
- [Agent Skills Specification](https://agentskills.io) - Cross-agent skill format
- [add-skill](https://github.com/vercel-labs/add-skill) - Universal skill installer by Vercel

## Superseded Repositories

The following repositories have been **archived** and superseded by this CLI:

| Old Repo | Status | Replacement |
|----------|--------|-------------|
| [oracle-philosophy](https://github.com/Soul-Brews-Studio/oracle-philosophy) | 🗄️ Archived | `/philosophy` skill |
| [oracle-starter-kit](https://github.com/laris-co/oracle-starter-kit) | 🗄️ Archived | `curl \| bash` installer |

## License

MIT
