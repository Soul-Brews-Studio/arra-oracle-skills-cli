---
name: wormhole
description: 'Federated query proxy — ask questions across oracle nodes without moving data. Use when user says "wormhole", "ask another node", "federated query", "cross-node", or wants to query remote oracles.'
argument-hint: "<node>:<agent> <question> [--raw | --deep]"

---

# /wormhole — Federated Query Proxy

> Viewer global, data sovereign. Questions travel. Answers return. Data stays home.

Send questions to remote oracle nodes via `maw hey` federation transport. The remote oracle executes locally and returns results. No data exfiltration — only answers cross the wire.

## Usage

```
/wormhole <node>:<agent> "<question>"       # One-shot query
/wormhole <node>:<agent> "<question>" --raw  # Return raw output, no formatting
/wormhole <node>:<agent> "<question>" --deep # Ask for deep analysis
/wormhole status                             # Show recent wormhole activity
/wormhole ping <node>:<agent>                # Test connectivity
```

### Examples

```
/wormhole white:white-wormhole "what oracles do you have?"
/wormhole mawjs-oracle "/dig --timeline"
/wormhole boonkeeper "git log --oneline -5"
/wormhole white:mawjs "how many skills are installed?" --deep
```

---

## Step 0: Detect & Load Contacts

```bash
date "+🕐 %H:%M %Z (%A %d %B %Y)" && ORACLE_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -n "$ORACLE_ROOT" ] && [ -f "$ORACLE_ROOT/CLAUDE.md" ] && { [ -d "$ORACLE_ROOT/ψ" ] || [ -L "$ORACLE_ROOT/ψ" ]; }; then
  PSI="$ORACLE_ROOT/ψ"
else
  ORACLE_ROOT="$(pwd)"
  PSI="$ORACLE_ROOT/ψ"
fi
```

### Load Contacts

```bash
if [ ! -f "$PSI/contacts.json" ]; then
  echo "❌ No contacts.json found. Run /contacts first."
  exit 1
fi

# Parse target from arguments
TARGET="$1"  # e.g., "white:white-wormhole" or "mawjs-oracle"
QUESTION="$2"
```

### Resolve Target

```bash
# Check if target exists in contacts
python3 -c "
import json, sys
data = json.load(open('$PSI/contacts.json'))
contacts = data.get('contacts', {})

target = '$TARGET'
# Try exact match first
if target in contacts:
    maw = contacts[target].get('maw', target)
    print(f'RESOLVED={maw}')
    sys.exit(0)

# Try node:agent format — check if any contact has matching maw
for name, info in contacts.items():
    if info.get('maw') == target:
        print(f'RESOLVED={target}')
        sys.exit(0)

# Try partial match on node name
for name, info in contacts.items():
    maw = info.get('maw', name)
    if target in maw or target == name:
        print(f'RESOLVED={maw}')
        sys.exit(0)

print('RESOLVED=NONE')
sys.exit(1)
" 2>/dev/null
```

If `RESOLVED=NONE`, show available contacts and exit.

---

## Step 1: Compose Request

### Protocol v0.1 — Rule 6 Signature IS Return Address

The request format embeds identity so the remote oracle knows who's asking and where to reply:

```
[ORIGIN_HOST:ORIGIN_AGENT] → REQUEST: <question>
```

Get our identity:

```bash
SELF_HOST=$(hostname -s 2>/dev/null || echo "unknown")
SELF_AGENT=$(basename "$ORACLE_ROOT" | sed 's/-oracle$//')
ORIGIN="[$SELF_HOST:$SELF_AGENT]"
```

Compose the message:

```bash
MESSAGE="$ORIGIN → REQUEST: $QUESTION"
```

---

## Step 2: Send via maw hey

