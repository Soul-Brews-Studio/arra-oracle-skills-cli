---
name: pulse-scan
description: Scan for untracked issues and oracle activity. Use when user says "scan", "untracked", "what's not tracked", "pulse scan", "who's active".
argument-hint: "[--mine] [--auto] [--no-cache]"
---

# /pulse-scan - Scan & Discover

Find untracked issues across repos and scan oracle family activity.

## Usage

```
/pulse-scan               # Find untracked issues in all repos
/pulse-scan --mine        # Oracle family activity (today's commits)
/pulse-scan --mine --no-cache  # Force fresh fetch
/pulse-scan --auto        # Auto-assign untracked issues via routing config
```

## Step 1: Run Pulse CLI

```bash
bun ~/Code/github.com/Pulse-Oracle/pulse-cli/packages/cli/src/pulse.ts scan $ARGUMENTS
```

## Step 2: Present Output

### Default mode (no flags)
Lists open issues not on Master Board:
```
Untracked Issues (N found)

| Repo | # | Title |
|------|---|-------|
| neo-oracle | #42 | Fix auth flow |
```

Suggest `/pulse-add` for items that should be tracked.

### --mine mode
Shows today's commits grouped by repo + oracle:
- Repos with activity, commit hashes, messages
- AI commits marked with robot emoji
- Uses daily cache (incremental — only re-fetches repos pushed since last cache)

### --auto mode
Routes unassigned items to oracles using `pulse.config.json` routing rules.
Shows assignment reasoning (repo rule, keyword match, etc.).

## Related

- `/pulse-board` — View current board
- `/pulse-add` — Add discovered items to board

---

ARGUMENTS: $ARGUMENTS
