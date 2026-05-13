# /rrr eval framework

Kien-thai-shaped evals for the `/rrr` session-retrospective skill.

Mirrors [chakrit/kien-thai](https://github.com/chakrit/kien-thai)'s pattern
(`evals.json` + Python pytest + audit-loop runner) adapted for /rrr's
file-on-disk artifacts.

## Layout

```
__tests__/rrr-evals/
├── evals.json                       # 7 register prompts (trivial / messy / release / failed / bug-fix / research-only / marathon)
├── conftest.py                      # pytest fixtures + CLI options
├── test_quant_rrr.py                # Q1, Q2, Q4-Q6, Q8 (sync), Q9
├── test_anti_rationalization_rrr.py # two-gate excuse detection
├── test_consistency_rrr.py          # skill-execution rules (no-home-psi-write, no-task-tool, retro-path)
├── fixtures/ψ/                      # sample-good retro+learning so the suite runs green
└── README.md                        # this file

scripts/eval_rrr.py                  # audit-loop runner (max 2 corrections)
```

## Install

```bash
pip install pytest pyyaml httpx
```

(Python 3.9+. We avoid touching `package.json` — this is Python tooling on top
of the Bun project.)

## Run

```bash
# Discover tests
python3 -m pytest __tests__/rrr-evals/ --collect-only

# Run the whole suite against the bundled fixture ψ
python3 -m pytest __tests__/rrr-evals/ -v

# Restrict to a single slug
python3 -m pytest __tests__/rrr-evals/ --slug=sample-good -v

# Point at a different ψ tree (e.g. a real retro you just produced)
python3 -m pytest __tests__/rrr-evals/ --psi=/path/to/repo/ψ --slug=my-session

# Enable the Oracle sync gate (Q8) — otherwise it skips
ARRA_ORACLE_URL=http://localhost:47778 python3 -m pytest __tests__/rrr-evals/

# Provide a session .jsonl to give the consistency log-parsing checks teeth
python3 -m pytest __tests__/rrr-evals/ \
  --session-log=/path/to/session.jsonl
```

## Audit-loop runner

```bash
# Run all 7 registers
python3 scripts/eval_rrr.py

# Run a single register
python3 scripts/eval_rrr.py bug-fix

# Exercise the pytest suite against the fixture ψ without invoking /rrr
python3 scripts/eval_rrr.py --fixture-only
```

The runner allows `max_corrections=2` (3 attempts total). On failure it
injects the failing test output back into the next /rrr attempt as a
correction context.

The real `claude` CLI invocation is stubbed (`# TODO`) until the eval harness
lands. The audit-loop structure is exercised end-to-end via `--fixture-only`.

## Q1–Q9 reference

| Gate | Test                                  | What it asserts                                        |
|------|---------------------------------------|--------------------------------------------------------|
| Q1   | `test_section_completeness`           | All 7 required headers present                         |
| Q1   | `test_metrics_row_appended`           | session-metrics.md exists with row for today           |
| Q1   | `test_learning_file_frontmatter`      | learning file has pattern/date/source/concepts         |
| Q2   | `test_evidence_density`               | ≥3 SHAs + file paths                                   |
| Q3   | `test_anti_rationalization` (separate file) | Excuse phrases excavated by causal phrase within 50 words |
| Q4   | `test_word_floors`                    | AI Diary ≥150w, Honest Feedback ≥100w                  |
| Q5   | `test_friction_count`                 | ≥3 friction bullets in Honest Feedback                 |
| Q6   | `test_next_steps_start_with_verbs`    | Each Next Step starts with an action verb              |
| Q8   | `test_learning_sync_to_oracle`        | Distilled `pattern:` retrievable via arra_search top-5 |
| Q9   | `test_no_lesson_friction_overlap`     | Lesson/friction token overlap below threshold          |

Plus consistency:

| Test                          | What it asserts                                       |
|-------------------------------|-------------------------------------------------------|
| `test_no_home_psi_write`      | No Write/Edit to `~/ψ/` in session .jsonl             |
| `test_no_task_tool_used`      | Task tool not invoked (base /rrr — only --deep may)   |
| `test_retro_path_format`      | Retro at `ψ/memory/retrospectives/YYYY-MM/DD/*.md`    |

## Provenance

Spec lives at `ψ/memory/mailbox/eval-architect/2026-05-13_brainstorm-recovered.md`
(Round 3 final section). The brainstorm-rrr-eval team ran 3 rounds and
converged on 5 cross-cutting tensions; this directory implements
eval-architect's piece verbatim.
