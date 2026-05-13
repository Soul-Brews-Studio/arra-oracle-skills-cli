"""
Q-stale (BLOCK): KNOWN-DELETED-SYMBOLS must not appear in /learn output.

Fixture seeds the deleted-symbol list per register in registers/<name>.yaml.
For the canonical thClaws-oracle PRD-111 register, seeds are:
- stylos_request_talk        (renamed → stylos_send_message)
- stylos_request_task        (deleted, replaced by board notes)
- stylos_query_task_status   (deleted with request_task)
- stylos_query_task_result   (deleted with request_task)
- request_talk_handler

Test grep's every session doc for word-boundary matches; any hit → BLOCK.
This is the safety-net against the failure mode where the agent reads a stale
local snapshot and proudly documents APIs that were deleted at HEAD.
"""
from __future__ import annotations

import re

import pytest


def test_q_stale_no_deleted_symbols(session_docs, fixture_meta):
    """Q-stale (BLOCK): fail if any KNOWN-DELETED symbol appears in any session doc."""
    deleted = fixture_meta.get("known_deleted_symbols", []) if fixture_meta else []
    if not deleted:
        pytest.skip("Q-stale: no known-deleted-symbols seeded for this register")
    if not session_docs:
        pytest.skip("Q-stale: no session docs found")
    hits: list[tuple[str, str]] = []
    for doc in session_docs:
        body = doc.read_text()
        for sym in deleted:
            if re.search(rf"\b{re.escape(sym)}\b", body):
                hits.append((doc.name, sym))
    assert not hits, (
        f"Q-stale-BLOCK: deleted symbols present in output: {hits[:5]}. "
        f"Agent read stale snapshot — refused to update against current HEAD."
    )
