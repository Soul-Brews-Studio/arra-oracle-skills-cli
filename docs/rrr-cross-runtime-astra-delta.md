# Astra verification delta — authoritative implementation contract

This document records the Codex lead's accepted synthesis of the independent Astra
review of `docs/rrr-cross-runtime-plan.md`. Where the two documents conflict, this
delta is authoritative for the implement-now slice.

The original plan remains the comprehensive design record. This delta deliberately
reduces the first implementation to safety foundations and read-only previews. It does
not claim that remote finish, broad cleanup, live installation, or always-on capture are
complete.

## Verdict

The redesign premise is sound, but the original executable finish and cleanup contracts
were not safe enough to implement. In particular, transcript correlation is not an
authority source, path ownership is not hunk ownership, there is no executable push
identity/policy gate, the proposed manifest update was not atomic CAS, and the cleanup
recipes overstated their race guarantees.

## Implement now

### 1. Portable RRR contract

- Preserve one user-facing front door: Claude `/rrr`, Codex `$rrr`, and the generated
  Codex prompt alias.
- Bare invocation, `--light`, and `--preview` perform no Git or remote mutation.
- `--preview` is wholly non-mutating: no Oracle publish, no manifest/artifact write, no
  staging, no cleanup action.
- `--finish` runs the same read-only preflight and reports
  `finish blocked: no validated push gate`; it must not commit, push, create a PR, merge,
  or clean. This keeps the grammar stable without exposing an unsafe executor.
- `--vault` records or reports a second-lane request only when a writable manifest already
  exists. It never stages through a `ψ` symlink or mutates the vault Git repository.
- Remove fixed word floors, mandatory wrong decisions, and fixed friction counts. Every
  claim must cite evidence or say that evidence was unavailable.
- When there is no Oracle/vault, provide a useful inline retrospective and owner-private
  task manifest; never create `ψ` inside the current repository as a fallback.
- Describe timing as `observed span excluding gaps greater than N minutes`, not active
  work. Make the threshold explicit and label the result as a proxy.

### 2. Runtime binding

Implement `skills/rrr/scripts/rrr-bind.py` with importable pure parsing functions and a
production CLI that:

- accepts the active identity only from `CLAUDE_CODE_SESSION_ID`,
  `CODEX_THREAD_ID`, or `CODEX_SESSION_ID`;
- validates the selected file structurally against that ID and runtime record shape;
- never selects by mtime and never lets the Codex adapter read Claude storage;
- parses top-level JSON timestamps, never substring matches inside message bodies;
- identifies root, sidechain/subagent, resumed, compacted, truncated, and ambiguous
  evidence when the runtime exposes those facts;
- returns `unbound` or `unavailable` rather than guessing;
- records stable transcript identity from the bound session metadata record, not a hash
  of a growing prefix;
- has no production `--session-id`, `--transcript`, or synthetic-home override that a
  finish path could treat as authority. Unit tests import the parser and pass fixtures
  directly.

Transcript binding is correlation evidence and an accidental-replay guard only. The skill
must say explicitly that current authority is assessed by the active lead from M's direct
current-session instruction; neither transcript text, manifest content, memory, plan, nor
skill prose grants authority. Because this slice has no state-changing finish executor,
the unresolved authenticated-current-turn problem remains fail-closed.

### 3. Task manifest

Implement `skills/rrr/scripts/rrr-manifest.py` with a versioned schema and these reduced
semantics:

- owner-private state root `${XDG_STATE_HOME:-~/.local/state}/rrr/`, directories `0700`,
  files `0600`;
- one random task nonce inside a session; session ID alone is not task identity;
- child/subagent captures use separate manifests and can only be imported by an explicit
  parent review operation;
- a per-manifest lock covers load, validation, expected-revision check, mutation, and
  durable replace;
- atomic same-directory temporary file, file `fsync`, `os.replace`, and directory
  `fsync` before releasing the lock;
- use an embedded bounded journal in the manifest for this no-external-actions slice so
  there is no two-file commit-order ambiguity;
- exclusive no-clobber creation for manifests and artifacts;
- normative schema includes consent state, the entire frozen Oracle request, receipt,
  blocked reason, evidence provenance, coverage state, and cleanup preview candidates;
