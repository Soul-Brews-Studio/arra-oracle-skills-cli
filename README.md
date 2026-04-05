# arra-oracle-skills-cli

26 skills for AI coding agents. Give your AI persistent memory, session awareness, and collaborative tools.

## Install

```bash
# Claude Code — standard profile (default)
npx arra-oracle-skills@3.6.0 install -g -y --agent claude-code

# Full profile (all skills)
npx arra-oracle-skills@3.6.0 install -g -y -p full --agent claude-code

# Lab profile (full + experimental)
npx arra-oracle-skills@3.6.0 install -g -y -p lab --agent claude-code

# Specific skills only
npx arra-oracle-skills@3.6.0 install -g -y -s recap rrr trace --agent claude-code

# Other agents (skills + commands)
npx arra-oracle-skills@3.6.0 install -g -y --agent codex --with-commands
npx arra-oracle-skills@3.6.0 install -g -y --agent opencode --with-commands
npx arra-oracle-skills@3.6.0 install -g -y --agent cursor
npx arra-oracle-skills@3.6.0 install -g -y --agent gemini-cli --with-commands

# Multiple agents
npx arra-oracle-skills@3.6.0 install -g -y --agent claude-code codex opencode
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
| 10 | **contacts** | skill | Manage Oracle contacts |
| 11 | **create-shortcut** | skill | Create local skills as shortcuts |
| 12 | **dig** | skill | Mine Claude Code sessions |
| 13 | **dream** | skill | "Cross-repo pattern discovery |
| 14 | **feel** | skill | "Capture how the system feels |
| 15 | **forward** | skill | Create handoff + enter plan mode for next |
| 16 | **go** | skill | 'Switch skill profiles |
| 17 | **inbox** | skill | Read and write to Oracle inbox |
| 18 | **oracle-soul-sync-update** | skill | Sync Oracle instruments with the family |
| 19 | **philosophy** | skill | Display Oracle philosophy |
| 20 | **resonance** | skill | Capture a resonance moment |
| 21 | **standup** | skill | Daily standup check |
| 22 | **talk-to** | skill | Talk to another Oracle agent via threads |
| 23 | **trace** | skill | Find projects, code |
| 24 | **where-we-are** | skill | Session awareness |
| 25 | **who-are-you** | skill | Know ourselves |
| 26 | **xray** | skill | X-ray deep scan |

<!-- skills:end -->

## Profiles

<!-- profiles:start -->

| Profile | Count | Skills |
|---------|-------|--------|
| **standard** | 16 | `about-oracle`, `awaken`, `contacts`, `dig`, `forward`, `go`, `inbox`, `learn`, `oracle-family-scan`, `oracle-soul-sync-update`, `recap`, `rrr`, `standup`, `talk-to`, `trace`, `xray` |
| **full** | 26 | all |
| **lab** | 26 | all |

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
