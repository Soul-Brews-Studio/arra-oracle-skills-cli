"""
Q5 (cross-refs), Q11 (count-based hot-phrase redundancy), Q12 (self-admission).

Q5 tiering (per eval-architect Round 3 verdict):
- WARN-ship for individual docs under the ≥2 cross-ref quota.
- BLOCK when a SYNTHESIS doc fails to link every sibling.

Q11 verdict: count-based hot-phrase grep, NOT Jaccard. Reasons:
- zero threshold-tune
- interpretable error ("3 instances of 'this codebase demonstrates'")
- catches the failure pattern (repeated stock phrases) cheaply
- Jaccard moved to --strict mode if ever needed.

Hot-phrase rule: per-doc count > 3× session median → fail (WARN-tier).
Starter list of 8 phrases blends generic stock-prose with the
usage-anthropologist Round 3 hot-table (CongestionControl::Drop,
stylos/<realm>/themion, tool_definitions, ChatBackend).

Q12 self-admission regex BLOCKS on any match. Today's `## 4. MCP support —
absent (re-stated)` heading was the catalyst.
"""
from __future__ import annotations

import re
import statistics
from collections import Counter
from pathlib import Path

import pytest

from conftest import doc_type


WIKILINK_RE = re.compile(r"\[\[([^\]|]+)(?:\|[^\]]+)?\]\]")
MDLINK_RE = re.compile(r"\[[^\]]+\]\((?!https?:)([^)]+\.md)[^)]*\)")

# Hand-tuned starter hot-phrase list (8 entries):
#   - 4 generic stock-prose anchors (catches "this codebase / the project / ...")
#   - 4 today-specific bloater anchors from usage-anthropologist's table.
# Extend per-register if needed.
HOT_PHRASES: list[str] = [
    "this codebase",
    "the project",
    "this module",
    "implementation details",
    "CongestionControl::Drop",
    "stylos/<realm>/themion",
    "tool_definitions",
    "ChatBackend",
]

SELF_ADMISSION_RE = re.compile(
    r"\b(re-stated|restated|same as above|as mentioned (?:earlier|above)|"
    r"repeated from|see above|covered (?:above|earlier)|duplicate of|"
    r"already (?:mentioned|covered|stated))\b",
    re.IGNORECASE,
)


def _count_xrefs(body: str) -> int:
    return len(WIKILINK_RE.findall(body)) + len(MDLINK_RE.findall(body))


# ---------- Q5 cross-refs ---------------------------------------------------

def test_q5_cross_reference_quota(session_docs):
    """Q5 (WARN-ship): ≥2 wiki/relative-md links per non-OVERVIEW doc.

    OVERVIEW docs in --fast mode are single-doc by design; the quota does
    not apply (no siblings to link to).
    """
    if not session_docs:
        pytest.skip("Q5: no session docs found")
    warnings: list[tuple[str, int]] = []
    for doc in session_docs:
        if doc_type(doc) == "OVERVIEW":
            continue
        n = _count_xrefs(doc.read_text())
        if n < 2:
            warnings.append((doc.name, n))
    if warnings:
        pytest.skip(f"Q5-WARN: {len(warnings)} docs under cross-ref quota: {warnings[:5]}")


def test_q5_synthesis_links_all_siblings(session_docs):
    """Q5-BLOCK: SYNTHESIS.md (when present) must link to every sibling doc."""
    if not session_docs:
        pytest.skip("Q5-SYNTH: no session docs found")
    by_type = {doc_type(d): d for d in session_docs}
    synth = by_type.get("SYNTHESIS")
    if synth is None:
        pytest.skip("Q5-SYNTH: no SYNTHESIS doc in this register — skipping")
    body = synth.read_text()
    siblings = [d for d in session_docs if d != synth]
    missing = []
    for sib in siblings:
        if sib.name not in body and sib.stem not in body:
            missing.append(sib.name)
    assert not missing, f"Q5-BLOCK: SYNTHESIS missing links to siblings: {missing}"


# ---------- Q11 hot-phrase redundancy (count-based, NOT Jaccard) -----------

def test_q11_hot_phrase_redundancy(session_docs):
    """Q11 (WARN): per-doc hot-phrase count > 3× session median → flag.

    Verdict: count-based (per eval-architect Round 3). Jaccard moved to
    --strict as Q11-extra.
    """
    if not session_docs:
        pytest.skip("Q11: no session docs found")
    # Build matrix: phrase → [count_per_doc].
    matrix: dict[str, dict[str, int]] = {p: {} for p in HOT_PHRASES}
    for doc in session_docs:
        body = doc.read_text()
        body_lower = body.lower()
        for phrase in HOT_PHRASES:
            # Case-sensitive for camelCase symbols; case-insensitive for stock prose.
            if any(c.isupper() for c in phrase):
                n = body.count(phrase)
            else:
                n = body_lower.count(phrase.lower())
            if n:
                matrix[phrase][doc.name] = n

    bloaters: list[str] = []
    for phrase, per_doc in matrix.items():
        counts = list(per_doc.values())
        if len(counts) < 2:
            continue  # need at least 2 docs to compute a meaningful median
        med = statistics.median(counts)
        if med == 0:
            continue
        for doc_name, n in per_doc.items():
            if n > 3 * med:
                bloaters.append(f"{doc_name}: '{phrase}'×{n} (median {med:g})")
    if bloaters:
        pytest.skip(f"Q11-WARN: hot-phrase overuse — {bloaters[:5]}")


# ---------- Q12 self-admission (BLOCK) --------------------------------------

def test_q12_no_self_admission(session_docs):
    """Q12 (BLOCK): zero self-admission-of-redundancy phrases."""
    if not session_docs:
        pytest.skip("Q12: no session docs found")
    offenders: list[tuple[str, str]] = []
    for doc in session_docs:
        for m in SELF_ADMISSION_RE.finditer(doc.read_text()):
            offenders.append((doc.name, m.group(0)))
    assert not offenders, f"Q12-BLOCK: self-admission of redundancy: {offenders[:5]}"
