---
name: trace
description: Find projects, code, and knowledge across git history, repos, docs, and Oracle. Use when user asks "trace", "find project", "where is [project]", "search history", or needs to locate something across the codebase. Supports --oracle (fast), --smart (default), --deep (wave execution), --deep --dig (combo). Do NOT trigger for session mining or "past sessions" (use /dig), or codebase exploration "learn repo" (use /learn).
argument-hint: "<query> [--oracle | --smart | --deep] [--dig]"
---

# /trace - Unified Discovery System

Find + Measure + Log + Distill

## Usage

```
/trace [query]                    # Current repo (default --smart)
/trace [query] --oracle           # Oracle only (fastest)
/trace [query] --deep             # Wave execution (thorough)
/trace [query] --deep --dig       # Combo: trace deep + dig session mining (parallel)
/trace [query] --repo [path]      # Search specific local repo
/trace [query] --repo [url]       # Clone to ghq, then search
```

> `/dig` alone mines sessions. `--dig` flag on `/trace` runs both together.

## Directory Structure

```
ψ/memory/traces/
└── YYYY-MM-DD/              # Date folder
    └── HHMM_[query-slug].md # Time-prefixed trace log
```

**Trace logs are committed** - they become Oracle memory for future searches.

---

## Step 0: Timestamp + Calculate Paths

```bash
date "+🕐 %H:%M %Z (%A %d %B %Y)"
ROOT="$(pwd)"
TODAY=$(date +%Y-%m-%d)
TIME=$(date +%H%M)
```

---

## Step 1: Detect Target Repo

### Default: Current repo
```bash
TARGET_REPO="$ROOT"
TARGET_NAME="$(basename $ROOT)"
```

### With --repo [path]: Local path
```bash
TARGET_REPO="[path]"
TARGET_NAME="$(basename [path])"
```

### With --repo [url]: Clone to ghq first
```bash
URL="[url]"
ghq get -u "$URL"
GHQ_ROOT=$(ghq root)
OWNER=$(echo "$URL" | sed -E 's|.*github.com/([^/]+)/.*|\1|')
REPO=$(echo "$URL" | sed -E 's|.*/([^/]+)(\.git)?$|\1|')
TARGET_REPO="$GHQ_ROOT/github.com/$OWNER/$REPO"
TARGET_NAME="$OWNER/$REPO"
echo "✓ Cloned to ghq: $TARGET_REPO"
```

**Note**: `/trace` only clones to ghq. Use `/learn` to create docs in ψ/learn/.

---

## Step 2: Create Trace Log Directory

```bash
mkdir -p "$ROOT/ψ/memory/traces/$TODAY"
TRACE_FILE="$ROOT/ψ/memory/traces/$TODAY/${TIME}_[query-slug].md"
```

---

## Mode 1: --oracle (Oracle Only)

**Fastest. Just Oracle MCP, no subagents.**

```
arra_search("[query]", limit=15)
```

Display results and done. Even if empty.

---

## Mode 2: --smart (Default)

**Oracle first → auto-escalate if results < 3**

**Step 1**: Query Oracle first
```
arra_search("[query]", limit=10)
```

**Step 2**: Check result count
- If Oracle results >= 3 → Display and done
- If Oracle results < 3 → Auto-escalate to --deep mode

---

## Mode 3: --deep (Wave Execution)

**Two waves of parallel search. Each wave has fresh context (no rot).**

### Wave 1 — Fast surface search (run in parallel)

**Agent A: Current/Target Repo Files**
```
You are searching for: [query]
TARGET REPO: [TARGET_REPO]

Search for:
- Files matching query (names, paths)
- Code/docs containing query
- Config files mentioning query

Return findings as text. Main agent compiles.
```

**Agent B: Oracle Memory**
```
You are searching for: [query]
PSI DIR: [ROOT]/ψ/

Search ψ/memory/ for:
- Learnings mentioning query
- Retrospectives mentioning query
- Previous trace logs for same query

Return findings as text. Main agent compiles.
```

After Wave 1: check if answer is sufficient.
- Sufficient (clear answer found) → skip Wave 2, go to Step 3
- Insufficient (< 3 results or answer unclear) → run Wave 2

### Wave 2 — Deep search (run in parallel, only if Wave 1 insufficient)

