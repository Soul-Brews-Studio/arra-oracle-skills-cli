---
name: workon
description: 'Work on a GitHub issue with worktree isolation, or resume a killed worktree session. Use when user says "work on", "workon", "resume", or wants issue-driven development with isolation.'
argument-hint: "<#issue | --resume name>"
zombie: true
origin: arra-symbiosis-skills
---

# /workon — Work + Resume

Start work from issue OR resume killed worktree.

## Usage

```
/workon #435                              # Work on issue (this repo)
/workon #435 --oracle neo                 # Assign to specific Oracle
/workon Soul-Brews-Studio/repo#435        # Cross-repo issue
/workon --resume athena                   # Resume killed worktree + old session
```

## Flow: Issue → Worktree → Work → PR

### Step 1: Read Issue

```bash
gh issue view [N] --repo [owner/repo] --json title,body,labels,assignees
```

### Step 2: Spawn Worktree

Create isolated worktree for the work:
```bash
git worktree add .claude/worktrees/<task-name> -b worktree-<task-name>
```

Or via EnterWorktree tool:
```
EnterWorktree({ name: "<task-name>" })
```

### Step 3: Create Tracking Issue (if cross-repo)

If working on a different repo:
```bash
gh issue create --repo [target-repo] --title "[task]" --body "From [source-repo]#[N]"
```

### Step 4: Work

The oracle works in the worktree on the issue. When done:
1. Commit changes
2. Create PR
3. Notify parent oracle

### Step 5: Confirm

```
/workon #435

  Issue:     /awaken Wizard v2
  Worktree:  awaken-wizard-v2
  Branch:    worktree-awaken-wizard-v2
  
  Working in isolation. Main is untouched.
```

## Mode 2: `--resume` — Restore Killed Worktree

### Step 1: Find Old Session

```bash
for dir in ~/.claude/projects/*[name]*/; do
  ls -lS "$dir"*.jsonl 2>/dev/null
done
```

Pick **largest .jsonl** = most context.

### Step 2: Recreate Worktree + Resume

```bash
git worktree add .claude/worktrees/<name> -b worktree-<name>
claude --resume [session-id]
```

## Rules

- **Always create gh issue** before working (visibility)
- **Feature branch + PR** — never push to main directly
- **Human approves** merges — Oracle works autonomously otherwise
- **Resume scans ~/.claude/projects/** not maw ls (sessions persist)

ARGUMENTS: $ARGUMENTS
