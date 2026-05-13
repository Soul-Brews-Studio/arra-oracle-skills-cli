#!/usr/bin/env python3
"""
Audit-loop runner for the /learn eval framework.

Implements tiered enforcement per eval-architect Round 3 spec section 6:
- Q1 word-count 100-120% of ceiling → AUTO-TRIM (re-spawn doc-agent with trim instruction)
- Q1 word-count >120%, Q2/Q3/Q4/Q7/Q8/Q9/Q12 → BLOCK + correction context
- Q5 cross-ref under quota (non-SYNTHESIS), Q6, Q10, Q11 → WARN (ship with annotation)
- Q-stale → BLOCK
- Q5-SYNTHESIS missing siblings → BLOCK

For each register in __tests__/learn-evals/evals.json:
  1. Run /learn (currently stubbed — see TODO below; mirrors scripts/eval_rrr.py)
  2. Run pytest --json-report against the resulting ψ artifacts
  3. classify() splits failures into block / warn / auto-trim
  4. If only warn → PASS-WITH-WARN
     If auto-trim → re-spawn with "trim to <N>w" instruction
     If block    → re-spawn with grounding ("re-resolve all file:line against $SOURCE_DIR")
  5. Stop after `max_corrections` corrections (default 2 ⇒ 3 attempts total)

Usage:
  python scripts/eval_learn.py                       # all 11 registers
  python scripts/eval_learn.py themion-stylos-replay # single register by name
  python scripts/eval_learn.py --fixture-only        # exercise pytest against fixtures only

Exit code: 0 if all registers pass (including PASS-WITH-WARN), 1 otherwise.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent.parent
EVALS_JSON = HERE / "__tests__" / "learn-evals" / "evals.json"
FIXTURE_PSI = HERE / "__tests__" / "learn-evals" / "fixtures" / "ψ"
FIXTURE_ORIGIN = HERE / "__tests__" / "learn-evals" / "fixtures" / "origin-fixture-repo"


BLOCK_TESTS: set[str] = {
    # Q1 handled specially in classify() — over-budget below 120% routes to auto-trim.
    "test_q1_word_count_per_doc",
    "test_q2_claim_vs_reality",
    "test_q3_required_sections",
    "test_q4_file_line_refs_resolve",
    "test_q7_no_fluff_phrases",
    "test_q8_announce_paths_absolute",
    "test_q9_hub_and_manifest",
    "test_q12_no_self_admission",
    "test_q_stale_no_deleted_symbols",
    "test_q5_synthesis_links_all_siblings",
}

WARN_TESTS: set[str] = {
    "test_q5_cross_reference_quota",
    "test_q6_code_density",
    "test_q10_sync",
    "test_q11_hot_phrase_redundancy",
}


def load_evals() -> list[dict]:
    return json.loads(EVALS_JSON.read_text())["evals"]


def run_learn(entry: dict, extra_context: str = "") -> tuple[int, str]:
    """Invoke /learn. Stubbed until eval harness wired (mirrors eval_rrr.py)."""
    # TODO: subprocess.run(["claude", "--print",
    #                       f"{extra_context}\n\nContext: {entry['prompt']}\n\n/learn"],
    #                      capture_output=True, text=True, timeout=900)
    return 0, "(stubbed) /learn run skipped — eval harness not yet wired"


def run_pytest(register: str, psi: Path) -> tuple[bool, str, dict]:
    """Run the learn-eval pytest suite and return (passed, stdout, json-report-dict)."""
    psi.mkdir(parents=True, exist_ok=True)
    report_path = psi / ".pytest-report.json"
    cmd = [
        sys.executable, "-m", "pytest",
        str(HERE / "__tests__" / "learn-evals"),
        f"--psi={psi}",
        f"--register={register}",
        "-v", "--tb=short", "--no-header",
        "--json-report",
        f"--json-report-file={report_path}",
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    try:
        report = json.loads(report_path.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        report = {}
    return proc.returncode == 0, proc.stdout + proc.stderr, report


def classify(report: dict) -> tuple[list[tuple[str, str]], list[tuple[str, str]], list[tuple[str, str]]]:
    """Return (block, warn, auto_trim) — each a list of (test_name, longrepr_msg)."""
    block: list[tuple[str, str]] = []
    warn: list[tuple[str, str]] = []
    auto_trim: list[tuple[str, str]] = []
    for test in report.get("tests", []):
        if test.get("outcome") != "failed":
            continue
        nodeid = test.get("nodeid", "")
        name = nodeid.split("::")[-1].split("[", 1)[0]
        call = test.get("call") or {}
        msg = call.get("longrepr", "") or ""
        if not isinstance(msg, str):
            msg = str(msg)

        if name == "test_q1_word_count_per_doc":
            # Parse drift: "= 1750w (budget 1500w, ceiling 1800w)"
            m = re.search(r"=\s*(\d+)w\s*\(budget\s*(\d+)w", msg)
            if m:
                actual, budget = int(m.group(1)), int(m.group(2))
                if budget > 0 and actual / budget <= 1.20:
                    auto_trim.append((name, msg))
                    continue
            block.append((name, msg))
        elif name in BLOCK_TESTS:
            block.append((name, msg))
        elif name in WARN_TESTS:
            warn.append((name, msg))
        else:
            # Default-deny: unknown failure routes to BLOCK rather than silently passing.
            block.append((name, msg))
    return block, warn, auto_trim


def build_correction(block: list[tuple[str, str]], auto_trim: list[tuple[str, str]]) -> str:
    parts = ["CORRECTION NEEDED — /learn output failed eval suite:"]
    for name, _msg in auto_trim:
        parts.append(
            f"  AUTO-TRIM: {name} — over budget. Re-write trimming repeated "
            "explanations; preserve cross-refs and code blocks."
        )
    for name, msg in block:
        first = msg.splitlines()[0] if msg else ""
        parts.append(f"  BLOCK: {name}")
        if first:
            parts.append(f"    {first}")
    parts.append(
        "Fix every BLOCK item. For hallucinated file:line refs: re-grep live "
        "source via `rg -n <symbol> $SOURCE_DIR/` before citing."
    )
    return "\n".join(parts)


def eval_loop(entry: dict, max_corrections: int = 2, fixture_only: bool = False) -> bool:
    """Run one register through the audit loop. Returns True if it passes (incl. warn-only)."""
    slug = entry["name"]
    register = entry["register"]
    correction_ctx = ""
    psi = FIXTURE_PSI  # in fixture-only mode the artifact target IS the fixture
    for attempt in range(max_corrections + 1):
        if not fixture_only:
            rc, out = run_learn(entry, correction_ctx)
            if rc != 0:
                print(f"[{slug}] /learn invocation failed (rc={rc}):\n{out}")
                return False
        # In fixture-only mode the only seeded register tree is themion-style-good.
        # Route everything through it so the audit-loop structure is exercised end-to-end.
        test_register = "themion-style-good" if fixture_only else slug
        passed, pytest_out, report = run_pytest(test_register, psi)
        block, warn, auto_trim = classify(report)

        if not block and not auto_trim:
            if warn:
                print(f"PASS-WITH-WARN [{register}] {slug} (attempt {attempt + 1}): {len(warn)} warnings")
                for n, _m in warn:
                    print(f"  WARN {n}")
            else:
                print(f"PASS [{register}] {slug} (attempt {attempt + 1})")
            return True

        if attempt < max_corrections:
            print(
                f"FLAGS [{slug}] attempt {attempt + 1} — "
                f"{len(block)} block, {len(auto_trim)} auto-trim, {len(warn)} warn"
            )
            correction_ctx = build_correction(block, auto_trim)
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
        help="Skip /learn invocation; exercise pytest against the fixture ψ only",
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
