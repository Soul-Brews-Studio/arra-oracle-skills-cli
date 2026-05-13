"""
Quantitative assertions on /rrr retro artifacts.

Implements Q1, Q2, Q4-Q6, Q8 (sync), Q9 from the eval-architect Round 3 spec.

Each test consumes the `psi`, `slug`, `today`, and `retro_text` fixtures from
conftest.py. The slug fixture is parametrized — by default it runs against the
sample-good fixture, but can be widened via --slug or by extending
pytest_generate_tests in conftest.py.
"""
from __future__ import annotations

import os
import re
import datetime
from pathlib import Path

import pytest
import yaml

from conftest import load_latest_learning


REQUIRED_SECTIONS = [
    "## Session Summary",
    "## Timeline",
    "## Files Modified",
    "## AI Diary",
    "## Honest Feedback",
    "## Lessons Learned",
    "## Next Steps",
]

NEXT_STEP_VERBS = {
    "add", "fix", "move", "create", "open", "run", "refactor", "write",
    "test", "remove", "update", "check", "ship", "wire", "migrate",
    "document", "rebase", "merge", "deploy", "investigate", "land",
    "extract", "split", "rename", "review", "audit", "lift", "apply",
}


# ---------- helpers ----------------------------------------------------------

def _section(text: str, header: str) -> str | None:
    """Return the body of a section starting at `header` up to the next `## ` or EOF."""
    pat = re.escape(header) + r"(.+?)(?=^## |\Z)"
    m = re.search(pat, text, re.DOTALL | re.MULTILINE)
    return m.group(1) if m else None


# ---------- Q1: structure ----------------------------------------------------

def test_section_completeness(retro_text):
    """Q1: every required header must be present."""
    missing = [h for h in REQUIRED_SECTIONS if h not in retro_text]
    assert not missing, f"Q1-FAIL: Missing sections: {missing}"


def test_metrics_row_appended(psi, today):
    """Q1 ext: session-metrics.md must exist and have a row for today."""
    metrics = psi / "memory" / "learnings" / "session-metrics.md"
    assert metrics.exists(), f"Q1-FAIL: session-metrics.md not found at {metrics}"
    content = metrics.read_text()
    assert today.isoformat() in content, (
        f"Q1-FAIL: No metrics row for {today.isoformat()} in {metrics}"
    )


def test_learning_file_frontmatter(psi, today):
    """Q1 ext: today's learning file must have pattern/date/source/concepts frontmatter."""
    learning = load_latest_learning(psi, today)
    text = learning.read_text()
    parts = text.split("---")
    assert len(parts) >= 3, f"Q1-FAIL: learning file {learning} has no YAML frontmatter"
    fm = yaml.safe_load(parts[1])
    for field in ("pattern", "date", "source", "concepts"):
        assert field in fm and fm[field], (
            f"Q1-FAIL: Learning frontmatter missing or empty field '{field}' in {learning}"
        )


# ---------- Q2: evidence density --------------------------------------------

def test_evidence_density(retro_text):
    """Q2: at least 3 evidence items (SHAs + file paths) in the retro."""
    shas = re.findall(r"\b[0-9a-f]{7,40}\b", retro_text)
    paths = re.findall(r"[\w/\-]+\.\w{1,6}", retro_text)
    total = len(shas) + len(paths)
    assert total >= 3, (
        f"Q2-FAIL: Only {len(shas)} SHAs + {len(paths)} paths found; need ≥3 evidence items"
    )


# ---------- Q4: word floors --------------------------------------------------

def test_word_floors(retro_text):
    """Q4: AI Diary ≥150 words, Honest Feedback ≥100 words."""
    diary = _section(retro_text, "## AI Diary")
    feedback = _section(retro_text, "## Honest Feedback")
    assert diary is not None, "Q4-FAIL: AI Diary section missing"
    assert feedback is not None, "Q4-FAIL: Honest Feedback section missing"
    diary_words = len(diary.split())
    feedback_words = len(feedback.split())
    assert diary_words >= 150, f"Q4-FAIL: AI Diary {diary_words} words (need ≥150)"
    assert feedback_words >= 100, f"Q4-FAIL: Honest Feedback {feedback_words} words (need ≥100)"


