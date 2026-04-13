---
name: mailbox
description: 'Persistent agent mailbox — store findings, standing orders, and context for team agents across sessions. Use when user says "mailbox", "agent memory", "standing orders", "what did scout find", or wants to manage persistent agent knowledge.'
argument-hint: "[read <agent> | write <agent> | orders <agent> | list | load <agent>]"

---

# /mailbox — Persistent Agent Memory

> Agents die. Knowledge survives. ψ/ remembers what ~/.claude/ forgets.

Team agents in Claude Code use ephemeral file-based mailboxes that die with the session. /mailbox adds a persistent layer in ψ/memory/mailbox/ — agents remember across sessions.

## Usage

```
/mailbox                                    # List all agent mailboxes
/mailbox read <agent>                       # Read agent's mailbox
/mailbox read-all                           # Read all mailboxes
/mailbox write <agent> "<subject>" "<msg>"  # Write finding to agent
/mailbox orders <agent> "<instructions>"    # Set standing orders
/mailbox load <agent>                       # Pre-load context for spawn prompt
/mailbox archive <agent> <team>             # Archive session end
/mailbox clear <agent>                      # Clear mailbox (→ /tmp, not deleted)
```

---

## How It Works

### Storage: ψ/memory/mailbox/

```
ψ/memory/mailbox/
├── scout/
│   ├── standing-orders.md          ← permanent instructions
│   ├── 2026-04-13_findings.md      ← what scout found (append-only)
│   ├── 2026-04-14_findings.md      ← next session's findings
│   ├── context.md                  ← saved working context
│   └── 2026-04-13_session-end.md   ← archive marker
├── builder/
│   ├── standing-orders.md
│   └── 2026-04-13_findings.md
└── auditor/
    └── standing-orders.md
```

**Why ψ/, not ~/.claude/?**

| Location | Owner | Lifetime | Purpose |
|----------|-------|----------|---------|
| `~/.claude/teams/` | Claude Code | Session only | Team config, ephemeral mailbox |
| `~/.claude/tasks/` | Claude Code | Session only | Task tracking |
| **`ψ/memory/mailbox/`** | **Oracle** | **Forever** | **Persistent agent knowledge** |

Claude Code's data dies with the session. Our data lives in the vault. Nothing is Deleted.

---

## Step 0: Run the Script

```bash
bash ~/.claude/skills/mailbox/scripts/mailbox.sh [command] [args]
```

The script handles all operations. Parse the user's `/mailbox` arguments and pass them through.

---

## Commands

### `/mailbox list`

Show all agents with mailboxes:

```
📬 Agent Mailboxes (ψ/memory/mailbox/)

  scout           3 files  orders: yes  last: 2026-04-13
  builder         1 files  orders: no   last: 2026-04-13
  auditor         1 files  orders: yes  last: never
```

### `/mailbox read <agent>`

Show an agent's mailbox — standing orders + latest findings:

```
📬 Mailbox: scout

  📋 Standing Orders:
    Always check security implications first. Report severity levels.

  📝 Latest Findings (2026-04-13_findings.md):
    ## Session 4 findings
    Found ghost agent bug in Claude Code...

  Total files: 3
```

### `/mailbox write <agent> "<subject>" "<content>"`

Append a finding to the agent's mailbox:

```
📬 Written to scout's mailbox: Session 4 findings
```

### `/mailbox orders <agent> "<instructions>"`

Set permanent standing orders for an agent. These are pre-loaded into every spawn:

```
📋 Standing orders set for scout
```

### `/mailbox load <agent>`

Output agent's context in a format ready to inject into a spawn prompt. Used by /team-agents when spawning agents with memory:

```markdown
## Previous Context for scout

### Standing Orders
Always check security implications first.

### Last Session Findings
Found ghost agent bug in Claude Code...
```

### `/mailbox archive <agent> <team>`

Mark session end. Called during /team-agents shutdown:

```
📦 Session archived for scout (team: whetstone-ops)
```

### `/mailbox clear <agent>`

Move mailbox to /tmp (Nothing is Deleted):

```
📦 scout mailbox moved to /tmp/mailbox-scout-20260413_104500
```

---

## Integration with /team-agents

### On Spawn (auto-load)

When /team-agents spawns an agent, it pre-loads mailbox context:

```bash
CONTEXT=$(bash ~/.claude/skills/mailbox/scripts/mailbox.sh load scout 2>/dev/null)
```

Injected into the agent's prompt so it starts with memory.

### On Shutdown (auto-archive)

When /team-agents shuts down, it archives each agent's session:

```bash
bash ~/.claude/skills/mailbox/scripts/mailbox.sh archive scout whetstone-ops
```

### Standing Orders + Spawn

If scout has standing orders, every spawn includes them:

```
You are scout on team "whetstone-ops".

## Previous Context (from ψ/memory/mailbox/scout/)

### Standing Orders
Always check security implications first. Report severity levels.

### Last Session Findings
Found ghost agent bug in Claude Code. isActive() returns true always.
```

Scout starts every session knowing what it knows.

---

## Rules

1. **ψ/ is home** — all data lives in ψ/memory/mailbox/, never in ~/.claude/
2. **Append-only findings** — each session appends, never overwrites
3. **Nothing is Deleted** — clear moves to /tmp, not rm
4. **Standing orders persist** — until explicitly changed
5. **Load is cheap** — last 30 lines only, keeps spawn prompt small
6. **Agent identity = name** — same name across sessions = same mailbox
7. **No secrets** — never store tokens, passwords, or keys in mailbox

---

ARGUMENTS: $ARGUMENTS
