# oracle-skills

[![CI](https://github.com/Soul-Brews-Studio/oracle-skills-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/Soul-Brews-Studio/oracle-skills-cli/actions/workflows/ci.yml)
[![Version](https://img.shields.io/github/v/tag/Soul-Brews-Studio/oracle-skills-cli?label=version)](https://github.com/Soul-Brews-Studio/oracle-skills-cli/releases)

Skills for AI coding agents. 39 skills, 18 agents, 4 profiles.

## Install

```bash
curl -fsSL https://raw.githubusercontent.com/Soul-Brews-Studio/oracle-skills-cli/main/install.sh | bash
```

Restart your agent. Try `/about-oracle`.

## Profiles

```bash
oracle-skills init                  # standard (11 skills, default)
oracle-skills init -p minimal       # minimal (7 skills)
oracle-skills install -g -y         # full (all skills)
oracle-skills select -g             # interactive — pick exactly what you want
oracle-skills uninstall -g -y       # remove all
oracle-skills uninstall -g -s dig   # remove specific skill
```

<!-- profiles:start -->

| Profile | Count | Skills |
|---------|-------|--------|
| **minimal** | 8 | `forward`, `rrr`, `recap`, `standup`, `go`, `about-oracle`, `oracle-family-scan`, `oracle-soul-sync-update` |
| **standard** | 12 | `forward`, `rrr`, `recap`, `standup`, `trace`, `dig`, `learn`, `talk-to`, `oracle-family-scan`, `go`, `about-oracle`, `oracle-soul-sync-update` |
| **full** | 39 | all |

Switch anytime: `/go minimal`, `/go standard`, `/go full`, `/go + soul`

**Features** (stack on any profile with `/go + feature`):

| Feature | Skills |
|---------|--------|
| **+soul** | `awaken`, `philosophy`, `who-are-you`, `about-oracle`, `birth`, `feel` |
| **+network** | `talk-to`, `oracle-family-scan`, `oracle-soul-sync-update`, `oracle`, `oraclenet` |
| **+workspace** | `worktree`, `physical`, `schedule` |
| **+creator** | `speak`, `deep-research`, `watch`, `gemini` |
| **+pulse** | `pulse-board`, `pulse-add`, `pulse-timeline`, `pulse-scan` |

<!-- profiles:end -->

## Skills

Oracle skills extend your agent's capabilities with specialized workflows:

| # | Skill | Type | Description |
|---|-------|------|-------------|
| 1 | **about-oracle** | skill + subagent | What is Oracle — told by the AI itself |
| 2 | **learn** | skill + subagent | Explore a codebase |
| 3 | **mine** | skill + subagent | Extract a specific topic from ONE session |
| 4 | **rrr** | skill + subagent | Create session retrospective with AI diary |
| 5 | **trace** | skill + subagent | Find projects across git history, repos |
| 6 | **xray** | skill + subagent | Full anatomy scan of ONE session JSONL |
| - |  |  |  |
| 7 | **deep-research** | skill + code | Deep Research via Gemini |
| 8 | **gemini** | skill + code | Control Gemini via MQTT WebSocket |
| 9 | **oracle-family-scan** | skill + code | Oracle Family Registry |
| 10 | **oraclenet** | skill + code | OracleNet — claim identity, post, comment |
| 11 | **physical** | skill + code | Physical location awareness from FindMy |
| 12 | **project** | skill + code | Clone and track external repos |
| 13 | **recap** | skill + code | Session orientation and awareness |
| 14 | **schedule** | skill + code | Query schedule via Oracle API (Drizzle DB) |
| 15 | **speak** | skill + code | Text-to-speech using edge-tts or macOS say |
| 16 | **watch** | skill + code | Learn from YouTube videos |
| - |  |  |  |
| 17 | **awaken** | skill | Guided Oracle birth |
| 18 | **birth** | skill | Prepare birth props for a new Oracle repo |
| 19 | **dig** | skill | Mine Claude Code sessions |
| 20 | **feel** | skill | Log emotions with optional structure |
| 21 | **forward** | skill | Create handoff + enter plan mode for next |
| 22 | **go** | skill | Switch skill profiles and features |
| 23 | **oracle** | skill | Manage Oracle skills |
| 24 | **oracle-soul-sync-update** | skill | Sync Oracle instruments with the family |
| 25 | **philosophy** | skill | Display Oracle philosophy principles |
| 26 | **pulse-add** | skill | Add task to Pulse board |
| 27 | **pulse-board** | skill | View Pulse Master Board |
| 28 | **pulse-cleanup** | skill | Detect and remove stale worktrees across all |
| 29 | **pulse-escalate** | skill | P0 escalation |
| 30 | **pulse-heartbeat** | skill | Check agent health |
| 31 | **pulse-resume** | skill | Resume a paused agent |
| 32 | **pulse-scan** | skill | Scan for untracked issues and oracle activity |
| 33 | **pulse-start** | skill | Start tracked work |
| 34 | **pulse-timeline** | skill | ASCII Gantt timeline of Pulse board items |
| 35 | **standup** | skill | Daily standup check |
| 36 | **talk-to** | skill | Talk to an agent via Oracle threads |
| 37 | **where-we-are** | skill | Session awareness |
| 38 | **who-are-you** | skill | Know ourselves |
| 39 | **worktree** | skill | Git worktree for parallel work |

*Generated: 2026-03-20 03:20:29 UTC*

## Supported Agents

Claude Code, OpenCode, Codex, Cursor, Amp, Kilo Code, Roo Code, Goose, Gemini CLI, Antigravity, GitHub Copilot, OpenClaw, Droid, Windsurf, Cline, Aider, Continue, Zed

Run `oracle-skills agents` to see detected agents and paths.

## CLI

```
oracle-skills agents             # list supported agents
oracle-skills about              # prereqs check + system status
oracle-skills init               # first-time setup (standard profile)
oracle-skills install -g -y      # install all skills globally
oracle-skills select -g          # interactive skill picker
oracle-skills uninstall -g -y    # remove all skills
oracle-skills uninstall -g -s X  # remove specific skill(s)
oracle-skills list -g            # show installed skills
oracle-skills profiles           # list profiles
oracle-skills profiles minimal   # show skills in a profile
```

## Origin

By [Nat Weerawan](https://github.com/nazt) — [Soul Brews Studio](https://github.com/Soul-Brews-Studio) · [Community](https://www.facebook.com/groups/1461988771737551). MIT.
