"""
Two-gate anti-rationalization check per eval-architect Round 3 spec.

Gate 1 (regex):    rationalization label exists in the retro
Gate 2 (proximity): within 50 words *after* the excuse, a causal/excavation phrase
                    explains WHY the rationalization felt safe at the time.

Listing an excuse without excavating motive passes Gate 1 but fails Gate 2.
That's the failure mode usage-anthropologist found ("named but not excavated").
"""
from __future__ import annotations

import re

import pytest


# Excuses lifted from SKILL.md's anti-rationalization table.
EXCUSES = [
    r"too complex to finish",
    r"ran out of context",
    r"api.{0,10}didn.?t work",
    r"tool didn.?t work",
    r"already tested it manually",
    r"fix it next session",
    r"it.?s mostly done",
    r"user changed direction",
    r"this is a known issue",
    r"made good progress",
]

CAUSAL_PHRASES = [
    r"because",
    r"the reason",
    r"felt safe",
    r"i noticed",
    r"in retrospect",
    r"the real",
    r"what actually",
    r"specifically",
    r"the error was",
    r"root cause",
    r"i wanted to avoid",
    r"i was trying to",
]


def _window_after(text: str, end_idx: int, n_words: int = 50) -> str:
    """Return the next `n_words` words after position `end_idx`."""
    tail = text[end_idx : end_idx + 800]
    words = tail.split()
    return " ".join(words[:n_words])


def test_anti_rationalization(retro_text):
    """Every excuse phrase, if present, must be excavated by a causal phrase within 50 words."""
    failures: list[str] = []
    for excuse_pat in EXCUSES:
        for m in re.finditer(excuse_pat, retro_text, re.IGNORECASE):
            window = _window_after(retro_text, m.end(), n_words=50)
            excavated = any(
                re.search(cp, window, re.IGNORECASE) for cp in CAUSAL_PHRASES
            )
            if not excavated:
                failures.append(
                    f"  - '{m.group()}' at pos {m.start()}: window=\"{window[:120]}...\""
                )

    if failures:
        msg = (
            "ANTI-RAT-FAIL: Excuse phrases found but not excavated within 50 words.\n"
            + "\n".join(failures)
            + "\n  Fix: add WHY each rationalization felt safe at the time of writing."
        )
        pytest.fail(msg)
