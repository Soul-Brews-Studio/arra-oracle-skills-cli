---
name: pulse-cleanup
description: Detect and remove stale worktrees across all Oracles. Use when user says "cleanup", "clean worktrees", "gc", "stale worktrees", "too many worktrees", "pulse cleanup".
argument-hint: "[--dry]"
---

# /pulse-cleanup - Worktree Cleanup

Scan worktrees, classify as active/stale/orphan/done, check tmux sessions, suggest removals.

## Usage

```
/pulse-cleanup          — scan and suggest removals
/pulse-cleanup --dry    — preview only, no suggestions
```

## Step 1: Run

```bash
bun ~/Code/github.com/Pulse-Oracle/pulse-cli/packages/cli/src/pulse.ts cleanup $ARGUMENTS
```

## Safety

- Checks tmux session alive before suggesting removal
- Skips dirty worktrees
- Skips worktrees with unpushed commits
- Never auto-deletes — prints ACTION REQUIRED with maw done commands
- Human decides what to remove

---

ARGUMENTS: $ARGUMENTS
