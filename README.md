# arra-oracle-skills-cli

37 skills for AI coding agents. Give your AI persistent memory, session awareness, and collaborative tools.

## Install

```bash
# Claude Code — standard profile (default)
npx arra-oracle-skills@26.5.14-alpha.1034 install -g -y --agent claude-code

# Full profile (all skills)
npx arra-oracle-skills@26.5.14-alpha.1034 install -g -y -p full --agent claude-code

# Lab profile (full + experimental)
npx arra-oracle-skills@26.5.14-alpha.1034 install -g -y -p lab --agent claude-code

# Specific skills only
npx arra-oracle-skills@26.5.14-alpha.1034 install -g -y -s recap rrr trace --agent claude-code

# Other agents (skills + commands)
npx arra-oracle-skills@26.5.14-alpha.1034 install -g -y --agent codex --with-commands
npx arra-oracle-skills@26.5.14-alpha.1034 install -g -y --agent opencode --with-commands
npx arra-oracle-skills@26.5.14-alpha.1034 install -g -y --agent cursor
npx arra-oracle-skills@26.5.14-alpha.1034 install -g -y --agent gemini-cli --with-commands

# Multiple agents
npx arra-oracle-skills@26.5.14-alpha.1034 install -g -y --agent claude-code codex opencode

# thClaws (federated agent — explicit opt-in)
bunx arra-oracle-skills@github:Soul-Brews-Studio/arra-oracle-skills-cli install -y -g --with-thclaws
# OR target thclaws directly:
bunx arra-oracle-skills@github:Soul-Brews-Studio/arra-oracle-skills-cli install -y -g -a thclaws
# Skills install to ~/.config/thclaws/skills/ when --with-thclaws is passed

# Install to ALL detected agents incl. federated (CI escape hatch)
bunx arra-oracle-skills@github:Soul-Brews-Studio/arra-oracle-skills-cli install -y -g --all-detected
```

> **#330 note**: as of v26.5.14+, federated agents (thClaws, OpenCode, GitHub Copilot, OpenClaw) are NOT auto-installed by default — they require explicit `-a <name>`, `--with-<name>`, or `--all-detected`. Host Anthropic agents (Claude Code, Codex) continue to auto-detect.

### Local project install

By default (no `-g` flag), skills install to the current project's `.claude/skills/` instead of `~/.claude/skills/`:

```bash
# Local install (current project)
npx arra-oracle-skills@26.5.14-alpha.1034 install -a claude-code -s trace -y

# Same with explicit -l flag (symmetric to -g)
npx arra-oracle-skills@26.5.14-alpha.1034 install -l -a claude-code -s trace -y
```

Use when:
- Testing skill changes before global rollout
- Different repos want different skill versions
- Committing project-specific skills to `.claude/skills/` in version control

The `L-SKLL` marker in the SKILL.md description distinguishes locally-installed skills from globally-installed ones (which get `G-SKLL`).

19 agents: Claude Code, Codex, OpenCode, Cursor, Gemini CLI, Amp, Kilo Code, Roo Code, Goose, Antigravity, GitHub Copilot, OpenClaw, Droid, Windsurf, Cline, Aider, Continue, Zed, thClaws

## Skills

<!-- skills:start -->

