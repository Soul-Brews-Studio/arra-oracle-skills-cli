# RRR cross-runtime E2E evidence — 2026-09-08

This report records isolated fresh-process checks for the reduced safe RRR slice. It is
not evidence of live-root installation, duplicate-name precedence, or remote finish.

## Isolation

- Canonical source: `skills/rrr/**` in the task worktree.
- Scratch namespace: `rrr-e2e-a91d`; no literal installed `rrr` was invoked.
- Claude: temporary plugin + `CLAUDE_CONFIG_DIR`, persisted scratch sessions, Haiku 4.5,
  low effort, permission prompts disabled, bounded budget.
- Codex: project-local `.agents/skills/rrr-e2e-a91d` + temporary `CODEX_HOME`, persisted
  scratch sessions, Codex CLI 0.153.2, `gpt-5.6-luna`, low effort, read-only sandbox.
- Authentication files were referenced by owner-private temporary symlinks; no secret
  value was copied, printed, or committed.

## Results

| Runtime/path | Discovery | Argument evidence | Safe execution | Result |
|---|---|---|---|---|
| Claude namespaced `/rrr-e2e-a91d:rrr --preview` | returned scratch-only marker | persisted record contained `<command-name>/rrr-e2e-a91d:rrr</command-name>` and `<command-args>--preview</command-args>` | executed the scratch binder only | `status=bound`, root session |
| Claude invalid `--finish --light` | loaded the namespaced skill | both flags present in invocation | ran no helper and wrote no RRR state | refused invalid combination |
| Codex `$rrr-e2e-a91d --preview` | returned scratch-only marker | persisted user turn contained the literal skill mention and flag | executed the scratch binder only | `status=bound`, root session, CLI 0.153.2 |
| Codex `/prompts:rrr-e2e-a91d --preview` | fresh process resolved and read the unique project skill | literal alias and flag reached the turn | executed the scratch binder only | `status=bound`; isolated installer fixture separately proves generated stub `$ARGUMENTS` forwarding |
| Codex invalid `--finish --light` | loaded the unique project skill | both flags present in invocation | ran no helper and wrote no RRR state | refused invalid combination |

Claude API cost exposed by the four bounded probes was USD 0.0845863 total. Codex exposed
token usage but no cost in these runs.

## E2E-discovered gotcha and correction

A Claude CLI launched from a Codex-controlled shell inherits the parent's `CODEX_THREAD_ID`
and `CODEX_SESSION_ID` while setting its own `CLAUDE_CODE_SESSION_ID`, `CLAUDECODE`, and
`CLAUDE_CODE_ENTRYPOINT`. Treating both ID families as automatically ambiguous made the
first Claude binder probe safely return `unbound`. The binder now uses Claude's own runtime
marker to select the current Claude ID over inherited Codex correlation IDs; a regression
fixture covers this nested-launch shape. Repeating the fresh Claude probe then returned
`status=bound` for the exact isolated session record.

## Still pending

- Literal production `/rrr` and `$rrr` loader precedence across existing duplicate roots.
- Installation into live Claude/Codex roots.
- Always-on capture policy, Oracle writes, vault Git, state-changing finish/cleanup, and
  live GitHub remote-action E2E.
