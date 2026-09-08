# RRR cross-runtime redesign — implementation plan

| field | value |
|---|---|
| author | Fable (Claude Fable 5.1), planner |
| date | 2026-09-08 (Asia/Bangkok) |
| repo / branch | `/home/aitma/.herdr/worktrees/oracle-skills-cli/rrr-cross-runtime-20260908` / `feat/rrr-cross-runtime-20260908` |
| base | `upstream/alpha` at `68110ad0641f5b7bc8a14a988971ff4ead9ad77a` |
| reviewers | Astra (independent verification) → Terra (implementation) → Codex lead (validation + E2E) |
| authority in this session | plan file only; no commit, push, merge, install, runtime-setting, Oracle, or remote action |

Evidence tags used throughout: **[verified]** = read from the cited file/line or observed live in this session; **[inference]** = consistent with evidence but not behaviorally proven; **[unavailable]** = could not be observed from this machine. Every load-bearing claim carries a `file:line` citation. Paths without a repo prefix are relative to this worktree.

---

## 0. Premise verdict

**The premise is correct and the scope is one skill, not a runtime.** The user wants one front door (`/rrr`, `$rrr`) that (1) captures evidence-backed learnings without invented completeness, (2) can finish a task on explicit request through exact live gates, (3) cleans only proven task-owned artifacts, (4) captures verified gotchas during a session without per-item prompting, and (5) behaves the same in Claude Code and Codex. All five are achievable with a portable skill plus small executable helpers and a typed task manifest. None requires a global dispatcher, daemon, worktree manager, cross-task claim ledger, or multi-repo transaction. The 2026-09-08 retirement learning is explicit that those were the overengineering failure class (`/home/aitma/sda-script/ψ/memory/learnings/2026-09-08_automatic-workspace-runtime-overengineering-and-retirement-gotchas.md:19-41`) [verified].

Two parts of the premise are corrected rather than accepted:

1. **"Continuous immediate capture" cannot be delivered by a skill that is loaded only at closeout.** The first release delivers capture *while the skill is loaded* (bare `/rrr`, `/rrr --light` checkpoints, and a callable capture command) and documents a deferred, M-approved, one-line startup instruction for both runtimes. No hook or global instruction ships in this release (§4.6, §11.4). Outcome 5 is therefore **partial** in this release and the completeness matrix says so (§16).
2. **Runtime tool approval cannot be waived by skill text.** Codex does not pre-approve `arra_learn` (`/home/aitma/.codex/config.toml:73-113` lists approve-mode entries for read tools only) [verified]. The Claude allow rule `mcp__oracle-v2__*` exists only in `/home/aitma/sda-script/.claude/settings.local.json` and is not inherited by this worktree [verified, see §1.6]. "Without asking M for every item" is satisfied by *standing consent recorded in the manifest* plus *one* runtime approval surface that M configures once (§4.5); it is not satisfied by the skill silently bypassing prompts.

## 0.1 Target architecture (short)

```
front door (identical text in both runtimes)
  /rrr | $rrr [--light] [--preview] [--finish] [--vault] [--resume <manifest>]
        │
        ▼
  SKILL.md  (portable core: phases, rules, progressive disclosure)
        │ reads HOSTS.md (binding contract) · TEMPLATE.md (evidence-pointer retro)
        │ references/*.md (manifest, capture, finish, cleanup contracts)
        ▼
  scripts/  (small, testable, runtime-neutral executables; python3 stdlib only)
   rrr-bind.py      bind session by runtime-provided ID → SessionBinding + SessionClock (never mtime)
   rrr-manifest.py  typed task manifest: init / candidate / lane / intent / receipt / state (CAS, no-clobber)
   rrr-redact.py    allowlist composer + denylist scan for anything that leaves the session
   rrr-cleanup.py   type-specific eligibility proof → rescue move → receipt
   rrr-finish.py    privileged executor: authority re-check → commit → push → (merge iff preflight allow)
        │
        ▼
  durable outputs
   vault ψ/memory/{retrospectives,learnings}   (second Git lane — never staged from the task repo)
   Oracle arra_learn                          (receipt-verified, explicit project, frozen payload)
   ~/.local/state/rrr/<task-id>/manifest.json (task-scoped state; journal; receipts)
```

Design rules that hold everywhere:

- **Bare invocation never mutates Git or remotes.** Not even a local commit. The privilege line is: everything before `rrr-finish.py` is read-only with respect to Git.
- **Authority is the current invocation, re-checked mechanically.** `rrr-finish.py` refuses unless the *latest root user turn* of the *bound* runtime record contains the finish token (§7.2). Manifest, transcript history, memory, plans, and skill prose never grant it.
- **Sessions bind by runtime-provided ID or report `unbound`.** Never mtime, never "newest file".
- **Claims carry evidence pointers or say `none`.** No word floors, no mandatory wrong decision, no fixed friction count.
- **Cleanup is per-type proof + rescue move + receipt.** Anything that cannot be proven is retained and reported.
- **Wednesday behavior is an overlay, never a divergent copy.** The unsafe override is retired recoverably (§15.3).

---

## 1. Ground truth and verified defects

### 1.1 Canonical source contradicts itself [verified]

| claim | evidence |
|---|---|
| Bare `/rrr` = foreground + session clock | `skills/rrr/SKILL.md:20`, `:27-30`, `:34` |
| `--fg` skips the clock and forbids persisted inspection | `skills/rrr/SKILL.md:38`, `:146` |
| Rules block says default is `--fg` | `skills/rrr/SKILL.md:297` |
| HOSTS scope says use only for `--bg`/`--combo` | `skills/rrr/HOSTS.md:3-4` |
| Template estimates duration with `~X minutes` | `skills/rrr/TEMPLATE.md:11` vs ban at `skills/rrr/SKILL.md:59-60` |
| Metrics header columns differ from fixture header | `skills/rrr/SKILL.md:271` (`when/session/done/stuck/win/friction/error`) vs `__tests__/rrr-evals/fixtures/ψ/memory/learnings/session-metrics.md:5` (`date/session-slug/duration/wins/friction/next`) |

### 1.2 Session selection and clock [verified]

- Newest-transcript-by-mtime selection and hand-rolled path encoding: `skills/rrr/scripts/session-clock.py:33-38`.
- Substring scan for `"timestamp":"` and a fixed 24-char slice: `:30`, `:47-49`. Any tool-result body that embeds JSON with a timestamp field is counted as a session event. This session printed such JSON while profiling transcripts, so the self-poisoning case is real, not theoretical.
- Duration is first-to-last of the last segment (`:89`, `:94-96`), not active minutes.
- ISO parsing only handles `Z` via replace (`:71`); `+07:00` offsets parse, but fractional-second and non-24-char variants are truncated by the slice at `:49`.
- Installed Codex copy reads Claude storage: `/home/aitma/.codex/skills/rrr/SKILL.md:66-74` (`$HOME/.claude/projects/... | ls -t | head -1`).
- Installed Claude copy (= Wednesday override) selects a project dir by basename glob and `head -1`: `/home/aitma/.claude/skills/rrr/SKILL.md:246`.

### 1.3 Tests and eval are false-green [verified]

- `__tests__/rrr-contract.test.ts:11-117` asserts string presence only; it passes while §1.1 contradictions exist.
- `scripts/eval_rrr.py:38-51` stubs `run_rrr`; `:75` pins `psi = FIXTURE_PSI`; `:82-86` routes every register to `sample-good`; `:87-88` prints `PASS [register]`.
- `__tests__/rrr-evals/conftest.py:59-67` parametrizes only `sample-good`.
- Template drift masked by the fixture: `__tests__/rrr-evals/test_quant_rrr.py:24-32` requires the literal `## AI Diary` and `## Honest Feedback`, but `skills/rrr/TEMPLATE.md:47` and `:66` emit `## 📝 AI Diary` and `## 💭 Honest Feedback`. A template-conforming retro **fails** `test_section_completeness`; the suite is green only because the fixture (`fixtures/.../12.00_sample-good.md:31,39`) uses the old headings.
- `pytest` is not installed on this machine (`python3 -c "import pytest"` → `ModuleNotFoundError`) [verified], so the Python suite is not part of `bun run test` or CI (`.github/workflows/ci.yml:16-18` runs `bun run test:full` only).

### 1.4 Fabrication incentives [verified]

- Word floors: `skills/rrr/TEMPLATE.md:48` (≥150), `:67` (≥100); enforced by `__tests__/rrr-evals/test_quant_rrr.py:96-105`.
- Mandatory wrong decision: `skills/rrr/TEMPLATE.md:50-51` (`[→ AGENT DECISION]` naming a decision made wrong) and `:95`.
- Exactly three friction points: `skills/rrr/TEMPLATE.md:68`, `:113`; `test_quant_rrr.py:110-115` requires ≥3 bullets.
- Installed Claude copy: `/home/aitma/.claude/skills/rrr/SKILL.md:128-133`, `:270-273`.

### 1.5 Installed copies are divergent generations; loader precedence unproven [verified unless noted]

| root | marker | generation | notable behavior |
|---|---|---|---|
| `/home/aitma/.claude/skills/rrr/SKILL.md` | `installer: oracle-skills-cli v3-custom` (`:2`) | Wednesday override | `git add ψ/… && git commit && git push origin main` (`:229-235`) |
| `/home/aitma/.codex/skills/rrr/SKILL.md` | `arra-oracle-skills-cli v26.4.18-alpha.22` (`:2`) | 2026-04 canonical | reads Claude JSONL by mtime (`:66-74`); `--deep --teammate` (`:195-197`) |
| `/home/aitma/.agents/skills/rrr/SKILL.md` | `oracle-skills-cli v2.0.10` (`:2`) | 2026-03 canonical | bare `ψ/` paths (`:49-52`), legacy `oracle_learn` tool name (`:71`) |
| `/home/aitma/.codex/prompts/rrr.md` | v26.4.18 stub (`:2`) | points at `~/.codex/skills/rrr/SKILL.md` (`:8`) | `$ARGUMENTS` pass-through (`:10`) |

Codex 0.153.2 (`codex --version` → `codex-cli 0.153.2`) binary strings contain `$CODEX_HOME/skills`, `~/.codex/skills`, and `.agents/skills` [verified by `strings` on the vendored binary]; which root wins on a duplicate name is **[unavailable]** and must be proven behaviorally (§12.9). The `.agents` root is tracked by `/home/aitma/.agents/.skill-lock.json` (vercel `npx skills` lock) [verified]; its removal is deferred (§11.4).

Installer facts that shape rollout: the installer removes the destination unconditionally before copy (`src/cli/installer.ts:671-673`); the #230 shield protects only *local cwd* skills during a global install (`:563-588`); ownership is detected by the `installer: arra-oracle-skills-cli` marker (`:316-326`); Codex gets `~/.codex/skills` plus a `~/.codex/prompts/<name>.md` stub (`src/cli/agents.ts:50-59`, `installer.ts:860-877`) and the marketplace bundle is deliberately cleaned (`installer.ts:925-940`). The Wednesday deploy copies `skills/overrides/*/` over installed skills (`/home/aitma/ghq/github.com/mangsriso/wednesday-oracle/deploy.sh:151-166`, and `:12-24` for `--overrides-only`), globbing `overrides/*/` (`:14`, `:153`).

