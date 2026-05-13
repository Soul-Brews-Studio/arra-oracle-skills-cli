# API-SURFACE — thclaws-oracle (post-PRD-111 replay)

## Tool catalogue

The `tools.rs` module exposes the following live tools. List taken from
ARCHITECTURE.md lines 130-131, which the agent documented as "live":

- `stylos_request_talk` — open a Stylos talk channel
- `stylos_request_task` — delegate a task
- `stylos_query_task_status` — query delegated-task status
- `stylos_query_task_result` — fetch a completed task's result
- `request_talk_handler` — internal handler for talk requests

<!--
NEGATIVE FIXTURE — every symbol above was DELETED in PRD-111.

`grep stylos_request_talk crates/themion-core/src/tools.rs` returns empty.
THEMION-INTEGRATION.md §4 quotes the migration: "Prefer durable board notes
for delegated work… not stylos_send_message." The agent that wrote this doc
ran /learn against a stale local checkout pre-PRD-111 and documented APIs
that no longer exist at HEAD.

The Q-stale gate (test_q_stale_no_deleted_symbols) loads the
known_deleted_symbols list from registers/stale-snapshot-repo.yaml and
greps every output doc. Any hit → BLOCK.
-->