<details>
<summary>📚 <strong>37 skills installed</strong> — click to expand</summary>

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
| 8 | **awaken** | skill | "Guided Oracle birth and awakening ritual |
| 9 | **bampenpien** | skill | "บำเพ็ญเพียร |
| 10 | **bud** | skill | 'Create a new oracle via maw bud |
| 11 | **calver** | skill | Show or bump CalVer version |
| 12 | **contacts** | skill | Manage Oracle contacts |
| 13 | **create-shortcut** | skill | Create local skills as shortcuts |
| 14 | **dig** | skill | Mine Claude Code sessions |
| 15 | **dream** | skill | 'Speculative dreaming |
| 16 | **feel** | skill | "Capture how the system feels |
| 17 | **forward** | skill | Create handoff + enter plan mode for next |
| 18 | **forward-lite** | skill | Quick handoff to next session |
| 19 | **fyi** | skill | Log information for future reference |
| 20 | **go** | skill | Switch skill profiles (standard/full/lab) |
| 21 | **hey** | skill | Talk to another oracle via maw federation |
| 22 | **inbox** | skill | Read and write to Oracle inbox |
| 23 | **incubate** | skill | Clone or create repos for active development |
| 24 | **mailbox** | skill | 'Persistent agent mailbox |
| 25 | **oracle-soul-sync-update** | skill | Sync Oracle instruments with the family |
| 26 | **recap-lite** | skill | Quick session orientation |
| 27 | **resonance** | skill | Capture a resonance moment |
| 28 | **rrr-lite** | skill | Quick session retrospective |
| 29 | **standup** | skill | Daily standup check |
| 30 | **talk-to** | skill | Talk to another Oracle agent |
| 31 | **team-agents** | skill | Spin up coordinated agent teams for any task |
| 32 | **trace** | skill | Find projects, code |
| 33 | **watch** | skill | 'Extract YouTube video transcripts |
| 34 | **where-we-are** | skill | Session awareness |
| 35 | **who-are-you** | skill | Know ourselves |
| 36 | **worktree** | skill | 'Work in an isolated git worktree |
| 37 | **xray** | skill | X-ray deep scan |

</details>

<!-- skills:end -->

## Profiles

<!-- profiles:start -->

| Profile | Count | Skills |
|---------|-------|--------|
| **minimal** | 7 | `about-oracle`, `forward-lite`, `go`, `oracle-soul-sync-update`, `recap-lite`, `rrr-lite`, `trace` |
| **standard** | 12 | `awaken`, `bampenpien`, `bud`, `dig`, `forward`, `go`, `learn`, `recap`, `rrr`, `talk-to`, `team-agents`, `trace` |
| **full** | 37 | all |
| **lab** | 37 | all |

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

<!-- secret-skills:start -->

## Zombie Skills

27 skills excluded from all profiles. Install by name:

```bash
npx arra-oracle-skills install -g -y -s <name>
```

| Skill | What |
|-------|------|
| `/alpha-feature` | Full skill development pipeline — create, compile, test, ... |
| `/birth` | Prepare Oracle birth props for a new repo — Issue #1, MCP... |
| `/deep-research` | Deep Research via Gemini — opens new tab, selects Deep Re... |
| `/gemini` | Control Gemini browser tab via MQTT WebSocket — chat, tra... |
| `/handover` | Transfer work to another Oracle — forward + wake + tell i... |
| `/list-issues-pr-pulse` | Open issues, PRs, and Pulse board in one view. Use when u... |
| `/mine` | Extract a specific topic from a single session JSONL file... |
| `/new-issue` | Quick GitHub issue creation. Use when user says "new issu... |
| `/oracle-manage` | Skill and profile management — prepare tools, switch prof... |
| `/speak` | Text-to-speech using edge-tts neural voices with macOS sa... |
| `/what-we-done` | Facts-only progress report — commits, PRs merged, issues ... |
| `/whats-next` | Smart action suggestions — scan context, rank priorities,... |
| `/workon` | Work on a GitHub issue with worktree isolation, or resume... |
| `/i-believed` | Declare belief — looking back or leaping forward. 'I beli... |
| `/work-with` | Persistent cross-oracle collaboration with synchronic sco... |
| `/morpheus` | Speculative dreaming — background thinking, pre-computati... |
| `/retrospective` | Quick session retrospective — summary, lessons, next step... |
| `/skills-list` | List all Oracle skills with profile tier, type, and scrip... |
| `/fleet` | Deep fleet census — discover all oracles across all nodes... |
| `/machines` | Fleet machines — discover nodes from contacts, ping to pr... |
| `/warp` | Teleport to a remote oracle node via SSH+tmux. Interactiv... |
| `/release` | Automated release flow — bump version, changelog, tag, pu... |
| `/philosophy` | Display Oracle philosophy — the 5 Principles + Rule 6. Us... |
| `/wormhole` | Federated query proxy — ask questions across oracle nodes... |
| `/harden` | Audit Oracle configuration for safety, governance, and ha... |
| `/vault` | Connect external knowledge bases (Obsidian, Logseq, markd... |
| `/dream-original` | Cross-repo pattern discovery with parallel agents. Finds ... |
<!-- secret-skills:end -->

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
