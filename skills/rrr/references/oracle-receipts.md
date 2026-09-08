# Oracle receipt contract

Bind canonical project explicitly and record Oracle's actual storage root. Unknown
project/storage is local and withheld. Persist the complete frozen request, idempotency
key, request fingerprint, and receipt.

Accept `created`, `replayed`, or `reconciled` only when `success:true`,
`durability.level` is `full`, a file-backed `arra_read` resolves beneath the bound storage
root with the same project, and SHA-256 of its content equals
`durability.content_hash`. Its `durability.request_fingerprint` must equal the frozen
request fingerprint. `rrr-receipt.py` is the pure local validator; it never calls Oracle.

Title search only finds candidates and same-title/different-content is not success. On
unknown transport outcome, retry the byte-identical frozen request/key once; then retain
`withheld/unknown`. Preserve `partial`, `degraded`, and `conflict`; never replay an
accepted receipt or manufacture an ID.

Reindex-then-replay is unverified: reindex preserves document `updated_at` but changes
`indexed_at`. `arra_supersede` needs separate current approval and is not executed here.
