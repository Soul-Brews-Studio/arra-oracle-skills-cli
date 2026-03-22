# oracle-skills

41 skills for AI coding agents. 18 agents supported.

## Install

```bash
bunx --bun oracle-skills@github:Soul-Brews-Studio/oracle-skills-cli install -g -y
```

## Profiles

```
oracle-skills init                    # minimal (8 skills, default)
oracle-skills init -p standard        # standard (13 skills)
oracle-skills install -g -y           # full (all skills)
oracle-skills select -g               # interactive picker
oracle-skills uninstall -g -y         # remove all
```

## Switch

```
/go minimal          /go standard          /go full
/go + soul           /go + network         /go + workspace         /go + creator
```

<!-- profiles:start -->

| Profile | Count | Skills |
|---------|-------|--------|
| **minimal** | 8 | `forward`, `rrr`, `recap`, `standup`, `go`, `about-oracle`, `oracle-family-scan`, `oracle-soul-sync-update` |
| **standard** | 13 | `forward`, `rrr`, `recap`, `standup`, `trace`, `dig`, `learn`, `talk-to`, `oracle-family-scan`, `go`, `about-oracle`, `oracle-soul-sync-update`, `awaken` |
| **full** | 41 | all |

Switch anytime: `/go minimal`, `/go standard`, `/go full`, `/go + soul`

**Features** (stack on any profile with `/go + feature`):

| Feature | Skills |
|---------|--------|
| **+soul** | `awaken`, `philosophy`, `who-are-you`, `about-oracle`, `birth`, `feel` |
| **+network** | `talk-to`, `oracle-family-scan`, `oracle-soul-sync-update`, `oracle` |
| **+workspace** | `worktree`, `workon`, `schedule` |
| **+creator** | `speak`, `deep-research`, `watch`, `gemini` |

<!-- profiles:end -->

## Skills

<!-- skills:start -->

| # | Skill | Type | Description |
|---|-------|------|-------------|
| 1 | **about-oracle** | skill + subagent | What is Oracle |
| 2 | **learn** | skill + subagent | Explore a codebase |
| 3 | **mine** | skill + subagent | Extract a specific topic from ONE session |
| 4 | **rrr** | skill + subagent | Create session retrospective with AI diary |
| 5 | **trace** | skill + subagent | Find projects, code |
| 6 | **xray** | skill + subagent | Full anatomy scan of ONE session JSONL |
| - |  |  |  |
| 7 | **deep-research** | skill + code | Deep Research via Gemini |
| 8 | **gemini** | skill + code | Control Gemini via MQTT WebSocket |
| 9 | **oracle-family-scan** | skill + code | Oracle Family Registry |
| 10 | **project** | skill + code | Clone and track external repos |
| 11 | **recap** | skill + code | Session orientation and awareness |
| 12 | **schedule** | skill + code | Query schedule via Oracle API (Drizzle DB) |
| 13 | **speak** | skill + code | Text-to-speech using edge-tts or macOS say |
| 14 | **watch** | skill + code | Learn from YouTube videos |
| - |  |  |  |
| 15 | **alpha-feature** | skill | Create a new skill, compile, test, commit |
| 16 | **auto-rrr** | skill | Configure auto-rrr |
| 17 | **awaken** | skill | Guided Oracle birth and awakening ritual |
| 18 | **birth** | skill | Prepare birth props for a new Oracle repo |
| 19 | **create-shortcut** | skill | Create, list, or remove quick skills |
| 20 | **dig** | skill | Mine Claude Code sessions |
| 21 | **feel** | skill | Log emotions with optional structure |
| 22 | **forward** | skill | Create handoff + enter plan mode for next |
| 23 | **go** | skill | Switch skill profiles and features |
| 24 | **handover** | skill | Transfer work to another Oracle |
| 25 | **list-issues-pr-pulse** | skill | List open issues, PRs |
| 26 | **new-issue** | skill | Create a GitHub issue in the current repo |
| 27 | **oracle** | skill | Manage Oracle skills |
| 28 | **oracle-soul-sync-update** | skill | Sync Oracle instruments with the family |
| 29 | **philosophy** | skill | Display Oracle philosophy |
| 30 | **release-alpha** | skill | Bump version, compile, test, commit, tag |
| 31 | **resonance** | skill | Capture a resonance moment |
| 32 | **standup** | skill | Daily standup check |
| 33 | **talk-to** | skill | Talk to another Oracle agent via threads |
| 34 | **tell** | skill | Send one-way command to another Oracle |
| 35 | **wake** | skill | Spawn Oracle in new tmux tab with instruction |
| 36 | **what-we-done** | skill | Quick list of what got done |
| 37 | **whats-next** | skill | Suggest next action based on open issues |
| 38 | **where-we-are** | skill | Session awareness |
| 39 | **who-are-you** | skill | Know ourselves |
| 40 | **workon** | skill | Work on an issue OR resume a killed worktree |
| 41 | **worktree** | skill | Git worktree for parallel work |

<!-- skills:end -->

## Agents

Claude Code, OpenCode, Codex, Cursor, Amp, Kilo Code, Roo Code, Goose, Gemini CLI, Antigravity, GitHub Copilot, OpenClaw, Droid, Windsurf, Cline, Aider, Continue, Zed

## Origin

[Nat Weerawan](https://github.com/nazt) — [Soul Brews Studio](https://github.com/Soul-Brews-Studio) · MIT