### 1.6 Oracle persistence facts [verified]

- Tool schema accepts `project` and `idempotency_key` (`/home/aitma/ghq/github.com/Soul-Brews-Studio/oracle-v2/src/tools/learn.ts:35-43`); project resolution order = explicit → `source` regex (`rrr: owner/repo` or github URL) → cwd detect (`src/learn/project.ts:26-42`); `null` project stores under `_universal` (`src/learn/storage.ts:27`).
- Outcomes `created | replayed | reconciled | partial | degraded` (`src/learn/persistence.ts:18`); result shape with `durability.level ∈ {full,file,missing}` and `indexing.status` (`:20-31`); partial says "retry identically to reconcile" (`:186-188`); degraded requires operator requeue (`:209-211`).
- Canonical fingerprint over pattern/concepts/source/project/origin (`src/learn/canonical.ts:69-78`); document id = `learning_<UTC date>_<slug of first line>_<fingerprint[0:12]>` (`:97-105`); first line becomes YAML `title` and the H1 (`:117`, `:131`), so a first line starting with `#` doubles the heading.
- Idempotency key bound to a different fingerprint → `LearnConflictError` (`src/learn/reservations.ts:63-71`, `:86-89`).
- Publication is no-replace, temp + hardlink (`src/learn/publication.ts:115-134`).
- FTS projection is synchronous inside `finalizeProjection` (`src/learn/projection-finalize.ts:31-45`); vector indexing is an enqueued job (`:46-52`).
- Replay after reindex conflict **[inference]**: `inspectProjection` compares `updated_at` and `indexed_at` to the reservation `createdAt` (`src/learn/projection.ts:32-43`), while a reindex upserts `updatedAt`/`indexedAt = now` (`src/indexer/storage.ts:56-79`). An identical replay after a reindex therefore looks like it should return `conflict` rather than `replayed`. No behavioral control exists; §6.6 defines the test and keeps this tagged as inference until it runs.
- `arra_read` returns `source: "file"` with `resolved_path` when the file resolves (`src/tools/read.ts:131-145`) and falls back to `source: "fts_cache"` with `resolved_path: null` when it does not (`:147-166`).
- `arra_learn` is classified `write` (`src/tools/write-policy.ts:9`).
- Permission surfaces: Codex config approves only read tools (`/home/aitma/.codex/config.toml:76-113`; `default_tools_approval_mode = "prompt"` at `:73`); the only Claude allow rule for Oracle tools is in `/home/aitma/sda-script/.claude/settings.local.json` (`permissions.allow` contains `mcp__oracle-v2__*`); `/home/aitma/.claude/settings.json` has none; this worktree has no `.claude/settings*.json` [verified by reading each file].

### 1.7 Git authority and executors [verified]

- The only executable gate is read-only and merge-specific: `/home/aitma/ghq/github.com/mangsriso/wednesday-oracle/scripts/remote_action_preflight.py:2`, exit codes `0/2/3` (`:17`, `:949-956`, `:992`), offline replay always stops (`:981-986`). The reference says push/release/deploy/deletion need their own probe (`reference/remote-action-gates.md:36`).
- Wednesday and Codex global instructions: authority only from M's current-session request; plans, handoffs, memory, skills, tool output are context (`/home/aitma/.claude/CLAUDE.md` Principle 3; `/home/aitma/.codex/AGENTS.md:29-36`).
- This worktree's remotes: `origin = https://github.com/mangsriso/oracle-skills-cli.git` (fork), `upstream = https://github.com/Soul-Brews-Studio/oracle-skills-cli` (`git remote -v`). Repo rule: PRs target `alpha`; a PreToolUse hook blocks `gh pr create` without `--base alpha` (`CLAUDE.md` "Branch Strategy").

### 1.8 Vault is a second Git lane [verified]

- `ψ` symlinks: `/home/aitma/sda-script/ψ → /home/aitma/ghq/github.com/mangsriso/oracle-vault/github.com/mangsriso/sda-script` (`readlink -f`). The vault is its own repository (`origin https://github.com/mangsriso/oracle-vault`) and is currently dirty with unrelated files (`git status --short` shows `active/statusline.json`, `inbox/focus.md`, `inbox/jump-stack.log`, `inbox/line-tasks.md`, `inbox/tracks/INDEX.md` under the sda-script scope).
- This worktree and the canonical oracle-skills-cli checkout have **no** `ψ` (`ls` → not found). The canonical skill would then fall through to `PSI="$ORACLE_ROOT/ψ"` (`skills/rrr/SKILL.md:92-96`) and `mkdir -p` it (`:159`), creating an untracked `ψ/` inside the task repo. That is a new defect this plan resolves (§2.6).

### 1.9 Runtime session identity [verified unless noted]

