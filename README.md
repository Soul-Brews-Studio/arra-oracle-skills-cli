# arra-oracle-skills-cli

49 skills for AI coding agents. Give your AI persistent memory, session awareness, and collaborative tools.

## Install

```bash
# Claude Code — standard profile (default)
npx arra-oracle-skills@26.5.13-alpha.1726 install -g -y --agent claude-code

# Full profile (all skills)
npx arra-oracle-skills@26.5.13-alpha.1726 install -g -y -p full --agent claude-code

# Lab profile (full + experimental)
npx arra-oracle-skills@26.5.13-alpha.1726 install -g -y -p lab --agent claude-code

# Specific skills only
npx arra-oracle-skills@26.5.13-alpha.1726 install -g -y -s recap rrr trace --agent claude-code

# Other agents (skills + commands)
npx arra-oracle-skills@26.5.13-alpha.1726 install -g -y --agent codex --with-commands
npx arra-oracle-skills@26.5.13-alpha.1726 install -g -y --agent opencode --with-commands
npx arra-oracle-skills@26.5.13-alpha.1726 install -g -y --agent cursor
npx arra-oracle-skills@26.5.13-alpha.1726 install -g -y --agent gemini-cli --with-commands

# Multiple agents
npx arra-oracle-skills@26.5.13-alpha.1726 install -g -y --agent claude-code codex opencode

# thClaws (auto-detected if thclaws binary is in PATH)
bunx arra-oracle-skills@github:Soul-Brews-Studio/arra-oracle-skills-cli install -y -g
# Skills install to ~/.config/thclaws/skills/ AND ~/.claude/skills/

# Opt out of thClaws target
bunx arra-oracle-skills@github:Soul-Brews-Studio/arra-oracle-skills-cli install -y -g --no-thclaws
```

19 agents: Claude Code, Codex, OpenCode, Cursor, Gemini CLI, Amp, Kilo Code, Roo Code, Goose, Antigravity, GitHub Copilot, OpenClaw, Droid, Windsurf, Cline, Aider, Continue, Zed, thClaws

## Skills

<!-- skills:start -->

<details>
<summary>📚 <strong>49 skills installed</strong> — click to expand</summary>

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
| 11 | **bud** | skill | 'Create a new oracle via maw bud |
| 12 | **calver** | skill | Show or bump CalVer version |
| 13 | **contacts** | skill | Manage Oracle contacts |
| 14 | **create-shortcut** | skill | Create local skills as shortcuts |
| 15 | **dig** | skill | Mine Claude Code sessions |
| 16 | **dream** | skill | "Cross-repo pattern discovery |
| 17 | **feel** | skill | "Capture how the system feels |
| 18 | **fleet** | skill | 'Deep fleet census |
| 19 | **forward** | skill | Create handoff + enter plan mode for next |
| 20 | **forward-lite** | skill | Quick handoff to next session |
| 21 | **go** | skill | Switch skill profiles (standard/full/lab) |
| 22 | **harden** | skill | 'Audit Oracle configuration for safety |
| 23 | **i-believed** | skill | "Declare belief |
| 24 | **inbox** | skill | Read and write to Oracle inbox |
| 25 | **incubate** | skill | Clone or create repos for active development |
| 26 | **machines** | skill | 'Fleet machines |
| 27 | **mailbox** | skill | 'Persistent agent mailbox |
| 28 | **morpheus** | skill | 'Speculative dreaming |
| 29 | **oracle-soul-sync-update** | skill | Sync Oracle instruments with the family |
| 30 | **philosophy** | skill | Display Oracle philosophy |
| 31 | **recap-lite** | skill | Quick session orientation |
| 32 | **release** | skill | 'Automated release flow |
| 33 | **resonance** | skill | Capture a resonance moment |
| 34 | **retrospective** | skill | Quick session retrospective |
| 35 | **rrr-lite** | skill | Quick session retrospective |
| 36 | **skills-list** | skill | 'List all Oracle skills |
| 37 | **standup** | skill | Daily standup check |
| 38 | **talk-to** | skill | Talk to another Oracle agent |
| 39 | **team-agents** | skill | Spin up coordinated agent teams for any task |
| 40 | **trace** | skill | Find projects, code |
| 41 | **vault** | skill | Connect external knowledge bases (Obsidian |
| 42 | **warp** | skill | 'Teleport to a remote oracle node |
| 43 | **watch** | skill | 'Extract YouTube video transcripts |
| 44 | **where-we-are** | skill | Session awareness |
| 45 | **who-are-you** | skill | Know ourselves |
| 46 | **work-with** | skill | 'Persistent cross-oracle collaboration |
| 47 | **worktree** | skill | 'Work in an isolated git worktree |
| 48 | **wormhole** | skill | 'Federated query proxy |
| 49 | **xray** | skill | X-ray deep scan |

</details>

<!-- skills:end -->

## Profiles

<!-- profiles:start -->

| Profile | Count | Skills |
|---------|-------|--------|
| **minimal** | 7 | `about-oracle`, `forward-lite`, `go`, `oracle-soul-sync-update`, `recap-lite`, `rrr-lite`, `trace` |
| **standard** | 13 | `awaken`, `bampenpien`, `bud`, `dig`, `forward`, `go`, `learn`, `recap`, `rrr`, `talk-to`, `team-agents`, `trace`, `xray` |
| **full** | 49 | all |
| **lab** | 49 | all |

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
npx arra-oracle-skills@26.5.13-alpha.1726 install -g -y -s watch harden wormhole fleet release warp morpheus mailbox
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
