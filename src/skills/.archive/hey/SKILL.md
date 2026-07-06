---
name: hey
description: Talk to another oracle via maw federation. Uses fleet machine names (white, mba, clinic-nat, oracle-world, phaith). Auto-signs with current oracle's [host:handle] from CLAUDE.md. Global — works from any oracle repo.
---

# /hey

Quick federation messenger. Wraps `maw hey <node>:<agent>` with two additions:
1. Fleet-name resolution — just use `fireman` instead of `white:fireman` when target is on current host
2. Auto-sig — appends `[<host>:<handle>]` read from local CLAUDE.md

## Usage

```
/hey <node>:<agent> <message>      # explicit node:agent
/hey <agent> <message>              # same host as me (infer node)
/hey list                           # list reachable agents in fleet
/hey peek <node>:<agent>            # wrap maw peek
```

## Step 0: Init + resolve identity

```bash
date "+🕐 %H:%M %Z"
# Resolve my identity from CLAUDE.md
MY_HANDLE=$(grep -E "^- \*\*Technical handle\*\*:|^- \*\*Handle\*\*:" CLAUDE.md 2>/dev/null | head -1 | sed -E 's/.*`([^`]+)`.*/\1/' || echo "")
# Fallback to repo name if CLAUDE.md missing
[ -z "$MY_HANDLE" ] && MY_HANDLE=$(basename "$(git rev-parse --show-toplevel 2>/dev/null || pwd)" | sed 's/-oracle$//')
MY_HOST=$(hostname -s 2>/dev/null | tr '[:upper:]' '[:lower:]')
# Common fleet host aliases
case "$MY_HOST" in
  white.local|white) MY_HOST=white ;;
  mba*) MY_HOST=mba ;;
esac
MY_SIG="[$MY_HOST:$MY_HANDLE]"
echo "sig=$MY_SIG"
```

## Usage: send

```bash
TARGET="$1"      # fireman OR white:fireman
MSG="$2"         # message body

# Resolve target node
if [[ "$TARGET" == *:* ]]; then
  NODE=${TARGET%%:*}
  AGENT=${TARGET##*:}
else
  NODE=$MY_HOST
  AGENT=$TARGET
fi

maw hey "$NODE:$AGENT" "$MSG $MY_SIG"
```

## Usage: list

```bash
maw agents 2>&1 | awk 'NR>1 {print $1":"$4, "("$5")"}'
```

## Usage: peek

```bash
maw peek "$TARGET" 2>&1 | head -40
```

## Fleet machine names (from ~/etc/hosts)

| Name | IP | Route |
|---|---|---|
| `white` | localhost / 10.x | this machine (Linux/Ubuntu) |
| `mba` | mba.wg / 10.20.0.3 | WireGuard |
| `clinic-nat` | 10.20.0.1 | WireGuard |
| `oracle-world` | 100.120.242.120 | WireGuard |
| `phaith` | localhost:3458 | local peer |

## Rule 6 discipline

All outbound federation messages carry `[<host>:<handle>]` at the end. Never pretend to be human; never drop the sig. The sig is identity, not decoration.

## Related

- `/contacts` (core) — Oracle contact registry
- `/talk-to` (core) — heavier threaded conversation
- `/federation-talk` (user) — fleet-wide broadcast

## Examples

```
/hey fireman "FMT registry changed?"
/hey white:arthur-god-line "update from child"
/hey list
/hey peek white:fireman
```

---

ARGUMENTS: $ARGUMENTS
