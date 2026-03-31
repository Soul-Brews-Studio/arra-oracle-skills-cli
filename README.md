# arra-oracle-skills-cli

24 skills for AI coding agents. Give your AI persistent memory, session awareness, and collaborative tools.

## Install

```bash
npx arra-oracle-skills install -g -y
```

Skills only. Standard profile (16 skills). Claude Code auto-detected.

| Flag | What |
|------|------|
| `-p seed` | Minimal (11 skills) |
| `-p full` | Everything (24 skills) |
| `--agent codex` | Target specific agent |
| `--with-commands` | Also install command stubs |
| `--agent opencode --with-commands` | OpenCode with commands |

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
| 13 | **forward** | skill | Create handoff + enter plan mode for next |
| 14 | **go** | skill | 'Switch skill profiles and features |
| 15 | **inbox** | skill | Read and write to Oracle inbox |
| 16 | **oracle-soul-sync-update** | skill | Sync Oracle instruments with the family |
| 17 | **philosophy** | skill | Display Oracle philosophy |
| 18 | **resonance** | skill | Capture a resonance moment |
| 19 | **standup** | skill | Daily standup check |
| 20 | **talk-to** | skill | Talk to another Oracle agent via threads |
| 21 | **trace** | skill | Find projects, code |
| 22 | **where-we-are** | skill | Session awareness |
| 23 | **who-are-you** | skill | Know ourselves |
| 24 | **xray** | skill | X-ray deep scan |

<!-- skills:end -->

## Profiles

<!-- profiles:start -->

| Profile | Count | Skills |
|---------|-------|--------|
| **standard** | 16 | `forward`, `rrr`, `recap`, `standup`, `trace`, `learn`, `talk-to`, `oracle-family-scan`, `go`, `about-oracle`, `oracle-soul-sync-update`, `awaken`, `inbox`, `xray`, `create-shortcut`, `contacts` |
| **full** | 24 | all |

Switch anytime: `/go minimal`, `/go standard`, `/go full`, `/go + soul`

**Features** (stack on any profile with `/go + feature`):

| Feature | Skills |
|---------|--------|
| **+soul** | `awaken`, `philosophy`, `who-are-you`, `about-oracle` |
| **+network** | `talk-to`, `oracle-family-scan`, `oracle-soul-sync-update` |
| **+workspace** | `schedule`, `project` |

<!-- profiles:end -->

## CLI

```
install [options]       # install skills (default: standard, skills only)
uninstall [options]     # remove installed skills
select [options]        # interactive skill picker
list [options]          # show installed skills
profiles [name]         # list profiles
agents                  # list 18 supported agents
about                   # version + status
```

## Origin

[Nat Weerawan](https://github.com/nazt) — [Soul Brews Studio](https://github.com/Soul-Brews-Studio) · MIT
