# arra-oracle-skills-cli

62 skills for AI coding agents. Give your AI persistent memory, session awareness, and collaborative tools.

## Install

```bash
# Claude Code — standard profile (default)
npx arra-oracle-skills@26.5.13-alpha.1200 install -g -y --agent claude-code

# Full profile (all skills)
npx arra-oracle-skills@26.5.13-alpha.1200 install -g -y -p full --agent claude-code

# Lab profile (full + experimental)
npx arra-oracle-skills@26.5.13-alpha.1200 install -g -y -p lab --agent claude-code

# Specific skills only
npx arra-oracle-skills@26.5.13-alpha.1200 install -g -y -s recap rrr trace --agent claude-code

# Other agents (skills + commands)
npx arra-oracle-skills@26.5.13-alpha.1200 install -g -y --agent codex --with-commands
npx arra-oracle-skills@26.5.13-alpha.1200 install -g -y --agent opencode --with-commands
npx arra-oracle-skills@26.5.13-alpha.1200 install -g -y --agent cursor
npx arra-oracle-skills@26.5.13-alpha.1200 install -g -y --agent gemini-cli --with-commands

# Multiple agents
npx arra-oracle-skills@26.5.13-alpha.1200 install -g -y --agent claude-code codex opencode
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
| 14 | **calver** | skill | Show or bump CalVer version |
| 15 | **contacts** | skill | Manage Oracle contacts |
| 16 | **create-shortcut** | skill | Create local skills as shortcuts |
| 17 | **deep-research** | skill | 'Deep Research via Gemini |
| 18 | **dig** | skill | Mine Claude Code sessions |
| 19 | **dream** | skill | "Cross-repo pattern discovery |
| 20 | **feel** | skill | "Capture how the system feels |
| 21 | **fleet** | skill | 'Deep fleet census |
| 22 | **forward** | skill | Create handoff + enter plan mode for next |
| 23 | **forward-lite** | skill | Quick handoff to next session |
| 24 | **gemini** | skill | 'Control Gemini browser tab |
| 25 | **go** | skill | Switch skill profiles (standard/full/lab) |
| 26 | **handover** | skill | 'Transfer work to another Oracle |
| 27 | **harden** | skill | 'Audit Oracle configuration for safety |
| 28 | **i-believed** | skill | "Declare belief |
| 29 | **inbox** | skill | Read and write to Oracle inbox |
| 30 | **incubate** | skill | Clone or create repos for active development |
| 31 | **list-issues-pr-pulse** | skill | 'Open issues, PRs |
| 32 | **machines** | skill | 'Fleet machines |
| 33 | **mailbox** | skill | 'Persistent agent mailbox |
| 34 | **mine** | skill | 'Extract a specific topic from a single |
| 35 | **morpheus** | skill | 'Speculative dreaming |
| 36 | **new-issue** | skill | 'Quick GitHub issue creation |
| 37 | **oracle-manage** | skill | 'Skill and profile management |
| 38 | **oracle-soul-sync-update** | skill | Sync Oracle instruments with the family |
| 39 | **philosophy** | skill | Display Oracle philosophy |
| 40 | **recap-lite** | skill | Quick session orientation |
| 41 | **release** | skill | 'Automated release flow |
| 42 | **resonance** | skill | Capture a resonance moment |
| 43 | **retrospective** | skill | Quick session retrospective |
| 44 | **rrr-lite** | skill | Quick session retrospective |
| 45 | **skills-list** | skill | 'List all Oracle skills |
| 46 | **speak** | skill | 'Text-to-speech using edge-tts neural voices |
| 47 | **standup** | skill | Daily standup check |
| 48 | **talk-to** | skill | Talk to another Oracle agent |
| 49 | **team-agents** | skill | Spin up coordinated agent teams for any task |
| 50 | **trace** | skill | Find projects, code |
| 51 | **vault** | skill | Connect external knowledge bases (Obsidian |
| 52 | **warp** | skill | 'Teleport to a remote oracle node |
| 53 | **watch** | skill | 'Extract YouTube video transcripts |
| 54 | **what-we-done** | skill | 'Facts-only progress report |
| 55 | **whats-next** | skill | 'Smart action suggestions |
| 56 | **where-we-are** | skill | Session awareness |
| 57 | **who-are-you** | skill | Know ourselves |
| 58 | **work-with** | skill | 'Persistent cross-oracle collaboration |
| 59 | **workon** | skill | 'Work on a GitHub issue |
| 60 | **worktree** | skill | 'Work in an isolated git worktree |
| 61 | **wormhole** | skill | 'Federated query proxy |
| 62 | **xray** | skill | X-ray deep scan |

<!-- skills:end -->

## Profiles

<!-- profiles:start -->

| Profile | Count | Skills |
|---------|-------|--------|
| **minimal** | 7 | `about-oracle`, `forward-lite`, `go`, `oracle-soul-sync-update`, `recap-lite`, `rrr-lite`, `trace` |
| **standard** | 13 | `awaken`, `bampenpien`, `bud`, `dig`, `forward`, `go`, `learn`, `recap`, `rrr`, `talk-to`, `team-agents`, `trace`, `xray` |
| **full** | 62 | all |
| **lab** | 62 | all |

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
npx arra-oracle-skills@26.5.13-alpha.1200 install -g -y -s watch harden wormhole fleet release warp morpheus mailbox
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
