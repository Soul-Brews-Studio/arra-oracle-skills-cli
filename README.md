# arra-oracle-skills

23 skills for AI coding agents. Compatible with 43+ agents via [Vercel Skills CLI](https://github.com/vercel-labs/skills).

## Install

```bash
# Full CLI (profiles, picker, xray, awaken)
bunx --bun oracle-skills@github:Soul-Brews-Studio/arra-oracle-skills install -g -y

# Or via Vercel Skills CLI (any single skill, 43+ agents)
npx skills add Soul-Brews-Studio/arra-oracle-skills
npx skills add Soul-Brews-Studio/arra-oracle-skills --skill recap -y
```

Audited on [skills.sh](https://skills.sh/Soul-Brews-Studio/arra-oracle-skills). Discoverable via `npx skills find arra-oracle-skills`.

## Profiles

```
oracle-skills init                    # seed (10 skills, default)
oracle-skills init -p standard        # standard (14 skills)
oracle-skills install -g -y           # full (all 24 skills)
oracle-skills select -g               # interactive picker
oracle-skills uninstall -g -y         # remove all
```

## Switch

```
/go seed             /go standard          /go full
/go + soul           /go + network         /go + workspace
```

<!-- profiles:start -->

| Profile | Count | Skills |
|---------|-------|--------|
| **standard** | 17 | `forward`, `retrospective`, `rrr`, `recap`, `standup`, `trace`, `learn`, `talk-to`, `oracle-family-scan`, `go`, `about-oracle`, `oracle-soul-sync-update`, `awaken`, `inbox`, `memory`, `create-shortcut`, `contacts` |
| **full** | 23 | all |

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
| - |  |  |  |
| 3 | **oracle-family-scan** | skill + code | Oracle Family Registry |
| 4 | **project** | skill + code | Clone and track external repos |
| 5 | **recap** | skill + code | Session orientation and awareness |
| 6 | **schedule** | skill + code | Query schedule via Oracle API (Drizzle DB) |
| - |  |  |  |
| 7 | **auto-retrospective** | skill | Configure auto-rrr |
| 8 | **awaken** | skill | Guided Oracle birth and awakening ritual |
| 9 | **contacts** | skill | Manage Oracle contacts |
| 10 | **create-shortcut** | skill | Create local skills as shortcuts |
| 11 | **forward** | skill | Create handoff + enter plan mode for next |
| 12 | **go** | skill | 'Switch skill profiles and features |
| 13 | **inbox** | skill | Read and write to Oracle inbox |
| 14 | **memory** | skill | Scan and manage Claude Code auto-memory |
| 15 | **oracle-soul-sync-update** | skill | Sync Oracle instruments with the family |
| 16 | **philosophy** | skill | Display Oracle philosophy |
| 17 | **retrospective** | skill | Quick session retrospective |
| 18 | **rrr** | skill | Quick session retrospective (alias for |
| 19 | **standup** | skill | Daily standup check |
| 20 | **talk-to** | skill | Talk to another Oracle agent via threads |
| 21 | **trace** | skill | v3.3.1 G-SKLL | Find projects, code |
| 22 | **where-we-are** | skill | Session awareness |
| 23 | **who-are-you** | skill | Know ourselves |

<!-- skills:end -->

## CLI Commands

```
oracle-skills install [options]       # install skills to agents
oracle-skills init [options]          # first-time setup (seed profile)
oracle-skills uninstall [options]     # remove installed skills
oracle-skills select [options]        # interactive skill picker
oracle-skills list [options]          # show installed skills
oracle-skills profiles [name]         # list skill profiles
oracle-skills agents                  # list supported agents
oracle-skills about                   # version, prereqs, status
oracle-skills awaken                  # TUI awakening mode selector
oracle-skills inspect [skill]         # inspect a skill (profiles, agents, hooks)
oracle-skills xray memory [project]   # x-ray Claude Code auto-memory
oracle-skills shortcut [action]       # create/list/delete command shortcuts
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