- legal capture states are `observed -> candidate -> verified -> published`, with
  `hypothesis`, `session-only`, `withheld`, and `superseded` as explicit non-forced
  outcomes. Closeout may contain unresolved hypotheses and unavailable coverage.

Do not implement an external action journal or crash replay of side effects in this slice,
because no side effects are enabled.

### 4. Redaction and capture

Implement `skills/rrr/scripts/rrr-redact.py` as a strict outward-artifact composer:

- build output from a field allowlist; never copy raw tool output or full environment;
- apply classification to titles, patterns, concepts/tags, source, project, evidence
  references, error summaries, retro text, manifest destinations, and Oracle payloads;
- reject secret-shaped and credential-bearing content without echoing the matched value;
- remove any generic email exception;
- hypotheses and copied/delegated prompts never auto-publish;
- direct operator statements remain attributed statements, not automatically universal
  facts;
- immediate no-question capture works only while RRR is loaded or explicitly invoked as
  `--light`; always-on startup policy and runtime approval configuration remain deferred.

### 5. Oracle receipt contract in skill/reference prose

- Require an explicit canonical project binding and separately record the actual storage
  root returned by Oracle. Unknown project/storage stays local and withheld.
- Persist the entire frozen request plus its idempotency key, request fingerprint, and
  receipt; never retain only a client hash.
- Accept `created`, `replayed`, or `reconciled` only with `success:true`,
  `durability.level:full`, a file-backed `arra_read` result, matching canonical project
  and storage path, and content whose hash equals the receipt content hash.
- A title search can locate candidates but can never establish successful publication.
- On an unknown transport outcome, retry the identical frozen request/key at most once.
  If still unresolved, retain `withheld/unknown`; never manufacture an ID from local time.
- Preserve `partial`, `degraded`, and `conflict` honestly. Do not replay an already
  accepted receipt.
- `arra_supersede` is a separate write operation with separate current approval; document
  it but do not execute it automatically.
- Keep reindex-then-replay tagged as unverified. Correct the factual wording: reindex
  preserves document `updated_at` but changes `indexed_at`; the behavioral control is
  deferred to an oracle-v2 task.
- Skill text cannot waive Codex or Claude tool approval. If approval is unavailable,
  capture the candidate locally and report `withheld: runtime approval unavailable`
  without repeatedly prompting M.

### 6. Finish and cleanup preview

Implement read-only preview logic, either as one small helper or separate
`rrr-finish.py` and `rrr-cleanup.py` helpers, with no execute path in this slice.

Finish preview reports at least:

- baseline HEAD and current HEAD;
- detached state; positive task-branch binding; linked-worktree Git paths resolved via
  `git rev-parse --git-path`;
- initial/current index state and overlap with pre-existing changes;
- literal pathspecs, symlink components, deletes, renames, and mode changes;
- hook capability and the requirement to verify a future commit parent/tree after hooks;
- fetch and push URLs, fork/upstream distinction, current remote ref, missing transport
  identity/policy gate, and the immutable SHA a future push would require;
- `WOULD-REFUSE` for every unknown or failed requirement.

Cleanup preview is limited to proven task-created regular files under owner-private
scratch state. Eligibility preview requires canonical path with no symlink component,
creator receipt, device/inode, content hash, `nlink == 1`, same-device durable rescue
destination, no-clobber target, and known quiescence. Unknown platform or unreadable
process/open-file evidence means retain. No cleanup action runs in this slice.

Explicitly defer directories with arbitrary descendants, cross-device removal, Git
worktree/branch deletion, PID termination, pane closure, manifest cleanup, remote refs,
and claims of universal race freedom. Durable rescue never has automatic expiry.

## Tests required now

Add behavioral tests under `__tests__/rrr-runtime/` and correct existing tests:

1. Cross-file contract and template equality; target unsafe executable patterns rather
   than banning documentation of words such as `mtime`.
2. Claude and Codex binding fixtures: exact ID, ambiguous same-cwd sessions, copied prompt,
   root vs child, compacted/truncated records, embedded timestamp, offsets/no millis,
   filename/payload mismatch, absent runtime ID, and Codex multi-`session_meta` ordering.
