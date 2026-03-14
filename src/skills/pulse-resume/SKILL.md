---
name: pulse-resume
description: Resume a paused agent — wake worktree, send resume prompt, set status back to In Progress. Use when user says "resume", "wake up", "continue task", "pick up", "pulse resume".
argument-hint: "<item#>"
---

# /pulse-resume - Resume Paused Agent

Wake a paused agent from the board, send resume prompt, set back to In Progress.

## Usage

```
/pulse-resume 3          — resume board item #3
```

## Step 1: Run

```bash
bun ~/Code/github.com/Pulse-Oracle/pulse-cli/packages/cli/src/pulse.ts resume $ARGUMENTS
```

## What Happens

1. Gets board item by index
2. Wakes Oracle via maw wake
3. Sends resume prompt via maw hey
4. Sets board status to In Progress
5. Posts issue comment

---

ARGUMENTS: $ARGUMENTS
