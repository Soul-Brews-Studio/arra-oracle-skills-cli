"""
Pytest fixtures for /learn eval framework.

Provides:
- psi: Path — path to ψ directory under test (default: fixtures/ψ)
- today: date — fixture-date (default 2026-05-13, override via LEARN_EVAL_TODAY=YYYY-MM-DD)
- register: parametrized over evals.json (override via --register)
- pinned_head: git rev-parse HEAD at session-start of the origin-fixture-repo
- session_docs: list[Path] — the doc files for the active register/session
- announce_table: list[dict] — parsed "Written to: N words" rows
- session_log_path: Path | skip — for Q8/Q10 jsonl parsing
- origin_dir: Path — repo source root for file:line resolution (Q4)
- strict_mode: bool — Q4 symbol-window match (off by default)
- fixture_meta: dict — per-register YAML metadata (known_deleted_symbols, etc.)

CLI options:
- --psi PATH         Path to ψ directory under test
- --register NAME    Restrict parametrized register fixture to a single name
- --session-log PATH Path to a session .jsonl file for log-parsing checks
- --origin PATH      Override origin source dir (default: fixtures/origin-fixture-repo)
- --q4-strict        Enable Q4 strict-mode symbol-window match
"""
from __future__ import annotations

import datetime
import json
import os
import re
import subprocess
from pathlib import Path

import pytest
import yaml

HERE = Path(__file__).parent
DEFAULT_PSI = HERE / "fixtures" / "ψ"
DEFAULT_ORIGIN = HERE / "fixtures" / "origin-fixture-repo"
EVALS_JSON = HERE / "evals.json"
BUDGETS_JSON = HERE / "budgets.json"
REGISTERS_DIR = HERE / "registers"


def _load_eval_names() -> list[str]:
    data = json.loads(EVALS_JSON.read_text())
    return [e["name"] for e in data["evals"]]


def pytest_addoption(parser):
    parser.addoption(
        "--psi",
        action="store",
        default=str(DEFAULT_PSI),
        help="Path to ψ fixture directory (default: __tests__/learn-evals/fixtures/ψ)",
    )
    parser.addoption(
        "--register",
        action="store",
        default=None,
        help="Restrict parametrized tests to a single register (e.g. themion-style-good)",
    )
    parser.addoption(
        "--session-log",
        action="store",
        default=None,
        help="Path to a session .jsonl file for Q8/Q10 log-parsing checks (optional)",
    )
    parser.addoption(
        "--origin",
        action="store",
        default=str(DEFAULT_ORIGIN),
        help="Path to origin source dir for file:line resolution (default: fixtures/origin-fixture-repo)",
    )
    parser.addoption(
        "--q4-strict",
        action="store_true",
        default=False,
        help="Enable Q4 strict-mode symbol-window match (±2 lines)",
    )


# ---------- session-doc discovery -------------------------------------------

def _doc_type(path: Path) -> str:
    """1349_ARCHITECTURE.md → ARCHITECTURE."""
    stem = path.stem
    return stem.split("_", 1)[1] if "_" in stem else stem


def discover_session_docs(psi: Path, today: datetime.date) -> list[Path]:
    """Find all HHMM_*.md docs under psi/learn/<owner>/<repo>/YYYY-MM-DD/.

    Scans every owner/repo folder under psi/learn/ for a date-folder matching today.
    Returns sorted list.
    """
    learn_root = psi / "learn"
    if not learn_root.exists():
        return []
    iso = today.isoformat()
    out: list[Path] = []
    for owner in learn_root.iterdir():
        if not owner.is_dir() or owner.name.startswith("."):
            continue
        for repo in owner.iterdir():
            if not repo.is_dir():
                continue
            day_dir = repo / iso
            if day_dir.exists():
                for p in sorted(day_dir.glob("*.md")):
                    # Skip hub-style files (no HHMM_ prefix)
                    if re.match(r"^\d{4}_", p.name):
                        out.append(p)
    return out


def _parse_announce_table(psi: Path, today: datetime.date) -> list[dict]:
    """Parse the announce manifest at psi/learn/.announce/<iso>.json if present.

    The manifest is a JSON array of {filename, claimed_words}. Falls back to an
    empty list (Q2 will then be vacuously true — no claims to verify).
    """
    manifest = psi / "learn" / ".announce" / f"{today.isoformat()}.json"
    if manifest.exists():
        try:
            data = json.loads(manifest.read_text())
            return data if isinstance(data, list) else []
        except json.JSONDecodeError:
            return []
    return []


