# Runtime binding

`rrr-bind.py` accepts active identity only from runtime environment IDs. Claude records
must structurally match `sessionId`; Codex records must match both rollout filename UUID
and the matching `session_meta.payload.id`. Codex never reads Claude storage.

Nested CLI launches can inherit both runtimes' IDs. When Claude's own `CLAUDECODE` or
`CLAUDE_CODE_ENTRYPOINT` marker accompanies `CLAUDE_CODE_SESSION_ID`, that current Claude
identity wins over inherited `CODEX_*` correlation IDs. With both ID families and no
current-runtime marker, binding remains ambiguous and fails closed.

Top-level JSON timestamps are parsed with ISO offsets and fractional seconds; strings in
message bodies are ignored. The binding reports root/child, resumed, compacted, truncated,
malformed, and ambiguity evidence when present. It returns `unbound` or `unavailable`
rather than guessing by cwd, basename, mtime, or newest file.

The stable transcript identity is metadata-record identity, not a hash of a growing
prefix. A child/sidechain may capture only its own manifest; parent import needs explicit
review. A bound transcript is correlation evidence only, never authority and never current
authority.

Fresh-runtime fixtures validate content discovery, argument transport, binding, and safe
execution separately. Live-root discovery is runtime evidence and must be rechecked
after installation; duplicate-root precedence remains pending unless the current run
proves which installed copy was selected.

Git preview removes repository-local `GIT_*` variables before honoring its explicit
`git -C <repo>` target. This is required when RRR is called from a Git hook: inherited
`GIT_DIR`, `GIT_WORK_TREE`, or `GIT_INDEX_FILE` otherwise override the requested repo.

The executable adapter currently requires Python 3.11+ on a POSIX host (`fcntl` supplies
the manifest lock). Missing Python or POSIX locking degrades to context-only inline
reflection with binding/capture marked unavailable; it never falls back to another
runtime's files or an unlocked manifest.
