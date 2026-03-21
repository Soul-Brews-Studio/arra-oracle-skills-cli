---
name: what-we-done
description: Quick list of what got done — commits, PRs merged, issues closed. Facts only, no reflection. Use when user says "what we done", "what have we done", "what did we do", "show progress", "list accomplishments". Do NOT trigger for retrospectives (use /rrr), session orientation (use /recap), or mid-session status (use /where-we-are).
argument-hint: "[3h | 6h | 12h | 1d | 3d]"
---

# /what-we-done — Facts Only Progress Report

List what got done. No diary, no reflection — just facts.

## Usage

```
/what-we-done          # Last 3 hours (default)
/what-we-done 6h       # Last 6 hours
/what-we-done 1d       # Last 24 hours
/what-we-done 3d       # Last 3 days
```

## Steps

### 1. Parse time window

Default: `3 hours ago`. Accept: 3h, 6h, 12h, 1d, 2d, 3d, 7d.

### 2. Gather facts (parallel)

```bash
# Commits
git log --since="$SINCE" --oneline --all

# PRs merged
gh pr list --state merged --search "merged:>$DATE" --json number,title --jq '.[] | "#\(.number) \(.title)"' 2>/dev/null

# Issues closed
gh issue list --state closed --search "closed:>$DATE" --json number,title --jq '.[] | "#\(.number) \(.title)"' 2>/dev/null

# Releases
gh release list --limit 5 2>/dev/null | head -5
```

### 3. Output

```markdown
## What We Done (last 3h)

### Commits (N)
- abc1234 feat: add /whats-next skill
- def5678 fix: /alpha-feature no release

### PRs Merged (N)
- #106 fix: arra rebrand + dig-trace

### Issues Closed (N)
- #99 refactor: oracle_ → arra_
- #65 /dig → /trace connection

### Releases
- v3.3.0-alpha.10
```

If nothing in a category → skip it silently.
If nothing at all → "Nothing shipped in the last 3h."

ARGUMENTS: $ARGUMENTS
