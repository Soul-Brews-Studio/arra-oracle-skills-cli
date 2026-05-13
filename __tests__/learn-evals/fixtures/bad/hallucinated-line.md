# CODE-SNIPPETS — themion (replay)

## Tool definitions

The `tool_definitions` function lives at `src/lib.rs:625` and constructs the
full tool catalogue handed to the model. Here's the body, lifted verbatim:

<!--
NEGATIVE FIXTURE — the claim above is a hallucination.

ACTUAL (sed -n '625p' tools.rs in the real themion repo): line 625 is inside
the `memory_create_node` body, not `tool_definitions`. The real
`tool_definitions` function lives at line 1345 — off by 720 lines.

For the eval-framework fixture we point at the synthetic origin-fixture-repo:
the `src/lib.rs` there is only 19 lines long, so a ref to `src/lib.rs:625`
fails Q4's "lineno > file length" branch deterministically.
-->

```rust
pub fn tool_definitions() -> Value {
    let mut base_defs = vec![ json!({...}) ];
    base_defs
}
```

Cross-ref: see `src/lib.rs:625` (hallucinated — fixture is intentional) and
`src/core.ts:9999` (file exists, line does not).
