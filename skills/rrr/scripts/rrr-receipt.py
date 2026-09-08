#!/usr/bin/env python3
"""Pure Oracle receipt validation; this module never contacts Oracle."""
from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path
from typing import Any

ACCEPTED = {"created", "replayed", "reconciled"}
RETAINED = {"partial", "degraded", "conflict", "unknown"}


def _canonical_request(request: dict[str, Any]) -> str:
    frozen = request.get("frozen_request")
    return json.dumps(frozen, sort_keys=True, separators=(",", ":")) if isinstance(frozen, dict) else ""


def validate(
    request: dict[str, Any],
    receipt: dict[str, Any],
    read_result: dict[str, Any],
    *,
    supersede_approved: bool = False,
) -> tuple[bool, str]:
    """Validate a frozen request, persistence receipt, and file-backed readback."""
    if request.get("operation") == "supersede" and not supersede_approved:
        return False, "supersede requires separate approval"
    if not _canonical_request(request):
        return False, "complete frozen request unavailable"
    outcome = receipt.get("outcome", "unknown")
    if outcome not in ACCEPTED:
        label = outcome if outcome in RETAINED else "unknown"
        return False, f"outcome retained: {label}"
    durability = receipt.get("durability")
    if receipt.get("success") is not True or not isinstance(durability, dict) or durability.get("level") != "full":
        return False, "receipt is not full success"
    if read_result.get("source") != "file" or not read_result.get("resolved_path"):
        return False, "read is not file-backed"
    project = request.get("canonical_project")
    if not project or project != read_result.get("project"):
        return False, "project mismatch"
    storage_root = request.get("storage_root")
    receipt_file = receipt.get("file")
    try:
        resolved_root = Path(storage_root).resolve(strict=False)
        resolved_file = Path(read_result["resolved_path"]).resolve(strict=False)
        if resolved_file != resolved_root and resolved_root not in resolved_file.parents:
            return False, "storage mismatch"
        if receipt_file and os.path.basename(str(receipt_file)) != resolved_file.name:
            return False, "receipt file mismatch"
    except (OSError, TypeError, ValueError):
        return False, "storage mismatch"
    content = read_result.get("content")
    if not isinstance(content, str):
        return False, "read content unavailable"
    digest = hashlib.sha256(content.encode()).hexdigest()
    if digest != durability.get("content_hash"):
        return False, "content hash mismatch"
    fingerprint = request.get("request_fingerprint")
    if not fingerprint or durability.get("request_fingerprint") != fingerprint:
        return False, "frozen request mismatch"
    if not request.get("idempotency_key"):
        return False, "idempotency key unavailable"
    return True, "accepted"


def retry_plan(outcome: str, attempts: int, request_changed: bool = False) -> str:
    """At most one retry, and only with the byte-identical frozen request/key."""
    if outcome == "unknown" and attempts == 0 and not request_changed:
        return "retry-identical-once"
    return "withheld/unknown"
