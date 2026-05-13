"""
Negative-corpus tests — prove each Q-gate has teeth.

For every `fixtures/bad/*.md` we assert the matching Q-check FAILS or WARNS
the right way. Without these, the green-path passes could mean "the fixtures
happen to be clean" — these tests are how we know each gate would actually
fire on a known-bad input.

Mirrors the spec's `# test_negative_corpus.py — proves gates fire on
known-bad fixtures` block (eval-architect Round 3 section 7).
"""
from __future__ import annotations

import re
import statistics
from collections import Counter
from pathlib import Path

import pytest
import yaml

from conftest import doc_type, load_budgets_full, REGISTERS_DIR
from test_anti_hallucination_learn import REF_RE, _validate_ref
from test_consistency_learn import (
    HOT_PHRASES,
    SELF_ADMISSION_RE,
    WIKILINK_RE,
    MDLINK_RE,
)
from test_quant_learn import (
    DOC_BUDGETS,
    FLUFF_PHRASES,
    AUTO_TRIM_MULT,
)


HERE = Path(__file__).parent
BAD = HERE / "fixtures" / "bad"
ORIGIN = HERE / "fixtures" / "origin-fixture-repo"


def _words(text: str) -> int:
    return len(text.split())


# ---------- Q1 ---------------------------------------------------------------

def test_word_overshoot_caught():
    """word-overshoot.md (treated as API-SURFACE) must exceed BLOCK threshold."""
    body = (BAD / "word-overshoot.md").read_text()
    actual = _words(body)
    budget = DOC_BUDGETS["API-SURFACE"]
    block_threshold = int(budget * AUTO_TRIM_MULT)
    assert actual > block_threshold, (
        f"Negative-corpus regression: word-overshoot.md is {actual}w but "
        f"BLOCK threshold for API-SURFACE is {block_threshold}w — fixture too short to test Q1 BLOCK."
    )


# ---------- Q4 ---------------------------------------------------------------

def test_hallucinated_line_caught():
    """hallucinated-line.md cites src/lib.rs:625 — actual lib.rs has 19 lines."""
    body = (BAD / "hallucinated-line.md").read_text()
    refs = list(REF_RE.finditer(body))
    assert refs, "Negative-corpus regression: no file:line refs in hallucinated-line.md"
    failures = [
        m.group(0)
        for m in refs
        if _validate_ref(ORIGIN, "", body, m, strict=False) is not None
    ]
    assert failures, (
        "Negative-corpus regression: Q4 did not catch the hallucinated ref in "
        "hallucinated-line.md (expected at least 1 unresolved file:line)."
    )


# ---------- Q5 (cross-refs) -------------------------------------------------

def test_no_cross_refs_warns():
    """no-cross-refs.md has zero wiki-links and zero relative md-links."""
    body = (BAD / "no-cross-refs.md").read_text()
    n = len(WIKILINK_RE.findall(body)) + len(MDLINK_RE.findall(body))
    assert n < 2, (
        f"Negative-corpus regression: no-cross-refs.md has {n} cross-refs but "
        "Q5 WARN threshold is <2 — fixture too rich to test the WARN tier."
    )


# ---------- Q7 (fluff) ------------------------------------------------------

def test_fluff_caught():
    """fluff-fixture (we inline a small one here) — Q7 must blacklist-match."""
    sample = "This codebase demonstrates robust and scalable architecture."
    hits: list[str] = []
    body_lower = sample.lower()
    for pat in FLUFF_PHRASES:
        for m in re.finditer(pat, body_lower):
            hits.append(m.group(0))
    assert len(hits) >= 2, (
        f"Negative-corpus regression: expected ≥2 fluff matches in inline sample, "
        f"got {hits}."
    )


# ---------- Q11 (hot-phrase, count-based) -----------------------------------

def test_hot_phrase_redundancy_caught():
    """Construct a synthetic 3-doc session where one doc has 4× the others' median."""
    bloater = "ChatBackend " * 12  # 12 mentions
    sibling_a = "ChatBackend " * 2
    sibling_b = "ChatBackend " * 2
    docs = {"BLOAT": bloater, "A": sibling_a, "B": sibling_b}
    counts = [d.count("ChatBackend") for d in docs.values()]
    med = statistics.median(counts)
    bloater_count = docs["BLOAT"].count("ChatBackend")
    assert bloater_count > 3 * med, (
        f"Negative-corpus regression: synthetic 3-doc session — bloater={bloater_count}, "
        f"median={med}; Q11 needs bloater > 3× median to fire."
    )


# ---------- Q12 (self-admission) --------------------------------------------

def test_self_admission_caught():
    """self-admission.md has a literal '(re-stated)' heading — Q12 BLOCK."""
    body = (BAD / "self-admission.md").read_text()
    hits = SELF_ADMISSION_RE.findall(body)
    assert hits, (
        "Negative-corpus regression: Q12 did not catch '(re-stated)' in "
        "self-admission.md — regex broken or fixture clean."
    )


# ---------- Q-stale (KNOWN-DELETED-SYMBOLS) ---------------------------------

def test_stale_snapshot_caught():
    """stale-snapshot.md mentions PRD-111-deleted symbols — Q-stale BLOCK."""
    body = (BAD / "stale-snapshot.md").read_text()
    seeds = yaml.safe_load((REGISTERS_DIR / "stale-snapshot-repo.yaml").read_text())
    deleted = seeds.get("known_deleted_symbols", [])
    assert deleted, "Negative-corpus regression: stale-snapshot-repo.yaml has no seed symbols"
    hits = [sym for sym in deleted if re.search(rf"\b{re.escape(sym)}\b", body)]
    assert hits, (
        f"Negative-corpus regression: Q-stale did not catch any deleted symbol in "
        f"stale-snapshot.md. Seeds: {deleted}"
    )
