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

If you're an AI agent and a user asked you to install oracle-skills:

**macOS / Linux** — pre-built binary (~37ms startup, no runtime needed):

```bash
curl -fsSL https://raw.githubusercontent.com/Soul-Brews-Studio/oracle-skills-cli/main/install.sh | bash
```

**Windows** — via bunx (requires [Bun](https://bun.sh)):

```bash
bunx --bun oracle-skills@github:Soul-Brews-Studio/oracle-skills-cli install -g -y
```

To install for specific agents only, add `--agent`:

```bash
oracle-skills install -g -y --agent claude-code gemini antigravity
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
| 1 | **about-oracle** | skill + subagent | What is Oracle — told by the AI itself |
| 2 | **learn** | skill + subagent | Explore a codebase |
| 3 | **rrr** | skill + subagent | Create session retrospective with AI diary |
| 4 | **trace** | skill + subagent | Find projects across git history, repos |
| - |  |  |  |
| 5 | **deep-research** | skill + code | Deep Research via Gemini |
| 6 | **gemini** | skill + code | Control Gemini via MQTT WebSocket |
| 7 | **oracle-family-scan** | skill + code | Oracle Family Registry |
| 8 | **oraclenet** | skill + code | OracleNet — claim identity, post, comment |
| 9 | **physical** | skill + code | Physical location awareness from FindMy |
| 10 | **project** | skill + code | Clone and track external repos |
| 11 | **recap** | skill + code | Session orientation and awareness |
| 12 | **schedule** | skill + code | Query schedule via Oracle API (Drizzle DB) |
| 13 | **speak** | skill + code | Text-to-speech using edge-tts or macOS say |
| 14 | **watch** | skill + code | Learn from YouTube videos |
| - |  |  |  |
| 15 | **awaken** | skill | Guided Oracle birth |
| 16 | **birth** | skill | Prepare birth props for a new Oracle repo |
| 17 | **dig** | skill | Mine Claude Code sessions |
| 18 | **feel** | skill | Log emotions with optional structure |
| 19 | **forward** | skill | Create handoff + enter plan mode for next |
| 20 | **fyi** | skill | Log information for future reference |
| 21 | **merged** | skill | Post-Merge Cleanup |
| 22 | **oracle** | skill | Manage Oracle skills and profiles |
| 23 | **oracle-soul-sync-update** | skill | Sync Oracle instruments with the family |
| 24 | **philosophy** | skill | Display Oracle philosophy principles |
| 25 | **retrospective** | skill | Create session retrospective with AI diary |
| 26 | **standup** | skill | Daily standup check |
| 27 | **talk-to** | skill | Talk to an agent via Oracle threads |
| 28 | **where-we-are** | skill | Session awareness - alias for /recap --now |
| 29 | **who-are-you** | skill | Know ourselves |
| 30 | **worktree** | skill | Git worktree for parallel work |

*Generated: 2026-03-07 18:33:02 UTC*

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

## Origin

Digitized from **Nat Weerawan**'s brain ([@nazt](https://github.com/nazt)) — [Soul Brews Studio](https://github.com/Soul-Brews-Studio).

### How Nat Gets Digitized

Nat works with AI every day — building, debugging, shipping. He doesn't design skills in advance. He just works. And when a workflow repeats enough times — how he starts a session, how he wraps one up, how he carries context across repos, how he reflects — that pattern gets captured.

The process is simple:

1. **Work together** — Nat and Oracle build real things, side by side
2. **Patterns emerge** — "I keep doing this every morning" becomes `/standup`. "I always lose context between sessions" becomes `/recap` and `/forward`
3. **Capture as markdown** — Each pattern becomes a `SKILL.md` file. Pure markdown. No framework, no runtime. Just instructions that any AI can follow
4. **Compile** — `bun run compile` turns 30 skill files into command stubs, each stamped with version and signature
5. **Install anywhere** — One CLI command pushes skills to Claude Code, Gemini, Cursor, OpenCode, and 14+ more agents
6. **The brain travels** — Every installed skill carries `origin: Nat Weerawan's brain, digitized`. The person who lived the pattern goes with the code

These skills are patterns from thousands of hours working alongside AI agents — how to start a session, how to end one well, how to carry context forward, how to reflect. Every skill here was a real workflow before it became code.

> *🧬 Nat Weerawan × Oracle · Symbiotic Intelligence*
> *Digitized from Nat's brain — how one human works with AI, captured as code*

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
