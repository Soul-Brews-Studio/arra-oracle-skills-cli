---
name: dream
description: "Cross-repo pattern discovery with parallel agents. Finds pains, plans, gains, lost work, and feelings across all repositories. Use when user says 'dream', 'what hurts', 'cross-repo patterns', 'big picture', or wants to see connections between projects."
argument-hint: "[--pain | --plan | --gain | --all]"
hidden: true
---

# /dream — Cross-Repo Pattern Discovery

> "The forest doesn't know it's a forest. Each tree only knows its own roots.
> But the mycelium underground sees every root, every nutrient, every signal.
> /dream is the moment the underground tells the forest what it sees."

## Usage

```
/dream              # Full dream — all categories
/dream --pain       # Focus on what hurts (blocking, broken)
/dream --plan       # Focus on what's planned (decided, not built)
/dream --gain       # Focus on what we won (completed, delivered)
/dream --all        # Maximum depth — every source, every dimension
```

---

## How It Works

Launch **5 parallel agents**, each searching a different dimension:

| Agent | Focus | Source |
|-------|-------|--------|
| 1. Deep Dig | Session history | `dig.py` across project dirs |
| 2. Deep Trace | Cross-repo patterns | `ghq` repos, open issues, stale items |
| 3. Deep Learn | Recent activity | `git log` per repo, abandoned work |
| 4. Oracle Memory | What we already know | `ψ/memory/`, previous dreams |
| 5. Fleet Status | How the system feels | services, board, running processes |

### Agent Instructions

Each agent returns **max 500 words** (prevents context waste). Format:

```markdown
## [Agent Name] Findings

### Items Found
- [item]: [classification] — [1-line summary]

### Connections Noticed
- [pattern or link between items]
```

---

## Classification

After all agents return, classify every finding:

| Icon | Category | Meaning |
|------|----------|---------|
| 🔴 | PAIN | Hurts RIGHT NOW — blocking someone |
| 📋 | PLAN | Decided but not built yet |
| 🟢 | GAIN | Completed, delivered value |
| ⚫ | LOST | Abandoned, forgotten, disabled |
| 🧠 | MEMORY | Pattern learned, lesson discovered |
| 💜 | FEELING | How an Oracle or human feels about state |

---

## Connection Finding

The key value of /dream — find the web:

| From → To | Question |
|-----------|----------|
| PAIN → PLAN | Which pain has a plan to fix it? |
| PAIN → no PLAN | Which pain has NO plan? (create one) |
| GAIN → unlocks | Which gain unblocks a plan? |
| MEMORY → prevents | Which memory prevents a pain? |
| FEELING → signals | Burnout, breakthrough, or drift? |
| LOST → revivable | Which lost thing should we revive? |

---

## Output

Write to: `ψ/writing/dreams/YYYY-MM-DD_dream.md`

```markdown
# Dream — YYYY-MM-DD

## 🔴 PAINS
[Items that hurt right now]

## 📋 PLANS
[Decided but not built]

## 🟢 GAINS
[Completed, delivered value]

## ⚫ LOST
[Abandoned, forgotten]

## 🧠 MEMORIES
[Patterns learned]

## 💜 FEELINGS
[Emotional state of the system]

## 🔗 CONNECTIONS
[The web — how items relate to each other]

## 💡 INSIGHTS — What Nobody Sees Yet
[Cross-repo patterns that only emerge from looking at everything]

## ⏭️ NEXT — What Should Happen
[Suggestions — human decides, Oracle presents]
```

---

## Rules

1. **5 parallel agents** — each returns max 500 words
2. **Main agent classifies** — connects + writes the dream
3. **Dreams are append-only** — Nothing is Deleted
4. **Oracle sync** — `oracle_learn` after every dream
5. **Never act on findings** — dream presents, human decides
6. **Never leak secrets** — no tokens, passwords, API keys in dream output

---

## Dependencies

- `/dig` for session mining
- `/trace` for cross-repo search
- Oracle MCP for `oracle_search` + `oracle_learn`
- `ghq list` for repo discovery

---

## Philosophy

Individual skills see one dimension. /dream sees all dimensions at once.

- `/trace` finds specific things
- `/dig` mines session history
- `/learn` studies one repo
- `/rrr` reflects on one session
- **/dream** looks sideways across everything

Patterns emerge only when you look at EVERYTHING together.

---

ARGUMENTS: $ARGUMENTS
