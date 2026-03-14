---
name: pulse-escalate
description: P0 escalation — create issue, add to board, spawn oracle agent. Use when user says "escalate", "P0", "incident", "delegate", "pulse escalate", "server down", "pipeline broken".
argument-hint: "<title> [--oracle <name>] [--context <text>]"
---

# /pulse-escalate - P0 Escalation

Create a P0 issue, add to board, set In Progress, and output maw commands to spawn the agent.

## Usage

```
/pulse-escalate "Server down" --oracle Homekeeper
/pulse-escalate "Pipeline broken" --oracle Homekeeper --context "mqtt.laris.co OOM"
```

## Step 1: Run

```bash
bun ~/Code/github.com/Pulse-Oracle/pulse-cli/packages/cli/src/pulse.ts escalate $ARGUMENTS
```

## Step 2: Follow Up

The command outputs maw commands to spawn the agent. Run them to wake the Oracle.

---

ARGUMENTS: $ARGUMENTS
