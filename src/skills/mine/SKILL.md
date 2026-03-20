---
name: mine
description: Extract a specific topic from ONE session JSONL. 4 parallel subagents mine what you said, what was built, what AI did, and connections. Use when user says "mine", "mine session", "what did we do about X".
argument-hint: "[session-id] <keyword>"
---

# /mine — Oracle Mining

Extract a specific topic from ONE session. Like /xray but filtered by keyword.

## Usage

```
/mine <session-id> <keyword>     # Mine session for keyword
/mine <keyword>                  # Mine last session for keyword
```

Examples:
```
/mine 74c32f34 mqtt              # MQTT stuff from that session
/mine 9f1de41e voice             # Voice work from the monster session
/mine wireguard                  # WireGuard from last session
```

## Step 0: Find the Session + Parse Args

```bash
# Detect args: if first arg looks like a session ID (hex), use it
# Otherwise treat first arg as keyword and use most recent session
ARG1="$1"
ARG2="$2"

if echo "$ARG1" | grep -qE '^[0-9a-f]{6,}'; then
  SESSION_ID="$ARG1"
  KEYWORD="$ARG2"
else
  SESSION_ID=""
  KEYWORD="$ARG1"
fi

if [ -z "$KEYWORD" ]; then
  echo "Usage: /mine [session-id] <keyword>"
  exit 1
fi

# Find JSONL
if [ -z "$SESSION_ID" ]; then
  PROJECT_BASE=$(ls -d "$HOME/.claude/projects/"*"$(basename "$(pwd)")" 2>/dev/null | head -1)
  SESSION_FILE=$(ls -t "$PROJECT_BASE"/*.jsonl 2>/dev/null | head -1)
else
  SESSION_FILE=$(find "$HOME/.claude/projects/" -name "${SESSION_ID}*.jsonl" 2>/dev/null | head -1)
fi
```

Print: `Mining session [ID] for "[KEYWORD]"...`

If not found, error and stop.

## Step 1: Launch 4 Parallel Subagents

All agents read the SAME one JSONL file. All filter by KEYWORD (case-insensitive).

### Agent 1: What You Said

Read the JSONL and extract:
- All human messages containing KEYWORD (case-insensitive)
- Include timestamp + full message content (up to 200 chars)
- Also grab the message BEFORE and AFTER each match for context
- Build timeline of when you talked about this topic

Output format:
```
HUMAN MESSAGES matching "[KEYWORD]":
HH:MM  [message content]
HH:MM  [message content]

TIMELINE:
  First mention: HH:MM
  Last mention: HH:MM
  Total mentions: N messages
```

### Agent 2: What AI Did

Read the JSONL and extract:
- All assistant text responses containing KEYWORD
- Summarize what the AI said/explained about the topic
- Include tool calls where KEYWORD appears in the command or file path
- Show Bash commands containing KEYWORD

Output format:
```
AI RESPONSES mentioning "[KEYWORD]":
HH:MM  [summary of response]

COMMANDS:
HH:MM  [bash command]
```

### Agent 3: Files + Code

Read the JSONL and extract:
- All Write/Edit tool calls where file_path contains KEYWORD
- All Write/Edit tool calls where the content contains KEYWORD
- All git commit commands where message contains KEYWORD
- Show the actual code snippets written (new_string from Edit, content from Write) — truncate to 50 lines each

Output format:
```
FILES CREATED/EDITED matching "[KEYWORD]":
  Write  path/to/file  (N lines)
  Edit   path/to/file  (old → new summary)

COMMITS:
  hash  message

CODE SNIPPETS:
  --- path/to/file ---
  [code]
```

### Agent 4: Connections + Context

Read the JSONL and extract:
- Agent/subagent spawns related to KEYWORD
- Skill invocations related to KEYWORD
- MCP calls related to KEYWORD
- Other topics that appeared alongside KEYWORD (co-occurring themes)
- URLs/links mentioned near KEYWORD references

Output format:
```
AGENTS SPAWNED for "[KEYWORD]":
  Agent: description

SKILLS:
  /skill-name args

RELATED TOPICS:
  [other themes that appeared alongside keyword]

LINKS:
  url
```

## Step 2: Compile Mining Report

After all 4 agents return, compile:

```markdown
## Mine: "[KEYWORD]" in Session [ID]

`YYYY-MM-DD HH:MM — HH:MM | Keyword appears N times`

### What You Said
[From Agent 1 — your messages about this topic]

### What Was Built
[From Agent 3 — files, commits, code snippets]

### What AI Did
[From Agent 2 — explanations, commands run]

### Connections
[From Agent 4 — related topics, agents, skills]

### Summary
[1-3 sentences: what happened with this topic in this session]
```

## Hard Rules

1. **ONE JSONL file only** — never search other files, repos, or Oracle
2. **4 parallel subagents** — each reads same file, all filter by keyword
3. **Case-insensitive matching** — "mqtt", "MQTT", "Mqtt" all match
4. **GMT+7 timestamps** — always convert from UTC
5. **No trace log** — output to screen only, don't write to ψ/
6. **Show actual code** — don't just say "edited file", show what was written
7. **Context matters** — grab messages before/after matches for context
