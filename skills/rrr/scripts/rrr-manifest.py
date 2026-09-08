#!/usr/bin/env python3
"""Durable, owner-private local state for RRR.

This module records local evidence only. It has no Git, Oracle, cleanup, or
remote executor. Mutations use an expected revision while holding one
per-manifest lock, so concurrent writers cannot both commit the same revision.
"""
from __future__ import annotations

import argparse
import fcntl
import json
import os
import re
import secrets
import tempfile
from pathlib import Path
from typing import Any

SCHEMA_VERSION = 1
JOURNAL_LIMIT = 100
NONCE_RE = re.compile(r"^[0-9a-f]{32}$")
CAPTURE_STATES = {
    "observed", "candidate", "verified", "published", "hypothesis",
    "session-only", "withheld", "superseded",
}
TRANSITIONS = {
    "observed": {"candidate", "hypothesis", "session-only", "withheld"},
    "candidate": {"verified", "hypothesis", "session-only", "withheld"},
    "verified": {"published", "session-only", "withheld"},
    "published": {"superseded"},
    "hypothesis": {"candidate", "session-only", "withheld"},
    "session-only": set(),
    "withheld": {"candidate"},
    "superseded": set(),
}


def state_root() -> Path:
    base = Path(os.environ.get("XDG_STATE_HOME", str(Path.home() / ".local/state")))
    return base / "rrr"


def _fsync_dir(path: Path) -> None:
    descriptor = os.open(path, os.O_RDONLY | getattr(os, "O_DIRECTORY", 0))
    try:
        os.fsync(descriptor)
    finally:
        os.close(descriptor)


def _ensure_private_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True, mode=0o700)
    stat = path.lstat()
    if path.is_symlink() or not path.is_dir():
        raise ValueError("state directory must be a real directory")
    if stat.st_uid != os.geteuid():
        raise ValueError("state directory is not owned by the current user")
    os.chmod(path, 0o700)


def _encode(value: dict[str, Any]) -> bytes:
    return (json.dumps(value, sort_keys=True, separators=(",", ":")) + "\n").encode()


def _write_new(path: Path, value: dict[str, Any]) -> None:
    """Publish a fully written new manifest without replacing an existing one."""
    fd, temporary = tempfile.mkstemp(prefix=".manifest.new.", dir=path.parent)
    temporary_path = Path(temporary)
    try:
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, "wb") as stream:
            stream.write(_encode(value))
            stream.flush()
            os.fsync(stream.fileno())
        # Hard-link publication is same-filesystem, atomic, and fails if path exists.
        os.link(temporary_path, path)
        temporary_path.unlink()
        _fsync_dir(path.parent)
    finally:
        try:
            os.close(fd)
        except OSError:
            pass
        if temporary_path.exists():
            temporary_path.unlink()


def _replace(path: Path, value: dict[str, Any]) -> None:
    fd, temporary = tempfile.mkstemp(prefix=".manifest.write.", dir=path.parent)
    temporary_path = Path(temporary)
    try:
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, "wb") as stream:
            stream.write(_encode(value))
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(temporary_path, path)
        os.chmod(path, 0o600)
        _fsync_dir(path.parent)
    finally:
        try:
            os.close(fd)
        except OSError:
            pass
        if temporary_path.exists():
            temporary_path.unlink()


def _manifest_template(session_id: str, nonce: str, child: bool) -> dict[str, Any]:
    return {
        "schema_version": SCHEMA_VERSION,
        "revision": 0,
        "task_nonce": nonce,
        "session_id": session_id,
        "child": child,
        "consent": {"oracle_publish": "unknown", "vault": "unknown"},
        "oracle": {
            "canonical_project": None,
            "storage_root": None,
            "frozen_request": None,
            "idempotency_key": None,
            "request_fingerprint": None,
            "receipt": None,
        },
        "blocked_reason": None,
        "evidence_provenance": [],
        "coverage": "unavailable",
        "lifecycle": "observed",
        "captures": [],
        "cleanup_preview_candidates": [],
        "vault_request": None,
        "journal": [],
    }


