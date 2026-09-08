---
name: rrr
description: Evidence-backed session retrospective and local capture with safe cross-runtime previews. Use when user says rrr, retrospective, or session review.
---

# /rrr

One front door: Claude `/rrr`; Codex `$rrr` (and `/prompts:rrr` as the generated
compatibility alias). Resolve `<RRR_SKILL_DIR>` to the directory containing this
loaded `SKILL.md`; helper commands below are relative to that directory, never to
the user's current repository. Read [HOSTS.md](HOSTS.md), [TEMPLATE.md](TEMPLATE.md),
and only the reference needed for the current phase.

Invocation grammar: `[--light | --preview | --finish | --vault | --resume <manifest>]`.

## Safety contract

- Bare, `--light`, and `--preview` do not mutate Git or a remote. `--preview` is
  wholly non-mutating: no manifest/artifact, Oracle, staging, or cleanup write.
- `--finish` performs read-only preflight only and reports `finish blocked: no
  validated push gate`. It never commits, pushes, creates a PR, merges, or cleans.
- Never create `ψ` in the repository. If Oracle/vault is unavailable, provide the
  inline retrospective and use only an owner-private manifest.
- Transcript correlation is an accidental-replay guard, never authority. Current
  authority is assessed by the active lead from M's direct current-session instruction;
  transcript, manifest, memory, plan, and this prose grant none.
- No fixed word count, mandatory mistake, or friction quota. Each claim has an evidence
  pointer or says evidence is unavailable.
- Helpers require Python 3.11+ and POSIX file locking. If either is unavailable, produce
  the inline context-only retrospective, do not create a manifest or simulate helper
  output, and label binding/capture/preview `unavailable on this host`.

## Route

1. Parse literal flags. Refuse invalid combinations without effects: `--finish --light`,
   `--finish --vault`, and `--resume` with flags other than `--preview`/`--finish`.
2. Bind only from `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`, or `CODEX_SESSION_ID`:
   `python3 <RRR_SKILL_DIR>/scripts/rrr-bind.py`. `unbound`/`unavailable` is a useful
   result, never a reason to search newest files or another runtime's storage.
3. For bare or `--light`, initialize one task manifest when none was supplied:
   `python3 <RRR_SKILL_DIR>/scripts/rrr-manifest.py init <bound-session-id>` (add
   `--child` for a sidechain/subagent). If binding is unavailable, use an explicit
   local task label such as `unbound-<date>` and keep coverage unavailable.
4. Reconcile the current conversation, exact task Git status, verified command/test
   output, and existing manifest candidates. Coverage is a matrix: list gaps instead of
   claiming every event was recovered. Never mine a different session to fill a gap.
5. Compose an inline retrospective from allowlisted evidence. Describe time as
   `observed span excluding gaps greater than 30 minutes (proxy)`, or unavailable.
6. For `--preview`, do not initialize or mutate a manifest. Run only
   `python3 <RRR_SKILL_DIR>/scripts/rrr-finish.py --preview ...`; report every refusal.
7. For `--finish`, run that same read-only preview and state the fixed blocked result.
   State-changing commit, push, PR, merge, and cleanup remain deferred.

## Immediate gotcha capture

While RRR is loaded, record a reusable gotcha or learning as soon as evidence verifies
it; local capture needs no per-item question because it is owner-private and has no
external side effect. Use the current manifest revision:

```text
python3 <RRR_SKILL_DIR>/scripts/rrr-manifest.py mutate <manifest> <revision> candidate-add \
  '{"id":"<stable-local-id>","state":"candidate","title":"...","evidence":["..."]}'
```

Use `hypothesis` when not verified, `session-only` for non-generalizable material, and
do not put sensitive content into an outward retrospective. Child captures stay in the
child manifest until the parent performs `import-child-reviewed`. At closeout account
for every candidate as verified, hypothesis, session-only, withheld, published, or
superseded; do not force a terminal conclusion. Always-on startup capture is deferred,
so “complete” means complete for the evidence sources listed, never omniscient.

`--vault` may record a second-lane request only in an already writable manifest using
the `vault-request` local operation. It never stages via a `ψ` symlink and reports
`vault lane: not implemented in this release`.

## Oracle publication

Read [references/oracle-receipts.md](references/oracle-receipts.md). Runtime approval
cannot be waived. With unavailable approval, retain a local candidate and report
`withheld: runtime approval unavailable`; do not repeatedly prompt. Supersede is a
separate approved write and is never automatic. Validate returned evidence locally with
`python3 <RRR_SKILL_DIR>/scripts/rrr-receipt.py` through its importable `validate`
function; the helper itself makes no Oracle call.

## Preview scope

Read [references/manifest.md](references/manifest.md) and
[references/finish-cleanup-preview.md](references/finish-cleanup-preview.md). Cleanup
is preview-only and only considers proven task-created regular scratch files. Directory,
worktree, branch, PID/pane, remote-ref, and manifest removal are deferred.

## Coverage labels

Use independently: `implemented locally`, `fixture-verified`, `runtime-verified`,
`blocked`, and `deferred`. Treat live installation and duplicate-loader precedence as
run-specific evidence, not a permanent source claim: label each `runtime-verified` only
after a literal fresh-process check of the current installed copies, otherwise
`deferred`. Always-on capture, Oracle-v2 reindex control, vault Git, all finish
execution, and real GitHub E2E remain deferred or blocked.
