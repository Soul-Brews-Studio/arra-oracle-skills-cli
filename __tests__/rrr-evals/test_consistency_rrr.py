"""
Skill-execution consistency checks for /rrr.

- no-home-psi-write: /rrr must NOT write to ~/ψ/ (use repo-local ψ instead)
- no-task-tool:      base /rrr must not spawn subagents (only --deep may)
- retro-path-format: retro lives at ψ/memory/retrospectives/YYYY-MM/DD/*.md

The session-log checks parse a session .jsonl. They skip cleanly when
--session-log is not provided.
"""
from __future__ import annotations

import json
import datetime
from pathlib import Path

import pytest


def _iter_jsonl(p: Path):
    with p.open() as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                yield json.loads(line)
            except json.JSONDecodeError:
                continue


def _tool_uses(entry: dict):
    """Yield (tool_name, tool_input) for any tool_use found in the entry.

    Supports both flat (`{"type":"tool_use","name":...,"input":{...}}`) and
    Anthropic-message-shaped entries (`{"message":{"content":[{"type":"tool_use",...}]}}`).
    """
    if entry.get("type") == "tool_use":
        yield entry.get("name", ""), entry.get("input", {}) or {}
        return
    msg = entry.get("message") or {}
    content = msg.get("content") or []
    if isinstance(content, list):
        for block in content:
            if isinstance(block, dict) and block.get("type") == "tool_use":
                yield block.get("name", ""), block.get("input", {}) or {}


def test_no_home_psi_write(session_log_path):
    """No Write to ~/ψ/ (oracle root detection should redirect to repo-local ψ)."""
    home_psi = str(Path.home() / "ψ")
    offenders: list[str] = []
    for entry in _iter_jsonl(session_log_path):
        for name, inp in _tool_uses(entry):
            if name in ("Write", "Edit", "NotebookEdit"):
                path = str(inp.get("file_path", ""))
                if path.startswith(home_psi):
                    offenders.append(path)
    assert not offenders, (
        f"CONSISTENCY-FAIL: Wrote to ~/ψ/ directly ({len(offenders)} times): "
        f"{offenders[:5]}"
    )


def test_no_task_tool_used(session_log_path):
    """Base /rrr must not call the Task tool (subagents reserved for --deep)."""
    offenders: list[dict] = []
    for entry in _iter_jsonl(session_log_path):
        for name, inp in _tool_uses(entry):
            if name == "Task":
                offenders.append({"description": inp.get("description", "")})
    assert not offenders, (
        f"CONSISTENCY-FAIL: Task tool used in base /rrr ({len(offenders)} calls). "
        f"Only --deep may use subagents. First: {offenders[:3]}"
    )


def test_retro_path_format(psi, slug, today):
    """Retro file lives at ψ/memory/retrospectives/YYYY-MM/DD/*slug*.md."""
    expected_dir = psi / "memory" / "retrospectives" / today.strftime("%Y-%m") / today.strftime("%d")
    matches = list(expected_dir.glob(f"*{slug}*.md"))
    assert matches, (
        f"CONSISTENCY-FAIL: No retro for slug '{slug}' at expected path {expected_dir}/*{slug}*.md"
    )