def validate_manifest(value: Any) -> dict[str, Any]:
    if not isinstance(value, dict) or value.get("schema_version") != SCHEMA_VERSION:
        raise ValueError("unsupported manifest schema")
    if not isinstance(value.get("revision"), int) or value["revision"] < 0:
        raise ValueError("invalid manifest revision")
    if not isinstance(value.get("session_id"), str) or not value["session_id"]:
        raise ValueError("invalid session id")
    if not isinstance(value.get("child"), bool) or not NONCE_RE.fullmatch(str(value.get("task_nonce", ""))):
        raise ValueError("invalid task identity")
    if not isinstance(value.get("consent"), dict) or not isinstance(value.get("oracle"), dict):
        raise ValueError("missing consent or Oracle state")
    required_oracle = {
        "canonical_project", "storage_root", "frozen_request", "idempotency_key",
        "request_fingerprint", "receipt",
    }
    if not required_oracle.issubset(value["oracle"]):
        raise ValueError("incomplete Oracle state")
    if value.get("lifecycle") not in CAPTURE_STATES:
        raise ValueError("invalid lifecycle")
    for key in ("captures", "cleanup_preview_candidates", "evidence_provenance", "journal"):
        if not isinstance(value.get(key), list):
            raise ValueError(f"invalid {key}")
    capture_ids: set[str] = set()
    for capture in value["captures"]:
        if not isinstance(capture, dict) or capture.get("state") not in CAPTURE_STATES:
            raise ValueError("invalid capture")
        capture_id = capture.get("id")
        if not isinstance(capture_id, str) or not capture_id or capture_id in capture_ids:
            raise ValueError("invalid or duplicate capture id")
        capture_ids.add(capture_id)
    return value


def create(session_id: str, child: bool = False) -> Path:
    if not session_id or any(character in session_id for character in "/\\\0"):
        raise ValueError("invalid session id")
    root = state_root()
    _ensure_private_dir(root)
    while True:
        nonce = secrets.token_hex(16)
        task = root / f"{session_id}-{nonce}"
        try:
            os.mkdir(task, 0o700)
            break
        except FileExistsError:
            continue
    _fsync_dir(root)
    path = task / "manifest.json"
    _write_new(path, _manifest_template(session_id, nonce, child))
    return path


def _validated_manifest_path(path: str | Path) -> Path:
    candidate = Path(path)
    resolved_root = state_root().resolve(strict=True)
    resolved = candidate.resolve(strict=True)
    if resolved.name != "manifest.json" or resolved_root not in resolved.parents:
        raise ValueError("manifest is outside the RRR state root")
    stat = resolved.stat()
    if stat.st_uid != os.geteuid() or stat.st_mode & 0o077:
        raise ValueError("manifest is not owner-private")
    return resolved


def load(path: str | Path) -> dict[str, Any]:
    manifest = _validated_manifest_path(path)
    return validate_manifest(json.loads(manifest.read_text()))


