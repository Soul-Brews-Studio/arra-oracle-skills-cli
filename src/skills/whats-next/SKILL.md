---
name: whats-next
description: 'Smart action suggestions — scan context, rank priorities, suggest top 3 actions. Use when user says "whats next", "what should I do", "next action", "priorities", or wants direction.'
argument-hint: "[--issues] [--pulse]"
zombie: true
origin: arra-symbiosis-skills
---

# /whats-next — Smart Action Suggestions

Scan context → rank priorities → suggest top 3 actions.

## Usage

```
/whats-next              # Scan everything, suggest top 3
/whats-next --issues     # Focus on open issues only
```

## Steps

### 1. Gather Context (parallel)

```bash
# Open issues
gh issue list --state open --limit 10 --json number,title,updatedAt,labels \
  --jq '.[] | "#\(.number) \(.title) [\(.labels | map(.name) | join(","))]"' 2>/dev/null

# Git status
git status --short
git log --oneline -3

# Open PRs
gh pr list --state open --json number,title,headRefName \
  --jq '.[] | "#\(.number) \(.title) (\(.headRefName))"' 2>/dev/null

# Latest handoff
PSI=$(readlink -f ψ 2>/dev/null || echo "ψ")
ls -t "$PSI/inbox/handoff/"*.md 2>/dev/null | head -1 | xargs head -30 2>/dev/null

# Stale branches
git branch --list | grep -v '^\*' | grep -v main
```

### 2. Analyze & Rank

| Signal | Weight |
|--------|--------|
| Uncommitted changes | High |
| Open PR needs merge | High |
| Handoff pending items | Medium |
| P0/P1 issues | Medium |
| Stale branches | Low |
| Old issues | Low |

### 3. Output

```markdown
## What's Next?

### 1. [Top priority action]
   Why: [reasoning from signals]
   How: `[command or /skill]`

### 2. [Second action]
   Why: [reasoning]
   How: `[command or /skill]`

### 3. [Third action]
   Why: [reasoning]
   How: `[command or /skill]`

---
Pick one, or tell me what you'd rather do.
```

## Rules

- Max 3 suggestions — not a dump
- Each suggestion has a concrete command or skill
- Never repeat what /recap shows — this is about ACTION not STATUS

ARGUMENTS: $ARGUMENTS
