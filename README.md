# arra-arra-oracle-skills

25 skills for AI coding agents. Compatible with 43+ agents via [Vercel Skills CLI](https://github.com/vercel-labs/skills).

## Install

```bash
# Full CLI (profiles, picker, xray, awaken)
bunx --bun arra-oracle-skills@github:Soul-Brews-Studio/arra-arra-oracle-skills install -g -y

# Or via Vercel Skills CLI (any single skill, 43+ agents)
npx skills add Soul-Brews-Studio/arra-oracle-skills
npx skills add Soul-Brews-Studio/arra-oracle-skills --skill recap -y
```

Audited on [skills.sh](https://skills.sh/Soul-Brews-Studio/arra-arra-oracle-skills). Discoverable via `npx skills find arra-arra-oracle-skills`.

## Profiles

```
arra-oracle-skills init                    # seed (10 skills, default)
arra-oracle-skills init -p standard        # standard (14 skills)
arra-oracle-skills install -g -y           # full (all 24 skills)
arra-oracle-skills select -g               # interactive picker
arra-oracle-skills uninstall -g -y         # remove all
```

## Switch

```
/go seed             /go standard          /go full
/go + soul           /go + network         /go + workspace
```

<!-- profiles:start -->

| Profile | Count | Skills |
|---------|-------|--------|
| **standard** | 17 | `forward`, `retrospective`, `rrr`, `recap`, `standup`, `trace`, `learn`, `talk-to`, `oracle-family-scan`, `go`, `about-oracle`, `oracle-soul-sync-update`, `awaken`, `inbox`, `xray`, `create-shortcut`, `contacts` |
| **full** | 25 | all |

Switch anytime: `/go minimal`, `/go standard`, `/go full`, `/go + soul`

**Features** (stack on any profile with `/go + feature`):

| Feature | Skills |
|---------|--------|
| **+soul** | `awaken`, `philosophy`, `who-are-you`, `about-oracle` |
| **+network** | `talk-to`, `oracle-family-scan`, `oracle-soul-sync-update` |
| **+workspace** | `schedule`, `project` |

<!-- profiles:end -->

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
| 9 | **awaken** | skill | Guided Oracle birth and awakening ritual |
| 10 | **contacts** | skill | Manage Oracle contacts |
| 11 | **create-shortcut** | skill | Create local skills as shortcuts |
| 12 | **dig** | skill | Mine Claude Code sessions |
| 13 | **forward** | skill | Create handoff + enter plan mode for next |
| 14 | **go** | skill | 'Switch skill profiles and features |
| 15 | **inbox** | skill | Read and write to Oracle inbox |
| 16 | **oracle-soul-sync-update** | skill | Sync Oracle instruments with the family |
| 17 | **philosophy** | skill | Display Oracle philosophy |
| 18 | **resonance** | skill | Capture a resonance moment |
| 19 | **retrospective** | skill | Quick session retrospective |
| 20 | **standup** | skill | Daily standup check |
| 21 | **talk-to** | skill | Talk to another Oracle agent via threads |
| 22 | **trace** | skill | v3.3.1 G-SKLL | Find projects, code |
| 23 | **where-we-are** | skill | Session awareness |
| 24 | **who-are-you** | skill | Know ourselves |
| 25 | **xray** | skill | X-ray deep scan |

<!-- skills:end -->

## CLI Commands

```
arra-oracle-skills install [options]       # install skills to agents
arra-oracle-skills init [options]          # first-time setup (seed profile)
arra-oracle-skills uninstall [options]     # remove installed skills
arra-oracle-skills select [options]        # interactive skill picker
arra-oracle-skills list [options]          # show installed skills
arra-oracle-skills profiles [name]         # list skill profiles
arra-oracle-skills agents                  # list supported agents
arra-oracle-skills about                   # version, prereqs, status
arra-oracle-skills awaken                  # TUI awakening mode selector
arra-oracle-skills inspect [skill]         # inspect a skill (profiles, agents, hooks)
arra-oracle-skills xray memory [project]   # x-ray Claude Code auto-memory
arra-oracle-skills shortcut [action]       # create/list/delete command shortcuts
```

## Hidden Skills

Skills with `hidden: true` in frontmatter are installed but skip command stub generation — invisible in autocomplete, still callable by agents.

```yaml
---
name: auto-retrospective
hidden: true
description: ...
---
```

## Agents

**Native** (18): Claude Code, OpenCode, Codex, Cursor, Amp, Kilo Code, Roo Code, Goose, Gemini CLI, Antigravity, GitHub Copilot, OpenClaw, Droid, Windsurf, Cline, Aider, Continue, Zed

**Via [Vercel Skills CLI](https://github.com/vercel-labs/skills)**: 43+ agents

## Origin

[Nat Weerawan](https://github.com/nazt) — [Soul Brews Studio](https://github.com/Soul-Brews-Studio) · MIT
