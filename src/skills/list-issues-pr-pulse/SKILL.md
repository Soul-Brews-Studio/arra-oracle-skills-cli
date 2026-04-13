---
name: list-issues-pr-pulse
description: 'Open issues, PRs, and Pulse board in one view. Use when user says "issues", "prs", "pulse", "board", "what is open", or wants to see project status.'
argument-hint: "[issues | prs | board | closed | merged]"
zombie: true
origin: arra-symbiosis-skills
---

# /list-issues-pr-pulse — Issues + PRs + Pulse Board

One command to see everything that's open.

## Usage

```
/list-issues-pr-pulse              # Issues + PRs (default)
/list-issues-pr-pulse issues       # Issues only
/list-issues-pr-pulse prs          # PRs only
/list-issues-pr-pulse board        # Pulse board
/list-issues-pr-pulse closed       # Recently closed issues
/list-issues-pr-pulse merged       # Recently merged PRs
```

## Commands

### Default: Issues + PRs

```bash
echo "=== ISSUES ==="
gh issue list --state open --limit 20 --json number,title,updatedAt,labels \
  --jq '.[] | "#\(.number) \(.title) [\(.labels | map(.name) | join(","))] (\(.updatedAt[:10]))"'

echo "=== PRs ==="
gh pr list --state open --json number,title,headRefName \
  --jq '.[] | "#\(.number) \(.title) (\(.headRefName))"'
```

### closed / merged

```bash
gh issue list --state closed --limit 10 --json number,title,closedAt \
  --jq '.[] | "#\(.number) \(.title) (closed \(.closedAt[:10]))"'

gh pr list --state merged --limit 10 --json number,title,mergedAt \
  --jq '.[] | "#\(.number) \(.title) (merged \(.mergedAt[:10]))"'
```

## Output

Format as clean table. If no items in a category, skip silently.

ARGUMENTS: $ARGUMENTS
