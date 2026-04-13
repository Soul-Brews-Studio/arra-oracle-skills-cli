---
name: what-we-done
description: 'Facts-only progress report — commits, PRs merged, issues closed, releases in a time window. No diary, no reflection. Use when user says "what we done", "what shipped", "progress report", "what happened".'
argument-hint: "[3h | 6h | 12h | 1d | 3d | 7d]"
zombie: true
origin: arra-symbiosis-skills
---

# /what-we-done — Facts Only Progress Report

List what got done. No diary, no reflection — just facts.

## Usage

```
/what-we-done          # Last 3 hours (default)
/what-we-done 6h       # Last 6 hours
/what-we-done 1d       # Last 24 hours
/what-we-done 7d       # Last week
```

## Steps

### 1. Parse time window

Default: `3 hours ago`. Accept: 3h, 6h, 12h, 1d, 2d, 3d, 7d.

### 2. Gather facts (parallel)

```bash
# Commits
git log --since="$SINCE" --oneline --all

# PRs merged
gh pr list --state merged --search "merged:>$DATE" --json number,title \
  --jq '.[] | "#\(.number) \(.title)"' 2>/dev/null

# Issues closed
gh issue list --state closed --search "closed:>$DATE" --json number,title \
  --jq '.[] | "#\(.number) \(.title)"' 2>/dev/null

# Releases
gh release list --limit 5 2>/dev/null | head -5
```

### 3. Output

```markdown
## What We Done (last 3h)

### Commits (N)
- abc1234 feat: add /whats-next skill

### PRs Merged (N)
- #106 fix: arra rebrand

### Issues Closed (N)
- #99 refactor: oracle_ -> arra_

### Releases
- v3.3.0-alpha.10
```

If nothing in a category, skip silently.
If nothing at all: "Nothing shipped in the last 3h."

ARGUMENTS: $ARGUMENTS