```bash
echo "🌀 Sending wormhole request..."
echo "  📡 Target: $TARGET"
echo "  ❓ Question: $QUESTION"
echo ""

RESPONSE=$(maw hey $RESOLVED "$MESSAGE" 2>&1)
EXIT_CODE=$?

if [ $EXIT_CODE -ne 0 ]; then
  echo "❌ Wormhole failed: $RESPONSE"
  echo "💡 Check: is the target node online? Try /machines ping first."
  exit 1
fi

echo "$RESPONSE"
```

---

## Step 3: Log Activity

Record wormhole activity for /wormhole status:

```bash
LOG_DIR="$PSI/memory/logs"
mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/wormhole.jsonl"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

echo "{\"ts\":\"$TIMESTAMP\",\"target\":\"$TARGET\",\"question\":\"$QUESTION\",\"status\":\"sent\"}" >> "$LOG_FILE"
```

---

## Step 4: Format Response

### Default Mode

```
🌀 Wormhole Response

  From: <target>
  Question: <question>
  
  ─────────────────────────────
  <response content>
  ─────────────────────────────
  
  📡 Round-trip complete
  💡 /wormhole status — see recent activity
```

### `--raw` Mode

Print response content only, no formatting. Useful for piping to other skills.

### `--deep` Mode

Append `— please analyze in depth, show your reasoning` to the question before sending.

---

## /wormhole status

Show recent wormhole activity from log:

```bash
echo "🌀 Recent Wormhole Activity"
echo ""

if [ -f "$PSI/memory/logs/wormhole.jsonl" ]; then
  tail -10 "$PSI/memory/logs/wormhole.jsonl" | python3 -c "
import json, sys
for line in sys.stdin:
    try:
        entry = json.loads(line.strip())
        ts = entry.get('ts', '?')[:16].replace('T', ' ')
        target = entry.get('target', '?')
        q = entry.get('question', '?')[:50]
        status = entry.get('status', '?')
        icon = '✅' if status == 'delivered' else '📡' if status == 'sent' else '❌'
        print(f'  {icon} {ts}  {target:20s}  {q}')
    except: pass
"
else
  echo "  No wormhole activity yet."
fi
```

---

## /wormhole ping

Quick connectivity test:

```bash
echo "🌀 Pinging $TARGET..."
RESPONSE=$(maw hey $RESOLVED "ping from $(hostname) — alive?" 2>&1)
if echo "$RESPONSE" | grep -qi "delivered\|success\|alive"; then
  echo "✅ $TARGET is alive"
else
  echo "⏳ $TARGET — sent but no confirmation"
  echo "   Response: $RESPONSE"
fi
```

---

## Trust Boundary (v0.1)

### Default Safe (any peer can ask)

- `/dig`, `/trace` — read-only exploration
- Read on `ψ/memory/`, `~/Code/` — knowledge sharing
- Grep reads — search without modification

### Opt-In (requires explicit trust config)

- Bash execution
- Write/Edit operations
- Access to non-standard paths

### Hard Refuse (always blocked)

- `.env`, `.ssh/`, credentials — never exposed
- Destructive operations (`rm -rf`, `git reset --hard`)
- Unsanitized paths — **EXACT-MATCH, not prefix-match** (prevents traversal like `~/Code/../.ssh/`)

---

## Rules

1. **Data sovereign** — answers travel, source data stays home
2. **Rule 6 signed** — every request carries origin identity
3. **Log everything** — wormhole activity tracked in ψ/memory/logs/
4. **No silent failures** — always report delivery status
5. **Trust boundary** — respect the safe/opt-in/refuse tiers
6. **Path normalization** — `realpath` before any allowlist check (v0.1.1 security fix)
7. **Fire-and-forget** — maw hey is async; if you need interactive, use /warp instead

---

## Companion Skills

| Need | Use |
|------|-----|
| Specific question, one round-trip | `/wormhole` |
| Exploratory, multi-step, interactive | `/warp` (SSH + tmux attach) |
| Ping all nodes | `/machines ping` |
| Fleet census | `/fleet` |

---

ARGUMENTS: $ARGUMENTS
