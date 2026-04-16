---
name: warp
description: 'Teleport to a remote oracle node via SSH+tmux. Interactive session — you BECOME the remote oracle temporarily. Use when user says "warp", "teleport", "ssh to node", "go to node", or needs interactive multi-step work on a remote machine.'
argument-hint: "<node>:<agent> [--attach | --new | --list]"

---

# /warp — Teleport to Remote Node

> When one round-trip isn't enough. Step through the door.

SSH into a remote oracle node and attach to their tmux session. You become the remote oracle temporarily — full interactive access for multi-step work. The complement to /wormhole (fire-and-forget queries).

## When to Use

| Need | Use |
|------|-----|
| Specific question, one answer | `/wormhole` |
| Exploratory work, debugging, multi-step | `/warp` |
| "I need more than 2 round-trips" | `/warp` |

## Usage

```
/warp <node>:<agent>           # SSH + attach to existing tmux session
/warp <node>:<agent> --new     # SSH + create new tmux session
/warp <node>:<agent> --attach  # Attach only (already SSH'd)
/warp <node>:<agent> --list    # List active tmux sessions on node
/warp back                     # Return to local oracle
```

### Examples

```
/warp white:mawjs              # Teleport to white node, mawjs oracle
/warp boonkeeper --list        # Check what's running on boonkeeper
/warp oracle-world:mawjs-oracle --new  # New session on oracle-world
/warp back                     # Come home
```

---

## Step 0: Resolve Target

```bash
date "+🕐 %H:%M %Z (%A %d %B %Y)" && ORACLE_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -n "$ORACLE_ROOT" ] && [ -f "$ORACLE_ROOT/CLAUDE.md" ] && { [ -d "$ORACLE_ROOT/ψ" ] || [ -L "$ORACLE_ROOT/ψ" ]; }; then
  PSI="$ORACLE_ROOT/ψ"
else
  ORACLE_ROOT="$(pwd)"
  PSI="$ORACLE_ROOT/ψ"
fi
```

### Load Contacts & Resolve

```bash
if [ ! -f "$PSI/contacts.json" ]; then
  echo "❌ No contacts.json. Run /contacts first."
  exit 1
fi
```

Parse target to find the node's SSH address. Look for node configuration in contacts or known hosts:

```bash
python3 -c "
import json, sys
data = json.load(open('$PSI/contacts.json'))
contacts = data.get('contacts', {})
target = '$TARGET'

# Find the contact
for name, info in contacts.items():
    maw = info.get('maw', name)
    if target == name or target == maw or target.split(':')[0] in [name, maw.split(':')[0]]:
        print(f'NAME={name}')
        print(f'MAW={maw}')
        print(f'REPO={info.get(\"repo\", \"\")}')
        print(f'NOTES={info.get(\"notes\", \"\")}')
        sys.exit(0)
print('NOT_FOUND')
sys.exit(1)
"
```

---

## Step 1: Determine SSH Target

Map node names to SSH hosts. Check these sources in order:

1. **~/.ssh/config** — look for Host entries matching the node name
2. **WireGuard peers** — `wg show` for known endpoints
3. **maw registry** — `maw nodes` if available
4. **/etc/hosts** — direct hostname resolution

```bash
# Try SSH config first
SSH_HOST=$(ssh -G "$NODE" 2>/dev/null | grep "^hostname " | awk '{print $2}')

if [ -z "$SSH_HOST" ]; then
  echo "❌ No SSH config for node '$NODE'"
  echo "💡 Add to ~/.ssh/config:"
  echo "  Host $NODE"
  echo "    HostName <ip-or-hostname>"
  echo "    User neo"
  exit 1
fi

echo "🌀 Resolved: $NODE → $SSH_HOST"
```

---

## Step 2: Check Remote tmux

```bash
echo "🔍 Checking tmux sessions on $NODE..."

SESSIONS=$(ssh "$NODE" "tmux list-sessions 2>/dev/null" 2>/dev/null)

if [ -z "$SESSIONS" ]; then
  echo "  No active tmux sessions."
  if [ "$MODE" != "--new" ]; then
    echo "  💡 Use /warp $TARGET --new to create one"
  fi
fi
```

### `--list` Mode

Show sessions and exit:

```
🌀 tmux sessions on $NODE:

  Session       Windows  Created      Status
  ─────────────  ──────── ──────────── ──────
  oracle         3        2h ago       attached
  dev            1        5h ago       detached

  💡 /warp $NODE --attach <session-name>
```

---

## Step 3: Connect

### Attach to existing session (default)

```bash
echo "🌀 Warping to $NODE..."
echo "  📡 SSH: $SSH_HOST"
echo "  🖥  tmux: attaching to default session"
echo ""
echo "  ⚠️ You are now REMOTE. Local context is paused."
echo "  💡 Ctrl+B D to detach (keeps session alive)"
echo "  💡 /warp back to return"
echo ""

ssh -t "$NODE" "tmux attach-session || tmux new-session -s oracle"
```

### Create new session (`--new`)

```bash
SESSION_NAME="${AGENT:-oracle}-$(date +%H%M)"
ssh -t "$NODE" "tmux new-session -s '$SESSION_NAME'"
```

---

## Step 4: Return (`/warp back`)

When the user says `/warp back` or detaches from tmux:

```
🌀 Returned to local oracle

  📍 Back at: $(hostname) / $ORACLE_ROOT
  ⏱  Remote session: still alive (detached)
  
  💡 /warp $LAST_TARGET — reconnect
  💡 /wormhole $LAST_TARGET "status" — quick check
```

---

## Safety

1. **SSH keys required** — never prompt for passwords (use ssh-agent)
2. **tmux isolation** — always use tmux (never raw SSH), so sessions survive disconnects
3. **No port forwarding** — warp is for oracle work, not tunneling
4. **Log warps** — record in ψ/memory/logs/warp.jsonl for audit trail
5. **Return signal** — always remind how to come back (Ctrl+B D or /warp back)

---

## Warp Log

```bash
LOG_FILE="$PSI/memory/logs/warp.jsonl"
mkdir -p "$(dirname "$LOG_FILE")"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "{\"ts\":\"$TIMESTAMP\",\"target\":\"$TARGET\",\"node\":\"$NODE\",\"action\":\"warp\"}" >> "$LOG_FILE"
```

---

## Rules

1. **Interactive only** — warp is for multi-step work, not queries (use /wormhole for that)
2. **SSH config required** — never guess hostnames or IPs
3. **tmux always** — raw SSH is dangerous (disconnects kill work)
4. **Log everything** — warp activity tracked for audit
5. **Return path** — always show how to come back
6. **No secrets transit** — never pipe .env or credentials through warp

---

ARGUMENTS: $ARGUMENTS
