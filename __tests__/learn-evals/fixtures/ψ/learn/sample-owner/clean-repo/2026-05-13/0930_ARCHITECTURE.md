# ARCHITECTURE — clean-repo

## Entry Points

The repo exposes a single Rust entry point `agent_new` at `src/lib.rs:7`. It
constructs an `Agent` struct, declared at `src/lib.rs:11`. TypeScript and
Python halves are separate runtimes: see `src/core.ts:10` for the TS engine
and `src/cli.py:12` for the Python CLI shim.

```rust
pub fn agent_new(name: &str) -> Agent {
    Agent { name: name.to_string() }
}
```

## Core Abstractions

Three abstractions, one per language. Each is small on purpose — the repo's
job is to be a fixture, not a framework.

| Abstraction | Language | File | Line |
|---|---|---|---|
| `Agent`         | Rust       | `src/lib.rs` | 11 |
| `CoreEngine`    | TypeScript | `src/core.ts` | 8 |
| `parse_args`    | Python     | `src/cli.py` | 7 |

The Rust half is the "kernel" — TS and Python are alternative runtimes that
share no state with Rust and no state with each other. There is no IPC layer
and no shared protocol. The point is to give an eval framework three real
files in three real languages so file:line refs can be validated.

```rust
pub struct Agent {
    pub name: String,
}
```

```ts
export class CoreEngine {
  constructor(private cfg: Config) {}
  run(): string {
    return `engine for ${this.cfg.name}`;
  }
}
```

## Cross-references

For verbatim code excerpts longer than this section's snippets, see
[[0930_CODE-SNIPPETS.md]]. For installation and usage, see
[[0930_QUICK-REFERENCE.md]].
