# API-SURFACE — themion (replay)

## 1. Public Rust API

The themion crate exposes `Agent`, `Agent::new`, `Agent::greet`, and a
`tool_definitions` helper. Re-exports are stable across the 0.x line.

## 2. MCP support

themion is intentionally outside the MCP ecosystem. Its tool catalogue is
in-tree, its inter-process protocol is Stylos/Zenoh, and its prompt-injection
format is AGENTS.md. Anyone wanting MCP support needs to fork.

## 3. Stylos surface

See `stylos/THEMION-INTEGRATION.md` for the full Stylos wire surface.

## 4. MCP support — absent (re-stated)

Zero references. themion is intentionally outside the MCP ecosystem. Its
tool catalogue is in-tree, its inter-process protocol is Stylos/Zenoh, and
its prompt-injection format is AGENTS.md. Anyone wanting MCP needs to fork.

<!--
NEGATIVE FIXTURE — section 4's heading literally says "(re-stated)" and
duplicates section 2 word-for-word. The Q12 gate
(test_q12_no_self_admission) catches the self-admission regex on the
heading and BLOCKS.
-->
