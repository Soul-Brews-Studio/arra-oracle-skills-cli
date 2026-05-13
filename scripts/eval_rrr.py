#!/usr/bin/env python3
"""
Audit-loop runner for the /rrr eval framework.

For each eval in __tests__/rrr-evals/evals.json:
  1. Run /rrr (currently stubbed — see TODO below)
  2. Run pytest against the resulting ψ artifacts
  3. If any test fails, inject the failure messages into the next /rrr attempt
  4. Stop after `max_corrections` corrections (default 2 ⇒ 3 attempts total)

Spec source: ψ/memory/mailbox/eval-architect/2026-05-13_brainstorm-recovered.md
(Round 3 section 5).

Usage:
  python scripts/eval_rrr.py                # run all 7 registers
  python scripts/eval_rrr.py bug-fix        # run a single register by name
  python scripts/eval_rrr.py --fixture-only # don't run claude; just exercise fixtures

Exit code: 0 if all registers PASS, 1 otherwise.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
EVALS_JSON = HERE / "__tests__" / "rrr-evals" / "evals.json"
FIXTURE_PSI = HERE / "__tests__" / "rrr-evals" / "fixtures" / "ψ"


def load_evals() -> list[dict]:
    return json.loads(EVALS_JSON.read_text())["evals"]


def run_rrr(register_prompt: str, extra_context: str = "") -> tuple[int, str]:
    """Invoke /rrr via the claude CLI with the eval prompt as synthetic context.

    The brainstorm spec stubs this as aspirational — the real wiring lands
    when an eval harness exists. For now we no-op so the audit-loop structure
    is testable. Replace with a real subprocess.run when ready.
    """
    # TODO: wire to real claude CLI when eval harness lands.
    # Example shape:
    #   prompt = f"{extra_context}\n\nContext: {register_prompt}\n\n/rrr"
    #   result = subprocess.run(["claude", "--print", prompt],
    #                           capture_output=True, text=True, timeout=600)
    #   return result.returncode, result.stdout + result.stderr
    return 0, "(stubbed) /rrr run skipped — eval harness not yet wired"


def run_pytest(slug: str, psi: Path) -> tuple[bool, str]:
    """Run the rrr-eval pytest suite against `psi` for a single slug.

    Returns (passed, output).
    """
    cmd = [
        sys.executable, "-m", "pytest",
        str(HERE / "__tests__" / "rrr-evals"),
        f"--psi={psi}",
        f"--slug={slug}",
        "-v", "--tb=short", "--no-header",
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    return proc.returncode == 0, proc.stdout + proc.stderr


def eval_loop(entry: dict, max_corrections: int = 2, fixture_only: bool = False) -> bool:
    """Run one register through the audit loop. Returns True if it passes."""
    slug = entry["name"]
    register = entry["register"]
    correction_ctx = ""
    psi = FIXTURE_PSI  # in fixture-only mode the artifact target IS the fixture
    for attempt in range(max_corrections + 1):
        if not fixture_only:
            rc, rrr_output = run_rrr(entry["prompt"], extra_context=correction_ctx)
            if rc != 0:
                print(f"[{slug}] /rrr invocation failed (rc={rc}):\n{rrr_output}")
                return False
        # In fixture-only mode we don't have per-register fixtures, so route
        # every register through the sample-good fixture to exercise the loop
        # structure. When the real claude CLI is wired, the slug will match.
        test_slug = "sample-good" if fixture_only else slug
        passed, pytest_out = run_pytest(test_slug, psi)
        if passed:
            print(f"PASS [{register}] {slug} (attempt {attempt + 1})")
            return True
        if attempt < max_corrections:
            print(f"FLAGS [{slug}] attempt {attempt + 1} — injecting correction context")
            correction_ctx = (
                "CORRECTION NEEDED — previous /rrr attempt failed the eval suite:\n"
                f"{pytest_out}\n"
                "Fix every flagged item in your next run."
            )
        else:
            print(f"EVAL_FAIL [{register}] {slug} after {max_corrections + 1} attempts:")
            print(pytest_out)
            return False
    return False


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("register", nargs="?", help="Single register to run (default: all)")
    ap.add_argument("--max-corrections", type=int, default=2)
    ap.add_argument(
        "--fixture-only",
        action="store_true",
        help="Skip /rrr invocation; exercise pytest against the fixture ψ only",
    )
    args = ap.parse_args()

    evals = load_evals()
    if args.register:
        evals = [e for e in evals if e["name"] == args.register or e["register"] == args.register]
        if not evals:
            print(f"No eval matching '{args.register}' found in {EVALS_JSON}")
            return 1

    results = {e["name"]: eval_loop(e, args.max_corrections, args.fixture_only) for e in evals}
    passed = sum(1 for v in results.values() if v)
    print(f"\n{passed}/{len(results)} registers passed")
    return 0 if passed == len(results) else 1


if __name__ == "__main__":
    sys.exit(main())
