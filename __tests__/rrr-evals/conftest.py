"""
Pytest fixtures for /rrr eval framework.

Provides:
- `psi`: Path to the fixture ψ directory (override via --psi CLI flag)
- `slug`: Parametrized over evals.json names (override via --slug CLI flag)
- `retro_text`: Loaded retro markdown for the current slug
- `session_log_path`: Optional path to a session .jsonl (skip if absent)

CLI options:
- --psi PATH     Path to ψ directory under test (default: fixtures/ψ)
- --slug SLUG    Restrict the parametrized slug fixture to a single name
- --session-log  Path to session .jsonl for consistency tests
"""
from __future__ import annotations

import json
import datetime
from pathlib import Path

import pytest

HERE = Path(__file__).parent
DEFAULT_PSI = HERE / "fixtures" / "ψ"
EVALS_JSON = HERE / "evals.json"


def _load_eval_names() -> list[str]:
    data = json.loads(EVALS_JSON.read_text())
    return [e["name"] for e in data["evals"]]


def pytest_addoption(parser):
    parser.addoption(
        "--psi",
        action="store",
        default=str(DEFAULT_PSI),
        help="Path to ψ fixture directory (default: __tests__/rrr-evals/fixtures/ψ)",
    )
    parser.addoption(
        "--slug",
        action="store",
        default=None,
        help="Restrict parametrized tests to a single eval slug (e.g. sample-good)",
    )
    parser.addoption(
        "--session-log",
        action="store",
        default=None,
        help="Path to a session .jsonl file for consistency tests (optional)",
    )


def pytest_generate_tests(metafunc):
    """Parametrize the `slug` fixture from evals.json names + fixture slugs.

    Always include 'sample-good' so the fixture-based green path runs.
    """
    if "slug" in metafunc.fixturenames:
        cli_slug = metafunc.config.getoption("--slug")
        if cli_slug:
            slugs = [cli_slug]
        else:
            # Always include sample-good (the fixture); other slugs from evals.json
            # are placeholders for when real /rrr runs land artifacts on disk.
            slugs = ["sample-good"]
        metafunc.parametrize("slug", slugs)


@pytest.fixture
def psi(request) -> Path:
    return Path(request.config.getoption("--psi")).resolve()


@pytest.fixture
def today() -> datetime.date:
    # For fixture-based runs we treat 2026-05-13 as "today" so the sample retro
    # path resolves. Override by setting RRR_EVAL_TODAY=YYYY-MM-DD.
    import os
    iso = os.environ.get("RRR_EVAL_TODAY", "2026-05-13")
    return datetime.date.fromisoformat(iso)


@pytest.fixture
def session_log_path(request):
    val = request.config.getoption("--session-log")
    if not val:
        pytest.skip("--session-log not provided; consistency log checks skipped")
    p = Path(val)
    if not p.exists():
        pytest.skip(f"session log not found at {p}")
    return p


def load_retro(psi: Path, slug: str, today: datetime.date) -> str:
    """Find and read the retro markdown for `slug` under psi/memory/retrospectives/YYYY-MM/DD/."""
    retro_dir = psi / "memory" / "retrospectives" / today.strftime("%Y-%m") / today.strftime("%d")
    matches = sorted(retro_dir.glob(f"*{slug}*.md"))
    if not matches:
        pytest.fail(f"Q1-FAIL: No retro file found under {retro_dir} matching '*{slug}*.md'")
    return matches[0].read_text()


def load_latest_learning(psi: Path, today: datetime.date) -> Path:
    files = sorted((psi / "memory" / "learnings").glob(f"{today.isoformat()}_*.md"))
    if not files:
        pytest.fail(f"Q1-FAIL: No learning file for {today.isoformat()} under {psi}/memory/learnings/")
    return files[-1]


@pytest.fixture
def retro_text(psi: Path, slug: str, today: datetime.date) -> str:
    return load_retro(psi, slug, today)
