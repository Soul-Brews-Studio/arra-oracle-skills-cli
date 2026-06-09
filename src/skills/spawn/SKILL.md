---
name: spawn
description: Spawn a worker from another Oracle via maw bring — visible split pane, auto-park when done. Use when user says "spawn", "bring worker", "spawn logger-spy", or wants to delegate a task to another Oracle as a visible worker.
argument-hint: "<oracle> \"<task description>\" [--dry-run]"
---

# /spawn — Spawn Oracle Worker

> "มอบงานให้คนอื่น แล้วดูเขาทำได้เลย"

Spawn a worker from another Oracle in a split pane. Worker does the job, writes to KB, notifies you, then parks itself.

## Usage

```
/spawn logger-spy "trace debugKey TT45 หา root cause"
/spawn thawanban "review payment flow for provider X"
/spawn sorachai "check k8s deployment status"
/spawn logger-spy "analyze error pattern in last 1h" --dry-run
```

---

## Step 0: Parse & Detect

```bash
date "+🕐 %H:%M %Z (%A %d %B %Y)"
```

Parse ARGUMENTS:
- First token = `ORACLE` (target oracle name, e.g. `logger-spy`)
- Quoted string = `TASK` (task description)
- `--dry-run` = preview only

Detect caller identity:

```bash
SELF=$(basename "$(git rev-parse --show-toplevel 2>/dev/null)" | sed 's/-oracle$//')
echo "Caller: $SELF"
```

If no ORACLE or no TASK provided:

```
Usage: /spawn <oracle> "<task description>" [--dry-run]

Example: /spawn logger-spy "trace debugKey TT45 หา root cause"
```

---

## Step 1: Verify maw + target

```bash
if ! command -v maw &>/dev/null; then
  echo "❌ maw CLI not found — /spawn requires maw-js"
  exit 1
fi
```

Check target oracle exists:

```bash
maw ls 2>/dev/null | grep -qi "$ORACLE"
```

If not found:

```
❌ Oracle "$ORACLE" not found in fleet.
   Run: maw ls    — to see available oracles
```

---

## Step 2: Compose worker task

Build the full task prompt that includes worker lifecycle instructions:

```
WORKER_PROMPT = """
[worker-spawn from ${SELF}]

## Task
${TASK}

## Worker Lifecycle — FOLLOW THESE STEPS

You are an ephemeral worker spawned by ${SELF}. Do the task, report back, then park.

### Step 1: Search KB first
Before starting, run muninn_search for relevant existing knowledge about this task.

### Step 2: Do the work
Execute the task. Report confidence level with every finding:
- 90-100%: confirmed by KB + evidence
- 70-89%: strong evidence, not yet confirmed
- 50-69%: likely but other possibilities exist
- <50%: uncertain — flag for human review

### Step 3: Write findings to KB
When you have findings worth persisting, use muninn_learn to write them to shared KB.

### Step 4: Capture & notify
When your work is complete:

a. Summarize your findings in 3-5 bullet points
b. Run: maw capture $(maw whoami 2>/dev/null || echo "current") --full
c. Run: maw hey ${SELF} "done: [your 1-line summary of findings]"

### Step 5: Auto-park decision
After completing your work:

- If the user has NOT interacted with you (only the initial spawn prompt, 1 user turn total):
  → Run: maw park
  → You are done. Session parks automatically.

- If the user HAS interacted (typed additional messages, asked follow-ups):
  → Stay open. Tell the user: "งานเสร็จแล้ว — park เมื่อพร้อมด้วย maw park หรือพิมพ์ต่อได้"
  → Do NOT auto-park — the user is actively using this session.

### Rules
- Do ONLY the task given. Do not expand scope.
- Search KB before and write KB after.
- Report confidence on every finding.
- Auto-park only when user never interacted.
"""
```

---

## Step 3: Spawn (or dry-run)

### If --dry-run:

```
🔍 Dry run — would spawn:

  Target:   ${ORACLE}
  Task:     ${TASK}
  Caller:   ${SELF}
  Command:  maw bring ${ORACLE} --task "..."

  Worker will:
  1. Search KB → do task → write findings to KB
  2. maw capture (save scrollback)
  3. maw hey ${SELF} "done: [summary]"
  4. Auto-park if user didn't interact
```

### If not dry-run:

```bash
maw bring "$ORACLE" --task "$WORKER_PROMPT"
```

Then confirm:

```
✅ Worker spawned: ${ORACLE}

  Task:     ${TASK}
  Caller:   ${SELF}
  Pane:     visible in split (right)

  Worker will notify you when done via: maw hey ${SELF} "done: ..."
  View later: maw resume ${ORACLE}
  Check KB:   muninn_search for findings
```

---

## After Park — How to Resume

Worker parks when done (if no interaction). To review:

| Action | Command |
|--------|---------|
| Resume worker session | `maw resume <oracle>` |
| Check worker output from KB | `muninn_search "<keywords from task>"` |
| Read capture logs | `maw capture <oracle> --full` (already saved) |

---

## Rules

1. **Human initiates** — /spawn never self-triggers
2. **Use maw bring** — don't reinvent tmux/claude spawning
3. **Worker is ephemeral** — it does the task and parks
4. **KB is the artifact** — worker writes findings to KB, that's the lasting output
5. **Auto-park only when no interaction** — respect active sessions
6. **Notify caller** — always `maw hey` back when done

---

ARGUMENTS: $ARGUMENTS