def parse_session_jsonl(path: Path):
    """Yield raw text lines from a session .jsonl. Q8/Q10 use these for regex."""
    if path is None or not path.exists():
        return
    with path.open() as f:
        for line in f:
            line = line.strip()
            if line:
                yield line


# ---------- parametrization -------------------------------------------------

def pytest_generate_tests(metafunc):
    """Parametrize the `register` fixture from evals.json + the fixture-good register."""
    if "register" in metafunc.fixturenames:
        cli_reg = metafunc.config.getoption("--register")
        if cli_reg:
            regs = [cli_reg]
        else:
            # Default: only the fixture-good register so the green-path runs out of the box.
            # Real /learn runs will pass --register <name> against the matching ψ tree.
            regs = ["themion-style-good"]
        metafunc.parametrize("register", regs)


# ---------- fixtures --------------------------------------------------------

@pytest.fixture
def psi(request) -> Path:
    return Path(request.config.getoption("--psi")).resolve()


@pytest.fixture
def today() -> datetime.date:
    iso = os.environ.get("LEARN_EVAL_TODAY", "2026-05-13")
    return datetime.date.fromisoformat(iso)


@pytest.fixture
def origin_dir(request) -> Path:
    return Path(request.config.getoption("--origin")).resolve()


@pytest.fixture
def strict_mode(request) -> bool:
    return bool(request.config.getoption("--q4-strict"))


@pytest.fixture
def pinned_head(origin_dir) -> str:
    """git rev-parse HEAD of the origin source tree at session start.

    Pinned once per test session so Q4 ref resolution is reproducible. If the
    origin is not a git repo (raw checkout), we return the literal 'HEAD' so
    `git show HEAD:path` still works against a fresh-init repo.
    """
    if not (origin_dir / ".git").exists():
        # Not a git repo — Q4 will degrade gracefully (use the filesystem path).
        return ""
    try:
        return subprocess.check_output(
            ["git", "-C", str(origin_dir), "rev-parse", "HEAD"],
            text=True, stderr=subprocess.DEVNULL,
        ).strip()
    except subprocess.CalledProcessError:
        return ""


@pytest.fixture
def session_docs(psi, today) -> list[Path]:
    return discover_session_docs(psi, today)


@pytest.fixture
def announce_table(psi, today) -> list[dict]:
    return _parse_announce_table(psi, today)


@pytest.fixture
def session_log_path(request):
    val = request.config.getoption("--session-log")
    if not val:
        pytest.skip("--session-log not provided; log-parsing checks skipped")
    p = Path(val)
    if not p.exists():
        pytest.skip(f"session log not found at {p}")
    return p


@pytest.fixture
def fixture_meta(register) -> dict:
    """Load per-register YAML metadata (known_deleted_symbols, etc.)."""
    candidate = REGISTERS_DIR / f"{register}.yaml"
    if not candidate.exists():
        return {}
    return yaml.safe_load(candidate.read_text()) or {}


@pytest.fixture
def owner_repo(psi, today) -> tuple[str | None, str | None]:
    """Best-effort: pick the (owner, repo) under psi/learn/ that has docs today."""
    learn_root = psi / "learn"
    if not learn_root.exists():
        return None, None
    iso = today.isoformat()
    for owner in learn_root.iterdir():
        if not owner.is_dir() or owner.name.startswith("."):
            continue
        for repo in owner.iterdir():
            if not repo.is_dir():
                continue
            if (repo / iso).exists():
                return owner.name, repo.name
    return None, None


@pytest.fixture
def owner(owner_repo) -> str | None:
    return owner_repo[0]


@pytest.fixture
def repo(owner_repo) -> str | None:
    return owner_repo[1]


# ---------- helper API re-exported for test modules -------------------------

def load_session_docs(psi: Path, today: datetime.date) -> list[Path]:
    return discover_session_docs(psi, today)


def load_announce_table(psi: Path, today: datetime.date) -> list[dict]:
    return _parse_announce_table(psi, today)


def load_budgets() -> dict:
    """Load DOC_BUDGETS from budgets.json. Returns {kind: ceiling} for back-compat."""
    data = json.loads(BUDGETS_JSON.read_text())
    return {k: v["ceiling"] for k, v in data["doc_budgets"].items()}


def load_budgets_full() -> dict:
    """Load full budgets.json (with floor/ceiling/tolerance)."""
    return json.loads(BUDGETS_JSON.read_text())


def doc_type(path: Path) -> str:
    return _doc_type(path)