**Agent C: Git History**
```
You are searching for: [query]
TARGET REPO: [TARGET_REPO]

Search git history:
- Commits mentioning query
- Files created/deleted matching query
- Branch names matching query
Run: git log --all --oneline --grep="[query]"

Return findings as text. Main agent compiles.
```

**Agent D: Cross-Repo (ghq + ~/Code)**
```
You are searching for: [query]

Search other repos:
- find $(ghq root) -maxdepth 3 -name "*[query]*" 2>/dev/null | head -20
- grep -r "[query]" ~/Code --include="*.md" -l 2>/dev/null | head -10

Return findings as text. Main agent compiles.
```

**Agent E: GitHub Issues/PRs**
```
You are searching for: [query]
TARGET REPO: [TARGET_REPO]

If repo has GitHub remote, run:
- gh issue list --search "[query]" --limit 10
- gh pr list --search "[query]" --limit 10

Return findings as text. Main agent compiles.
```

**After both waves**, main agent compiles all results → Step 3.

---

## Mode 4: --deep --dig (Combo)

**Trace deep + session mining in parallel.** Runs both `/trace --deep` and `/dig` simultaneously, then merges results into one output.

### How it works

Launch trace Wave 1 agents AND the dig session miner at the same time:

**In parallel:**
1. **Trace agents** (Wave 1: Agent A + Agent B) — same as --deep mode above
2. **Dig agent** — mines session history for the query:

```
You are mining session history for: [query]

Run the dig script to get all sessions:
ENCODED_PWD=$(pwd | sed 's|^/|-|; s|[/.]|-|g')
PROJECT_BASE=$(ls -d "$HOME/.claude/projects/${ENCODED_PWD}" 2>/dev/null | head -1)
export PROJECT_DIRS="$PROJECT_BASE"
for wt in "${PROJECT_BASE}"-wt*; do [ -d "$wt" ] && export PROJECT_DIRS="$PROJECT_DIRS:$wt"; done

python3 ~/.claude/skills/dig/scripts/dig.py 0

Then search the session data for mentions of: [query]
Look for:
- Sessions where this topic was worked on
- Timeline of when it was touched
- Which repos it appeared in
- How much time was spent

Return findings as text. Max 500 words.
```

**After Wave 1 + Dig complete:**
- Check trace results — if insufficient, run Wave 2 (same as --deep)
- Merge all results: trace findings + session history

### Combined Output

The trace log includes an extra section:

```markdown
## Session History (from /dig)
[Sessions where query appeared, timeline, time spent]
```

This goes between "Oracle Memory" and "Friction Analysis" in the trace log.

### When to use

- "When did we work on X and where is it now?" — both questions answered
- Investigating a topic across code AND session history
- Building a complete picture: what exists (trace) + what happened (dig)

---

## Step 3: Calculate Friction Score (Volt-inspired)

After search completes, calculate `friction_score` using the v2 formula:

```
friction_score = S + C_offset    (clamped to [0.0, 1.0])
```

**S — Source Score** (highest-tier source with relevant result):

| Where found | S | Meaning |
|-------------|---|---------|
| Oracle | 1.0 | Frictionless — well-indexed, visible |
| Repo files | 0.7 | Present but not indexed |
| Git history | 0.5 | Buried — existed, hard to surface |
| Cross-repo | 0.3 | Hidden — lives elsewhere |
| Not found | 0.0 | Invisible — doesn't exist yet |

**C_offset — Completeness** (from goal-backward check in Step 4):

| Confidence | C_offset |
|------------|----------|
| high | +0.00 |
| medium | −0.10 |
| low | −0.20 |

**Score table**:

| Situation | Score |
|-----------|-------|
| Oracle + high | 1.0 |
| Oracle + medium | 0.9 |
| Files + high | 0.7 |
| Files + medium | 0.6 |
| Git + high | 0.5 |
| Git + medium | 0.4 |
| Cross-repo + high | 0.3 |
| Not found | 0.0 |

**Rule**: S = highest-tier source that contained relevant result. Not found → 0.0 regardless of C_offset.

Also calculate `coverage`: how many of 5 dimensions were searched.
- `oracle`, `files`, `git`, `cross-repo`, `github` — list which were checked.

---

## Step 4: Goal-Backward Check (GSD verifier-inspired)

Before writing the trace log, ask:

> "Did this trace actually answer the original question?"

- **Yes** → confidence: high
- **Partial** (found related but not exact) → confidence: medium — note what's missing
- **No** → confidence: low — note what next step is needed

