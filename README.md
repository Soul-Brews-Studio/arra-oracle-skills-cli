# oracle-skills

[![CI](https://github.com/Soul-Brews-Studio/oracle-skills-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/Soul-Brews-Studio/oracle-skills-cli/actions/workflows/ci.yml)
[![Version](https://img.shields.io/github/v/tag/Soul-Brews-Studio/oracle-skills-cli?label=version)](https://github.com/Soul-Brews-Studio/oracle-skills-cli/releases)

Install Oracle skills to Claude Code, OpenCode, Codex, Gemini, Cursor, and 13+ AI coding agents.

## Quick Start

```bash
# macOS / Linux — pre-built binary (no runtime needed)
curl -fsSL https://raw.githubusercontent.com/Soul-Brews-Studio/oracle-skills-cli/main/install.sh | bash
```

```bash
# Windows / fallback (requires Bun)
bunx --bun oracle-skills@github:Soul-Brews-Studio/oracle-skills-cli install -g -y
```

After install, restart your AI agent. Try `/about-oracle` to learn what you just installed.

## Commands

| Command | What it does |
|---------|--------------|
| `oracle-skills about` | Version, prerequisites check, system status |
| `oracle-skills init` | First-time setup — installs standard profile globally |
| `oracle-skills init -p minimal` | Init with minimal profile instead |
| `oracle-skills install -g -y` | Install all skills globally |
| `oracle-skills install -g -y --profile standard` | Install specific profile |
| `oracle-skills install -g -y --commands` | Also install command stubs |
| `oracle-skills uninstall -g -y` | Remove all installed skills |
| `oracle-skills list -g` | Show installed skills |
| `oracle-skills profiles` | List available profiles |
| `oracle-skills profiles standard` | Show skills in a profile |
| `oracle-skills agents` | List supported agents |

## Profiles

Profiles control how many skills get installed. Start small, expand with `/go`.

```bash
oracle-skills init -y                    # standard (default)
oracle-skills init -p minimal -y         # minimal
oracle-skills install -g -y              # full (all 31 skills)
```

| Profile | Count | Skills |
|---------|-------|--------|
| **seed** / **minimal** | 6 | `forward`, `retrospective`, `recap`, `standup`, `go`, `about-oracle` |
| **standard** | 11 | minimal + `trace`, `dig`, `learn`, `talk-to`, `oracle-family-scan` |
| **full** | 31 | All skills |

### Features (add-ons via `/go`)

After installing, use `/go` to add feature modules on top of your profile:

```
/go + soul              → +awaken, philosophy, who-are-you, birth, feel
/go + network           → +talk-to, oracle-family-scan, oraclenet, oracle, oracle-soul-sync-update
/go + workspace         → +worktree, physical, schedule
/go + creator           → +speak, deep-research, watch, gemini
/go full                → enable everything
/go reset               → same as /go full
```

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
| 21 | **go** | skill | Switch skill profiles and features |
| 22 | **merged** | skill | Post-Merge Cleanup |
| 23 | **oracle** | skill | Manage Oracle skills |
| 24 | **oracle-soul-sync-update** | skill | Sync Oracle instruments with the family |
| 25 | **philosophy** | skill | Display Oracle philosophy principles |
| 26 | **retrospective** | skill | Create session retrospective with AI diary |
| 27 | **standup** | skill | Daily standup check |
| 28 | **talk-to** | skill | Talk to an agent via Oracle threads |
| 29 | **where-we-are** | skill | Session awareness - alias for /recap --now |
| 30 | **who-are-you** | skill | Know ourselves |
| 31 | **worktree** | skill | Git worktree for parallel work |

*Generated: 2026-03-13 06:01:18 UTC*

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

These skills are patterns from thousands of hours working alongside AI agents — how to start a session, how to end one well, how to carry context forward, how to reflect. Every skill here was a real workflow before it became code.

> *Nat Weerawan x Oracle · Symbiotic Intelligence*
> *Digitized from Nat's brain — how one human works with AI, captured as code*

## Related

- [oracle-v2](https://github.com/Soul-Brews-Studio/oracle-v2) - MCP Memory Layer (Oracle brain)
- [Agent Skills Specification](https://agentskills.io) - Cross-agent skill format
- [add-skill](https://github.com/vercel-labs/add-skill) - Universal skill installer by Vercel

## License

MIT
