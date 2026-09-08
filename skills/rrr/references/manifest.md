# Local task manifest contract

State lives under `${XDG_STATE_HOME:-~/.local/state}/rrr/`, with directories `0700` and
files `0600`. A random task nonce, not session ID alone, names a task. Child captures get
separate manifests and require explicit parent review to import.

The versioned manifest embeds a bounded journal. Mutation holds a per-manifest lock across
load, schema validation, expected revision comparison, mutation, file fsync, atomic
same-directory `os.replace`, and directory fsync. Creation is exclusive/no-clobber; stale
temporary files are never committed state.

Normative fields include consent; canonical Oracle project/storage; the complete frozen
Oracle request, fingerprint, and idempotency key; receipt; blocked reason; evidence
provenance; coverage; lifecycle; candidate captures; cleanup preview candidates; and a
bounded embedded journal. `rrr-manifest.py` validates the schema before and after every
mutation and uses expected revisions as compare-and-swap tokens.

Capture lifecycle is `observed → candidate → verified → published → superseded`.
`hypothesis`, `session-only`, and `withheld` are explicit non-forced outcomes with only
the legal transitions enforced by the helper. Supported local operations are
`candidate-add`, `candidate-transition`, `oracle-freeze`, `oracle-receipt`,
`cleanup-candidate`, `vault-request`, and `import-child-reviewed`. The last operation
requires an explicit review marker and imports only a same-session child manifest.

There is no external action journal or side-effect crash replay in this slice. Files
matching `.manifest.write.*` or `.manifest.new.*` are incomplete temporary evidence,
never committed state and never selected as a manifest.
