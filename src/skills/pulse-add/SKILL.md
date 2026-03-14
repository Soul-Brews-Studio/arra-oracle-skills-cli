---
name: pulse-add
description: Add task to Pulse board — creates GitHub issue + board item. Use when user says "add task", "new issue", "pulse add", "track this".
argument-hint: "<title> [--oracle <name>] [--repo <owner/repo>] [--type task|bug|feature] [--priority P0-P3] [--worktree]"
---

# /pulse-add - Add Task to Board

Create a GitHub issue and add it to the Pulse Master Board in one step.

## Usage

```
/pulse-add Fix login redirect bug
/pulse-add "New dashboard" --oracle Neo --priority P1
/pulse-add "API rate limiting" --oracle Neo --type feature --worktree
/pulse-add "IME fix" --oracle neo --wt bitkub-ui
```

## Step 1: Parse Arguments

**Required:** `<title>` — the task title (quote if it contains spaces)

**Optional flags:**
| Flag | Purpose |
|------|---------|
| `--oracle <name>` | Assign oracle (auto-resolves repo from config) |
| `--repo <owner/repo>` | Override target repo |
| `--type <type>` | `task`, `bug`, or `feature` |
| `--body <text>` | Issue body text |
| `--priority <P0-P3>` | Set priority on board |
| `--worktree` | Create new worktree + wake oracle |
| `--wt <name>` | Wake existing worktree |

## Step 2: Run Pulse CLI

```bash
bun ~/Code/github.com/Pulse-Oracle/pulse-cli/packages/cli/src/pulse.ts add $ARGUMENTS
```

## Step 3: Confirm

Show the created issue URL and board status. If `--worktree` was used, show the worktree name.

**Output format:**
```
Added: #N <title>
  Issue: https://github.com/org/repo/issues/N
  Board: Priority P1, Oracle: Neo
  Worktree: wt-N-slug (if created)
```

---

ARGUMENTS: $ARGUMENTS
