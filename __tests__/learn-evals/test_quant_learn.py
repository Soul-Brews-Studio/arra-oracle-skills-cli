"""
Q1, Q2, Q3, Q6, Q7, Q8, Q9, Q10 for /learn artifacts.

Quantitative checks against the docs written under psi/learn/<owner>/<repo>/<YYYY-MM-DD>/.

Budgets are sourced from `__tests__/learn-evals/budgets.json` (single source of
truth — same file is consumed by the SKILL.md prompt templates in a follow-up PR).

Tiering (see eval-architect Round 3 spec + scripts/eval_learn.py classify()):
- Q1 word-count: auto-trim if 100-120% of ceiling, BLOCK if >120%
- Q2/Q3/Q7/Q8/Q9: BLOCK
- Q6/Q10: WARN (skip-with-message)
"""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

import pytest

from conftest import doc_type, load_budgets_full, parse_session_jsonl


# ---------- budgets / required sections / fluff -----------------------------

_BUDGETS_DATA = load_budgets_full()

DOC_BUDGETS: dict[str, int] = {
    kind: spec["ceiling"] for kind, spec in _BUDGETS_DATA["doc_budgets"].items()
}
# {"OVERVIEW": 500, "ARCHITECTURE": 1400, "CODE-SNIPPETS": 1200,
#  "QUICK-REFERENCE": 700, "TESTING": 1000, "API-SURFACE": 1000, "SYNTHESIS": 1500}

HUB_PROSE_CAP: int = _BUDGETS_DATA["hub_prose_cap"]  # 100w
AUTO_TRIM_MULT: float = _BUDGETS_DATA["tolerance"]["auto_trim_mult"]  # 1.20 — BLOCK threshold
# Note: HARD_CEILING_MULT (Q1 first failure point) = 1.10 implicit via budget being the ceiling.

REQUIRED_SECTIONS: dict[str, list[str]] = {
    "ARCHITECTURE":    ["## Entry Points", "## Core Abstractions"],
    "CODE-SNIPPETS":   [],   # checked via fenced-block count instead
    "QUICK-REFERENCE": ["## Install", "## Usage"],
    "API-SURFACE":     ["## Public API"],
    "TESTING":         ["## Test Structure"],
    "SYNTHESIS":       [],   # cross-ref checks live in test_consistency_learn.py
    "OVERVIEW":        [],
}

# Per spec section 2 — fluff phrase blacklist (case-insensitive).
FLUFF_PHRASES: list[str] = [
    r"this codebase demonstrates",
    r"leveraging modern best practices",
    r"robust and scalable",
    r"powerful and flexible",
    r"cutting[- ]edge",
    r"industry[- ]standard",
    r"best[- ]in[- ]class",
    r"seamlessly integrat\w+",
]


def _words(text: str) -> int:
    return len(text.split())


# ---------- Q1: word-count per doc ------------------------------------------

def test_q1_word_count_per_doc(session_docs):
    """Q1: each doc within budget (BLOCK if >120% of ceiling).

    The eval-architect tier model: classify() in scripts/eval_learn.py inspects
    the failure message to decide auto-trim (100-120%) vs BLOCK (>120%). Here we
    enforce only the hard BLOCK threshold; auto-trim is a runner-level decision.
    """
    if not session_docs:
        pytest.skip("Q1: no session docs found at fixture path")
    failures: list[str] = []
    for doc in session_docs:
        kind = doc_type(doc)
        budget = DOC_BUDGETS.get(kind)
        if budget is None:
            continue
        actual = _words(doc.read_text())
        ceiling = int(budget * AUTO_TRIM_MULT)
        if actual > ceiling:
            failures.append(
                f"{doc.name} = {actual}w (budget {budget}w, ceiling {ceiling}w)"
            )
    assert not failures, "Q1-FAIL: " + "; ".join(failures)


# ---------- Q2: claim-vs-reality (announce ↔ disk) --------------------------

def test_q2_claim_vs_reality(announce_table, session_docs):
    """Q2: every word-count claim in the announce manifest matches disk ±10%."""
    if not announce_table:
        pytest.skip("Q2: no announce manifest (psi/learn/.announce/<iso>.json) — nothing to verify")
    by_name = {d.name: d for d in session_docs}
    failures: list[str] = []
    for row in announce_table:
        fn = row.get("filename")
        claimed = row.get("claimed_words", 0)
        doc = by_name.get(fn)
        if doc is None:
            failures.append(f"announce mentions {fn} but not on disk")
            continue
        actual = _words(doc.read_text())
        drift = abs(actual - claimed) / max(claimed, 1)
        if drift > 0.10:
            failures.append(
                f"{doc.name} claimed {claimed}w, actual {actual}w (drift {drift:.0%})"
            )
    assert not failures, "Q2-FAIL: " + "; ".join(failures)


# ---------- Q3: required sections per doc-type ------------------------------

def test_q3_required_sections(session_docs):
    """Q3: each doc-type has its required headers; CODE-SNIPPETS has >=3 fenced blocks."""
    if not session_docs:
        pytest.skip("Q3: no session docs found")
    failures: list[str] = []
    for doc in session_docs:
        kind = doc_type(doc)
        body = doc.read_text()
        for header in REQUIRED_SECTIONS.get(kind, []):
            if header not in body:
                failures.append(f"{doc.name} missing '{header}'")
        if kind == "CODE-SNIPPETS":
            fences = len(re.findall(r"^```", body, re.MULTILINE)) // 2
            if fences < 3:
                failures.append(f"CODE-SNIPPETS {doc.name} has {fences} fenced blocks (need >=3)")
    assert not failures, "Q3-FAIL: " + "; ".join(failures)