# ---------- Q5: friction count ----------------------------------------------

def test_friction_count(retro_text):
    """Q5: Honest Feedback contains ≥3 enumerated friction points."""
    feedback = _section(retro_text, "## Honest Feedback")
    assert feedback is not None, "Q5-FAIL: Honest Feedback section missing"
    bullets = re.findall(r"^\s*(?:\d+\.|[-*])\s+\S", feedback, re.MULTILINE)
    assert len(bullets) >= 3, f"Q5-FAIL: Only {len(bullets)} friction points; need ≥3"


# ---------- Q6: next-step verbs ---------------------------------------------

def test_next_steps_start_with_verbs(retro_text):
    """Q6: every Next Steps bullet starts with an action verb."""
    steps = _section(retro_text, "## Next Steps")
    assert steps is not None, "Q6-FAIL: Next Steps section missing"
    items = re.findall(r"^\s*(?:\d+\.|[-*])\s+(\w+)", steps, re.MULTILINE)
    assert items, "Q6-FAIL: No enumerated next-step bullets found"
    bad = [w for w in items if w.lower() not in NEXT_STEP_VERBS]
    assert not bad, (
        f"Q6-FAIL: Next steps not starting with action verbs: {bad}. "
        f"Allowed verbs: {sorted(NEXT_STEP_VERBS)}"
    )


# ---------- Q8: oracle sync (skipped without backend) -----------------------

@pytest.mark.skipif(
    not os.environ.get("ARRA_ORACLE_URL"),
    reason="ARRA_ORACLE_URL not set — skipping Oracle sync check",
)
def test_learning_sync_to_oracle(psi, today):
    """Q8: distilled `pattern:` value must be retrievable via arra_search."""
    import httpx

    learning = load_latest_learning(psi, today)
    fm = yaml.safe_load(learning.read_text().split("---")[1])
    pattern_line = fm.get("pattern", "")
    assert pattern_line, "Q8-FAIL: frontmatter 'pattern' field is empty"

    base = os.environ["ARRA_ORACLE_URL"].rstrip("/")
    resp = httpx.post(
        f"{base}/search",
        json={"query": pattern_line, "limit": 5, "models": ["bge-m3", "nomic", "qwen3"]},
        timeout=10,
    )
    resp.raise_for_status()
    results = resp.json().get("results", [])
    found = any(
        learning.stem in (r.get("path", "") or "")
        or pattern_line[:30] in (r.get("content", "") or "")
        for r in results
    )
    if not found:
        paths = [r.get("path") for r in results]
        pytest.fail(
            f"SYNC_LAG: pattern '{pattern_line[:60]}' not in top-5 arra_search results.\n"
            f"  Top results: {paths}\n"
            f"  Action: check Oracle auto-indexer picked up {learning}"
        )


# ---------- Q9: lesson/friction overlap -------------------------------------

_STOPWORDS = {
    "the", "a", "an", "and", "or", "but", "in", "on", "to", "of", "is", "was",
    "were", "be", "been", "are", "for", "with", "as", "at", "by", "it", "this",
    "that", "i", "we", "my", "our", "you", "your", "they", "them", "their",
    "from", "not", "no", "if", "then", "so", "do", "did", "done", "has", "have",
    "had", "can", "could", "would", "should", "may", "might", "will", "shall",
}


def test_no_lesson_friction_overlap(retro_text):
    """Q9: lessons and friction should not duplicate content (token overlap < 15)."""
    lessons = _section(retro_text, "## Lessons Learned")
    friction = _section(retro_text, "## Honest Feedback")
    if not lessons or not friction:
        pytest.skip("Q9: missing lessons or friction section — covered by Q1")
    lessons_tokens = set(re.findall(r"[a-z][a-z\-]{2,}", lessons.lower())) - _STOPWORDS
    friction_tokens = set(re.findall(r"[a-z][a-z\-]{2,}", friction.lower())) - _STOPWORDS
    overlap = lessons_tokens & friction_tokens
    assert len(overlap) < 15, (
        f"Q9-FAIL: High lesson/friction overlap ({len(overlap)} shared tokens) — "
        f"possible duplication. Shared: {sorted(overlap)[:20]}"
    )
