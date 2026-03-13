# oracle-skills

[![CI](https://github.com/Soul-Brews-Studio/oracle-skills-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/Soul-Brews-Studio/oracle-skills-cli/actions/workflows/ci.yml)
[![Version](https://img.shields.io/github/v/tag/Soul-Brews-Studio/oracle-skills-cli?label=version)](https://github.com/Soul-Brews-Studio/oracle-skills-cli/releases)

Skills for AI coding agents. 31 skills, 18 agents, 4 profiles.

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/Soul-Brews-Studio/oracle-skills-cli/main/install.sh | bash
```

Restart your agent. Try `/about-oracle`.

## Profiles

```bash
oracle-skills init                  # standard (11 skills, default)
oracle-skills init -p minimal       # minimal (7 skills)
oracle-skills install -g -y         # full (all 31 skills)
```

| Profile | Skills |
|---------|--------|
| **minimal** | `forward`, `retrospective`, `recap`, `standup`, `go`, `about-oracle`, `oracle-family-scan` |
| **standard** | minimal + `trace`, `dig`, `learn`, `talk-to`, `oracle-family-scan` |
| **full** | all 31 |

Switch anytime: `/go minimal`, `/go standard`, `/go full`, `/go + soul`

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

*Generated: 2026-03-13 06:08:38 UTC*

## Supported Agents

Claude Code, OpenCode, Codex, Cursor, Amp, Kilo Code, Roo Code, Goose, Gemini CLI, Antigravity, GitHub Copilot, OpenClaw, Droid, Windsurf, Cline, Aider, Continue, Zed

Run `oracle-skills agents` to see detected agents and paths.

## CLI

```
oracle-skills about              # prereqs check + system status
oracle-skills init               # first-time setup (standard profile)
oracle-skills install -g -y      # install all skills globally
oracle-skills uninstall -g -y    # remove all skills
oracle-skills list -g            # show installed skills
oracle-skills profiles           # list profiles
oracle-skills agents             # list agents
```

## Origin

By [Nat Weerawan](https://github.com/nazt) — [Soul Brews Studio](https://github.com/Soul-Brews-Studio) · [Community](https://www.facebook.com/groups/1461988771737551). MIT.
