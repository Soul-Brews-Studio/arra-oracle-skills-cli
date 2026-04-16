---
name: fleet
description: 'Deep fleet census — discover all oracles across all nodes, collect versions, skills, status. Use when user says "fleet", "census", "all oracles", "fleet status", or wants a complete picture of the oracle network.'
argument-hint: "[--quick | --deep | --diff | --map]"

---

# /fleet — Deep Fleet Census

> Count the stars. Know the constellation. The fleet is one body, many hands.

Discover all oracles across all nodes, collect versions, installed skills, last activity, and health status. The complete picture of the oracle network.

## Usage

```
/fleet                  # Standard census — nodes + oracles + status
/fleet --quick          # Fast — just count nodes and oracles from contacts
/fleet --deep           # Deep — ping all, collect versions + skills + activity
/fleet --diff           # Compare — what changed since last census
/fleet --map            # Visual — show fleet topology
```

---

## Step 0: Detect & Load

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
  echo "❌ No contacts.json. Run /contacts first to register fleet members."
  exit 1
fi
```

---

## Step 1: Discover Nodes & Oracles

Parse contacts.json into nodes:

```bash
python3 -c "
import json
data = json.load(open('$PSI/contacts.json'))
contacts = data.get('contacts', {})
nodes = {}
for name, info in contacts.items():
    maw = info.get('maw', name)
    node = maw.split(':')[0] if ':' in maw else 'local'
    if node == name:
        node = 'local'
    if node not in nodes:
        nodes[node] = []
    nodes[node].append({
        'name': name,
        'maw': maw,
        'repo': info.get('repo', ''),
        'notes': info.get('notes', '')
    })

total = sum(len(v) for v in nodes.values())
print(f'📡 Fleet Census: {total} oracles across {len(nodes)} nodes')
print()
for node in sorted(nodes):
    print(f'  🏗 {node} ({len(nodes[node])} oracles)')
    for oracle in nodes[node]:
        repo = f' [{oracle[\"repo\"]}]' if oracle['repo'] else ''
        print(f'    · {oracle[\"name\"]}{repo}')
        if oracle['notes']:
            print(f'      {oracle[\"notes\"]}')
"
```

---

## Step 2: Ping & Collect (`--deep` mode)

For each non-local node, send a wormhole ping:

```bash
echo ""
echo "🔍 Deep scan — pinging all nodes..."
echo ""
```

For each oracle, attempt:

```bash
# For local oracles — check repo directly
if [ -d "$HOME/Code/github.com/Soul-Brews-Studio/$REPO_NAME" ]; then
  ORACLE_DIR="$HOME/Code/github.com/Soul-Brews-Studio/$REPO_NAME"
  
  # Last commit
  LAST_COMMIT=$(git -C "$ORACLE_DIR" log --oneline -1 2>/dev/null)
  
  # Last activity (most recent file in ψ/)
  LAST_ACTIVITY=$(find "$ORACLE_DIR/ψ" -name '*.md' -type f 2>/dev/null | xargs ls -t 2>/dev/null | head -1)
  
  # Installed skills count
  SKILL_COUNT=$(ls "$ORACLE_DIR/.claude/settings"*.json 2>/dev/null | head -1 | xargs python3 -c "
import json, sys
try:
    data = json.load(open(sys.argv[1]))
    cmds = [k for k in data.get('permissions',{}).get('allow',[]) if 'SKILL.md' in str(k)]
    print(len(cmds))
except: print('?')
" 2>/dev/null || echo "?")
fi

# For remote oracles — ping via maw hey
maw hey $MAW_ADDRESS "fleet census ping — report: version, skill count, last commit" 2>&1
```

---

## Step 3: Report

### Standard Output

```
📡 Fleet Census — [DATE]

  Node            Oracles  Status    Last Activity
  ─────────────── ──────── ───────── ─────────────
  oracle-world    4        ✅ alive   2h ago
  white           2        ✅ alive   4h ago
  mba             3        ⏳ remote  unknown
  clinic-nat      1        ⏳ remote  unknown

  Total: N oracles | M nodes | X alive | Y remote

  ─── Oracle Details ───

  oracle-world/boonkeeper
    Repo: Soul-Brews-Studio/boonkeeper-oracle
    Last commit: abc1234 — description
    Skills: N installed
    Notes: Server infra. Foundation operator.

  oracle-world/mawjs-oracle
    Repo: Soul-Brews-Studio/mawjs-oracle
    Last commit: def5678 — description
    Skills: N installed
    Notes: maw-js runtime. Budded from.

  [... for each oracle ...]
```

### `--map` Mode

```
📡 Fleet Topology

  oracle-world ─┬─ boonkeeper (server infra)
                ├─ mawjs-oracle (maw-js runtime)
                ├─ mawui-oracle (living lens)
                └─ skills-cli-oracle (the whetstone) ← YOU ARE HERE

  white ────────┬─ mawjs (maw-js origin)
                └─ white-wormhole (federated proxy)

  mba ──────────┬─ vpnkeeper (VPN infra)
                ├─ homekeeper (home infra)
                └─ volt

  clinic-nat ───── neo (the soul)

  Legend: ← YOU ARE HERE marks this oracle
          Lines show node membership, not communication paths
```

### `--diff` Mode

Compare current census with last saved census:

```bash
LAST_CENSUS="$PSI/memory/fleet-census-latest.json"
```

Show:
- New oracles (added since last census)
- Removed oracles (no longer in contacts)
- Changed oracles (different repo, notes, or node)
- Activity delta (commits since last census)

---

## Step 4: Save Census

```bash
CENSUS_FILE="$PSI/memory/fleet-census-latest.json"
```

Save structured JSON with timestamp, node list, oracle details, and ping results. This enables `--diff` on next run.

---

## Rules

1. **Discover from contacts** — never hardcode nodes or oracles
2. **Local first** — check local repos directly before pinging remote
3. **No secrets** — census never includes .env, tokens, or credentials
4. **Save for diff** — always save census for future comparison
5. **Generic** — works for ANY fleet, ANY contacts.json
6. **Timeout** — don't hang on unresponsive remote nodes (5s timeout per ping)

---

ARGUMENTS: $ARGUMENTS
