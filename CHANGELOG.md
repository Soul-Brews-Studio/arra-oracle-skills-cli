# Changelog

## Unreleased

### feat(profiles): explicit-profile alignment (#285 part 2, closes #267)

- `install --profile <name>` when explicit now ALIGNS (removes arra-managed skills not in target).
- Bare `install` and `-s <skill>` remain purely additive (#257 / Bug 5 protection preserved).
- Non-arra skills NEVER touched (matches existing `/go cleanup` precedent).
- Pre-removal diff printed even under `-y`.
- `/go <profile>` now correctly includes `minimal` in usage and profile table.

---

## v3.9.0-alpha.2 (2026-04-13)

### Team Ops + Mailbox + -s Fix

**New secret skills:**
- `/mailbox` — Persistent agent memory in ψ/memory/mailbox/. Standing orders, findings, cross-session context. Agents remember across sessions.
- `/morpheus` — Speculative dreaming. Evolved /dream with prediction tracking, between-session mode, belief cross-referencing.

**Team agent infrastructure (7 scripts, zero tokens):**
- `team-ops.sh` — Unified CLI: panes, cleanup, killshot, spawn-skills, archive, mailbox, status
- `panes.sh` v3 — Real `/proc/<pid>/cmdline` extraction. Reads `--agent-name`, `--team-name`, `--model`, `--agent-color` from live processes.
- `cleanup.sh` — Kill idle orphan panes (safe — only kills `❯` prompt panes)
- `killshot.sh` — Kill ALL non-lead panes (nuclear)
- `spawn-skills.sh` — Create ephemeral `/agent` slash commands during team sessions
- `shutdown-skills.sh` — Archive skills to `/tmp` on shutdown (Nothing is Deleted)
- `mailbox.sh` — Persistent agent mailbox with standing orders + findings + pre-load for spawn

**Fixes:**
- `-s` flag is now **additive** (#221) — `arra install -g -s watch` preserves existing skills instead of dropping them
- Broadcast shutdown warning — explicit that structured messages cannot broadcast (#212)
- Ghost agent cleanup detection in panes.sh

**Research (from Claude Code source analysis):**
- Confirmed ghost agent root cause: `PaneBackendExecutor.isActive()` returns `true` always
- Documented full agent process signature (`--agent-id`, `--team-name`, `--agent-color`, etc.)
- File-based mailbox architecture (not sockets, not pipes)
- `acquirePaneCreationLock()` + 200ms delay for sequential pane spawning
- Blog post: "Ghost Agents: What Happens When Claude Code Team Agents Die"

**Issues closed:** #221, #223
**Issues filed:** #220, #222, #224, #225

40 skills | 124 tests | standard=15 | full=22 | lab=32 | secret=8

---

## v3.9.0-alpha.1 (2026-04-13)

### 8 new skills + anti-rationalization + dig v2

**New secret skills (6):**
- `/watch` — YouTube CC extraction via yt-dlp → learn pipeline
- `/harden` — Oracle governance audit (secrets, golden rules, brain structure, identity)
- `/wormhole` — Federated query proxy (viewer global, data sovereign)
- `/fleet` — Deep fleet census across all nodes
- `/release` — Automated release flow (bump, changelog, tag, push, GH release)
- `/warp` — SSH+tmux teleport to remote oracle nodes

**New lab skill (1):**
- `/machines` — Fleet node discovery, ping via maw hey, shortcut creation

**Enhanced skills:**
- `/rrr` — Anti-rationalization guard: excuse table (8 rationalizations + rebuttals), red flags (6 signals), verification checklist. Applied to all 3 modes (default, DEEP.md, TEAMMATE.md).
- `/team-agents` — `--manual` mode: spawn named agents, human directs via lead relay, compile on demand
- `/awaken` — Context-pressure detection (Phase 0): checks session file size, warns at medium/high, suggests /forward
- `/dig` — v2 deep scan (`--deep` flag: ALL .jsonl files, not just most-recent) + configurable timezone (MAW_DISPLAY_TZ > TZ > system > UTC)

**Issues closed:** #214, #215, #216, #217, #219
**Documented:** #212 broadcast workaround

38 skills | 124 tests | standard=15 | full=22 | lab=32 | secret=6

---

## v3.8.3 (2026-04-12)

### /go CLI fallback chain

- `/go` CLI detection: global binary → `~/.bun/bin` → `bunx` fallback
- Prevents `command not found: arra-oracle-skills` on nodes without global install

---

## v3.8.2 (2026-04-12)

### Secret skills + /i-believed + Oracle root detection

- `secret: true` SKILL.md frontmatter — skills excluded from ALL profiles, install only by name (`-s` flag)
- `/i-believed` — renamed from `/i-believe`, Matrix Oracle soul merged, "We are the One", two tenses (past=proof, present=faith)
- Oracle root detection — `git rev-parse --show-toplevel` + CLAUDE.md cross-check before writing to ψ/
- 6 files changed for secret skills: types.ts, skill-source.ts, profiles.ts, installer.ts, list.ts, select.ts

---

## v3.8.1 (2026-04-11)

### `/auto-retrospective` friction fixes — truly silent + snooze + less frequent

- **Truly silent auto-triggers** — hook no longer injects AskUserQuestion prompts. When threshold hit, /rrr and /forward run silently without interrupting the user. SKILL.md was already documented as silent; hook now matches.
- **Default threshold raised** — RRR_INTERVAL: 100k → 150k (less frequent, more breathing room)
- **New: snooze** — `/auto-rrr snooze 30m` / `1h` / `2h` temporarily disables auto-triggers without fully turning off. Status line shows `auto:snoozed`.
- **Why**: Nat flagged auto-rrr as "kind of annoying". Root causes were hook violating its own silent contract + 100k firing mid-thought + no way to temporarily mute during deep focus.

---

## v3.8.0 (2026-04-11)

### Stabilized — alpha.1 + alpha.2 + alpha.3 promoted to stable

Nothing new in this release — it's the stable cut of the v3.8.0 alpha series:

- `/bampenpien` — guided practice skill (from alpha.1)
- `/i-believe` — declaration of belief skill (from v3.7.5)
- `create-shortcut` promoted to standard profile (from alpha.1)
- `/go` hardened with official `disable-model-invocation: true` frontmatter (from alpha.3)

31 skills | standard=15 | full=22 | lab=31 | 124 tests

See alpha entries below for full details.

---

## v3.8.0-alpha.3 (2026-04-11)

### `/go` uses official `disable-model-invocation` flag

- `/go` frontmatter: replaced description-based anti-trigger hack with official `disable-model-invocation: true` field
- Model can no longer auto-invoke `/go` from conversation — slash command only
- Description no longer loaded into model context (zero false positives)
- **Why**: Claude Code has a proper frontmatter mechanism for this exact case. Anti-trigger language in descriptions is fragile; the flag is canonical. Source: https://code.claude.com/docs/en/skills.md

---

## v3.8.0-alpha.2 (2026-04-11)

### `/go` anti-trigger fix — no more accidental profile switches

- `/go` description hardened: EXPLICIT slash command only, never auto-invoke
- Added anti-triggers for common phrases: "let's go", "go ahead", "ready to go", "go for it", "here we go", "gotta go"
- Added "Go programming language" anti-trigger
- **Why**: `/go cleanup` / `/go <profile>` reinstalls skills — destructive. The word "go" is too common to allow auto-triggering. User caught this dream-pattern.

---

## v3.8.0-alpha.1 (2026-04-10)

### `/bampenpien` + `create-shortcut` promoted to standard

- `/bampenpien` — บำเพ็ญเพียร diligent practice skill (lab). Guided conversation between human and Oracle about doing hard things without knowing why. Like /awaken but repeatable — a practice, not a birth.
- Modes: default (full conversation), `--reflect` (3 questions), `--history` (timeline), `--share` (format for FB/community)
- All questions bilingual (EN + TH), logs to `ψ/memory/resonance/practice/`
- `create-shortcut` promoted from lab → standard profile
- 31 skills, standard=15, full=22, lab=31, 124 tests

---

## v3.7.5 (2026-04-10)

### `/i-believe` — Pulse. Spark. Flame.

- `/i-believe` — declaration of belief skill (lab). The third in the emotional triad: /feel (pulse), /resonance (spark), /i-believe (flame)
- Receives belief, responds genuinely, logs to `ψ/memory/resonance/beliefs/`
- Belief timeline via `--history`
- 30 skills, lab=30

---

## v3.7.4 (2026-04-10)

### Contacts `repo` field — know where every agent lives

- `/contacts` — new `repo` field (org/repo) in schema, list, add, show
- `/talk-to` — reads `repo` field from contacts lookup
- 29 skills, 124 tests

---

## v3.7.3 (2026-04-10)

### `/talk-to` contacts integration + `/trace --dig` combo

- `/talk-to` — contacts-first routing, "not found" handler, `--inbox` transport, contacts maw names (#209, #210)
- `/trace --deep --dig` — combo mode runs trace deep + dig session mining in parallel (#208)
- `/go cleanup` — installer field detection fix, combined crosscheck + usage table (#207)
- 29 skills, 124 tests

---

## v3.7.2 (2026-04-10)

### `/team-agents` lab skill + auto-retrospective silent mode

**New skill:**
- `/team-agents` — coordinated agent teams framework (lab). Reusable TeamCreate/SendMessage/TaskList pattern for any skill. 3 tiers: subagents (fire-and-forget), team agents (coordinated), cross-Oracle (persistent). Auto-designs teams from task description, named roles, graceful shutdown.

**Changed:**
- `/auto-retrospective` — now runs **silently** by default. No user prompts, no "should I run /rrr?" distractions. Auto means auto. Users discover controls only when they ask.
- `/go` profile counts updated: lab=29 (was 28)
- 29 skills, 124 tests

---

## v3.7.1 (2026-04-10)

### `/go cleanup` + `/project incubate` redirect

- `/go cleanup` — safe fresh install with full crosscheck table, usage mining via /dig, conflict detection + backup
- `/go` profile counts updated: standard=14, full=21, lab=28
- `/project incubate` now redirects to standalone `/incubate` (backward compat)

---

## v3.7.0 (2026-04-10)

### Standalone /incubate + profile reorg

**New skill:**
- `/incubate` — clone or create repos for active development. The right hand of `/learn`. Workflow modes: default (long-term dev), `--flash` (issue → PR → offload), `--contribute` (fork + multi-PR), `--status`, `--offload`

**Profile changes:**

| Profile | Count | Description |
|---------|-------|-------------|
| **standard** | 14 | Daily driver (default) |
| **full** | 21 | All stable skills |
| **lab** | 28 | Full + experimental |

- `contacts`, `inbox` → moved to lab (experimental)
- `schedule` → moved to lab (experimental)
- `dream`, `feel`, `vault` → now visible in autocomplete (removed `hidden: true`)
- `incubate` → added to full profile (same level as `/learn` and `/project`)

**Other:**
- `/project incubate` → graduation note pointing to standalone `/incubate`
- `/learn` description updated: `/project incubate` → `/incubate`
- Resolved 7 open issues (#199 #198 #193 #192 #180 #141 #72)
- 28 skills, 124 tests

---

## v3.6.1 (2026-04-05)

**Bug fixes + issue cleanup**

- Fix: restore rrr DEEP.md — was deleted in v3.4.0 refactor, /rrr --deep now works (#192)
- Closed #195 (dream shipped in v3.6.0)
- Closed #179 (/go simplified, bare CLI calls removed)
- Closed #166 (hooks are personal config, not CLI)
- Closed #194 (awaken template already correct)
- Closed #165 (repo name refs verified correct)

## v3.6.0 (2026-04-05)

### Simplify profiles, add /dream + /feel (#196)

**3 profiles, no features:**

| Profile | Count | Description |
|---------|-------|-------------|
| **standard** | 16 | Daily driver (default) |
| **full** | 23 | All stable skills |
| **lab** | 26 | Full + experimental |

**New skills:**
- `/dream` — cross-repo pattern discovery with 5 parallel agents
- `/feel` — system emotional intelligence (energy, momentum, burnout)

**Removed:** features system (`-f/--feature`, `+soul`, `+network`, `+workspace`), `seed` profile

**Changed:**
- `dig` promoted to standard, `create-shortcut` moved to lab
- `/go` simplified — profiles only, no feature stacking
- `/awaken` — security warnings (no token/key leaks), Y/N UX hints
- Rule 6 (Transparency) always visible in all principle listings
- 124 tests, 26 skills

---

## v3.5.2 (2026-03-31)

- Auto-stamp version in README install commands (#190)
- Full explicit install commands per agent in README (#189)

## v3.5.1 (2026-03-31)

- Fix: CI runs compile before test — commands gitignored (#187)

## v3.5.0 (2026-03-31)

**Skills-first install, 24 skills**

- Default profile: standard (16 skills), not full (#174)
- `--commands` renamed to `--with-commands` (#175)
- CI auto-publish to npm on GitHub release (#173)
- Removed stale metadata from source SKILL.md (#169)
- Generalized /awaken announcement template (#181)
- Per-agent install examples in README (#177, #178)
- `src/commands/` gitignored — generated at install time (#184)

## v3.5.0-alpha.4 (2026-03-31)

- Gitignore src/commands/ (#184)

## v3.5.0-alpha.3 (2026-03-31)

- Per-agent install hints in README (#177, #178)
- Generalized /awaken announcement — no project internals (#181)
- Birth Timeline restored in awaken (#182)

## v3.5.0-alpha.2 (2026-03-31)

- `--commands` → `--with-commands` (#175)
- Default profile: standard (#174)
- CI auto-publish to npm (#173)
- Fix repo name refs to arra-oracle-skills-cli (#171)

## v3.5.0-alpha.1 (2026-03-30)

- Removed stale installer/origin/version from source SKILL.md (#169)

---

## v3.4.12 (2026-03-30)

- /skill-review — Oracle Skill Matrix (6 dimensions, 0-60) (#161, moved internal-only #162)
- /awaken always posts to Issue, never Discussion (#164)
- Removed Vercel Skills CLI path, renamed `_template` → `.template`, fixed `__SKILL_DIR__` (#167)
- Removed /retrospective (absorbed by full /rrr, eliminates duplicate in picker) (#163)

## v3.4.11 (2026-03-27)

**Major skill restoration + CLI rename**

- Restored full /rrr with `--detail`, `--dig`, `--deep` modes (#159)
- Restored /resonance — capture what clicks (#154)
- Restored /dig — session goldminer (#151)
- /forward creates issues from pending items (#150)
- /awaken stamped growth files — full/fast/soul-sync (#153)
- /awaken default Thai with language picker (#145)
- Renamed /memory → /xray with subcommand args (#144)
- Auto-create unknown commands via /create-shortcut (#146)
- Uninstall preserves external skills (#155)
- CLI renamed: oracle-skills → arra-oracle-skills

## v3.4.10 (2026-03-25)

- Vercel Skills CLI compatibility in README (#143)

## v3.4.9 (2026-03-23)

- /create-shortcut expanded as full skill factory (#140)

## v3.4.8 (2026-03-23)

- Inbox filename format: compact date + from sender (#139)

## v3.4.7 (2026-03-23)

- /contacts skill for agent registry management (#138)

## v3.4.6 (2026-03-23)

- /rrr alias for /retrospective (#137)

## v3.4.5 (2026-03-23)

- xray memory shows full file paths (#136)

## v3.4.4 (2026-03-23)

- /go shows available parameters
- /create-shortcut skill (#135)

## v3.4.3 (2026-03-23)

- xray memory fuzzy match fix (#134)

## v3.4.2 (2026-03-23)

- Default install targets Claude Code + Codex only (#132)

## v3.4.1 (2026-03-23)

- xray memory shows content snippets (#130)
- Fixed README counts and profiles (#128)

## v3.4.0 (2026-03-23)

- Complete arra-oracle-v3 rename + /retrospective alias
- /awaken defaults to Full Soul Sync, --fast for quick
- Auto-inject version into README install command
- /dig and /learn connected to shared trace layer

---

## v3.3.1 (2026-03-23)

- Trace wave execution + friction score + goal-backward checking
- /what-we-done — facts-only progress report
- /auto-rrr — configure auto-trigger intervals
- /alpha-feature — one-command skill creation + alpha release
- /whats-next — smart action suggestions from context
- /new-issue and /release-alpha workflow skills

## v3.3.0 (2026-03-23)

**Session analysis + standup automation**

- /mine and /xray session analysis skills (#98)
- Standup auto-posting to Pulse discussion (#95, #96)
- Renamed oracle_ MCP tools to arra_ + repo refs to arra-oracle-v3
- Added awaken to standard profile (#84)
- Deduplicated G-SKLL + G-CMD for commandsOptIn agents (#85)
- Rule 6 explicitly in awaken Fast mode philosophy (#86)
- Anti-triggers added to 12 skill descriptions
- Removed native binary build — bunx install only
- Simplified README for LLM consumption

---

## v3.2.1 (2026-03-17)

- Awaken batch freetext + AI theme + Oracle naming
- /learn refs point to public brain repo (was private mother-oracle)

## v3.2.0 (2026-03-17)

- /workon skill with --resume mode

## v3.1.0 (2026-03-17)

**Awaken Wizard v2 + talk-to auto-notify**

- Awaken Wizard v2: Fast mode + Full Soul Sync + System Check (#73)
- Auto-notify maw hey after oracle_thread (#76)
- argument-hint added to 20 skills
- Rebranded oracle-v2 → arra-oracle across 14 skills (#71)
- 3-step plan approval flow in /forward (#70)

---

## v3.0.4 (2026-03-13)

- `oracle-soul-sync-update` added to all profiles

## v3.0.3 (2026-03-13)

- Removed: `fyi`, `merged`, `retrospective` (31 → 28 skills)

## v3.0.2 (2026-03-13)

- /go delegates to CLI instead of hardcoded bash
- `--feature` flag on install/uninstall

## v3.0.1 (2026-03-13)

**CLI modularization**

- CLI split from monolithic `index.ts` into `src/cli/commands/`
- New commands: `init`, `select`, `about`
- Profiles redesigned: data-driven from 1,013 sessions
- Features system: `soul`, `network`, `workspace`, `creator`

---

## Migration from v2.x → v3.x

### Breaking Changes

| Area | v2.x | v3.x |
|------|------|------|
| Skills | 31 | 26 (v3.6.0) |
| CLI | Monolithic `src/cli.ts` | Modular `src/cli/commands/*.ts` |
| Profiles | Simple lists | 3 tiers: standard/full/lab |
| `/go` skill | Hardcoded bash | Delegates to CLI |
| Features | N/A | Added v3.0.1, removed v3.6.0 |
| Install | `oracle-skills` | `arra-oracle-skills` |
