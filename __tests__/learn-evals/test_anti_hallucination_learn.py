"""
Q4: file:line refs resolve against git-pinned origin/ HEAD.

Default mode: parse-and-stat per ref — file must exist at HEAD AND lineno must
be within the file's line count.

--strict mode: also require the nearest backticked symbol within 200 chars of
the ref appears in the referenced line ±2.

Rejecting Q4 cheap-proxy: tempted to just check `Path(origin/relpath).exists()`
(any file by name). Rejected because that doesn't catch the `tools.rs:625 →
actual 1345` class — the file exists, the line is fictional. Pinned
`git rev-parse HEAD` + line-count + (optional) symbol-window match is the spec.
"""
from __future__ import annotations

import re
import subprocess
from pathlib import Path

import pytest


REF_RE = re.compile(
    r"\b([\w/.\-]+\.(?:rs|ts|tsx|js|jsx|py|go|rb|cpp|cc|h|hpp|java|kt|swift|md|toml|yaml|yml|json)):(\d+)\b"
)


def _git_blob(origin: Path, head: str, relpath: str) -> str | None:
    """Return the file blob at HEAD as text, or None if missing."""
    try:
        if head:
            return subprocess.check_output(
                ["git", "-C", str(origin), "show", f"{head}:{relpath}"],
                text=True, stderr=subprocess.DEVNULL,
            )
        # No head (origin is not a git repo) — read from filesystem directly.
        fs_path = origin / relpath
        if fs_path.exists() and fs_path.is_file():
            return fs_path.read_text()
        return None
    except subprocess.CalledProcessError:
        return None


def _line_count(blob: str | None) -> int | None:
    if blob is None:
        return None
    # Count "lines" the way `wc -l` + 1 would for non-newline-terminated text.
    return blob.count("\n") + (0 if blob.endswith("\n") else 1) if blob else 1


def _line_at(blob: str | None, lineno: int) -> str | None:
    if blob is None:
        return None
    lines = blob.splitlines()
    return lines[lineno - 1] if 0 < lineno <= len(lines) else None


def _resolve_ref(origin: Path, head: str, relpath: str) -> tuple[str | None, int | None]:
    """Return (blob, length) — or (None, None) if file missing at HEAD."""
    blob = _git_blob(origin, head, relpath)
    if blob is None:
        return None, None
    return blob, _line_count(blob)


def _validate_ref(
    origin: Path,
    head: str,
    body: str,
    m: re.Match,
    strict: bool,
) -> str | None:
    """Return None if ref is valid, otherwise a failure reason string."""
    relpath, lineno_s = m.group(1), int(m.group(2))
    blob, length = _resolve_ref(origin, head, relpath)
    if blob is None:
        return "FILE NOT FOUND at HEAD"
    if length is not None and lineno_s > length:
        return f"line {lineno_s} > file length {length}"
    if strict:
        # Pull a 200-char prefix window to find the nearest backticked symbol.
        ctx_start = max(0, m.start() - 200)
        window = body[ctx_start : m.end() + 100]
        sym_m = re.search(r"`([A-Za-z_]\w+)`", window)
        if sym_m:
            sym = sym_m.group(1)
            for delta in (-2, -1, 0, 1, 2):
                line = _line_at(blob, lineno_s + delta)
                if line and sym in line:
                    return None
            return f"symbol `{sym}` not in {relpath}:{lineno_s}±2"
    return None


def test_q4_file_line_refs_resolve(session_docs, origin_dir, pinned_head, strict_mode):
    """Q4 (BLOCK, default-on): every file:line ref resolves against pinned HEAD.

    Default: file exists at HEAD + line within file length.
    --strict: also require the nearest backticked symbol appears in line ±2.
    """
    if not session_docs:
        pytest.skip("Q4: no session docs found at fixture path")
    failures: list[tuple[str, str, str]] = []
    for doc in session_docs:
        body = doc.read_text()
        for m in REF_RE.finditer(body):
            reason = _validate_ref(origin_dir, pinned_head, body, m, strict_mode)
            if reason is not None:
                failures.append((doc.name, m.group(0), reason))
    if failures:
        head_display = pinned_head[:8] if pinned_head else "(no git head — filesystem fallback)"
        msg = (
            f"Q4-BLOCK: {len(failures)} unresolved file:line refs against HEAD={head_display}. "
            f"First 5:\n" +
            "\n".join(f"  {d}: {ref} — {why}" for d, ref, why in failures[:5])
        )
        pytest.fail(msg)
