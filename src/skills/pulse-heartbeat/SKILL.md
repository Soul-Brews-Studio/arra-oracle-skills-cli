---
name: pulse-heartbeat
description: Check agent health — detect stale or dead agents on the board. Use when user says "heartbeat", "check agents", "stale", "who's working", "agent status", "pulse heartbeat".
argument-hint: "[--fix]"
---

# /pulse-heartbeat - Agent Health Check

Check which agents are active, stale, or dead on the Master Board.

## Usage

```
/pulse-heartbeat          — show status of In Progress items
/pulse-heartbeat --fix    — auto-pause dead agents
```

## Step 1: Run

```bash
bun ~/Code/github.com/Pulse-Oracle/pulse-cli/packages/cli/src/pulse.ts heartbeat $ARGUMENTS
```

## Step 2: Show Results

Display the heartbeat table — each In Progress item with:
- Oracle name
- Last activity (from feed.log)
- tmux session alive/dead
- Classification: ACTIVE / STALE / DEAD

---

ARGUMENTS: $ARGUMENTS
