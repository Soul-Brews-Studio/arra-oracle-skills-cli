---
name: list-issues-pr-pulse
description: List open issues, PRs, and Pulse board in one view. Use when user says "list issues", "list prs", "show issues", "open prs", "what's open", "list pulse", "board". Do NOT trigger for creating issues (use /draft-issue), working on issues (use /workon), or session status (use /where-we-are).
argument-hint: "[issues | prs | board | closed | merged]"
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

## Steps

### Default (no args): Issues + PRs

```bash
echo "=== ISSUES ==="
gh issue list --state open --limit 20 --json number,title,updatedAt,labels --jq '.[] | "#\(.number) \(.title) [\(.labels | map(.name) | join(","))] (\(.updatedAt[:10]))"'

echo "=== PRs ==="
gh pr list --state open --json number,title,headRefName --jq '.[] | "#\(.number) \(.title) (\(.headRefName))"'
```

### issues

```bash
gh issue list --state open --limit 20 --json number,title,updatedAt,labels --jq '.[] | "#\(.number) \(.title) [\(.labels | map(.name) | join(","))] (\(.updatedAt[:10]))"'
```

### prs

```bash
gh pr list --state open --json number,title,headRefName,reviewDecision --jq '.[] | "#\(.number) \(.title) (\(.headRefName)) [\(.reviewDecision // "pending")]"'
```

### board

```bash
bun ~/Code/github.com/Pulse-Oracle/pulse-cli/packages/cli/src/pulse.ts board
```

### closed

```bash
gh issue list --state closed --limit 10 --json number,title,closedAt --jq '.[] | "#\(.number) \(.title) (closed \(.closedAt[:10]))"'
```

### merged

```bash
gh pr list --state merged --limit 10 --json number,title,mergedAt --jq '.[] | "#\(.number) \(.title) (merged \(.mergedAt[:10]))"'
```

## Output

Format as clean table:

```markdown
## Issues (N open)
| # | Title | Updated |
|---|-------|---------|
| #117 | /deep-analysis | 2026-03-22 |

## PRs (N open)
| # | Title | Branch | Review |
|---|-------|--------|--------|
| #106 | fix: arra rebrand | fix/all-issues | pending |
```

If no items in a category → skip silently.

ARGUMENTS: $ARGUMENTS
