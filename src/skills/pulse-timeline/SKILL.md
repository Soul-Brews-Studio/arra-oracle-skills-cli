---
name: pulse-timeline
description: ASCII Gantt timeline of Pulse board items. Use when user says "timeline", "gantt", "schedule view", "pulse timeline".
argument-hint: "[filter]"
---

# /pulse-timeline - Gantt Timeline

Display an ASCII Gantt chart of board items with colored bars by priority.

## Usage

```
/pulse-timeline           # Full timeline
/pulse-timeline neo       # Filter by oracle
/pulse-timeline P0        # Filter by priority
/pulse-timeline bitkub    # Filter by client
```

## Step 1: Run Pulse CLI

```bash
bun ~/Code/github.com/Pulse-Oracle/pulse-cli/packages/cli/src/pulse.ts timeline $ARGUMENTS
```

## Step 2: Present Output

The CLI outputs colored timeline bars with:
- Priority-based colors (P0 = red, P1 = orange, P2 = blue)
- Date ranges and duration in days
- Month headers for orientation

**Display rules:**
- Show the timeline output directly — it's already formatted with ANSI colors
- Only items with both start AND target dates appear
- If no items have dates, suggest using `pulse set <#> Start=YYYY-MM-DD Target=YYYY-MM-DD`

## Related

- `/pulse-board` — Table view
- `/pulse-scan` — Find untracked issues

---

ARGUMENTS: $ARGUMENTS