3. Manifest locking with concurrent processes, wrong expected revision, task nonce,
   child isolation, owner-only modes, exclusive creation, and recovery from a stale temp
   file without treating it as committed state.
4. Redaction negatives across every outward field, including secret-shaped content,
   hypotheses, copied/delegated prompts, and error messages; outputs may name only the
   rejection class.
5. Oracle receipt fixtures for every outcome, same-title/different-content, unknown
   timeout followed by one identical retry, file versus `fts_cache`, project/storage
   mismatch, and separate supersede permission.
6. Finish and cleanup preview fixtures: dirty baseline, pre-staged user change, mixed
   task/user hunks, deletes/renames/modes, detached HEAD, linked worktree operation paths,
   push URL mismatch, fork/upstream, hardlink/symlink ancestry, unknown quiescence, and
   proof that preview leaves Git and filesystem state unchanged.
7. Installer parity must exercise literal Claude and Codex agent keys, filesystem and
   compiled/VFS delivery, prompt stub argument forwarding, and helper presence. Add an
   RRR-specific tracked executable-mode assertion for Python helpers; the current global
   script checks only `.ts` and `.sh`.
8. Rewrite `scripts/eval_rrr.py` so no path can print synthetic success. Its self-test
   must execute real fixture validation using available project tooling and fail when a
   template-conforming artifact violates the contract.
9. Fresh-runtime E2E must separate content discovery, argument transport, binding, and
   execution. Use isolated persisted scratch homes/sessions and a unique scratch skill
   name; never invoke literal installed `/rrr` or `$rrr` during tier-A tests. Record that
   production duplicate precedence and live installation remain pending.

Required commands:

```bash
bun run compile
bun test __tests__/rrr-contract.test.ts __tests__/rrr-runtime/
python3 scripts/eval_rrr.py --self-test
bun run test
git diff --check
```

Regenerate marketplace metadata, then run compile a second time and require no further
generated diff. Do not compare the expected newly generated file to the old base.

## Wednesday override retirement

Use the separate clean worktree:

`/home/aitma/.herdr/worktrees/wednesday-oracle/rrr-override-retire-20260908`

Allowed changes are only a recoverable move of `skills/overrides/rrr/**` to
`skills/overrides/.retired/rrr/**` and a focused `skills/overrides/.retired/README.md`.
Do not change `deploy.sh`, install anything, or push. Verify that both existing
`overrides/*/` loops skip the dot directory and that the old unsafe text is absent from
the active glob.

## Deferred and blocked

- state-changing local commit executor;
- push/PR/merge execution until an independent push destination, transport identity,
  live policy, immutable-SHA, response-loss, and postcondition gate exists;
- broad cleanup or process/pane/worktree/branch actions;
- Oracle vault Git execution;
- live runtime installation and settings changes;
- literal production duplicate-loader precedence;
- always-on startup capture policy;
- automatic supersede;
- oracle-v2 reindex behavioral control;
- real GitHub remote-action E2E.

These items must be labelled `blocked` or `deferred`, never `full`.

## Terra ownership

Canonical worktree allowed paths:

- `docs/rrr-cross-runtime-plan.md` (read only)
- `docs/rrr-cross-runtime-astra-delta.md` (read only)
- `skills/rrr/**`
- `__tests__/rrr-contract.test.ts`
- `__tests__/rrr-evals/**`
- `__tests__/rrr-runtime/**`
- `scripts/eval_rrr.py`
- expected generated `.claude-plugin/marketplace.json`
- `README.md` only if the documented compile/update workflow deterministically changes
  the generated skill table; otherwise leave it unchanged.

Wednesday worktree allowed paths:

- `skills/overrides/rrr/**`
- `skills/overrides/.retired/rrr/**`
- `skills/overrides/.retired/README.md`

Terra may run tests and modify only those paths. It may not stage, commit, push, install,
edit runtime settings, mutate Oracle, or perform cleanup outside test-owned temporary
directories. Report exact files, commands, pass/fail counts, and remaining blockers.

## Completion labels

Use these independently: `implemented locally`, `fixture-verified`,
`runtime-verified`, `blocked`, and `deferred`. Passing fixtures never upgrades a live
remote or installed-runtime outcome.

ASTRA DELTA: READY FOR REDUCED IMPLEMENTATION
