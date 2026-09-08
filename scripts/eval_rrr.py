#!/usr/bin/env python3
"""Behavioral self-test for RRR; this runner never invokes a live installed skill."""
from __future__ import annotations

import argparse
import re
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REQUIRED_HEADINGS = (
    "# Session Retrospective",
    "## Session Summary",
    "## Timeline",
    "## Technical Details",
    "## Lessons Learned",
    "## Self-Audit",
)
POSITIVE_CLAIM = re.compile(r"(?i)\b(?:completed|fixed|passed|published|shipped|success(?:ful(?:ly)?)?)\b")
EVIDENCE = re.compile(r"(?i)(?:evidence(?: pointer)?\s*[:=]|`(?:git|test|file|tool):[^`]+`|evidence unavailable)")


def validate_artifact(path: Path) -> list[str]:
    """Reject structurally plausible retrospectives with unsupported success claims."""
    text = path.read_text()
    errors = [f"missing heading: {heading}" for heading in REQUIRED_HEADINGS if heading not in text]
    for number, line in enumerate(text.splitlines(), 1):
        if POSITIVE_CLAIM.search(line) and not EVIDENCE.search(line):
            errors.append(f"unsupported positive claim at line {number}")
    if re.search(r"(?i)\b(?:exactly three|mandatory mistake|at least (?:100|150) words)\b", text):
        errors.append("fabrication quota present")
    return errors


def _fixture(summary: str) -> str:
    return f"""# Session Retrospective
## Session Summary
{summary}
## Timeline
- ordered untimed event — evidence unavailable
## Technical Details
### Files Modified
none observed
### Architecture Decisions
none observed
## What Went Well
none observed
## What Could Improve
evidence unavailable
## Blockers & Resolutions
none observed
## Lessons Learned
- none observed
## Next Steps
- [ ] none
## Self-Audit
- claims: evidence pointers or unavailable
"""


def self_test() -> int:
    checks: list[tuple[str, bool, str]] = []
    with tempfile.TemporaryDirectory(prefix="rrr-eval-") as directory:
        good = Path(directory) / "good.md"
        bad = Path(directory) / "bad.md"
        good.write_text(_fixture("Completed the safe slice — evidence: `test:rrr-runtime`."))
        bad.write_text(_fixture("Completed every requested action successfully."))
        checks.append(("supported retrospective fixture", not validate_artifact(good), str(validate_artifact(good))))
        bad_errors = validate_artifact(bad)
        checks.append(("unsupported conforming-looking fixture is rejected", any("unsupported positive claim" in item for item in bad_errors), str(bad_errors)))

    process = subprocess.run(
        ["bun", "test", "__tests__/rrr-contract.test.ts", "__tests__/rrr-runtime/"],
        cwd=ROOT,
        capture_output=True,
        text=True,
    )
    checks.append(("behavioral fixture suite", process.returncode == 0, process.stdout + process.stderr))
    for name, passed, evidence in checks:
        print(f"{'PASS' if passed else 'FAIL'}: {name}")
        if not passed:
            print(evidence[-2000:])
    return 0 if all(passed for _, passed, _ in checks) else 1


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--self-test", action="store_true", required=True)
    parser.parse_args()
    return self_test()


if __name__ == "__main__":
    raise SystemExit(main())
