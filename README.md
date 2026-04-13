# arra-oracle-skills-cli

55 skills for AI coding agents. Give your AI persistent memory, session awareness, and collaborative tools.

## Install

```bash
# Claude Code — standard profile (default)
npx arra-oracle-skills@3.9.0-alpha.3 install -g -y --agent claude-code

# Full profile (all skills)
npx arra-oracle-skills@3.9.0-alpha.3 install -g -y -p full --agent claude-code

# Lab profile (full + experimental)
npx arra-oracle-skills@3.9.0-alpha.3 install -g -y -p lab --agent claude-code

# Specific skills only
npx arra-oracle-skills@3.9.0-alpha.3 install -g -y -s recap rrr trace --agent claude-code

# Other agents (skills + commands)
npx arra-oracle-skills@3.9.0-alpha.3 install -g -y --agent codex --with-commands
npx arra-oracle-skills@3.9.0-alpha.3 install -g -y --agent opencode --with-commands
npx arra-oracle-skills@3.9.0-alpha.3 install -g -y --agent cursor
npx arra-oracle-skills@3.9.0-alpha.3 install -g -y --agent gemini-cli --with-commands

# Multiple agents
npx arra-oracle-skills@3.9.0-alpha.3 install -g -y --agent claude-code codex opencode
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
| 13 | **contacts** | skill | Manage Oracle contacts |
| 14 | **create-shortcut** | skill | Create local skills as shortcuts |
| 15 | **deep-research** | skill | 'Deep Research via Gemini |
| 16 | **dig** | skill | Mine Claude Code sessions |
| 17 | **dream** | skill | "Cross-repo pattern discovery |
| 18 | **feel** | skill | "Capture how the system feels |
| 19 | **fleet** | skill | 'Deep fleet census |
| 20 | **forward** | skill | Create handoff + enter plan mode for next |
| 21 | **gemini** | skill | 'Control Gemini browser tab |
| 22 | **go** | skill | Switch skill profiles (standard/full/lab) |
| 23 | **handover** | skill | 'Transfer work to another Oracle |
| 24 | **harden** | skill | 'Audit Oracle configuration for safety |
| 25 | **i-believed** | skill | "Declare belief |
| 26 | **inbox** | skill | Read and write to Oracle inbox |
| 27 | **incubate** | skill | Clone or create repos for active development |
| 28 | **list-issues-pr-pulse** | skill | 'Open issues, PRs |
| 29 | **machines** | skill | 'Fleet machines |
| 30 | **mailbox** | skill | 'Persistent agent mailbox |
| 31 | **mine** | skill | 'Extract a specific topic from a single |
| 32 | **morpheus** | skill | 'Speculative dreaming |
| 33 | **new-issue** | skill | 'Quick GitHub issue creation |
| 34 | **oracle-manage** | skill | 'Skill and profile management |
| 35 | **oracle-soul-sync-update** | skill | Sync Oracle instruments with the family |
| 36 | **philosophy** | skill | Display Oracle philosophy |
| 37 | **release** | skill | 'Automated release flow |
| 38 | **resonance** | skill | Capture a resonance moment |
| 39 | **skills-list** | skill | 'List all Oracle skills |
| 40 | **speak** | skill | 'Text-to-speech using edge-tts neural voices |
| 41 | **standup** | skill | Daily standup check |
| 42 | **talk-to** | skill | Talk to another Oracle agent |
| 43 | **team-agents** | skill | Spin up coordinated agent teams for any task |
| 44 | **trace** | skill | Find projects, code |
| 45 | **vault** | skill | Connect external knowledge bases (Obsidian |
| 46 | **warp** | skill | 'Teleport to a remote oracle node |
| 47 | **watch** | skill | 'Extract YouTube video transcripts |
| 48 | **what-we-done** | skill | 'Facts-only progress report |
| 49 | **whats-next** | skill | 'Smart action suggestions |
| 50 | **where-we-are** | skill | Session awareness |
| 51 | **who-are-you** | skill | Know ourselves |
| 52 | **workon** | skill | 'Work on a GitHub issue |
| 53 | **worktree** | skill | 'Work in an isolated git worktree |
| 54 | **wormhole** | skill | 'Federated query proxy |
| 55 | **xray** | skill | X-ray deep scan |

<!-- skills:end -->

## Profiles

<!-- profiles:start -->

| Profile | Count | Skills |
|---------|-------|--------|
| **standard** | 16 | `about-oracle`, `awaken`, `create-shortcut`, `dig`, `forward`, `go`, `learn`, `oracle-family-scan`, `oracle-soul-sync-update`, `recap`, `rrr`, `skills-list`, `standup`, `talk-to`, `trace`, `xray` |
| **full** | 55 | all |
| **lab** | 55 | all |

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
npx arra-oracle-skills@3.9.0-alpha.3 install -g -y -s watch harden wormhole fleet release warp morpheus mailbox
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
