# arra-oracle-skills-cli

24 skills for AI coding agents. Supports 18 agents natively.

## Install

```bash
npx arra-oracle-skills install -g -y                # standard (16 skills, default)
npx arra-oracle-skills install -g -y -p full        # all 24 skills
npx arra-oracle-skills install -g -y -p seed        # minimal 11 skills
```

## Profiles

## Switch

```
/go seed             /go standard          /go full
/go + soul           /go + network         /go + workspace
```

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

## CLI Commands

```
arra-oracle-skills install [options]       # install skills (default: standard profile, skills only)
  -g, --global                             # install to ~/.claude/skills/
  -y, --yes                                # skip confirmation
  -p, --profile <name>                     # seed | standard (default) | full
  -f, --feature <names...>                 # soul, network, workspace
  -a, --agent <agents...>                  # claude-code, opencode, codex, ...
  -s, --skill <skills...>                  # install specific skills
  --with-commands                          # also install command stubs
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

Claude Code, OpenCode, Codex, Cursor, Amp, Kilo Code, Roo Code, Goose, Gemini CLI, Antigravity, GitHub Copilot, OpenClaw, Droid, Windsurf, Cline, Aider, Continue, Zed

## Origin

[Nat Weerawan](https://github.com/nazt) — [Soul Brews Studio](https://github.com/Soul-Brews-Studio) · MIT
