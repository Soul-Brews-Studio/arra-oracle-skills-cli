# arra-oracle-skills-cli

31 skills for AI coding agents. Give your AI persistent memory, session awareness, and collaborative tools.

## Install

```bash
# Claude Code — standard profile (default)
npx arra-oracle-skills@3.8.2-alpha.2 install -g -y --agent claude-code

# Full profile (all skills)
npx arra-oracle-skills@3.8.2-alpha.2 install -g -y -p full --agent claude-code

# Lab profile (full + experimental)
npx arra-oracle-skills@3.8.2-alpha.2 install -g -y -p lab --agent claude-code

# Specific skills only
npx arra-oracle-skills@3.8.2-alpha.2 install -g -y -s recap rrr trace --agent claude-code

# Other agents (skills + commands)
npx arra-oracle-skills@3.8.2-alpha.2 install -g -y --agent codex --with-commands
npx arra-oracle-skills@3.8.2-alpha.2 install -g -y --agent opencode --with-commands
npx arra-oracle-skills@3.8.2-alpha.2 install -g -y --agent cursor
npx arra-oracle-skills@3.8.2-alpha.2 install -g -y --agent gemini-cli --with-commands

# Multiple agents
npx arra-oracle-skills@3.8.2-alpha.2 install -g -y --agent claude-code codex opencode
```

18 agents: Claude Code, Codex, OpenCode, Cursor, Gemini CLI, Amp, Kilo Code, Roo Code, Goose, Antigravity, GitHub Copilot, OpenClaw, Droid, Windsurf, Cline, Aider, Continue, Zed

## Skills

<!-- skills:start -->

| # | Skill | Type | Description |
|---|-------|------|-------------|
| 1 | **about-oracle** | skill + subagent | What is Oracle |
| 2 | **learn** | skill + subagent | Explore a codebase |
| 3 | **rrr** | skill + subagent | Create session retrospective with AI diary |
| - |  |  |  |
| 4 | **oracle-family-scan** | skill + code | Oracle Family Registry |
| 5 | **project** | skill + code | Clone and track external repos |
| 6 | **recap** | skill + code | Session orientation and awareness |
| 7 | **schedule** | skill + code | Query schedule via Oracle API (Drizzle DB) |
| - |  |  |  |
| 8 | **auto-retrospective** | skill | Configure auto-rrr |
| 9 | **awaken** | skill | "Guided Oracle birth and awakening ritual |
| 10 | **bampenpien** | skill | "บำเพ็ญเพียร |
| 11 | **contacts** | skill | Manage Oracle contacts |
| 12 | **create-shortcut** | skill | Create local skills as shortcuts |
| 13 | **dig** | skill | Mine Claude Code sessions |
| 14 | **dream** | skill | "Cross-repo pattern discovery |
| 15 | **feel** | skill | "Capture how the system feels |
| 16 | **forward** | skill | Create handoff + enter plan mode for next |
| 17 | **go** | skill | Switch skill profiles (standard/full/lab) |
| 18 | **i-believed** | skill | "Declare belief |
| 19 | **inbox** | skill | Read and write to Oracle inbox |
| 20 | **incubate** | skill | Clone or create repos for active development |
| 21 | **oracle-soul-sync-update** | skill | Sync Oracle instruments with the family |
| 22 | **philosophy** | skill | Display Oracle philosophy |
| 23 | **resonance** | skill | Capture a resonance moment |
| 24 | **standup** | skill | Daily standup check |
| 25 | **talk-to** | skill | Talk to another Oracle agent |
| 26 | **team-agents** | skill | Spin up coordinated agent teams for any task |
| 27 | **trace** | skill | Find projects, code |
| 28 | **vault** | skill | Connect external knowledge bases (Obsidian |
| 29 | **where-we-are** | skill | Session awareness |
| 30 | **who-are-you** | skill | Know ourselves |
| 31 | **xray** | skill | X-ray deep scan |

<!-- skills:end -->

## Profiles

<!-- profiles:start -->

| Profile | Count | Skills |
|---------|-------|--------|
| **standard** | 15 | `about-oracle`, `awaken`, `create-shortcut`, `dig`, `forward`, `go`, `learn`, `oracle-family-scan`, `oracle-soul-sync-update`, `recap`, `rrr`, `standup`, `talk-to`, `trace`, `xray` |
| **full** | 31 | all |
| **lab** | 31 | all |

Switch anytime: `/go standard`, `/go full`, `/go lab`

<!-- profiles:end -->

## CLI

```
install [options]       # install skills (default: standard)
uninstall [options]     # remove installed skills
select [options]        # interactive skill picker
list [options]          # show installed skills
profiles [name]         # list profiles
agents                  # list 18 supported agents
about                   # version + status
```

## Origin

[Nat Weerawan](https://github.com/nazt) — [Soul Brews Studio](https://github.com/Soul-Brews-Studio) · MIT
