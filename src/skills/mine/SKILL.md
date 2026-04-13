---
name: mine
description: 'Extract a specific topic from a single session JSONL file using 4 parallel subagents. Use when user says "mine", "extract topic", "find in session", or wants to search a session for a keyword.'
argument-hint: "<keyword> [session-id]"
zombie: true
origin: arra-symbiosis-skills
---

# /mine — Oracle Mining

Extract a specific topic from a single session JSONL file.

## Usage

```
/mine worktree                    # Mine latest session for "worktree"
/mine ghost-agents abc12345       # Mine specific session
```

## How It Works

Detects whether the first argument is a session ID (hex) or treats it as a keyword for the most recent session. Launches 4 parallel subagents that all read the same JSONL file and filter by keyword (case-insensitive):

| Agent | Role |
|-------|------|
| **What You Said** | Human messages containing keyword, timeline of mentions |
| **What AI Did** | Assistant responses, tool calls, bash commands with keyword |
| **Files + Code** | Write/Edit operations, git commits, actual code snippets (truncated 50 lines) |
| **Connections** | Spawned agents, skill invocations, MCP calls, co-occurring themes, URLs |

## Output

Compiled report with timestamps, keyword frequency, and sections for each agent's findings. Concludes with 1-3 sentence summary.

## Rules

- Strictly processes one JSONL file
- Uses local timezone conversion
- Case-insensitive matching
- Displays actual code rather than summaries
- No output writes to trace logs

ARGUMENTS: $ARGUMENTS