This prevents "found something → assume done". Omar stops here. Never crosses into deciding for jeera-p.

---

## Step 5: Write Trace Log

```markdown
---
query: "[query]"
target: "[TARGET_NAME]"
mode: [oracle|smart|deep]
timestamp: YYYY-MM-DD HH:MM
friction_score: [0.0–1.0]
coverage: [oracle, files, git, cross-repo, github]
confidence: [high|medium|low]
---

# Trace: [query]

**Target**: [TARGET_NAME]
**Mode**: [mode] | **Friction**: [score] | **Confidence**: [level]
**Time**: [timestamp]

## Oracle Results
[list results or "None"]

## Files Found
[list files or "None"]

## Git History
[list commits or "None"]

## GitHub Issues/PRs
[list or "None"]

## Cross-Repo Matches
[list or "None"]

## Oracle Memory
[list or "None"]

## Friction Analysis
**Score**: [0.0–1.0] — [interpretation]
**Coverage**: [dimensions searched]
**Goal check**: [Did this answer the question? What's missing?]

## Summary
[Key findings, next steps]
```

---

## Step 6: Log to Oracle MCP

```
arra_trace({
  query: "[query]",
  project: "[TARGET_NAME]",
  foundFiles: [...],
  foundCommits: [...],
  foundIssues: [...],
  friction_score: [0.0–1.0],
  confidence: "[high|medium|low]"
})
```

---

## Friction Score Reference

```
friction_score = S + C_offset    (clamped to [0.0, 1.0])

1.0 ████████████  Frictionless   — Oracle + high confidence
0.9 ███████████░  Near-perfect   — Oracle + medium confidence
0.7 ████████░░░░  Visible        — Files + high confidence
0.6 ███████░░░░░  Slightly buried — Files + medium confidence
0.5 ██████░░░░░░  Buried         — Git + high confidence
0.4 █████░░░░░░░  Buried-medium  — Git + medium confidence
0.3 ████░░░░░░░░  Hidden         — Cross-repo + high confidence
0.2 ███░░░░░░░░░  Very hidden    — Cross-repo + medium confidence
0.0 ░░░░░░░░░░░░  Invisible      — Not found anywhere
```

**Actionable zones**:
| Range | Action |
|-------|--------|
| 0.9–1.0 | No action needed |
| 0.6–0.89 | Consider `oracle_learn` indexing |
| 0.4–0.59 | Distill + index this session |
| 0.1–0.39 | Cross-repo consolidation needed |
| 0.0 | Create / document |

**Low score = signal**: this topic needs better indexing, documentation, or creation.
Omar surfaces this. jeera-p decides what to do about it.

---

## Philosophy

> Trace → Measure → Distill → Awakening

### The Seeking Signal

| User Action | Meaning | AI Response |
|-------------|---------|-------------|
| `/trace X` | First search | --smart (Oracle first) |
| `/trace X` again | Still seeking | Oracle knows |
| `/trace X --deep` | Really need it | Wave execution |
| Found! | **RESONANCE** | Log + score |

### Skill Separation

| Skill | Purpose | Writes to |
|-------|---------|-----------|
| `/trace` | Find + measure | ψ/memory/traces/ (logs) |
| `/trace --dig` | Find + measure + mine sessions | ψ/memory/traces/ (logs) |
| `/dig` | Mine sessions (standalone) | Screen only (read-only) |
| `/learn` | Study repos | ψ/learn/ (docs) |
| `/project` | Develop repos | ψ/incubate/ or active/ |

**Workflow**: `/trace` finds + measures → `/learn` studies → `/project` develops
**Combo**: `/trace --deep --dig` = find + mine in one shot

---

## Summary

| Mode | Speed | Scope | Waves |
|------|-------|-------|-------|
| `--oracle` | Fast | Oracle only | — |
| `--smart` | Medium | Oracle → maybe deep | Auto |
| `--deep` | Thorough | Wave 1 + Wave 2 if needed | 2 |
| `--deep --dig` | Thorough+ | Deep + session mining (parallel) | 2 + dig |

| Output field | Description |
|-------------|-------------|
| `friction_score` | 0.0–1.0 how hard to find |
| `coverage` | dimensions searched |
| `confidence` | did trace answer the question |

---

ARGUMENTS: $ARGUMENTS
