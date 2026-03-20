---
name: xray
description: Full anatomy scan of ONE session JSONL. Timeline, commits, gaps, emotional arc, energy map, stats. 4 parallel subagents. Use when user says "xray", "xray session", "session anatomy", "what happened in session X".
argument-hint: "[session-id]"
---

# /xray — Oracle X-Ray

Full anatomy scan of ONE session. Timeline, commits, gaps, emotional arc, stats.

## Usage

```
/xray <session-id>              # Full session scan
/xray                           # Last session (most recent JSONL)
```

## Step 0: Find the Session

```bash
# If session ID provided, find the JSONL
SESSION_ID="$1"
if [ -z "$SESSION_ID" ]; then
  # No ID — use most recent JSONL in current project
  PROJECT_BASE=$(ls -d "$HOME/.claude/projects/"*"$(basename "$(pwd)")" 2>/dev/null | head -1)
  SESSION_FILE=$(ls -t "$PROJECT_BASE"/*.jsonl 2>/dev/null | head -1)
else
  # Find by ID prefix
  SESSION_FILE=$(find "$HOME/.claude/projects/" -name "${SESSION_ID}*.jsonl" 2>/dev/null | head -1)
fi
```

Print session file path + size + line count. If not found, error and stop.

## Step 1: Launch 4 Parallel Subagents

All agents read the SAME one JSONL file. No cross-repo search. No Oracle. No GitHub.

### Agent 1: Timeline + Emotional Arc

Read the JSONL and extract:
- All human messages with timestamps (filter out approvals: y/n/yes/no/ok)
- Filter out `<task-notification>` and `<local-command` prefixes
- Build chronological timeline with topic labels
- Detect emotional moments: excitement ("cool!", "very cool!", "wow"), frustration (repeated messages, "not working"), satisfaction ("commit")
- Map activity gaps (>15 min)
- Convert all timestamps to GMT+7

Output format:
```
TIMELINE:
HH:MM  [topic/quote summary]
HH:MM  [topic/quote summary]
  --- Xm gap ---
HH:MM  [topic/quote summary]

EMOTIONAL ARC:
HH:MM  [emoji] [moment]

GAPS:
HH:MM-HH:MM  Xm
```

### Agent 2: Code Activity

Read the JSONL and extract:
- All tool_use calls: count Edit, Write, Read, Bash, Agent, Grep, Glob, Skill
- All git commit commands: extract commit messages
- All files written/edited: list with counts
- Identify coding phases vs research phases

Output format:
```
TOOLS:
  Edit: N, Write: N, Read: N, Bash: N, Agent: N

COMMITS:
  hash  message (first line)

FILES TOUCHED:
  N  path/to/file
```

### Agent 3: Session Metadata + Energy Map

Read the JSONL and extract:
- First and last timestamp → duration
- Total messages by type (user, assistant, progress, system)
- Real human messages (not approvals)
- Activity density: messages per 10-min bucket
- Peak activity periods
- Session file size in MB

Output format:
```
METADATA:
  Start: YYYY-MM-DD HH:MM (GMT+7)
  End: HH:MM
  Duration: Xm (X.Xh)
  Messages: N total, N human, N assistant
  File: X.X MB, N lines

ENERGY MAP:
  HH:MM ████████████ (N msgs)
  HH:MM ████ (N msgs)
  HH:MM  (gap)
```

### Agent 4: Skills + Research

Read the JSONL and extract:
- All Skill tool invocations (skill name + args)
- All Agent tool invocations (description + subagent type)
- All /slash commands found in human messages
- MCP tool calls (oracle_search, oracle_trace, etc.)
- Screenshot/image references
- Links/URLs mentioned

Output format:
```
SKILLS USED:
  /trace --deep mqtt
  /recap
  /forward

AGENTS SPAWNED:
  Agent 1: description (type)

MCP CALLS:
  oracle_search("query")

SCREENSHOTS:
  path/to/image
```

## Step 2: Compile X-Ray Report

After all 4 agents return, compile into one report:

```markdown
## X-Ray: Session [ID]

**[First human message summary]**
`YYYY-MM-DD HH:MM — HH:MM (GMT+7) | X.Xh | X MB | N lines`

### Timeline
[From Agent 1 — chronological with gaps]

### Energy Map
[From Agent 3 — visual density bars]

### Code Activity
[From Agent 2 — tools, commits, files]

### Research
[From Agent 4 — skills, agents, MCP]

### Emotional Arc
[From Agent 1 — key moments with emoji]

### Stats
| Metric | Value |
|--------|-------|
[From Agent 3 — summary table]
```

## Hard Rules

1. **ONE JSONL file only** — never search other files, repos, or Oracle
2. **4 parallel subagents** — each reads the same file from different angle
3. **GMT+7 timestamps** — always convert from UTC
4. **No trace log** — output to screen only, don't write to ψ/
5. **Filter noise** — skip approvals (y/n), task-notifications, local-commands