# ---------- Q6: code density per doc-type (WARN) ----------------------------

CODE_DENSITY_FLOORS: dict[str, float] = {
    "CODE-SNIPPETS": 0.40,
    "QUICK-REFERENCE": 0.20,
    "ARCHITECTURE": 0.15,
}


def test_q6_code_density(session_docs):
    """Q6: char-fraction inside ``` fences meets floor per doc-type (WARN-tier)."""
    if not session_docs:
        pytest.skip("Q6: no session docs found")
    warnings: list[str] = []
    for doc in session_docs:
        kind = doc_type(doc)
        floor = CODE_DENSITY_FLOORS.get(kind)
        if floor is None:
            continue
        body = doc.read_text()
        fenced = re.findall(r"```[\s\S]*?```", body)
        ratio = sum(len(b) for b in fenced) / max(len(body), 1)
        if ratio < floor:
            warnings.append(f"{doc.name} code density {ratio:.0%} (floor {floor:.0%})")
    if warnings:
        # WARN tier — surface as skip with message, do not fail.
        pytest.skip("Q6-WARN: " + "; ".join(warnings))


# ---------- Q7: fluff-phrase blacklist (BLOCK) ------------------------------

def test_q7_no_fluff_phrases(session_docs):
    """Q7: zero fluff-phrase matches across all docs."""
    if not session_docs:
        pytest.skip("Q7: no session docs found")
    offenders: list[tuple[str, str]] = []
    for doc in session_docs:
        body = doc.read_text().lower()
        for pat in FLUFF_PHRASES:
            for m in re.finditer(pat, body):
                offenders.append((doc.name, m.group(0)))
    assert not offenders, f"Q7-FAIL: fluff phrases found: {offenders[:5]}"


# ---------- Q8: "Written to:" announce paths absolute -----------------------

ABS_PATH_RE = re.compile(r"Written to:\s*(\S+)")


def test_q8_announce_paths_absolute(session_log_path):
    """Q8: every 'Written to:' line in the session jsonl uses an absolute path."""
    bad: list[str] = []
    for line in parse_session_jsonl(session_log_path):
        for m in ABS_PATH_RE.finditer(line):
            p = m.group(1).strip('"\',')
            if not p.startswith("/"):
                bad.append(p)
    assert not bad, f"Q8-FAIL: relative paths in announce: {bad[:5]}"


# ---------- Q9: hub + .origins + symlink invariants -------------------------

WIKI_LINK_LINE_RE = re.compile(r"^\s*[-*]\s*\[[^\]]+\]\([^)]+\).*$", re.MULTILINE)


def test_q9_hub_and_manifest(psi, owner, repo, today):
    """Q9: hub file + .origins + origin symlink invariants + hub prose cap."""
    if owner is None or repo is None:
        pytest.skip("Q9: no <owner>/<repo>/<today>/ tree under psi/learn — nothing to check")
    hub = psi / "learn" / owner / repo / f"{repo}.md"
    origins = psi / "learn" / ".origins"
    symlink = psi / "learn" / owner / repo / "origin"
    failures: list[str] = []
    if not hub.exists():
        failures.append(f"hub {hub} missing")
    if not origins.exists():
        failures.append(".origins missing")
    else:
        text = origins.read_text()
        if f"{owner}/{repo}" not in text:
            failures.append(f"{owner}/{repo} not in .origins")
        lines = [l for l in text.splitlines() if l]
        if lines != sorted(set(lines)):
            failures.append(".origins not sorted+unique")
    if not symlink.is_symlink():
        failures.append(f"origin not a symlink at {symlink}")
    elif not symlink.resolve().exists():
        failures.append("origin symlink dangling")
    if hub.exists():
        body = hub.read_text()
        if today.isoformat() not in body:
            failures.append("hub missing today's session entry")
        # Hub prose cap: strip md-link list lines, count remaining words
        prose = WIKI_LINK_LINE_RE.sub("", body)
        prose_words = _words(prose)
        if prose_words > HUB_PROSE_CAP:
            failures.append(f"hub prose {prose_words}w (cap {HUB_PROSE_CAP}w excl link-list)")
    assert not failures, "Q9-FAIL: " + "; ".join(failures)


# ---------- Q10: arra_learn call logged (WARN, skip if no backend) ----------

@pytest.mark.skipif(
    not os.environ.get("ARRA_ORACLE_URL"),
    reason="ARRA_ORACLE_URL not set — Q10 sync check skipped (WARN tier)",
)
def test_q10_sync(session_log_path):
    """Q10: arra_learn / arra_save / oracle save tool-use logged in session."""
    pattern = re.compile(r"arra_learn|arra_save|oracle.*save", re.IGNORECASE)
    for line in parse_session_jsonl(session_log_path):
        if pattern.search(line):
            return  # found — pass
    pytest.skip("Q10-WARN: no arra_learn call logged (warn-tier, ship anyway)")
