#!/usr/bin/env python3
"""Strict cleanup eligibility preview; never moves, removes, or terminates."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import stat
from pathlib import Path
from typing import Any


def _result(reason: str, **facts: Any) -> dict[str, Any]:
    return {"eligible": False, "action": "retain", "reason": reason, **facts}


def _private_directory(path: Path) -> bool:
    try:
        metadata = path.lstat()
        return stat.S_ISDIR(metadata.st_mode) and not path.is_symlink() and metadata.st_uid == os.geteuid() and not metadata.st_mode & 0o077
    except OSError:
        return False


def _within(path: Path, root: Path) -> bool:
    try:
        path.relative_to(root)
        return path != root
    except ValueError:
        return False


def _has_symlink_component(root: Path, target: Path) -> bool:
    current = root
    if current.is_symlink():
        return True
    for part in target.relative_to(root).parts:
        current = current / part
        try:
            if current.is_symlink():
                return True
        except OSError:
            return True
    return False


def preview(candidate: str, manifest: str, rescue: str | None = None) -> dict[str, Any]:
    """Return eligibility evidence while remaining unconditionally non-mutating."""
    root = Path(os.environ.get("XDG_STATE_HOME", str(Path.home() / ".local/state"))) / "rrr"
    candidate_path = Path(candidate).absolute()
    manifest_path = Path(manifest).absolute()

    # Lexical/owner gates happen before opening either untrusted target.
    if not _private_directory(root):
        return _result("RRR scratch root is unavailable or not owner-private")
    if not _within(candidate_path, root) or not _within(manifest_path, root):
        return _result("outside owner-private scratch root")
    if _has_symlink_component(root, candidate_path) or _has_symlink_component(root, manifest_path):
        return _result("symlink ancestry")

    try:
        manifest_stat = manifest_path.lstat()
        if not stat.S_ISREG(manifest_stat.st_mode) or manifest_stat.st_uid != os.geteuid() or manifest_stat.st_mode & 0o077:
            return _result("manifest is not owner-private")
        data = json.loads(manifest_path.read_text())
    except (OSError, ValueError, json.JSONDecodeError):
        return _result("manifest unavailable")

    matches = [
        item for item in data.get("cleanup_preview_candidates", [])
        if isinstance(item, dict) and item.get("path") == str(candidate_path) and item.get("creator_receipt")
    ]
    if len(matches) != 1:
        return _result("no unique creator receipt")
    receipt = matches[0]

    try:
        metadata = candidate_path.lstat()
        if not stat.S_ISREG(metadata.st_mode) or metadata.st_nlink != 1:
            return _result("not a regular single-link file")
        facts = {
            "device": metadata.st_dev,
            "inode": metadata.st_ino,
            "sha256": hashlib.sha256(candidate_path.read_bytes()).hexdigest(),
        }
    except OSError:
        return _result("candidate unavailable")

    if any(receipt.get(key) != facts[key] for key in ("device", "inode", "sha256")):
        return _result("candidate identity or content changed", **facts)
    if receipt.get("quiescent") is not True:
        return _result("quiescence unknown", **facts)
    if rescue is None:
        return _result("durable rescue destination unavailable", **facts)

    rescue_path = Path(rescue).absolute()
    if rescue_path.exists() or rescue_path.is_symlink():
        return _result("rescue destination would clobber", **facts)
    if not _private_directory(rescue_path.parent):
        return _result("rescue parent is not owner-private", **facts)
    try:
        if rescue_path.parent.stat().st_dev != metadata.st_dev:
            return _result("cross-device rescue deferred", **facts)
    except OSError:
        return _result("rescue destination unavailable", **facts)

    return {
        "eligible": True,
        "action": "retain",
        "reason": "cleanup execution deferred in this release",
        **facts,
        "rescue": str(rescue_path),
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("path")
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--rescue")
    args = parser.parse_args()
    print(json.dumps(preview(args.path, args.manifest, args.rescue), sort_keys=True))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