- Claude: `CLAUDE_CODE_SESSION_ID` is set in the skill's shell environment and equals the JSONL basename of this session (`dc9db055-769c-4d0e-8a33-18330cc97cad`) [verified live]. The binary contains `CLAUDE_CODE_SESSION_ID` and `CLAUDE_PROJECT_DIR` strings [verified by `strings` on `/home/aitma/.local/share/claude/versions/2.1.263`]. JSONL records carry `sessionId`, `cwd`, `timestamp`, `isSidechain`, `version`, `gitBranch` [verified by key census]. Subagent transcripts live at `<projects>/<session>/subagents/agent-<id>.jsonl` with `.meta.json` [verified]. `sessions-index.json` entries carry `sessionId`, `fullPath`, `created`, `modified`, `gitBranch`, `projectPath`, `isSidechain` [verified]. A real compaction record shape was **[unavailable]** (the only `isCompactSummary` hit was inside a message body); the adapter treats compaction markers as fixture-driven (§5.5).
- Codex: rollouts at `~/.codex/sessions/YYYY/MM/DD/rollout-<ts>-<uuid>.jsonl` [verified]; a `session_meta` record carries `payload.id`, `timestamp`, `cwd`, `originator`, `cli_version`, `source` (`"cli"` or `{subagent:{thread_spawn:{parent_thread_id,…}}}`), `git` [verified]; a subagent rollout can contain **two** `session_meta` lines (its own first, the parent's second) [verified in `rollout-2026-09-08T15-19-18-01a08019-…`], so "line 1" is not the file's identity — the `payload.id` must equal the filename UUID. `turn_context` carries `turn_id`, `cwd`, `approval_policy`, `sandbox_policy`, `model` [verified]. Every record has a top-level `timestamp` [verified]. Compaction appears as `"type":"compacted"` / `"type":"compaction"` [verified in 2026-09-01 rollouts]. Binary strings include `CODEX_THREAD_ID`, `CODEX_SESSION_ID`, `CODEX_HOME` [verified]; whether they are exported into a skill's shell is **[inference]** (referenced by `/home/aitma/.codex/herdr-agent-state.sh:62`).

---

## 2. Command contract

Identical token grammar in both runtimes. Claude: `/rrr <flags>`. Codex: `$rrr <flags>` (skill mention; `/prompts:rrr <flags>` remains a compatibility alias through the installer stub). The skill treats the literal invocation text as the flag source in both runtimes; how each runtime delivers that text is a behavioral test (§12.10), not an assumption.

| invocation | Git | remote | Oracle | cleanup | notes |
|---|---|---|---|---|---|
| `/rrr` (bare) | read-only | none | publish only `verified` candidates that pass §4.4 and §6 | manifest-owned, proven, rescue-moved | full closeout: bind → evidence → capture reconcile → retro → learning → metrics → manifest → cleanup → report |
| `/rrr --light` | read-only | none | none (candidates appended, not published) | none | mid-session checkpoint; writes Timeline + Summary + candidates; marks `mode: light`; never claims completeness |
| `/rrr --preview` | read-only | none | as bare | dry-run listing only | runs bare closeout, then `rrr-finish.py --preview`: evaluates **every** §7.2 check and prints each as `PASS` or `WOULD-REFUSE: <reason>` (an absent `authority` block is printed as `WOULD-REFUSE: no authority`), prints the exact commands finish *would* run with live values substituted, executes nothing, exits 0 |
| `/rrr --finish` | commit exact allowlisted paths on the task branch | push task branch to the bound remote; merge **only** if a PR is bound and `remote_action_preflight.py` exits 0 | as bare | as bare, after finish | current invocation is the authority; re-checked by §7.2 |
| `/rrr --finish --pr` | as finish | additionally create the PR (`--base alpha` for this repo) before merge evaluation when none is bound | as bare | as bare | PR creation is outward-facing and is opt-in |
| `/rrr --vault` | none in this release | none | as bare | as bare | records a vault-lane *request* in the manifest and reports `vault lane: not implemented in this release` (§8) |
| `/rrr --resume <manifest.json>` | per recorded state | per recorded state | per recorded receipts | per recorded receipts | replays journal; re-verifies intents without receipts; never repeats an action that has a receipt |
| `/rrr --resume <manifest.json> --finish` | as finish | as finish | as bare | as bare | the only way to continue a `finishing`/`finish-blocked` manifest; §7.2 is re-run in full against the **new** invocation and a fresh `authority` block replaces the old one |

Unsupported combinations (refuse with the valid syntax, no side effects):

- `--finish` with `--light` (a checkpoint cannot finish).
- `--finish` or `--pr` from a subagent/sidechain session (Claude `isSidechain: true` or an `agent-*.jsonl` binding; Codex `session_meta.source.subagent`).
- `--finish` when binding is `unbound` (no mechanical authority re-check possible).
- `--finish` with `--vault` (vault lane is not executable in this release).
- `--resume` with any flag other than `--preview` or `--finish`.
- Any of the removed flags `--fg --bg --combo --detail --dig --deep --teammate`: refuse and name the replacement (`--light` or bare). No background agents, hidden miners, teams, or subagents in any mode (`skills/rrr/SKILL.md:304` retained).

### 2.1 Phases of a bare run

1. **Bind** — `rrr-bind.py --json` → `SessionBinding` + `SessionClock` (§5).
2. **Resolve repo and vault** — task repo = `git rev-parse --show-toplevel` of cwd; vault = `ψ` only if it exists and `readlink -f` resolves inside a directory that is itself a Git work tree different from the task repo, or the task repo itself has a real (non-symlink) `ψ` that is tracked. Otherwise `vault: none` (§2.6).
3. **Gather** — Git evidence (`status --porcelain`, `log` with `--date=format-local` under `TZ=Asia/Bangkok`, `diff --stat`), manifest candidates, and runtime evidence from the bound record only.
4. **Reconcile candidates** — every candidate moves to exactly one terminal state (§4.2); nothing is discarded silently.
5. **Write** — retrospective, learning file(s), metrics row (§3.4 paths).
6. **Publish** — `verified` candidates to Oracle with receipts (§6).
7. **Cleanup** — manifest-owned resources only (§9).
8. **Report** — absolute paths, receipts, retained/blocked items, evidence gaps.

### 2.2 Output block (announce mode, absolute paths only; `skills/CONVENTIONS.md` rules apply)

```
📝 Retrospective:  /abs/path.md
💡 Learning file:  /abs/path.md | none (no candidate reached verified)
📊 Metrics row:    /abs/path.md
🧠 Oracle:         <n> published (ids…) · <n> partial · <n> degraded · <n> conflict · <n> withheld
🗂  Manifest:       /abs/manifest.json (revision N, state S)
🧹 Cleanup:        <n> rescued · <n> retained (why) · <n> blocked (why)
🔒 Finish:         not requested | preview only | committed <sha> · pushed <remote>/<branch> · merge <allow|stop:reason|no-pr>
⚠️ Evidence gaps:   <list or none>
```

### 2.3 Timezone and clocks

All stored timestamps are ISO-8601 with offset (UTC as produced by runtimes). Display in the retro is GMT+7 via `TZ=Asia/Bangkok`. Git author times and runtime timestamps are never mixed into one segment; the Timeline labels each row's source (`clock`, `git`, `untimed`).

### 2.4 Session type header

The retro header gains `**Session kind**: root | subagent | unbound` and `**Binding**: <runtime>:<id> | unbound (<reason>)`. `**Duration**` is `active <N> min across <k> segments` from the clock, or `unknown`. No tilde.

### 2.5 Codex prompt stub

The installer's Codex stub (`src/cli/installer.ts:860-877`) stays as generated; it forwards `$ARGUMENTS` (`:871`). No installer change is required for the front door.

### 2.6 No vault → no `ψ` creation

If step 2 yields `vault: none`, the skill writes retro/learning/metrics under `<state-dir>/<task-id>/artifacts/` and reports `vault: none — artifacts kept in manifest state dir`. It never runs `mkdir -p "$ORACLE_ROOT/ψ"` in a repo that lacks `ψ`. This replaces `skills/rrr/SKILL.md:92-96` and `:156-160`.

---

## 3. Task-scoped manifest

### 3.1 Location and identity

- Path: `${XDG_STATE_HOME:-$HOME/.local/state}/rrr/<task-id>/manifest.json`, journal at `.../journal.ndjson`, artifacts at `.../artifacts/`, rescue at `.../rescue/`. Never `/tmp` (boot-stall incident, `CLAUDE.md` Golden Rules), never inside the vault, never inside the task repo's tracked tree.
- `task-id = <runtime>-<session_id>` (e.g. `claude-dc9db055-769c-4d0e-8a33-18330cc97cad`, `codex-01a08017-7356-7de2-8dbe-af80b844cf38`). Unbound sessions get `unbound-<utc-compact-ts>-<random8>`; an unbound manifest can never reach `finish-requested`.
- Repo fingerprint recorded, never used for lookup: `sha256(realpath(git rev-parse --git-common-dir) + "\n" + branch)[0:12]`.

### 3.2 Schema (v1)

```jsonc
{
  "schema_version": 1,
  "task_id": "claude-<uuid>",
  "revision": 7,                          // optimistic concurrency; every write requires --expect-revision
  "state": "open",                        // §3.3
  "created_at": "2026-09-08T10:14:03+00:00",
  "updated_at": "...",
  "runtime": { "name": "claude-code|codex", "version": "2.1.263", "session_kind": "root|subagent|unbound" },
  "binding": {                            // from rrr-bind.py, frozen at init; re-verified on every write
    "status": "bound|unbound",
    "session_id": "…", "record_path": "/abs/…jsonl", "record_sha256_head": "…first 64KiB…",
    "cwd": "/abs", "parent_session_id": null, "reason": null
  },
  "repos": [{                             // exactly one task lane in this release
    "role": "task",
    "root": "/abs/realpath", "git_common_dir": "/abs/realpath", "branch": "feat/…",
    "base_ref": "upstream/alpha", "base_sha": "68110ad…",
    "remotes": { "origin": "https://…", "upstream": "https://…" }
  }],
  "coverage": {                           // what evidence was actually swept — never a claim of totality
    "runtime_record": { "read": true, "records": 330, "malformed": 0, "compaction_markers": 0, "schema": "claude-v1|codex-v1|unknown" },
    "git": { "status": true, "log_since": "2026-09-08T00:00:00+07:00", "commits": 3 },
    "oracle_search": { "queries": ["…"], "hits": 2 },
    "gaps": ["compaction shape unknown", "…"]
  },
  "candidates": [{ /* §4.1 */ }],
  "learning_receipts": [{ /* §6.3 */ }],
  "lanes": {
    "task_repo": {
      "paths": [{ "path": "skills/rrr/SKILL.md", "sha256": "…", "kind": "file", "recorded_at": "…" }],
      "commit_message": "feat(rrr): …",
      "intent": null, "receipt": null
    },
    "vault": { "requested": false, "status": "not-implemented" }
  },
  "authority": null,                      // §7.1 — only ever written by a --finish invocation
  "cleanup": { "candidates": [ /* §9.1 */ ], "receipts": [ /* §9.4 */ ] },
  "artifacts": { "retro": "/abs", "learning": "/abs|null", "metrics": "/abs" }
}
```

### 3.3 Lifecycle states

```
open ──(bare/--light writes)──▶ closeout ──▶ cleaned | retained
open/closeout ──(--finish, root+bound only)──▶ finish-requested ──▶ finishing ──▶ finished | finish-blocked
any ──(operator)──▶ abandoned
```

Transitions are recorded as journal entries `{ts, from, to, by, revision}`. `finish-requested` is only reachable when `authority` is non-null and `binding.status == bound` and `runtime.session_kind == root`.

### 3.4 Optimistic concurrency, no-clobber, crash recovery

- Every write: read → validate schema → check `revision == --expect-revision` → write `manifest.json.tmp.<pid>.<random>` → `fsync` → `rename`. Mismatch → exit 4, no write, print current revision.
- Journal is append-only NDJSON; each line `{ts, kind: intent|receipt|state|note, id, payload}`; `fsync` after append.
- A leftover `manifest.json.tmp.*` is a crash marker: `--resume` reports it, verifies whether its content equals current or is newer by `revision`, and moves it to `rescue/` with a receipt. Never auto-applies.
- Two sessions with the same cwd have different `task-id`s, so they never share a manifest. A second process writing the *same* manifest is detected by revision mismatch.
- Artifact filenames are no-clobber: if `HH.MM_<slug>.md` exists, append `-2`, `-3`, …; never overwrite.

### 3.5 Provenance and knowledge classes stored per item

Every candidate, coverage entry, and lane path carries `provenance: { class, source_ref, recorded_at }` where `class ∈ {observed_tool_output, operator_statement, copied_prompt, inference, hypothesis, verified_fact}` (§4.3) and `source_ref` is `runtime:<record>#<uuid|turn_id>`, `git:<sha>`, `file:<path>:<line>`, or `none`.

---

## 4. Continuous capture — smallest safe state machine

### 4.1 Candidate record

```jsonc
{
  "id": "c-0007",                       // stable within the manifest
  "title": "rtk find ignores GNU -print",             // unique domain title, no leading '#'
  "statement": "…agent-authored, ≤ 600 chars…",
  "class": "hypothesis|verified_fact|session_only",   // §4.3
  "evidence": [{ "class": "observed_tool_output", "ref": "runtime:…#uuid", "excerpt": "exit 0 with empty output", "excerpt_kind": "error_string" }],
  "generalizable": true,
  "sensitivity": "none|contains-secret|contains-pii|unknown",
  "redaction": { "status": "pass|fail|not-run", "denylist_hits": 0 },
  "dedup": { "oracle_query": "…", "matches": ["learning_…"], "decision": "new|consolidate|supersede" },
  "state": "candidate",                 // §4.2
  "receipt_id": null,
  "superseded_by": null
}
```

### 4.2 State machine

| state | meaning | allowed next |
|---|---|---|
| `candidate` | captured, not evaluated | `hypothesis`, `verified`, `session-only`, `withheld` |
| `hypothesis` | causal claim without a disproving test or positive control | `verified`, `session-only`, `superseded` |
| `verified` | reproduced, or supported by ≥1 `observed_tool_output` or `operator_statement` evidence ref that a reader can open | `published`, `withheld`, `consolidated` |
| `published` | Oracle receipt accepted per §6.2 | `superseded` |
| `consolidated` | merged into another candidate or an existing learning (`dedup.decision`) | terminal |
| `session-only` | true but not generalizable, or `sensitivity != none` | terminal (kept in retro + manifest) |
| `withheld` | verified but blocked (redaction fail, permission unavailable, Oracle unreachable) | `published` on `--resume` |
| `superseded` | replaced; points to successor | terminal |

Rules: `hypothesis` is never published in this release. `verified` requires evidence a reader can open; an `inference` alone cannot verify. A candidate with `sensitivity != none` cannot leave `session-only`. Every candidate reaches a terminal or `published`/`withheld` state at closeout; the retro lists each with its state.

### 4.3 Knowledge classes (provenance)

| class | definition | may verify? | may publish text derived from it? |
|---|---|---|---|
| `observed_tool_output` | text returned by a tool call in the bound record (or in the current context, if the record is unbound) | yes | only through allowlisted excerpt kinds (§4.4) |
| `operator_statement` | a root user turn authored by M in the bound record | yes | paraphrase only; never quote verbatim into Oracle |
| `copied_prompt` | a user turn inside a subagent/sidechain record, or a delegated brief | no (it is an instruction, not evidence) | no |
| `inference` | agent reasoning consistent with evidence | no | only as `statement` with an evidence ref attached |
| `hypothesis` | inference about cause without a disproving test | no | no |
| `verified_fact` | statement plus ≥1 opening evidence ref | — | yes |
| `published_learning` | Oracle id with accepted receipt | — | — |
| `session_only` | local truth, not transferable | — | no |
| `superseded` | kept for history; successor named | — | — |

### 4.4 Redaction — allowlist composer plus denylist scan (`rrr-redact.py`)

Publishing composes text; it never forwards raw tool output. Allowed excerpt kinds and shapes:

| kind | allowed shape |
|---|---|
| `path` | absolute path under `$HOME/ghq/`, `$HOME/.local/state/rrr/`, `$HOME/.claude/`, `$HOME/.codex/`, or repo-relative path |
| `file_line` | `<path>:<n>[-<m>]` |
| `sha` | `[0-9a-f]{7,40}` |
| `exit_code` | integer |
| `tool_name` | `[A-Za-z_][A-Za-z0-9_.-]*` |
| `timestamp` | ISO-8601 |
| `error_string` | ≤200 chars, must pass the denylist |
| `version` | semver/calver token |

Denylist (any hit → `redaction.status = fail`, candidate → `session-only`): `AKIA[0-9A-Z]{16}`, `ghp_[A-Za-z0-9]{36}`, `github_pat_`, `sk-[A-Za-z0-9]{20,}`, `xox[baprs]-`, `Bearer\s+[A-Za-z0-9._-]{20,}`, `-----BEGIN [A-Z ]*PRIVATE KEY-----`, JWT shape `eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+`, `MS365_MCP_[A-Z_]+=`, `password\s*[:=]`, `token\s*[:=]\s*\S{12,}`, e-mail addresses other than the repo author fields, LINE tokens (`[A-Za-z0-9+/]{100,}={0,2}`), and any line that contains `Authorization:`. Negative ingestion tests (§12.5) feed each pattern and assert refusal.

### 4.5 Standing consent and runtime approval

- The manifest records `consent: { source: "invocation|instruction", text: "…", recorded_at }` only when the current user turn, or a standing instruction M has written, grants publish-without-per-item-confirmation. Consent is **absent** until M records it; the existing global text (`/home/aitma/.codex/AGENTS.md:18`) encourages capture but is not a consent record. The rule this record loosens is `rules/spawn-policy.md` ("Memory/Oracle writes → M must see before saving"); without a consent record, verified candidates stop at `withheld: consent` and the report lists them for M.
- Runtime tool approval is a separate gate the skill cannot waive. The plan documents the two surfaces M would configure once: Codex `[mcp_servers.arra-oracle-v2.tools.arra_learn] approval_mode = "approve"` (pattern at `/home/aitma/.codex/config.toml:76-113`), and a Claude `permissions.allow` entry `mcp__oracle-v2__arra_learn` in the settings file of the checkout where RRR runs (the only existing rule is in `/home/aitma/sda-script/.claude/settings.local.json`). Neither is changed by this work (§11.4). When approval is unavailable, candidates go to `withheld` with reason `permission`, and the report says so.

### 4.6 Capture while the skill is not loaded

- `rrr-manifest.py candidate add --title … --statement … --evidence …` is callable from any tool call once a manifest exists; `/rrr --light` initializes one. Any session that has loaded the skill can append candidates at the moment a gotcha is verified, without prompting M.
- A one-line startup instruction for both runtimes ("when a reusable gotcha is verified, append it with `rrr-manifest.py candidate add`; never publish from the instruction itself") is **deferred** to M's decision (§11.4). No hook, no `SessionStart` wiring, no edit to `~/.claude/CLAUDE.md` or `~/.codex/AGENTS.md` in this release.

---

## 5. Session binding and clock (`rrr-bind.py`)

### 5.1 Contract

```
SessionBinding {
  runtime: claude-code | codex | unknown
  status: bound | unbound
  session_id, record_path, cwd, session_kind: root | subagent, parent_session_id?, reason?
}
SessionClock {
  evidence: <runtime>-record | none
  segments: [{ start, end, minutes, events, beats: [HH:MM …] }]   // gap default 60 min
  active_minutes: sum(segments.minutes)
  records: n, malformed: n, without_timestamp: n
}
```

Exit 0 always for bind; `unbound` and `evidence: none` are valid answers. `--json` prints the two objects; `--gap`, `--beats`, `--tz` as today. Root overrides for tests and the doctor: `--home <dir>` (replaces `$HOME` for `~/.claude` and `~/.agents` lookups) and `--codex-home <dir>` (replaces `$CODEX_HOME`/`~/.codex`); the session id may be supplied as `--session-id <id>` (tests) and otherwise comes from the environment. `rrr-finish.py` accepts the same overrides and passes them through to its internal re-bind so §12.7/§12.8 can run against synthetic records.

### 5.2 Claude binding rule

1. `id = $CLAUDE_CODE_SESSION_ID` (verified present and equal to the record basename). Missing → `unbound: no runtime session id`.
2. Candidates = `glob(~/.claude/projects/*/<id>.jsonl)` plus `glob(~/.claude/projects/*/*/subagents/agent-*.jsonl)` only when `id` matches an agent file name. Exactly one file → continue; zero → `unbound: record not found`; more than one → `unbound: ambiguous record`.
3. Verify: the first record with `sessionId` equals `id`; a record `cwd` equals or is an ancestor/descendant of the task repo realpath; otherwise `unbound: identity mismatch` (never "pick the other one").
4. `session_kind`: any record with `isSidechain: true` in the head, or an `agent-*.jsonl` path → `subagent`; `parent_session_id` from the parent directory name. `CLAUDE_CODE_CHILD_SESSION` (set in this pane-launched root session [verified]) is **not** a subagent signal; it is recorded in `runtime` for the report only.
5. Never re-derive Claude's path encoding (`session-clock.py:35` is deleted with the script).

### 5.3 Codex binding rule

1. `id = $CODEX_THREAD_ID` else `$CODEX_SESSION_ID` [inference that they are exported; §12.10 proves it]. Missing → `unbound`.
2. Candidates = `glob($CODEX_HOME|~/.codex/sessions/*/*/*/rollout-*-<id>.jsonl)`. Exactly one → continue.
3. Verify: the `session_meta` record whose `payload.id == id` exists (not necessarily line 1, §1.9); its `payload.cwd` relates to the task repo; `session_kind = subagent` when `payload.source` is an object with `subagent`; `parent_session_id = source.subagent.thread_spawn.parent_thread_id`.
4. Record `cli_version` from that `session_meta` for the coverage block; compatibility claims bind to the executable actually used (learning `2026-09-04_gotcha-codex-rrr-…:21`).

### 5.4 Clock rule (both runtimes)

- Parse each line with `json.loads`; on failure count `malformed` and continue. Read only the **top-level** `timestamp`; never scan bodies. Accept `Z`, `±HH:MM`, with or without fractional seconds (`datetime.fromisoformat` after `Z→+00:00`; Python 3.12 handles fractional and offsets) [verified Python 3.12.3].
- Segments split on gaps > `--gap` minutes; `active_minutes = Σ segment minutes`; beats are distinct `HH:MM` per segment; never interpolate.
- Records without a top-level timestamp are counted, not guessed.
- Memory bound: stream line by line; do not load the file.

### 5.5 Unbound and unavailable behaviors (both runtimes)

| situation | behavior |
|---|---|
| compaction | Codex: `compacted`/`compaction` records are counted as `coverage.runtime_record.compaction_markers` and the Timeline inserts `— compaction boundary —`. Claude: shape unknown → detection is fixture-driven; when no fixture matches, report `gap: compaction shape unknown` and do not claim the timeline is complete. |
| resume | same `session_id` is reused by both runtimes (Claude `--resume <id>`, Codex `codex resume <id>`) [inference]; binding succeeds on the same record; the clock shows multiple segments. The plan does not claim a resumed session's earlier turns are the same "task". |
| simultaneous same-cwd sessions | binding by ID isolates them; manifests differ by `task-id`; the retro never merges another session's evidence. |
| nested agents | subagent bindings can capture candidates into the **parent's** manifest when `parent_session_id` resolves to an existing manifest, else into their own `subagent` manifest; they cannot finish. |
| delegated/copied prompts | user turns inside subagent records are `copied_prompt`; they never count as `operator_statement` and never satisfy the finish re-check. |
| schema drift | first 50 records must contain the expected keys (`sessionId`/`timestamp` or `session_meta`/`timestamp`); otherwise `coverage.runtime_record.schema = unknown`, clock `evidence: none`, and a gap is reported. |
| truncation | a malformed trailing line is counted; the clock still reports; the report lists `malformed: n`. |
| clocks/skew | runtime timestamps are UTC ISO; git times use `--date=format-local` under `TZ=Asia/Bangkok`; both are displayed GMT+7; rows are labeled by source and never merged into one interpolated sequence. |
| unbound | Timeline from git commit times, then ordered untimed bullets; `Duration: unknown`; `--finish` refused. |

---

## 6. Oracle receipt contract

### 6.1 Request shape (frozen before the call)

```
pattern        = "<title>\n\n<statement>\n\nEvidence:\n- <allowlisted refs…>"   // title is line 1, no leading '#'
concepts       = sorted unique tags (≤ 8)
source         = "rrr: <owner>/<repo> <task-id>"
project        = "<owner>/<repo>"                                                // explicit, always; never rely on cwd or source regex
idempotency_key= "<task-id>:<candidate-id>"
```

The frozen JSON is written to the candidate as `publish.payload_sha256` before the first call. Retries send byte-identical payloads (the fingerprint is over pattern/concepts/source/project/origin, `canonical.ts:69-78`).

### 6.2 Acceptance table

| response | accept? | action |
|---|---|---|
| `success: true`, `outcome ∈ {created, replayed, reconciled}`, `durability.level == "full"` | yes, pending readback | `arra_read({id})` must return `source: "file"`, `resolved_path` under `<vault realpath>/github.com/<owner>/<repo>/ψ/memory/learnings/`, and `project == github.com/<owner>/<repo>`; then `published` |
| readback returns `source: "fts_cache"` or `resolved_path: null` | no | state `withheld`, reason `no durable file`; record `id`; do not retry; report |
| readback file path outside the expected project scope or `project` differs | no | `withheld`, reason `misattributed`; report the actual project; never publish a second copy |
| `outcome: partial` (`durability.level == file`) | not yet | retry **once**, identical payload and key (`persistence.ts:186-188`); if still partial → `withheld`, reason `partial`, keep `id`/`file` |
| `outcome: degraded` | no | `withheld`, reason `degraded: <job status>`; operator requeue; no retry |
| `outcome: conflict` (idempotency key or projection) | no | `withheld`, reason `conflict`; **never** alter payload to retry; report both ids if present |
| transport timeout/abort | unknown | do not re-author; run `arra_read` by expected id (`learning_<utc-date>_<slug>_<fp12>`, computable client-side from `canonical.ts:97-105` only if the fingerprint is computed identically — otherwise search the unique title with `arra_search mode: fts`); if found → treat as `created`; else retry once identically |
| `isError` with schema/validation message | no | `withheld`, reason `request`; fix is a code bug, not a retry |

### 6.3 Receipt record

```jsonc
{ "candidate_id": "c-0007", "attempt": 1, "requested_at": "…", "payload_sha256": "…",
  "idempotency_key": "…", "outcome": "created", "id": "learning_…", "file": "github.com/…/ψ/memory/learnings/….md",
  "durability": "full", "indexing": { "status": "pending", "job_id": "…" },
  "readback": { "source": "file", "resolved_path": "/abs", "project": "github.com/…", "ok": true },
  "accepted": true }
```

### 6.4 Supersede and consolidate

- `dedup.decision = supersede` → after the new learning is accepted, call `arra_supersede(oldId, newId, reason)` and record a second receipt; on failure the new learning stays `published` and the retro notes the unlinked predecessor.
- `consolidate` → no new Oracle write; the candidate becomes `consolidated` with the existing id.
- Same-day same-topic fragmentation (prepare brief gotcha 16) is prevented by the dedup query being mandatory before any publish: `arra_search` by unique title fragment with `mode: fts`, and by `concepts`; zero hits do not prove absence (gotcha 14), so the query text and hit list are recorded.

### 6.5 Search visibility

`indexing.status: pending` is expected (`projection-finalize.ts:46-52`); FTS is available immediately (`:42-45`). The retro's learning table shows `index: pending|existing` and never claims vector searchability.

### 6.6 Reindex-retry behavioral test (keeps §1.6 inference honest)

Isolated test only — never against the live Oracle DB or vault:

1. In an oracle-v2 worktree (Terra-owned, §14), using the existing fixture at `src/learn/__tests__/fixture.ts`, call `persistAsyncLearning` once → expect `created`.
2. Run the indexer `storeDocuments` for that document (`src/indexer/storage.ts:16`) so `updated_at`/`indexed_at` change.
3. Call `persistAsyncLearning` again with the identical request.
4. Record the outcome. If `LearnConflictError` → the inference is **confirmed** and RRR's `--resume` must treat `conflict` after a known-accepted receipt as "already published" (receipt wins). If `replayed` → the inference is **disproved** and the acceptance table row for `conflict` keeps its current meaning.

The result is written into `references/capture-contract.md` as a dated finding either way.

---

## 7. Privilege boundary and the finish executor (`rrr-finish.py`)

### 7.1 Authority record (written only by a `--finish` invocation)

```jsonc
"authority": {
  "invocation_text": "/rrr --finish",             // the literal current user turn token set
  "runtime_session_id": "…",                      // must equal binding.session_id
  "granted_at": "…",
  "scope": { "repo_root": "/abs", "remote": "origin", "remote_url": "https://…", "branch": "feat/…",
             "base_remote": "upstream", "base_ref": "alpha", "pr": null, "lanes": ["task_repo"],
             "expected_actor": "mangsriso" },      // recorded at request time from `gh api user -q .login`; the executor passes this value, never re-derives it
  "consent_for_pr_create": false
}
```

### 7.2 Mechanical re-check inside the executor (fail closed)

`rrr-finish.py --manifest <path> [--preview] [--pr]` refuses (exit 3, nothing executed) unless **all** hold:

1. Manifest validates, `state ∈ {closeout, finish-requested}`, `runtime.session_kind == root`, `binding.status == bound`.
2. `authority.runtime_session_id == $CLAUDE_CODE_SESSION_ID` or `$CODEX_THREAD_ID/$CODEX_SESSION_ID` of the executor's own environment.
3. The bound runtime record is re-read now and the **latest root user turn** is classified. The classifier anchors on the *raw command text*, never on any record that merely contains the token: Claude — the turn's `<command-name>` equals `rrr` and its `<command-args>` contains `--finish`; a match is rejected when the same content also carries the skill body (frontmatter `name: rrr`, the mode table, or `SKILL.md` prose), because a loaded skill expands into the user turn and the new `SKILL.md` itself contains the string `/rrr --finish`. Codex — the last user-message record whose text is a `$rrr …` mention with `--finish` in its argument text, with the same skill-body rejection. An older turn does not count. If the record cannot be read, or the last turn cannot be classified as `bare`, `finish`, or `other`, the executor refuses. Both record shapes are [inference] until §12.10 captures one real bare `/rrr` record and one `/rrr --finish` record per runtime and the classifier separates them; that capture is a slice-1 acceptance item (tier A, bounded budget) because without it fail-closed makes `--finish` either unusable or unsafe. A copied prompt inside a subagent record can never satisfy this step because subagent sessions are refused at step 1.
4. `authority.scope.repo_root == realpath(git rev-parse --show-toplevel)` of cwd, `branch` equals `git rev-parse --abbrev-ref HEAD`, and `branch ∉ {main, master, alpha, beta}`.
5. `git remote get-url <remote>` equals `remote_url`.
6. No Git operation in progress (`.git/MERGE_HEAD`, `rebase-merge`, `rebase-apply`, `CHERRY_PICK_HEAD` absent).

### 7.3 Execution lanes (each with intent → action → receipt in the journal)

**Allowlist derivation (`lanes.task_repo.paths[]`)** — built by the skill during bare closeout, never by the executor: (a) paths written by this session's own tool calls in the bound record (Claude `Write`/`Edit`/`NotebookEdit` `file_path` inputs; Codex `apply_patch`/file-write tool inputs) that resolve inside `repo_root`; ∩ (b) paths reported by `git status --porcelain` (modified, added, untracked, renamed) at closeout; ∪ (c) paths added explicitly with `rrr-manifest.py lane add-path` in the current invocation. Pre-existing dirty paths that are not in (a) or (c) are excluded and listed in the report as `left untouched`. Generated files that `bun run compile`/lefthook regenerate (`.claude-plugin/marketplace.json`, `README.md`) qualify under (b) only when the skill ran the generator this session and records that command in the journal. Each entry stores `sha256` at capture; the executor re-hashes before staging.

1. **Stage**: for each `lanes.task_repo.paths[]`: refuse if the path is a symlink, resolves outside `repo_root`, or its sha256 differs from the recorded one (content changed after capture → re-run bare closeout first). `git add -- <path>` per path. Never `git add -A`, never `ψ/`.
2. **Commit**: `git commit -m "<message>"` where `<message>` is exactly `lanes.task_repo.commit_message` as composed by the skill during closeout (including any runtime-appropriate attribution trailer); the executor never composes or edits it; record SHA. If nothing is staged → receipt `noop` and continue.
3. **Push**: `git push <remote> <branch>:<branch>`; never `--force*` (the safety hook blocks it anyway, `/home/aitma/ghq/github.com/mangsriso/wednesday-oracle/hooks/safety-check.sh:129-130`). A non-fast-forward rejection is a stop, recorded verbatim; no retry with a different remote, token, or flag.
4. **PR** (only with `--pr` and `consent_for_pr_create: true`): `gh pr create --base <base_ref> --head <branch> --repo <base_owner/repo>`; record the PR number into `authority.scope.pr`. For this repo the base must be `alpha` (`CLAUDE.md` "Branch Strategy").
5. **Merge** (only when `authority.scope.pr` is set): run `remote_action_preflight.py --repo <base owner/repo> --remote <base_remote> --git-dir <repo_root> --expected-actor <authority.scope.expected_actor> --pr <n> --expected-base <base_ref> --expected-base-head <live base sha> --expected-head <pushed sha> --merge-method merge --require-workflow .github/workflows/ci.yml@pull_request --json`. Exit 0 → one `gh pr merge <n> --repo … --match-head-commit <sha> --merge`; then `gh pr view --json state,mergeCommit` must show `MERGED`. Exit 2/3 → stop with the helper's reasons verbatim. Zero-run, pending, or missing checks are stops by construction (`remote_action_preflight.py:606-608`, `:663-668`).
6. **Postcondition**: `git fetch <base_remote> <base_ref>` and record the new base tip; `finished` only when every intended lane has a receipt, else `finish-blocked` with the first stop reason.

`--preview` evaluates every §7.2 check (printing `PASS` / `WOULD-REFUSE: <reason>`), prints steps 1–6 as commands with the live values substituted, executes nothing, and exits 0 even when a check would refuse. `--resume <m> --finish` re-runs §7.2 fully against the new invocation before touching any lane.

### 7.4 What finish never does

No `git push --force*`, no `git reset --hard`, no `--amend`, no remote-ref deletion, no direct push to `main/alpha/beta`, no actor/token/target substitution after a refusal, no vault staging, no deployment, no touching `~/.claude` or `~/.codex`.

---

## 8. Oracle vault lane

- **Decision**: `--finish` defaults to the task repo only. Retro and learning files land in the vault repository (`oracle-vault`, §1.8) and are **not** committed or pushed by `--finish` in this release.
- **Why**: the vault is a separate Git repository reached through a symlink; staging through the symlink from the task repo is the incident class in the retirement learning (`…overengineering-and-retirement-gotchas.md:199-201`); the vault is currently dirty with unrelated session state, so any vault commit must be exact-path staging inside the vault checkout with its own remote/ref binding.
- **How it is requested**: `--vault` sets `lanes.vault.requested = true` and records the intended exact paths (the retro, learning, metrics files written this run). In this release the executor reports `vault lane: not implemented; files are on disk at <paths>; commit them from the vault checkout when M requests it`.
- **Binding contract for the future lane** (documented in `references/finish-contract.md`, not executed): authority scope must name `vault` explicitly, with `repo_root = realpath(vault checkout)`, `remote = origin`, `remote_url = https://github.com/mangsriso/oracle-vault`, `branch = main`; staging is exact paths only; the unrelated dirty files are never touched; push is a separate receipt; no merge step exists for the vault.
- **Deferred**: vault commit/push execution; multi-lane finish; any automatic fast-forward of a dirty vault checkout.

---

## 9. Cleanup contract (`rrr-cleanup.py`)

Only resource kinds with a complete proof recipe are eligible. Everything else is `retained` with a reason. Every action is a rescue move into `<state-dir>/<task-id>/rescue/<kind>/…` with a receipt; nothing is unlinked. Two-phase: journal `intent` → act → journal `receipt`; on `--resume`, an intent without a receipt is re-verified from scratch.

### 9.1 Cleanup candidate record

```jsonc
{ "id": "k-0003", "kind": "file|dir|worktree|branch|process|pane|manifest",
  "target": "/abs/realpath", "creator": { "task_id": "…", "recorded_at": "…", "by": "tool:Write|bash|git worktree add|…" },
  "identity": { "dev": 64769, "ino": 1234567, "sha256": "…" | "head_sha": "…" | "pid": 4242, "starttime": "…", "cwd": "/abs" | "pane_id": "wS:p2" },
  "postcondition": "absent|moved|removed-clean", "retention": "rescue-30d", "state": "candidate|eligible|rescued|retained|blocked", "reason": null }
```

### 9.2 Eligibility per kind

| kind | creator receipt required | identity re-check at cleanup | quiescence | action | postcondition |
|---|---|---|---|---|---|
| regular file | manifest entry written at creation by this task (`rrr-manifest.py cleanup add` immediately after the tool call that created it) | same `dev/ino` **and** same sha256 as recorded; not a symlink; realpath under `$HOME/.local/state/rrr/`, the task repo's untracked set, or a recorded scratch dir | no process has it open (`/proc/*/fd` scan by realpath) | `rename` into rescue dir (same device) or copy+verify+remove when cross-device | path absent; rescue file sha256 equals recorded |
| directory | every descendant is itself an eligible file candidate of this task; no unowned descendants | descendant census equals the recorded census | no process `cwd` inside (`/proc/*/cwd`) | move whole dir to rescue | path absent |
| Git worktree | created by this task (`git worktree add` intent + receipt in journal) | `git worktree list --porcelain` entry path == target; `HEAD` == recorded tip or an ancestor of an integrated ref | `git -C <wt> status --porcelain --ignored` empty **or** every ignored/untracked path is an eligible file candidate (rescued first); `git merge-base --is-ancestor <tip> <base_remote>/<base_ref>` true; no `/proc/*/cwd` inside | `git worktree remove <path>` **without** `--force` | worktree absent from `git worktree list`; branch untouched |
| local branch | created by this task (intent + receipt) | `git rev-parse <branch>` == recorded tip | tip integrated into `<base_remote>/<base_ref>` (`merge-base --is-ancestor`) | `git branch -d <branch>` (never `-D`) | branch absent; reflog retained |
| process | spawned by this task with recorded `pid`, `/proc/<pid>/stat` starttime, and `cwd` at spawn | `/proc/<pid>/stat` starttime equals recorded; `cmdline` equals recorded; `pgrep -f` is **never** used (self-match, learning `2026-08-30_rrr-publishing-and-cleanup-gotchas.md:15`) | none required | `SIGTERM`, wait ≤10 s, then `SIGKILL` only if still same starttime | pid absent or starttime differs |
| Herdr/tmux pane | created by this task (pane id recorded at creation) | pane exists and its recorded creation marker matches | its process tree matches recorded pids | close pane via the tool that created it | pane absent |
| manifest dir | all other candidates are `rescued`/`retained` with receipts; `state ∈ {cleaned, finished, retained}` | — | — | copy `manifest.json` + `journal.ndjson` into `rescue/` first, then mark `cleaned`; the state dir is kept (30-day retention, then operator decision) | manifest state `cleaned` |
| remote ref | never eligible | — | — | — | — |

Generic globs, mtime windows, name matching, and "files created during my session" are refused at input validation (learning `2026-09-01_gotcha-cleanup-by-timewindow-hits-other-sessions.md:44-49`).

### 9.3 Interruption

Each action writes `intent` before touching anything and `receipt` after verifying the postcondition. If the process dies between them, `--resume` finds the dangling intent, re-runs the eligibility proof, and either completes (writing the receipt) or marks `blocked: identity changed since intent`. A half-moved directory is detected by census mismatch and left for the operator with both paths reported.

### 9.4 Receipt record

```jsonc
{ "candidate_id": "k-0003", "kind": "file", "action": "rescue-move", "from": "/abs", "to": "/abs/rescue/file/…",
  "verified": { "identity_match": true, "quiescent": true, "postcondition": true }, "ts": "…" }
```

### 9.5 Report

`rescued` (with recovery paths), `retained` (with reason: unproven creator, identity changed, in use, unintegrated tip, unowned descendant), `blocked` (missing evidence or authority), and `untouched pre-existing state` (explicitly listed when a candidate was proposed and rejected).

---

## 10. Files — new, changed, removed, and why

### 10.1 Canonical worktree (`skills/rrr/`)

| path | change | why it exists |
|---|---|---|
| `SKILL.md` | rewrite (target ≤ 220 lines; compile warns at 500, `scripts/compile.ts:73-76`) | the front door: mode table, phases, rules, announce block; links out for detail (progressive disclosure) |
| `TEMPLATE.md` | rewrite | evidence-pointer retro: every claim has `ref` or `none`; no word floors, no mandatory wrong decision, `0..N` friction/decisions; headings fixed once so tests and template agree; header gains Binding/Session kind; Duration = active minutes or unknown; metrics table columns fixed to the `SKILL.md:271` set `when | session | done | stuck | win | friction | error` (the fixture's `date/session-slug/duration/wins/friction/next` header is retired) |
| `HOSTS.md` | rewrite | binding + clock contract for Claude and Codex, applicable to **all** modes; failure behaviors; no "only for --bg" scope |
| `references/manifest-schema.md` | new | §3 schema, states, CAS, journal, crash recovery — Terra and future readers need one normative text |
| `references/capture-contract.md` | new | §4 state machine, knowledge classes, redaction allowlist/denylist, §6 receipt table, §6.6 finding slot |
| `references/finish-contract.md` | new | §7 authority record, re-check, lanes, gates, §8 vault lane contract |
| `references/cleanup-contract.md` | new | §9 eligibility table and receipts |
| `scripts/rrr-bind.py` | new (+x) | replaces `session-clock.py`; binding by runtime ID; JSON-parsed clock; `doctor` subcommand that lists every installed `rrr` copy under `~/.claude/skills`, `~/.codex/skills`, `~/.agents/skills`, `~/.codex/prompts` with marker/version (used by §12.9 and §15) |
| `scripts/rrr-manifest.py` | new (+x) | `init`, `show`, `candidate add|set`, `lane add-path`, `cleanup add`, `intent`, `receipt`, `state`, `resume-check`; CAS via `--expect-revision`; exit 4 on conflict |
| `scripts/rrr-redact.py` | new (+x) | compose + scan; exit 0 pass / 3 fail with hit kinds (never the matched secret) |
| `scripts/rrr-cleanup.py` | new (+x) | per-kind proof and rescue; `--dry-run` |
| `scripts/rrr-finish.py` | new (+x) | privileged executor; `--preview`; `--pr` |
| `scripts/session-clock.py` | `git rm` | superseded; history retained; the contract test fails if any file still references it |

All scripts: `python3` ≥ 3.11 stdlib only (`datetime.fromisoformat` offset and fractional-second handling is verified on 3.12.3 here and documented from 3.11; each script asserts the version at startup and exits 2 with a clear message below it), `#!/usr/bin/env python3`, committed mode 100755 (`scripts/check_skill_scripts_exec.sh` gate).

### 10.2 Tests (`__tests__/`)

| path | change | why |
|---|---|---|
| `rrr-contract.test.ts` | rewrite | cross-file invariants (§12.1) instead of string presence |
| `rrr-runtime/` (new dir) | new | bun tests that spawn the Python scripts against fixtures: `bind.test.ts`, `clock.test.ts`, `manifest.test.ts`, `redact.test.ts`, `cleanup.test.ts`, `finish-preview.test.ts`, `git-topology.test.ts`, `install-parity.test.ts`, `stale-duplicates.test.ts` |
| `rrr-runtime/fixtures/claude/*.jsonl`, `…/codex/*.jsonl` | new | synthetic transcripts covering §12.2/§12.3 cases; **no real transcript content** is committed (keys only, synthetic text) |
| `rrr-evals/conftest.py`, `test_quant_rrr.py`, `test_anti_rationalization_rrr.py`, `test_consistency_rrr.py`, `README.md` | rewrite | headings match TEMPLATE; floors replaced by evidence-pointer checks; `test_no_task_tool_used` becomes "no Agent/Task tool in any mode"; README states the suite is optional (pytest not in CI) |
| `rrr-evals/fixtures/ψ/…` | rewrite | fixture regenerated from the new template so it cannot mask drift; second fixture `sample-unbound` (no vault, no clock) |
| `scripts/eval_rrr.py` | rewrite | `--self-test` (was fixture-only) prints `SELF-TEST` not `PASS [register]`; live mode requires `RRR_EVAL_LIVE=1`, a runtime (`--runtime claude|codex`), a budget, and asserts artifacts + manifest exist |

### 10.3 Repository metadata

- `.claude-plugin/marketplace.json`: regenerated by `bun run compile` (description text changes) — commit with the skill change (lefthook `regen-manifest`, `lefthook.yml`).
- `README.md` table: regenerated by `scripts/update-readme-table.ts` via lefthook `update-table`.
- No change to `src/cli/installer.ts`, `src/cli/agents.ts`, `src/profiles.ts` (rrr is already in minimal/standard, `src/profiles.ts:30-32`, `:52-62`).

### 10.4 Wednesday override repo (`/home/aitma/ghq/github.com/mangsriso/wednesday-oracle`)

| path | change | why |
|---|---|---|
| `skills/overrides/rrr/` → `skills/overrides/.retired/rrr/` | `git mv` + `skills/overrides/.retired/README.md` (3 lines: date, reason, restore command) | `deploy.sh:14` and `:153` glob `overrides/*/`, so a dot-dir is skipped without editing `deploy.sh`; the override's Step 8 push-to-main (`skills/overrides/rrr/SKILL.md:229-235`) stops being deployable; history retained; restore = `git mv` back |
| `CLAUDE.md`, `~/.codex/AGENTS.md` | **no change** | the thin capture instruction is deferred to M (§11.4) |

Work happens in a separate isolated worktree of wednesday-oracle (§14). Locally installed copies are never edited as source.

---

## 11. P0, slices, dependencies, non-goals

### 11.1 P0 stop-ship (before any rollout)

- **P0-1** Installed Claude `rrr` performs `git push origin main` (`/home/aitma/.claude/skills/rrr/SKILL.md:229-235`). Until it is replaced, any fresh Claude session that runs `/rrr` in a repo with a `ψ` symlink may push. Correction = §10.4 retirement + §15.1 rescue-then-install. Installing into the live `~/.claude/skills` is deployment state and requires M's current-session instruction to the Codex lead; this plan authorizes nothing.
- **P0-2** Canonical `SKILL.md` self-contradiction (§1.1) — fixed in slice 1 before anything else lands.
- **P0-3** `ψ` auto-creation in non-Oracle repos (§1.8, §2.6) — fixed in slice 1.

### 11.2 Slices

| slice | content | done when |
|---|---|---|
| **1 — canonical core (implement now)** | §10.1 SKILL/TEMPLATE/HOSTS rewrite; `rrr-bind.py`; `rrr-manifest.py`; `rrr-redact.py`; `rrr-cleanup.py` (file, dir, worktree, branch, process kinds); `rrr-finish.py` with `--preview` and full lane logic; references/*.md; `git rm session-clock.py`; tests §12.1–§12.8, §12.11; the §12.10 real-turn fixture capture (bare vs finish, both runtimes); eval rewrite; compile + README regen | `bun run compile` clean; `bun run test` green including new suites; `bash scripts/check_skill_scripts_exec.sh` and `check_skill_convention.sh` pass; local Git topology test exercises commit + push + preflight offline stop against local bare remotes; the §7.2 classifier separates the captured real bare/finish turns in both runtimes |
| **2 — Wednesday retirement + install verification** | §10.4 `git mv` in a wednesday-oracle worktree; `rrr-bind.py doctor` output captured for the three installed roots; §15.1 rescue procedure documented and dry-run | local commit in the wednesday worktree with SHA reported; doctor JSON attached to the ledger |
| **3 — deferred (needs M)** | live install into `~/.claude/skills` and `~/.codex/skills`; fresh-process discovery on live roots (§12.9 tier B); Codex `arra_learn` approve entry; Claude allow entry; thin startup capture line; `.agents/skills/rrr` retirement; vault lane executor; live GitHub PR/merge E2E; §6.6 oracle-v2 behavioral test | each item has its own scoped instruction from M |

Dependencies: slice 2 depends on slice 1 tests passing; slice 3 items are independent of each other and each needs authority.

### 11.3 Ordering inside slice 1 (Terra)

1. `references/*.md` (contracts first, so scripts and prose cite one text).
2. `rrr-manifest.py` + `manifest.test.ts`.
3. `rrr-bind.py` + fixtures + `bind.test.ts`, `clock.test.ts`.
4. `rrr-redact.py` + `redact.test.ts`.
5. `rrr-cleanup.py` + `cleanup.test.ts`.
6. `rrr-finish.py` + `finish-preview.test.ts` + `git-topology.test.ts`.
7. `SKILL.md`, `TEMPLATE.md`, `HOSTS.md` + `rrr-contract.test.ts`.
8. eval rewrite + fixtures.
9. `install-parity.test.ts`, `stale-duplicates.test.ts`.
10. `bun run compile`, README regen, full test run.

### 11.4 Non-goals (explicit)

Global dispatchers, daemons, automatic worktree managers, cross-task claim ledgers, multi-repo transactional rollback, broad cleanup engines, any `SessionStart`/`UserPromptSubmit` hook, edits to `~/.claude/CLAUDE.md`/`~/.codex/AGENTS.md`/`settings.json`/`config.toml`, installer semantics changes, vault push execution, remote-ref deletion, `.agents` root removal, live pushes or merges from this branch in this session.

---

## 12. Tests

Runner: `bun test __tests__/` (already `bun run test`). Python scripts are exercised by spawning `python3` from bun tests; fixtures are files. Each test names the defect it guards.

### 12.1 Cross-file invariants (`rrr-contract.test.ts`)

- The mode table in `SKILL.md`, the `argument-hint` frontmatter, the Rules block, `HOSTS.md` scope line, and `TEMPLATE.md` header all agree on: flag set `{--light, --preview, --finish, --pr, --vault, --resume}`, "bare never mutates Git", "no background agents".
- No occurrence of `~X`, `~HH:MM`, `--fg`, `--bg`, `--combo`, `--deep`, `--dig`, `--teammate`, `session-clock.py`, `.claude/projects`, `ls -t`, `head -1`, `mtime` in `skills/rrr/**`.
- `TEMPLATE.md` headings equal the `REQUIRED_SECTIONS` list in `rrr-evals/test_quant_rrr.py` byte-for-byte (guards §1.3 drift).
- The metrics table header in `SKILL.md`, `TEMPLATE.md`, and `rrr-evals/fixtures/ψ/memory/learnings/session-metrics.md` is byte-identical: `| when | session | done | stuck | win | friction | error |` (guards §1.1 column drift).
- `SKILL.md` line count ≤ 300 (progressive disclosure holds).
- Every `references/*.md` file linked from `SKILL.md` exists.
- No `mkdir` of `ψ` anywhere in `skills/rrr/**` (guards §2.6).
- `TEMPLATE.md` contains no "at least N words", "exactly three", or "made wrong" text (guards §1.4).

### 12.2 Claude adapter fixtures (`bind.test.ts`, `clock.test.ts`)

Synthetic JSONL fixtures: root session; root session with `CLAUDE_CODE_CHILD_SESSION` set (must stay `root`); sidechain record; subagent file under `subagents/`; malformed trailing line; record without timestamp; tool-result body containing `"timestamp":"…"` (must not count — guards `session-clock.py:47-49`); timestamps `Z`, `+07:00`, with/without ms; two-segment gap; cwd mismatch; duplicate session id in two project dirs (→ ambiguous → unbound); `CLAUDE_CODE_SESSION_ID` unset (→ unbound). Assertions on `SessionBinding` and `SessionClock` JSON, including `active_minutes = Σ segments`.

### 12.3 Codex adapter fixtures

Rollout with `session_meta` as line 1; rollout where the file's own `session_meta` is line 2 (subagent shape, §1.9); `source.subagent` → `session_kind: subagent` + parent id; `compacted`/`compaction` records counted; `turn_context` cwd mismatch; `CODEX_THREAD_ID` unset; filename UUID ≠ payload id (→ unbound).

### 12.4 Manifest (`manifest.test.ts`)

Init → revision 1; write with wrong `--expect-revision` → exit 4, file unchanged; concurrent writers (two processes, 50 iterations) → exactly one winner per revision; crash simulation (`.tmp` left) → `resume-check` reports and rescues; unbound manifest cannot enter `finish-requested`; subagent manifest cannot enter `finish-requested`; artifact no-clobber suffixing.

### 12.5 Redaction (`redact.test.ts`)

Positive: allowlisted shapes pass. Negative ingestion: one fixture per denylist pattern in §4.4 embedded in an `error_string`, a `path`, and a free `statement` → exit 3, output names the kind only, never echoes the secret. Length cap on `error_string`. Leading `#` in title rejected.

### 12.6 Cleanup (`cleanup.test.ts`)

Per kind in a temp tree: eligible file (same dev/ino/sha) → rescued with receipt; file with changed content → retained; file held open by a child process → retained; directory with one unowned descendant → retained; worktree with clean status and integrated tip → removed without `--force`; worktree with unintegrated tip → retained; worktree with a process cwd inside → retained; branch with tip == recorded and integrated → deleted with `-d`; process with matching starttime → terminated; process whose pid was reused (different starttime) → refused; glob/mtime input → rejected at validation; interrupted intent without receipt → re-verified on resume.

### 12.7 Finish preview and executor (`finish-preview.test.ts`)

Refusals (real mode): no authority; authority session id ≠ env; latest root user turn lacks `--finish` (older turn has it); latest turn is a bare `/rrr` whose expanded skill body contains `/rrr --finish` (must classify as `bare`); subagent binding; branch is `alpha`; remote URL mismatch; allowlisted path is a symlink; path sha changed since capture; Git op in progress. Preview mode on each of those fixtures prints `WOULD-REFUSE: <reason>`, exits 0, and makes no change (`git status` before == after). `--resume <m> --finish` on a `finish-blocked` manifest re-evaluates §7.2 and proceeds only when the new invocation passes.

### 12.8 Local Git topology (`git-topology.test.ts`)

Create bare `upstream.git` and bare `origin.git` (fork) in a temp dir; clone `origin`, add `upstream` remote; create branch `alpha` in both; create a topic branch with allowlisted changes; run `rrr-finish.py` with a fake Herdr-free environment where `$CLAUDE_CODE_SESSION_ID` points at a synthetic bound transcript whose last root user turn is `/rrr --finish`: assert commit SHA recorded, push receipt shows `origin/<topic>` at that SHA, `upstream` untouched, and the merge step reports `no PR bound`. With `--pr` and `gh` absent → PR lane stops with `gh missing`, no exception. Merge preflight via `--evidence-file` offline replay → exit 3 `offline_evidence_non_authoritative` (`remote_action_preflight.py:981-986`) → `finish-blocked` recorded. Nothing contacts the network.

### 12.9 Installer parity and stale duplicates

- `install-parity.test.ts`: install `rrr` into two fixture agents (`claude-code`-shaped with `commandsOptIn`, `codex`-shaped with prompts dir) using `makeInstallFixture`; assert both `SKILL.md` bodies are identical after stripping the injected frontmatter lines (`installer.ts:688-718`), all `scripts/*.py` copied with mode `0o755`, `references/*.md` copied, and the Codex prompt stub references `<skillsPath>/rrr/SKILL.md` and `$ARGUMENTS`.
- `stale-duplicates.test.ts`: `rrr-bind.py doctor --home <fixture>` with three roots holding different markers → JSON lists each with `installer`, `version`, `has_finish_executor`, and `flags` (`push origin main` detected by text) → exit 3 when generations differ. Real-machine run (lead) is expected to report the three generations in §1.5.
- Fresh-process discovery, **tier A (lead-runnable, no live-root change)** proves that the *new content* loads in a fresh process; it is **not** a front-door precedence test: Claude `--plugin-dir` skills are namespaced (`<plugin>:rrr`) and Codex `-C <tempdir>` still sees the stale `~/.codex/skills/rrr`, so the Codex tier-A copy is installed under a unique temporary skill name (e.g. `rrr-t<utc-compact>`) to avoid the collision. Only tier B tests `/rrr` and `$rrr` precedence. Claude — stage a plugin dir `{.claude-plugin/plugin.json, skills/rrr/…}` and run `claude -p --plugin-dir <dir> --no-session-persistence --max-budget-usd 0.25 --permission-mode plan "Load the rrr skill and print, verbatim, its argument-hint and the first line of scripts/rrr-bind.py; do not run anything"` (budget per learning `…retirement-gotchas.md:95-97`; not `--bare`, `:92-94`). Codex — `codex exec -C <tempdir-with-.agents/skills/rrr> --skip-git-repo-check --ephemeral -s read-only "…same prompt…"`; if repo-local `.agents/skills` is not discovered [inference], the result is recorded as `tier A codex: not discoverable from project root` and tier B is required. **Tier B (needs M)**: install to live roots and repeat without `--plugin-dir`; assert the printed `installer:` line is the new version in both runtimes; for Codex also confirm which root wins while `~/.agents/skills/rrr` still exists.

### 12.10 Behavioral invocation

**Slice-1 acceptance (tier A, bounded budget):** in each runtime capture one real bare `/rrr`/`$rrr` turn and one `/rrr --finish`/`$rrr --finish` turn from a scratch session that has the new skill loaded, redact them to keys plus command text, commit them as `__tests__/rrr-runtime/fixtures/<runtime>/turn-bare.jsonl` and `turn-finish.jsonl`, and assert the §7.2 classifier returns `bare` and `finish` respectively (and `other` for an unrelated turn). Also in each runtime (tier A harness above): invoke `… --preview` and assert the journal shows `rrr-finish.py --preview` was executed with `--preview`; invoke with `--finish --light` and assert refusal text and no journal intent; in Codex confirm the flag text reached the skill through `$rrr --preview` (skill mention) and through `/prompts:rrr --preview` (stub) — argument passing for skill mentions is [unavailable] until this runs.

### 12.11 Eval

`scripts/eval_rrr.py --self-test` must print `SELF-TEST` and exit 0 only when the fixture ψ passes the pytest suite (when pytest is present) or the bun template check (when it is not); it must never print `PASS [register]`. Live mode (`RRR_EVAL_LIVE=1 --runtime claude --budget-usd 1.00`) is slice 3.

### 12.12 Concurrency and replay

Covered by §12.4 (manifest CAS) and §12.6 (interrupted intent). Oracle replay: unit-level with a stub `arra_learn` returning each outcome row of §6.2 in sequence, asserting state transitions and that no second payload variant is ever produced (payload sha equality across attempts).

---

## 13. Lead-runnable E2E vs future authorized

| E2E | runnable now by the lead | requires future authority |
|---|---|---|
| `bun run compile && bun run test` in this worktree | yes | — |
| Local Git topology (§12.8) with bare remotes | yes | — |
| `rrr-bind.py --json` inside a live Claude session and a live Codex session (prints binding for the current session; read-only) | yes | — |
| `rrr-bind.py doctor` on this machine (read-only census of installed copies) | yes | — |
| `rrr-finish.py --preview` in this worktree against a manifest built from this branch's changed paths | yes (prints commands, changes nothing) | — |
| Fresh-process discovery tier A (`--plugin-dir`, `codex exec -C tempdir`) — content load only, not precedence | yes (spends a bounded API budget; no live-root change) | — |
| §12.10 real bare/finish turn capture for the §7.2 classifier | yes (scratch sessions, bounded budget, records redacted to keys + command text) | — |
| Fresh-process discovery tier B (live `~/.claude/skills`, `~/.codex/skills`) | no | M: install authority (deployment state) |
| Any `git push`, PR creation, merge from this branch | no | M: push/PR/merge authority; none in this session |
| Oracle publish of real candidates from this session | no (write tool approval + consent) | M: permission surfaces (§4.5) |
| §6.6 reindex-retry control | no | M: oracle-v2 worktree scope |

---

## 14. Implementation ownership (Terra)

| area | allowed paths (canonical worktree unless noted) | order | generated files | acceptance command |
|---|---|---|---|---|
| contracts | `skills/rrr/references/{manifest-schema,capture-contract,finish-contract,cleanup-contract}.md` | 1 | — | `bash scripts/check_skill_convention.sh` |
| manifest | `skills/rrr/scripts/rrr-manifest.py`, `__tests__/rrr-runtime/manifest.test.ts` | 2 | — | `bun test __tests__/rrr-runtime/manifest.test.ts` |
| binding + clock | `skills/rrr/scripts/rrr-bind.py`, `__tests__/rrr-runtime/{bind,clock}.test.ts`, `__tests__/rrr-runtime/fixtures/{claude,codex}/*.jsonl` | 3 | — | `bun test __tests__/rrr-runtime/bind.test.ts __tests__/rrr-runtime/clock.test.ts` |
| redaction | `skills/rrr/scripts/rrr-redact.py`, `__tests__/rrr-runtime/redact.test.ts` | 4 | — | `bun test __tests__/rrr-runtime/redact.test.ts` |
| cleanup | `skills/rrr/scripts/rrr-cleanup.py`, `__tests__/rrr-runtime/cleanup.test.ts` | 5 | — | `bun test __tests__/rrr-runtime/cleanup.test.ts` |
| finish | `skills/rrr/scripts/rrr-finish.py`, `__tests__/rrr-runtime/{finish-preview,git-topology}.test.ts` | 6 | — | `bun test __tests__/rrr-runtime/finish-preview.test.ts __tests__/rrr-runtime/git-topology.test.ts` |
| skill prose | `skills/rrr/{SKILL,TEMPLATE,HOSTS}.md`, `git rm skills/rrr/scripts/session-clock.py`, `__tests__/rrr-contract.test.ts` | 7 | `.claude-plugin/marketplace.json`, `README.md` (via `bun run compile`, `bun scripts/update-readme-table.ts`) | `bun run compile && bun test __tests__/rrr-contract.test.ts && git diff --exit-code .claude-plugin/marketplace.json` |
| eval | `scripts/eval_rrr.py`, `__tests__/rrr-evals/**` | 8 | — | `python3 scripts/eval_rrr.py --self-test` |
| installer parity + doctor | `__tests__/rrr-runtime/{install-parity,stale-duplicates}.test.ts` | 9 | — | `bun test __tests__/rrr-runtime/install-parity.test.ts __tests__/rrr-runtime/stale-duplicates.test.ts` |
| full gate | — | 10 | — | `bun run compile && bun run test && bash scripts/check_skill_scripts_exec.sh && bash scripts/check_skill_convention.sh` |
| Wednesday retirement | separate worktree of `/home/aitma/ghq/github.com/mangsriso/wednesday-oracle` from fresh `origin/main`: `skills/overrides/.retired/rrr/**`, `skills/overrides/.retired/README.md` | slice 2 | — | `git -C <wt> status --porcelain` shows only the rename + README; `bash -n deploy.sh`; `grep -c 'overrides/\*/' deploy.sh` = 2 (unchanged) |
| oracle-v2 control (§6.6) | separate worktree of `/home/aitma/ghq/github.com/Soul-Brews-Studio/oracle-v2`: one test file under `src/learn/__tests__/` | slice 3 (needs M) | — | `bun test src/learn/__tests__/<file>` |

Terra constraints: no edits outside the listed paths; no installs into `~/.claude` or `~/.codex`; no changes to `src/cli/**`; local commits on `feat/rrr-cross-runtime-20260908` are allowed with SHA reported only if M's current-session instruction to the Codex lead grants it; no push. Every script gets `chmod +x` before `git add` (`CLAUDE.md` "Script Permissions").

---

## 15. Rollback, install verification, override retirement

### 15.1 Install procedure (slice 3, M-gated) that never overwrites unreconciled overrides

1. `python3 skills/rrr/scripts/rrr-bind.py doctor --json` → for each root whose `SKILL.md` marker is **not** `installer: arra-oracle-skills-cli` (today: `~/.claude/skills/rrr` with `oracle-skills-cli v3-custom`, `~/.agents/skills/rrr` with `oracle-skills-cli v2.0.10`), copy the whole directory to `~/.local/state/rrr/rescue/installed/<root-slug>-<utc-ts>/` and write `RECEIPT.json` (sha256 per file). The installer would otherwise `rmrf` it (`installer.ts:671-673`).
2. Only then: `bun run src/cli/index.ts install -y -g --skill rrr` from this worktree (installs to detected `claude-code` and `codex`, `src/cli/agents.ts:205`).
3. Verify: markers show `arra-oracle-skills-cli v26.8.23-alpha.2112` (current `package.json` version) in both roots; `scripts/*.py` present and executable; `~/.codex/prompts/rrr.md` regenerated; `doctor` exit 0 or a report naming `~/.agents/skills/rrr` as the remaining stale root (left in place, §11.4).
4. Fresh-process discovery tier B (§12.9).

### 15.2 Rollback

- Installed copies: restore from the rescue directory (`cp -r` back; receipts verify sha256) or reinstall from an `upstream/alpha` checkout at `68110ad…`.
- Canonical: revert the branch merge (a normal revert commit; no force).
- Wednesday: `git mv skills/overrides/.retired/rrr skills/overrides/rrr` and `deploy.sh --overrides-only` re-applies the old override — this path is documented but is the *unsafe* state and should only be used if the new skill breaks closeout entirely.
- Manifests and rescue directories are never deleted by rollback.

### 15.3 Retiring the unsafe Wednesday override recoverably

`git mv skills/overrides/rrr skills/overrides/.retired/rrr` in a wednesday-oracle worktree, plus `.retired/README.md`. Because `deploy.sh` iterates `overrides/*/` (`:14`, `:153`) and `nullglob` is on (`:9`), the dot-directory is skipped by both the full deploy and `--overrides-only`; no `deploy.sh` edit is needed, which keeps the change to one rename. History is intact; restoring is one `git mv`. The retirement commit lands only under M's authority for that repo; nothing in this plan pushes it.

---

## 16. Completeness matrix

### 16.1 User outcomes

| # | outcome | plan sections | tests | status in this release |
|---|---|---|---|---|
| 1 | one front door `/rrr` and `$rrr` | §2, §2.5, §10.1 | §12.1, §12.9 parity, §12.10 | full (argument passing for Codex skill mentions proven by §12.10) |
| 2 | capture all evidence-backed learnings at closeout without invented completeness | §2.1, §3.2 coverage, §4, §5.5 gaps, §2.2 gaps line | §12.2, §12.3, §12.5, §12.12 | full |
| 3 | on explicit finish: commit + push exact task-owned changes; merge only if exact live gates pass | §7, §7.3 allowlist derivation, §12.8 | §12.7, §12.8, §12.10 classifier capture; live merge deferred (§13) | full for commit/push/preview and fail-closed merge once the §12.10 classifier fixtures pass; live merge E2E deferred (no authority this session) |
| 4 | clean only proven task-owned artifacts | §9 | §12.6 | full for file/dir/worktree/branch/process/pane/manifest; remote refs never |
| 5 | capture verified reusable gotchas during the session without per-item prompting | §4.5, §4.6, §11.4 | §12.4 candidate add; §12.5 | **partial**: works while the skill is loaded (`--light`, `candidate add`); the startup instruction and runtime approval surfaces are deferred to M |
| 6 | equivalent behavior and safety contract across Claude Code and Codex; adapters may differ | §2, §5.2 vs §5.3, §7.2, §10.1 single source | §12.2 + §12.3 symmetric fixtures, §12.9 parity, §12.10 | full for the contract; runtime env export for Codex proven by §12.10 |

### 16.2 Verified defects and constraints

| defect / constraint (from the task brief) | resolved in | evidence | test |
|---|---|---|---|
| installed Claude RRR pushes `origin main` without target binding | §11.1 P0-1, §15.3, §7 | `~/.claude/skills/rrr/SKILL.md:229-235`; `deploy.sh:151-166` | §12.9 doctor detects `push origin main` text; §12.7 refusals |
| three divergent installed generations; Codex duplicate roots; precedence unproven | §1.5, §15.1, §12.9 | markers cited in §1.5; binary strings | §12.9 stale-duplicates; tier B discovery (deferred) |
| canonical default/`--fg`/HOSTS/template/tests contradict | §1.1, §2, §10.1 | `SKILL.md:20,38,297`; `HOSTS.md:3-4`; `TEMPLATE.md:11`; `test_quant_rrr.py:24-32` | §12.1 |
| session selection by newest mtime; Codex copy reads Claude storage | §5.2, §5.3 | `session-clock.py:33-38`; `~/.codex/skills/rrr/SKILL.md:66-74` | §12.2 ambiguous/unbound cases; §12.3 |
| clock uses spans, substring scanning, fails on schema/timestamp variants | §5.4 | `session-clock.py:30,47-49,71,94-96` | §12.2 embedded-timestamp fixture, offset variants, active minutes |
| static tests false-green; eval stubbed; single fixture masks drift | §1.3, §10.2, §12.1, §12.11 | `rrr-contract.test.ts:11-117`; `eval_rrr.py:38-51,82-88`; `conftest.py:59-67` | §12.1 heading equality; §12.11 |
| fixed word counts, mandatory wrong decision, exactly three frictions | §1.4, §10.1 TEMPLATE, §10.2 evals (tests are changed because the *requirement* was wrong, not to match code) | `TEMPLATE.md:48,50-51,67-68,95`; `test_quant_rrr.py:96-115` | §12.1 forbidden-text check |
| Oracle fingerprints/idempotency/no-replace/sync FTS/async vector/receipt outcomes; `fts_cache` readback; explicit project required | §6 | `persistence.ts:18-31,186-188`; `canonical.ts:69-78,97-105`; `read.ts:131-166`; `project.ts:35-42`; `storage.ts:27` | §12.12 stubbed outcomes; readback assertions |
| retry after reindex may conflict (inference) | §1.6, §6.6 | `projection.ts:32-43`; `indexer/storage.ts:56-79` | §6.6 control (deferred, oracle-v2 worktree) |
| Codex does not pre-approve `arra_learn`; Claude allow rule exists in one checkout; skill cannot waive approval | §0 correction 2, §4.5, §11.4 | `config.toml:73-113`; `sda-script/.claude/settings.local.json` | `withheld: permission` path in §12.12 |
| only executable remote helper is read-only and merge-specific; push/stage/cleanup gates are prose | §7.3 (executor adds stage/commit/push receipts; merge delegates to the helper), §9 | `remote_action_preflight.py:2,17,981-986`; `remote-action-gates.md:36` | §12.7, §12.8 |
| RRR writes into a second Git lane; staging through a symlink is unsafe | §8, §7.3 step 1 symlink refusal, §2.6 | `readlink -f` topology; `oracle-vault` status; `SKILL.md:92-96,159` | §12.7 symlink refusal; §12.1 no-`mkdir ψ` |
| cleanup needs type-specific creator/identity receipts and quiescence; globs/mtime/process-name insufficient | §9 | learnings `2026-09-01_…:44-49`, `2026-08-30_…:15` | §12.6 |
| out of scope: transactions, dispatchers, worktree managers, daemons, claim ledgers, broad cleanup | §11.4 | retirement learning `:19-41` | — |
| continuous capture cannot be guaranteed by a closeout-only skill; no global hook in first release | §0 correction 1, §4.6, §11.4 | prepare brief `:31` | §16.1 row 5 marked partial |
| one command surface with least privilege; `--finish` hands off through a typed boundary and re-checks current authority; transcript/memory/plan/manifest never grant it | §2, §7.1, §7.2 | `CLAUDE.md` Principle 3; `AGENTS.md:29-36` | §12.7 (older-turn and copied-prompt refusals) |

### 16.3 Plan-quality checklist (self-audit)

- Premise verdict and target architecture: §0, §0.1.
- Command contract incl. unsupported combinations: §2.
- Typed manifest with version, identity, coverage, provenance, receipts, lanes, authority, cleanup, lifecycle, CAS, crash recovery, no-clobber: §3.
- Capture state machine and knowledge classes, allowlist redaction, negative ingestion tests: §4, §12.5.
- Session binding by runtime IDs with unbound/unavailable behaviors: §5.
- Oracle receipt table, readback, frozen payload, partial/degraded/conflict, supersede, reindex test: §6.
- Privilege boundary and executor: §7.
- Vault lane decision: §8.
- Type-specific cleanup: §9.
- Files and why: §10.
- P0, slices, dependencies, non-goals: §11.
- Tests: §12. Lead-runnable vs future-authorized: §13.
- Ownership table: §14. Rollback and override retirement: §15.
- Completeness matrix: §16.

PLAN: READY
