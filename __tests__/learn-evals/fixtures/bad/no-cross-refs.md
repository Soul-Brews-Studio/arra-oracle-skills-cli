# ARCHITECTURE — themion (replay)

## Entry Points

The crate's public entry is `agent_new`. It constructs an `Agent` and
returns it. The full chain is `agent_new → Agent::new → Agent::greet`.

## Core Abstractions

`Agent` owns its `name` and a handful of dispatch helpers. The plugin
trait `ChatBackend` lets external crates register custom backends.

## Build flow

`cargo build` produces a single `libthemion.rlib` artifact. Tests run via
`cargo test`. The CI matrix covers Linux/macOS on stable + beta Rust.

<!--
NEGATIVE FIXTURE — this doc has ZERO wiki-links and ZERO relative .md
links. The Q5 gate (test_q5_cross_reference_quota) flags it as WARN.
A real doc-set with this shape would ship but be annotated in the
announce block.
-->
