#!/usr/bin/env python3
"""Allowlist-only outward composer with recursive secret classification."""
from __future__ import annotations

import json
import re
import sys
from typing import Any

OUTWARD_FIELDS = {
    "title", "pattern", "concepts", "source", "project", "evidence_references",
    "error_summary", "retro_text", "manifest_destination", "oracle_payload",
}
NON_PUBLISHABLE_STATES = {"hypothesis", "session-only", "withheld", "superseded"}
NON_PUBLISHABLE_ORIGINS = {"copied", "delegated"}
SECRET_PATTERNS = [
    re.compile(r"AKIA[0-9A-Z]{16}"),
    re.compile(r"(?:ghp_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,}|sk-[A-Za-z0-9_-]{20,}|xox[baprs]-[A-Za-z0-9-]+)", re.I),
    re.compile(r"Bearer\s+[A-Za-z0-9._~+/-]{12,}", re.I),
    re.compile(r"-----BEGIN [A-Z ]*PRIVATE KEY-----"),
    re.compile(r"eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+"),
    re.compile(r"(?:password|passwd|secret|api[_-]?key|access[_-]?token|authorization|MS365_MCP_[A-Z_]+)\s*[:=]\s*\S+", re.I),
    re.compile(r"\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b", re.I),
    re.compile(r"(?<![A-Za-z0-9+/])[A-Za-z0-9+/]{100,}={0,2}(?![A-Za-z0-9+/])"),
]


def _contains_secret(value: Any) -> bool:
    rendered = json.dumps(value, ensure_ascii=False, sort_keys=True)
    return any(pattern.search(rendered) for pattern in SECRET_PATTERNS)


def compose(fields: dict[str, Any]) -> dict[str, Any]:
    if not isinstance(fields, dict):
        raise ValueError("rejected: invalid outward record")
    state = fields.get("state", "candidate")
    origin = fields.get("origin", "agent-observation")
    if fields.get("sensitive") is True:
        raise ValueError("rejected: sensitive classification")
    if fields.get("publish") is True and (state in NON_PUBLISHABLE_STATES or origin in NON_PUBLISHABLE_ORIGINS):
        raise ValueError("rejected: non-publishable capture classification")
    result: dict[str, Any] = {}
    for key in sorted(OUTWARD_FIELDS):
        if key not in fields:
            continue
        if _contains_secret(fields[key]):
            # Name only the field/class; never echo the matched value.
            raise ValueError(f"rejected: credential-bearing {key}")
        result[key] = fields[key]
    if origin == "operator":
        result["attribution"] = "direct operator statement"
    return result


if __name__ == "__main__":
    try:
        print(json.dumps(compose(json.load(sys.stdin)), ensure_ascii=False, sort_keys=True))
    except (ValueError, json.JSONDecodeError) as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(2)
