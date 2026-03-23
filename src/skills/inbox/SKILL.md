---
name: inbox
description: Read and write to Oracle inbox — notes, tasks, messages, handoffs. Use when user says "inbox", "leave a note", "write to inbox", "check inbox", "what's pending", or wants to read/write messages for self or other agents. Do NOT trigger for session handoffs (use /forward), schedule (use /schedule), or agent messaging (use /talk-to).
argument-hint: "[read | write <topic> | ls | clean]"
---

# /inbox - Oracle Inbox

Read and write timestamped notes to `ψ/inbox/`.

## Usage

```
/inbox                    # List recent inbox items
/inbox read               # List recent inbox items (alias)
/inbox read <topic>       # Read specific item by topic keyword
/inbox write <topic>      # Write new inbox item
/inbox ls                 # List all items (full)
/inbox clean              # Archive old items (move to ψ/archive/inbox/)
```

## Directory

```
ψ/inbox/
├── handoff/              # Session handoffs (managed by /forward)
├── schedule.md           # Schedule (managed by /schedule)
├── YYYY-MM-DD_HHMM_<topic>.md   # ← inbox items live here
└── ...
```

## Filename Format

Every inbox item follows this pattern:

```
YYYYMMDD_HHMM_<topic-slug>_from_<sender>.md
```

Example: `20260323_2112_fix-auth-bug_from_peter.md`

**Rules**:
- Date: compact `YYYYMMDD` (no dashes)
- Topic slug: lowercase, hyphens, no spaces
- Sender: who wrote it (oracle name or human name)
- Timestamp: local time (from `date`)
- Always at root of `ψ/inbox/` (not in subdirectories)

---

## Mode 1: Read (default)

### `/inbox` or `/inbox read`

```bash
ROOT="$(pwd)"
INBOX="$ROOT/ψ/inbox"
```

List all `.md` files in `ψ/inbox/` (excluding `schedule.md` and `handoff/`):

```bash
ls -1t "$INBOX"/*.md 2>/dev/null | grep -v schedule.md | head -10
```

For each file, show:
```
📥 20260323 21:12 — fix-auth-bug (from peter)
   First 2 lines of content...
```

If MCP available, also run:
```
oracle_inbox(limit=10)
```

### `/inbox read <topic>`

Find and display the most recent file matching the topic:

```bash
ls -1t "$INBOX"/*<topic>*.md 2>/dev/null | head -1
```

Read and display full content.

---

## Mode 2: Write

### `/inbox write <topic>`

```bash
TS=$(date +%Y%m%d_%H%M)
SLUG=$(echo "<topic>" | tr ' ' '-' | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]//g')
FROM=$(echo "<sender>" | tr ' ' '-' | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9-]//g')
FILE="$INBOX/${TS}_${SLUG}_from_${FROM}.md"
```

**Ask the user**: "What do you want to note?" (unless content is provided after topic)

Write the file:

```markdown
---
topic: <topic>
from: <current-oracle-name>
timestamp: YYYY-MM-DD HH:MM
---

<user's content>
```

If MCP available, also call:
```
oracle_handoff(content, slug)
```

This syncs to vault for cross-Oracle discovery.

**Confirm**: `📥 Written: ψ/inbox/${TS}_${SLUG}.md`

---

## Mode 3: List All

### `/inbox ls`

Same as read but show ALL items (no limit), with file sizes:

```bash
ls -lht "$INBOX"/*.md 2>/dev/null | grep -v schedule.md
```

Also count handoffs:
```bash
echo "📁 Handoffs: $(ls "$INBOX/handoff/" 2>/dev/null | wc -l) files"
```

---

## Mode 4: Clean

### `/inbox clean`

Move items older than 7 days to archive:

```bash
ARCHIVE="$ROOT/ψ/archive/inbox"
mkdir -p "$ARCHIVE"
find "$INBOX" -maxdepth 1 -name "*.md" -not -name "schedule.md" -mtime +7 -exec mv {} "$ARCHIVE/" \;
```

Report what was moved. Never delete — move to archive (Nothing is Deleted).

---

## Who Can Write?

Any Oracle, any skill, any agent. The only rule: **timestamp before topic** in filename.

| Writer | How | Example |
|--------|-----|---------|
| `/inbox write` | This skill | `20260323_2112_idea_from_neo.md` |
| `/forward` | Handoff | `ψ/inbox/handoff/20260323_2112_session-forward.md` |
| Another Oracle | `/talk-to` + write | `20260323_2112_status-update_from_odin.md` |
| Agent directly | `oracle_handoff()` MCP | Same format |

---

ARGUMENTS: $ARGUMENTS