def _apply(value: dict[str, Any], operation: str, payload: dict[str, Any]) -> tuple[str | None, str | None]:
    before: str | None = None
    after: str | None = None
    if operation == "candidate-add":
        state = payload.get("state", "candidate")
        if state not in {"candidate", "hypothesis", "session-only", "withheld"}:
            raise ValueError("illegal initial capture state")
        capture_id = payload.get("id") or secrets.token_hex(8)
        if any(item["id"] == capture_id for item in value["captures"]):
            raise ValueError("duplicate capture id")
        value["captures"].append({"id": capture_id, "state": state, "payload": payload})
        before, after = "observed", state
    elif operation == "candidate-transition":
        capture_id = payload.get("id")
        target = payload.get("state")
        matches = [item for item in value["captures"] if item["id"] == capture_id]
        if len(matches) != 1 or target not in CAPTURE_STATES:
            raise ValueError("unknown capture or state")
        capture = matches[0]
        before = capture["state"]
        if target not in TRANSITIONS[before]:
            raise ValueError("illegal capture transition")
        capture["state"] = target
        after = target
    elif operation == "oracle-freeze":
        required = {"canonical_project", "storage_root", "frozen_request", "idempotency_key", "request_fingerprint"}
        if not required.issubset(payload) or not isinstance(payload.get("frozen_request"), dict):
            raise ValueError("incomplete frozen Oracle request")
        value["oracle"].update({key: payload[key] for key in required})
    elif operation == "oracle-receipt":
        if value["oracle"]["frozen_request"] is None:
            raise ValueError("Oracle request is not frozen")
        value["oracle"]["receipt"] = payload
    elif operation == "cleanup-candidate":
        required = {"path", "creator_receipt", "device", "inode", "sha256", "quiescent"}
        if not required.issubset(payload):
            raise ValueError("incomplete cleanup candidate")
        value["cleanup_preview_candidates"].append(payload)
    elif operation == "vault-request":
        value["vault_request"] = {"status": "not implemented in this release", "request": payload}
    elif operation == "import-child-reviewed":
        if value["child"] or payload.get("reviewed") is not True:
            raise ValueError("explicit parent review is required")
        child = load(payload.get("manifest", ""))
        if not child["child"] or child["session_id"] != value["session_id"]:
            raise ValueError("manifest is not a child of this session")
        for capture in child["captures"]:
            imported = json.loads(json.dumps(capture))
            imported["id"] = f"{child['task_nonce']}:{capture['id']}"
            imported["imported_from_child"] = child["task_nonce"]
            value["captures"].append(imported)
    else:
        raise ValueError("unsupported local operation")
    return before, after


def mutate(path: str | Path, expected: int, operation: str, payload: dict[str, Any]) -> dict[str, Any]:
    manifest = _validated_manifest_path(path)
    lock_path = manifest.with_name("manifest.lock")
    flags = os.O_RDWR | os.O_CREAT | getattr(os, "O_NOFOLLOW", 0)
    descriptor = os.open(lock_path, flags, 0o600)
    try:
        os.fchmod(descriptor, 0o600)
        fcntl.flock(descriptor, fcntl.LOCK_EX)
        value = validate_manifest(json.loads(manifest.read_text()))
        if value["revision"] != expected:
            raise ValueError("expected revision mismatch")
        before, after = _apply(value, operation, payload)
        value["revision"] += 1
        value["journal"] = (value["journal"] + [{
            "revision": value["revision"], "operation": operation,
            "from": before, "to": after,
        }])[-JOURNAL_LIMIT:]
        validate_manifest(value)
        _replace(manifest, value)
        return value
    finally:
        os.close(descriptor)


def main() -> int:
    parser = argparse.ArgumentParser()
    commands = parser.add_subparsers(dest="command", required=True)
    init = commands.add_parser("init")
    init.add_argument("session_id")
    init.add_argument("--child", action="store_true")
    show = commands.add_parser("show")
    show.add_argument("manifest")
    change = commands.add_parser("mutate")
    change.add_argument("manifest")
    change.add_argument("expected", type=int)
    change.add_argument("operation", choices=[
        "candidate-add", "candidate-transition", "oracle-freeze", "oracle-receipt",
        "cleanup-candidate", "vault-request", "import-child-reviewed",
    ])
    change.add_argument("payload", nargs="?", default="{}")
    args = parser.parse_args()
    if args.command == "init":
        result: Any = {"manifest": str(create(args.session_id, args.child))}
    elif args.command == "show":
        result = load(args.manifest)
    else:
        result = mutate(args.manifest, args.expected, args.operation, json.loads(args.payload))
    print(json.dumps(result, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, json.JSONDecodeError) as error:
        print(f"rrr-manifest: {error}", file=os.sys.stderr)
        raise SystemExit(2)
