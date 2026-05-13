# /learn eval framework

Kien-thai-shaped evals for the `/learn` and `/learn --deep` repo-study skill.

Mirrors `__tests__/rrr-evals/` (shipped in #303 for /rrr) — `evals.json` +
Python pytest + audit-loop runner — adapted for /learn's multi-doc artifacts.

## Layout

```
__tests__/learn-evals/
├── evals.json                            # 11 registers — see below
├── budgets.json                          # SINGLE SOURCE OF TRUTH for per-doc word budgets
│                                         #   (also consumed by SKILL.md in a follow-up PR)
├── conftest.py                           # fixtures + CLI options
├── test_quant_learn.py                   # Q1, Q2, Q3, Q6, Q7, Q8, Q9, Q10
├── test_anti_hallucination_learn.py      # Q4 file:line resolution against pinned HEAD
├── test_consistency_learn.py             # Q5, Q11, Q12
├── test_stale_snapshot_learn.py          # Q-stale (KNOWN-DELETED-SYMBOLS)
├── test_negative_corpus.py               # proves every gate fires on its bad fixture
├── registers/
│   └── stale-snapshot-repo.yaml          # per-register seed data (deleted-symbol list)
├── fixtures/
│   ├── ψ/learn/                          # green-path sample tree
│   │   ├── .origins
│   │   └── sample-owner/clean-repo/
│   │       ├── clean-repo.md             # hub: ≤100w prose + link list
│   │       ├── origin -> ../../../../origin-fixture-repo   (symlink)
│   │       └── 2026-05-13/
│   │           ├── 0930_ARCHITECTURE.md
│   │           ├── 0930_CODE-SNIPPETS.md
│   │           └── 0930_QUICK-REFERENCE.md
│   ├── origin-fixture-repo/              # 3-file (Rust + TS + Python) mini-repo
│   │                                     #   so Q4 file:line refs resolve via filesystem
│   └── bad/                              # negative corpus — one .md per failure mode
│       ├── word-overshoot.md             # >120% budget → Q1 BLOCK
│       ├── hallucinated-line.md          # src/lib.rs:625 (actual length 19) → Q4 BLOCK
│       ├── stale-snapshot.md             # PRD-111-deleted symbols → Q-stale BLOCK
│       ├── self-admission.md             # "(re-stated)" heading → Q12 BLOCK
│       └── no-cross-refs.md              # 0 wiki/md-links → Q5 WARN
└── README.md                             # this file

scripts/eval_learn.py                     # audit-loop runner (max 2 corrections)
```

## Q-gate reference

| Q | Test                                       | What it asserts                                                       | Tier      |
|---|--------------------------------------------|-----------------------------------------------------------------------|-----------|
| Q1 | `test_q1_word_count_per_doc`              | each doc within `budgets.json[<kind>].ceiling × 1.20`                | auto-trim 100-120% / BLOCK >120% |
| Q2 | `test_q2_claim_vs_reality`                | announce manifest claims match disk word counts ±10%                 | BLOCK     |
| Q3 | `test_q3_required_sections`               | required headers per doc-type + CODE-SNIPPETS has ≥3 fenced blocks   | BLOCK     |
| Q4 | `test_q4_file_line_refs_resolve`          | every `path.ext:N` resolves at `git rev-parse HEAD` of origin        | BLOCK     |
| Q5 | `test_q5_cross_reference_quota`           | ≥2 wiki/md-links per non-OVERVIEW doc                                | WARN      |
| Q5 | `test_q5_synthesis_links_all_siblings`    | SYNTHESIS (when present) links every sibling doc                      | BLOCK     |
| Q6 | `test_q6_code_density`                    | fenced-block char-fraction floors per doc-type                        | WARN      |
| Q7 | `test_q7_no_fluff_phrases`                | zero fluff-phrase matches                                             | BLOCK     |
| Q8 | `test_q8_announce_paths_absolute`         | `Written to:` paths in session.jsonl are absolute                     | BLOCK     |
| Q9 | `test_q9_hub_and_manifest`                | hub + .origins + symlink invariants + hub prose cap (100w)            | BLOCK     |
| Q10 | `test_q10_sync`                          | arra_learn/arra_save call logged in session                           | WARN      |
| Q11 | `test_q11_hot_phrase_redundancy`         | per-doc hot-phrase count ≤ 3× session median (count-based, NOT Jaccard) | WARN    |
| Q12 | `test_q12_no_self_admission`             | zero `(re-stated)`, `as mentioned above`, etc.                        | BLOCK     |
| Q-stale | `test_q_stale_no_deleted_symbols`    | no register-seeded deleted symbol appears in any doc                  | BLOCK     |

## 11 registers

`tiny`, `medium`, `large-deep`, `dead-link`, `private`, `multi-lang`,
`non-code`, `huge-readme`, `themion-stylos-replay`, `re-learn-same-day`,
`stale-snapshot-repo`. See `evals.json` for prompts and expected behaviors.

## Install

```bash
pip install pytest pyyaml pytest-json-report
```

(Python 3.9+. Pure-Python tooling on top of the Bun project.)

## Run

```bash
# Discover all checks
python3 -m pytest __tests__/learn-evals/ --collect-only

# Run the suite against the bundled green-path fixture
python3 -m pytest __tests__/learn-evals/ -v

# Restrict to a single register
python3 -m pytest __tests__/learn-evals/ --register=themion-style-good -v

# Negative-corpus tests prove every gate has teeth
python3 -m pytest __tests__/learn-evals/test_negative_corpus.py -v

# Point at a real /learn output tree
python3 -m pytest __tests__/learn-evals/ \
  --psi=/path/to/repo/ψ \
  --register=themion-stylos-replay \
  --origin=/path/to/origin/repo

# Enable Q4 strict-mode symbol-window match
python3 -m pytest __tests__/learn-evals/ --q4-strict

# Provide a session .jsonl to give Q8/Q10 teeth
python3 -m pytest __tests__/learn-evals/ --session-log=/path/to/session.jsonl

# Q10 sync test skips cleanly if ARRA_ORACLE_URL is unset
ARRA_ORACLE_URL=http://localhost:47778 python3 -m pytest __tests__/learn-evals/
```

## Audit-loop runner

```bash
# All 11 registers
python3 scripts/eval_learn.py

# Single register
python3 scripts/eval_learn.py themion-stylos-replay

# Fixture-only mode — exercise pytest against the green-path ψ without
# invoking /learn (mirrors scripts/eval_rrr.py)
python3 scripts/eval_learn.py --fixture-only
```

`classify()` splits pytest failures into three tiers (BLOCK / WARN /
AUTO-TRIM), feeds BLOCK and AUTO-TRIM back as correction context, and
re-spawns the doc-agent up to `max_corrections=2` times.

The real `claude` CLI invocation in `run_learn()` is stubbed (`# TODO`)
until the eval harness lands — same shape as `scripts/eval_rrr.py`.

## Pairs with

`src/skills/learn/SKILL.md` edits ship in a separate "Foundation" PR
(skill-designer's 5 edits — Topic Ownership Matrix, per-agent budgets,
hub cap, NEW Step 4 Self-Audit, audit-aware announce block). Together they
implement the brainstorm-learn-eval team's full Round 3 output. The
`budgets.json` in this directory is the single source of truth consumed by
both PRs — one edit propagates.

## Provenance

Spec: `ψ/memory/mailbox/learn-eval/eval-architect/2026-05-13_round3.md`
(28K, 655 lines). 3 agents × 3 rounds, 45K of spec saved to
`ψ/memory/mailbox/learn-eval/` in the oracle vault.
