---
name: pulse-board
description: View Pulse Master Board — tasks, priorities, status. Use when user says "board", "tasks", "what's tracked", "pulse board".
argument-hint: "[filter]"
---

# /pulse-board - Master Board

Display the Pulse Master Board as a formatted table, grouped by priority.

## Usage

```
/pulse-board              # Full board
/pulse-board neo          # Filter by oracle
/pulse-board P0           # Filter by priority
/pulse-board bitkub       # Filter by client
```

## Step 1: Run Pulse CLI

```bash
bun ~/Code/github.com/Pulse-Oracle/pulse-cli/packages/cli/src/pulse.ts board $ARGUMENTS
```

## Step 2: Present Output

The CLI outputs a formatted table with columns:

```
# | Title | Pri | Client | Oracle | Repo | WT | Status | Dates
```

Items are grouped by priority (P0 → P1 → P2 → Unset).

**Display rules:**
- Show the table output directly — it's already formatted
- If filter matches nothing, say "No items matching [filter]"
- Suggest `/pulse-add` if board is empty

## Quick Actions

After showing the board, the user may want to:
- `/pulse-add <title>` — Add a new item
- `pulse set <#> <field>=<value>` — Update an item
- `/pulse-timeline` — See Gantt view
- `/pulse-scan` — Find untracked issues

---

ARGUMENTS: $ARGUMENTS
