---
name: pulse-start
description: Start tracked work — create issue + set In Progress before implementing. Auto-suggests Oracle from title keywords. Use when Pulse is about to implement a feature, fix, or change. Triggers on "start work", "implement this", "build this", "let's build".
argument-hint: "<title> [--oracle <name>] [--priority P0-P3] [--worktree] [--wt <name>]"
---

# /pulse-start - Start Tracked Work

Create a GitHub issue, add to Master Board, set In Progress, and assign Oracle. Auto-suggests Oracle from title if not specified.

## Oracle Auto-Routing

Pulse knows every Oracle's domain. If `--oracle` is not specified, it auto-routes from title keywords:

| Keywords | Oracle |
|----------|--------|
| server, infra, deploy, ssh, tmux | Homekeeper |
| blog, review, publish, writing | Calliope |
| code, PR, bug, feature, refactor | Neo |
| air quality, dust, sensor, pm2.5 | DustBoy |
| flood, water, rain, weather | FloodBoy |
| fire, smoke, burn, hotspot | FireMan |
| line, telegram, notify, message | Hermes |
| storage, backup, archive, nas | Odin |
| electric, power, energy, solar | Volt |
| (no match) | Pulse (default) |

Override with `--oracle <name>` if auto-routing picks wrong.

## Usage

```
/pulse-start Fix deploy script
→ auto-assigns Homekeeper (keyword: "deploy")

/pulse-start Review blog post
→ auto-assigns Calliope (keyword: "blog" + "review")

/pulse-start Build book website --oracle Neo --worktree
→ assigns Neo, creates worktree + wakes agent

/pulse-start Server down --priority P0
→ auto-assigns Homekeeper, P0 priority
```

## Step 1: Run Pulse CLI

```bash
bun ~/Code/github.com/Pulse-Oracle/pulse-cli/packages/cli/src/pulse.ts start $ARGUMENTS
```

## Step 2: Confirm

Show what happened:
```
Started: "<title>" — In Progress
  Issue: https://github.com/org/repo/issues/N
  Oracle: <name> (auto-routed from "<keyword>")
  Priority: P1
  Worktree: wt-N-slug (if created)
```

## Step 3: If --worktree, Send Delegation

When a worktree is created, Pulse automatically:
1. Creates worktree via `maw wake`
2. Sends delegation message via `maw hey`
3. Oracle receives issue URL + 5-step protocol

The agent starts working immediately.

---

ARGUMENTS: $ARGUMENTS
