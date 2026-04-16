# arra-oracle-skills-cli

60 skills for AI coding agents. Give your AI persistent memory, session awareness, and collaborative tools.

## Install

```bash
# Claude Code — standard profile (default)
npx arra-oracle-skills@3.9.0-alpha.17 install -g -y --agent claude-code

# Full profile (all skills)
npx arra-oracle-skills@3.9.0-alpha.17 install -g -y -p full --agent claude-code

# Lab profile (full + experimental)
npx arra-oracle-skills@3.9.0-alpha.17 install -g -y -p lab --agent claude-code

# Specific skills only
npx arra-oracle-skills@3.9.0-alpha.17 install -g -y -s recap rrr trace --agent claude-code

# Other agents (skills + commands)
npx arra-oracle-skills@3.9.0-alpha.17 install -g -y --agent codex --with-commands
npx arra-oracle-skills@3.9.0-alpha.17 install -g -y --agent opencode --with-commands
npx arra-oracle-skills@3.9.0-alpha.17 install -g -y --agent cursor
npx arra-oracle-skills@3.9.0-alpha.17 install -g -y --agent gemini-cli --with-commands

# Multiple agents
npx arra-oracle-skills@3.9.0-alpha.17 install -g -y --agent claude-code codex opencode
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
| 8 | **alpha-feature** | skill | 'Full skill development pipeline |
| 9 | **auto-retrospective** | skill | Configure auto-rrr |
| 10 | **awaken** | skill | "Guided Oracle birth and awakening ritual |
| 11 | **bampenpien** | skill | "บำเพ็ญเพียร |
| 12 | **birth** | skill | 'Prepare Oracle birth props for a new repo |
| 13 | **bud** | skill | 'Create a new oracle via maw bud |
| 14 | **contacts** | skill | Manage Oracle contacts |
| 15 | **create-shortcut** | skill | Create local skills as shortcuts |
| 16 | **deep-research** | skill | 'Deep Research via Gemini |
| 17 | **dig** | skill | Mine Claude Code sessions |
| 18 | **dream** | skill | "Cross-repo pattern discovery |
| 19 | **feel** | skill | "Capture how the system feels |
| 20 | **fleet** | skill | 'Deep fleet census |
| 21 | **forward** | skill | Create handoff + enter plan mode for next |
| 22 | **forward-lite** | skill | Quick handoff to next session |
| 23 | **gemini** | skill | 'Control Gemini browser tab |
| 24 | **go** | skill | Switch skill profiles (standard/full/lab) |
| 25 | **handover** | skill | 'Transfer work to another Oracle |
| 26 | **harden** | skill | 'Audit Oracle configuration for safety |
| 27 | **i-believed** | skill | "Declare belief |
| 28 | **inbox** | skill | Read and write to Oracle inbox |
| 29 | **incubate** | skill | Clone or create repos for active development |
| 30 | **list-issues-pr-pulse** | skill | 'Open issues, PRs |
| 31 | **machines** | skill | 'Fleet machines |
| 32 | **mailbox** | skill | 'Persistent agent mailbox |
| 33 | **mine** | skill | 'Extract a specific topic from a single |
| 34 | **morpheus** | skill | 'Speculative dreaming |
| 35 | **new-issue** | skill | 'Quick GitHub issue creation |
| 36 | **oracle-manage** | skill | 'Skill and profile management |
| 37 | **oracle-soul-sync-update** | skill | Sync Oracle instruments with the family |
| 38 | **philosophy** | skill | Display Oracle philosophy |
| 39 | **recap-lite** | skill | Quick session orientation |
| 40 | **release** | skill | 'Automated release flow |
| 41 | **resonance** | skill | Capture a resonance moment |
| 42 | **rrr-lite** | skill | Quick session retrospective |
| 43 | **skills-list** | skill | 'List all Oracle skills |
| 44 | **speak** | skill | 'Text-to-speech using edge-tts neural voices |
| 45 | **standup** | skill | Daily standup check |
| 46 | **talk-to** | skill | Talk to another Oracle agent |
| 47 | **team-agents** | skill | Spin up coordinated agent teams for any task |
| 48 | **trace** | skill | Find projects, code |
| 49 | **vault** | skill | Connect external knowledge bases (Obsidian |
| 50 | **warp** | skill | 'Teleport to a remote oracle node |
| 51 | **watch** | skill | 'Extract YouTube video transcripts |
| 52 | **what-we-done** | skill | 'Facts-only progress report |
| 53 | **whats-next** | skill | 'Smart action suggestions |
| 54 | **where-we-are** | skill | Session awareness |
| 55 | **who-are-you** | skill | Know ourselves |
| 56 | **work-with** | skill | 'Persistent cross-oracle collaboration |
| 57 | **workon** | skill | 'Work on a GitHub issue |
| 58 | **worktree** | skill | 'Work in an isolated git worktree |
| 59 | **wormhole** | skill | 'Federated query proxy |
| 60 | **xray** | skill | X-ray deep scan |

<!-- skills:end -->

## Profiles

<!-- profiles:start -->

| Profile | Count | Skills |
|---------|-------|--------|
| **minimal** | 6 | `about-oracle`, `forward-lite`, `go`, `recap-lite`, `rrr-lite`, `trace` |
| **standard** | 13 | `awaken`, `bampenpien`, `bud`, `dig`, `forward`, `go`, `learn`, `recap`, `rrr`, `talk-to`, `team-agents`, `trace`, `xray` |
| **full** | 60 | all |
| **lab** | 60 | all |

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

## Secret Skills

Secret skills are excluded from all profiles. Install by name:

```bash
npx arra-oracle-skills@3.9.0-alpha.17 install -g -y -s watch harden wormhole fleet release warp morpheus mailbox
```

| Skill | What |
|-------|------|
| `/watch` | YouTube CC extraction via yt-dlp |
| `/harden` | Oracle governance audit |
| `/wormhole` | Federated query proxy (data sovereign) |
| `/fleet` | Deep fleet census across nodes |
| `/release` | Automated release flow |
| `/warp` | SSH+tmux teleport to remote nodes |
| `/morpheus` | Speculative dreaming (evolved /dream) |
| `/mailbox` | Persistent agent memory in ψ/ |

## Team Agent Scripts

`/team-agents` includes zero-token bash scripts for tmux pane lifecycle:

```bash
team-ops panes [team]      # See agent panes (/proc cmdline extraction)
team-ops spawn <team> ...  # Create ephemeral /agent skills
team-ops archive <team> .. # Archive skills to /tmp on shutdown
team-ops sweep             # Kill idle panes (safe)
team-ops nuke              # Kill ALL non-lead panes
team-ops mailbox <cmd>     # Persistent agent memory
team-ops status            # Show everything
```

## Origin

[Nat Weerawan](https://github.com/nazt) — [Soul Brews Studio](https://github.com/Soul-Brews-Studio) · MIT
