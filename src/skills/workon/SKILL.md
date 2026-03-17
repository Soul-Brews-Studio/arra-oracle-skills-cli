---
name: workon
description: Work on an issue — read context, spawn worktree, create issue, incubate, send task, await report. Use when user says "workon", "work on", "implement issue", "do this issue".
---

# /workon — Issue → Work → Report

One command to go from issue to working agent.

## Usage

```
/workon #435                              # Work on issue (this repo)
/workon #435 --oracle neo                 # Assign to specific Oracle
/workon Soul-Brews-Studio/arra-oracle#435 # Cross-repo issue
```

## Flow

### Step 1: Read Issue

```bash
gh issue view [N] --repo [owner/repo] --json title,body,labels,assignees
```

Extract: title, body, repo, labels, context.

### Step 2: Spawn Worktree

```bash
maw wake [current-oracle] [task-name]
```

Task name = slugified issue title (e.g., `awaken-wizard-v2`).

### Step 3: Create Tracking Issue (if cross-repo)

If working on a different repo than the issue source:

```bash
gh issue create --repo [target-repo] --title "[task]" --body "From [source-repo]#[N]"
```

Pulse tracks work via issues — no issue = Pulse doesn't see.

### Step 4: Send Task (MCP first → hey after)

Post to oracle_thread:
```
oracle_thread({ title: "channel:[worktree-name]", message: "instructions + issue link" })
```

Then notify:
```bash
maw hey [worktree-name] "💬 channel:[name] (#[thread-id])
From: [parent Oracle]
งาน: [issue title]
→ /talk-to #[thread-id]"
```

Instructions include:
- Issue link (gh issue view)
- /project incubate [repo] (if cross-repo)
- What to do
- "เสร็จแล้ว maw hey [parent] + maw hey [reviewer]"

### Step 5: Confirm

```
⚡ /workon #435

  Issue:     /awaken Wizard v2
  Worktree:  mother-awaken-wizard-v2
  Thread:    #[N]
  Task sent: MCP + hey

  Worktree is working. Will report back via maw talk-to.
```

### Step 6: When Worktree Reports Back

Worktree follows this pattern when done:
1. `oracle_thread()` → MCP reply with summary + PR link
2. `maw hey [parent]-oracle` → notify parent
3. `maw hey [reviewer]-oracle` → notify reviewer

Parent reviews → approves → `maw done [worktree]` to cleanup.

---

## Rules

- **Always create gh issue** before working (Pulse visibility)
- **MCP first, hey after** — persistent before ephemeral
- **Feature branch + PR** — never push to main directly
- **Human approves** delete/close/done/sleep — Oracle works autonomously otherwise
- **Report to parent + reviewer** when done

---

ARGUMENTS: $ARGUMENTS
