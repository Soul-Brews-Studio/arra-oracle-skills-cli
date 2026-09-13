#!/usr/bin/env python3
"""Create a deterministic baseline architecture pack from a JSON project profile."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


PATTERNS = {
    "modern-fullstack": "A — Modern Full-Stack",
    "rapid-mvp": "B — Rapid MVP",
    "transaction": "C — High-Scale Transaction",
    "ai-native": "D — AI-Native",
    "realtime": "E — Realtime",
    "edge-global": "F — Edge / Global",
    "enterprise-modular": "G — Enterprise Modular",
    "multi-tenant": "H — Multi-Tenant SaaS",
    "agentic": "I — Agentic Platform",
    "content": "J — Content / Marketing",
}


def truthy(profile: dict[str, Any], key: str) -> bool:
    return bool(profile.get(key, False))


def select(profile: dict[str, Any]) -> tuple[str, list[str], list[str]]:
    kind = str(profile.get("product_type", "business-app")).lower()
    modules = {"core", "database", "observability"}
    reasons: list[str] = []

    if truthy(profile, "payments") or truthy(profile, "scarce_capacity") or truthy(profile, "flash_crowd"):
        primary = "transaction"
        modules.update({"redis", "queue", "audit"})
        reasons.append("Correctness under contention or financial state dominates.")
    elif truthy(profile, "agentic"):
        primary = "agentic"
        modules.update({"ai", "agent", "queue", "audit"})
        reasons.append("Autonomous multi-step tool execution is core behavior.")
    elif truthy(profile, "ai_core"):
        primary = "ai-native"
        modules.update({"ai", "queue"})
        reasons.append("Model or retrieval behavior is central to the product.")
    elif truthy(profile, "realtime"):
        primary = "realtime"
        modules.update({"realtime", "redis"})
        reasons.append("Shared low-latency state is product-critical.")
    elif truthy(profile, "global_latency"):
        primary = "edge-global"
        modules.add("edge")
        reasons.append("Measured global latency or locality drives the architecture.")
    elif kind in {"content", "marketing", "docs", "news"}:
        primary = "content"
        modules.add("cms")
        reasons.append("Publishing and discovery dominate over transactions.")
    elif truthy(profile, "enterprise_domains"):
        primary = "enterprise-modular"
        reasons.append("Multiple business domains or team ownership boundaries are material.")
    elif truthy(profile, "multi_tenant"):
        primary = "multi-tenant"
        modules.update({"auth", "tenancy", "audit"})
        reasons.append("Organization-level data isolation is a first-order requirement.")
    elif truthy(profile, "mvp_speed"):
        primary = "rapid-mvp"
        reasons.append("Validated learning and low operational overhead dominate.")
    else:
        primary = "modern-fullstack"
        reasons.append("A modular full-stack application is the minimum sufficient baseline.")

    if truthy(profile, "auth") or truthy(profile, "multi_tenant"):
        modules.add("auth")
    if truthy(profile, "multi_tenant"):
        modules.update({"tenancy", "audit"})
    if truthy(profile, "files"):
        modules.add("storage")
    if truthy(profile, "payments"):
        modules.update({"payment", "email", "audit"})
    if truthy(profile, "background_jobs"):
        modules.add("queue")
    if truthy(profile, "vector_search"):
        modules.add("vector")
    if truthy(profile, "search"):
        modules.add("search")

    return primary, sorted(modules), reasons


def render(profile: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    primary, modules, reasons = select(profile)
    name = str(profile.get("name", "New Application"))
    assumptions = profile.get("assumptions", [])
    if not isinstance(assumptions, list):
        assumptions = [str(assumptions)]
    assumption_lines = "\n".join(f"- {item}" for item in assumptions)
    if not assumption_lines:
        assumption_lines = "- No project-specific assumptions supplied; validate traffic, data sensitivity, tenancy, and deployment constraints."

    md = f"""# Architecture Decision — {name}

## Decision summary

- Primary pattern: **{PATTERNS[primary]}**
- Modules: {', '.join(f'`{item}`' for item in modules)}
- Basis: {' '.join(reasons)}

## Assumptions

{assumption_lines}

## Required design work

1. Define clients, trust boundaries, domain modules, workers, stores, and external dependencies.
2. State source of truth, consistency, idempotency, cache, retention, and backup rules.
3. Map the highest-impact failures to prevention, detection, recovery, and degraded behavior.
4. Complete security, privacy, observability, testing, CI/CD, and rollout decisions.
5. Record deferred decisions with measurable triggers.

## Scale-up triggers

- Extract a service only for proven independent scale, isolation, ownership, or release needs.
- Add distributed infrastructure only for a measured coordination, latency, or throughput requirement.
- Revisit the pattern when traffic shape, compliance scope, tenancy model, or critical workflows materially change.
"""
    result = {
        "name": name,
        "primary_pattern": primary,
        "primary_pattern_label": PATTERNS[primary],
        "modules": modules,
        "reasons": reasons,
        "source_profile": profile,
    }
    return md, result


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("profile", type=Path, help="Input JSON project profile")
    parser.add_argument("--output", type=Path, required=True, help="Output directory")
    args = parser.parse_args()

    profile = json.loads(args.profile.read_text(encoding="utf-8"))
    if not isinstance(profile, dict):
        raise SystemExit("Profile must be a JSON object")
    args.output.mkdir(parents=True, exist_ok=True)
    markdown, result = render(profile)
    (args.output / "ARCHITECTURE_DECISION.md").write_text(markdown, encoding="utf-8")
    (args.output / "STACK_PROFILE.json").write_text(
        json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


if __name__ == "__main__":
    main()

