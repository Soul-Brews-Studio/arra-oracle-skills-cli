---
name: machines
description: 'Fleet machines — discover nodes from contacts, ping to prove alive, create local shortcuts. Use when user says "machines", "nodes", "fleet", or wants to see/reach machines in the fleet.'
argument-hint: "[ping | list | setup | <node-name>]"
---

# /machines — Fleet Machines

> Discover. Ping. Create shortcuts. All from contacts.json.

## Usage

```
/machines              # Discover nodes from contacts, ping all
/machines ping         # Same — ping all, show who's alive
/machines list         # List known nodes (no ping)
/machines setup        # Ping → confirm → create /shortcuts for alive nodes
/machines <node>       # Ping one node, show details
```

---

## Step 0: Discover Nodes from Contacts

```bash
date "+🕐 %H:%M %Z (%A %d %B %Y)" && ORACLE_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -n "$ORACLE_ROOT" ] && [ -f "$ORACLE_ROOT/CLAUDE.md" ] && { [ -d "$ORACLE_ROOT/ψ" ] || [ -L "$ORACLE_ROOT/ψ" ]; }; then
  PSI="$ORACLE_ROOT/ψ"
else
  ORACLE_ROOT="$(pwd)"
  PSI="$ORACLE_ROOT/ψ"
fi
```

Read `$PSI/contacts.json` and group contacts by node. The node is extracted from the `maw` field (everything before `:` in `maw hey node:agent`):

```bash
cat "$PSI/contacts.json" 2>/dev/null | python3 -c "
import json, sys
data = json.load(sys.stdin)
nodes = {}
for name, info in data.get('contacts', {}).items():
    maw = info.get('maw', name)
    # Extract node: 'white:mawjs' → 'white', 'boonkeeper' → 'local'
    node = maw.split(':')[0] if ':' in maw else 'local'
    if node == name:
        node = 'local'
    if node not in nodes:
        nodes[node] = []
    nodes[node].append({'name': name, 'notes': info.get('notes', '')})
for node in sorted(nodes):
    agents = ', '.join(a['name'] for a in nodes[node])
    print(f'{node} ({len(nodes[node])}): {agents}')
"
```

**No hardcoded nodes.** Everything comes from contacts.

---

## Step 1: Ping (`/machines`, `/machines ping`)

For each discovered node, pick one agent and send a ping via `maw hey`:

```bash
# For each non-local node, pick the first agent and ping
maw hey <node>:<first-agent> "ping from $(hostname) — alive?" 2>&1
```

For the local node, just run `maw ls`.

Show results as a table:

```
🏗 Fleet Machines

  Node           Status    Oracles  Ping Target
  ────────────── ───────── ──────── ──────────────
  local          ✅ alive   N       maw ls
  <node-1>       ✅ alive   N       <agent> → delivered
  <node-2>       ⏳ waiting N       <agent> → sent
  <node-3>       ❌ failed  N       <agent> → error

  Alive: X/Y confirmed
```

If `maw hey` output contains "delivered", the node is alive.

---

## Step 2: Details (`/machines <node>`)

Show all oracles on that node + how to talk:

```
🏗 <node> — N oracles

  Agent           Notes                         Talk
  ──────────────  ───────────────────────────── ──────────────────────────
  <agent-1>       <notes from contacts>          maw hey <node>:<agent-1> "..."
  <agent-2>       <notes from contacts>          maw hey <node>:<agent-2> "..."
```

---

## Step 3: Setup (`/machines setup`)

After pinging, offer to create local shortcuts:

```
✅ N nodes confirmed alive. Create machine shortcuts?

  /<node-1>  → N oracles
  /<node-2>  → N oracles
  ...

  Create all? [Y/n]
```

**WAIT for user confirmation.**

Then for each node, create `.claude/skills/<node>/SKILL.md` with:
- Node name + oracle list (from contacts)
- `maw hey <node>:<agent>` examples
- Notes from contacts.json

These are LOCAL skills — gitignored, personal to each fleet.

---

## Step 4: List (`/machines list`)

Show all known nodes without pinging:

```
🏗 Known Machines (from ψ/contacts.json)

  Node           Oracles
  ────────────── ────────────────────────────────
  local          <comma-separated agents>
  <node-1>       <comma-separated agents>
  <node-2>       <comma-separated agents>

  💡 /machines ping  — check who's alive
  💡 /machines setup — create shortcuts
```

---

## Rules

1. **Discover from contacts** — never hardcode node names or IPs
2. **Talk first** — always ping before claiming alive
3. **Confirm before creating** — never auto-create without user approval
4. **Local shortcuts** — created in .claude/skills/, gitignored
5. **Generic** — works for ANY fleet, ANY nodes, ANY contacts.json

---

ARGUMENTS: $ARGUMENTS
