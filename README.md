# oracle-skills

[![CI](https://github.com/Soul-Brews-Studio/oracle-skills-cli/actions/workflows/ci.yml/badge.svg)](https://github.com/Soul-Brews-Studio/oracle-skills-cli/actions/workflows/ci.yml)
[![Version](https://img.shields.io/github/v/tag/Soul-Brews-Studio/oracle-skills-cli?label=version)](https://github.com/Soul-Brews-Studio/oracle-skills-cli/releases)

Skills for AI coding agents. 28 skills, 18 agents, 4 profiles.

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
| **full** | 28 | all |

Switch anytime: `/go minimal`, `/go standard`, `/go full`, `/go + soul`

**Features** (stack on any profile with `/go + feature`):

| Feature | Skills |
|---------|--------|
| **+soul** | `awaken`, `philosophy`, `who-are-you`, `about-oracle`, `birth`, `feel` |
| **+network** | `talk-to`, `oracle-family-scan`, `oracle-soul-sync-update`, `oracle`, `oraclenet` |
| **+workspace** | `worktree`, `physical`, `schedule` |
| **+creator** | `speak`, `deep-research`, `watch`, `gemini` |

<!-- profiles:end -->

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
| 20 | **go** | skill | Switch skill profiles and features |
| 21 | **oracle** | skill | Manage Oracle skills |
| 22 | **oracle-soul-sync-update** | skill | Sync Oracle instruments with the family |
| 23 | **philosophy** | skill | Display Oracle philosophy principles |
| 24 | **standup** | skill | Daily standup check |
| 25 | **talk-to** | skill | Talk to an agent via Oracle threads |
| 26 | **where-we-are** | skill | Session awareness |
| 27 | **who-are-you** | skill | Know ourselves |
| 28 | **worktree** | skill | Git worktree for parallel work |

*Generated: 2026-03-15 03:52:47 UTC*

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
