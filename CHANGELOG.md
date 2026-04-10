# Changelog

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
