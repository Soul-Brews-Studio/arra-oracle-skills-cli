#!/usr/bin/env bash
# Persistent team agent mailbox — agent memory across sessions
# Usage:
#   mailbox.sh write <agent> <subject> <content>   # Write to agent's mailbox
#   mailbox.sh read <agent>                         # Read agent's mailbox
#   mailbox.sh read-all                             # Read all agent mailboxes
#   mailbox.sh load <agent>                         # Output for pre-loading into spawn prompt
#   mailbox.sh standing-orders <agent> <orders>     # Set permanent instructions
#   mailbox.sh archive <agent> <team>               # Archive session findings
#   mailbox.sh list                                 # List all agents with mailboxes
#   mailbox.sh clear <agent>                        # Clear agent's mailbox (mv to /tmp)

set -euo pipefail

# Detect oracle root
ORACLE_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
if [ -f "$ORACLE_ROOT/CLAUDE.md" ] && { [ -d "$ORACLE_ROOT/ψ" ] || [ -L "$ORACLE_ROOT/ψ" ]; }; then
  PSI="$ORACLE_ROOT/ψ"
else
  PSI="$ORACLE_ROOT/ψ"
fi

MAILBOX_DIR="$PSI/memory/mailbox"
CMD="${1:-help}"
shift 2>/dev/null || true

case "$CMD" in

  write)
    AGENT="${1:?Usage: mailbox.sh write <agent> <subject> <content>}"
    SUBJECT="${2:?Usage: mailbox.sh write <agent> <subject> <content>}"
    shift 2
    CONTENT="$*"
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    DATE=$(date +%Y-%m-%d)

    mkdir -p "$MAILBOX_DIR/$AGENT"

    # Append to findings log
    cat >> "$MAILBOX_DIR/$AGENT/${DATE}_findings.md" << EOF

## $SUBJECT
**Time**: $TIMESTAMP

$CONTENT

---
EOF

    echo "📬 Written to $AGENT's mailbox: $SUBJECT"
    ;;

  read)
    AGENT="${1:?Usage: mailbox.sh read <agent>}"
    AGENT_DIR="$MAILBOX_DIR/$AGENT"

    if [ ! -d "$AGENT_DIR" ]; then
      echo "📭 No mailbox for $AGENT"
      exit 0
    fi

    echo ""
    echo "📬 Mailbox: $AGENT"
    echo ""

    # Standing orders first
    if [ -f "$AGENT_DIR/standing-orders.md" ]; then
      echo "  📋 Standing Orders:"
      sed 's/^/    /' "$AGENT_DIR/standing-orders.md"
      echo ""
    fi

    # Recent findings
    LATEST=$(ls -t "$AGENT_DIR"/*_findings.md 2>/dev/null | head -1)
    if [ -n "$LATEST" ]; then
      echo "  📝 Latest Findings ($(basename "$LATEST")):"
      tail -20 "$LATEST" | sed 's/^/    /'
      echo ""
    fi

    # Count total files
    TOTAL=$(find "$AGENT_DIR" -name "*.md" 2>/dev/null | wc -l)
    echo "  Total files: $TOTAL"
    echo ""
    ;;

  read-all)
    if [ ! -d "$MAILBOX_DIR" ]; then
      echo "📭 No mailboxes exist yet"
      exit 0
    fi

    echo ""
    echo "📬 All Agent Mailboxes"
    echo ""

    for agent_dir in "$MAILBOX_DIR"/*/; do
      [ -d "$agent_dir" ] || continue
      AGENT=$(basename "$agent_dir")
      FILES=$(find "$agent_dir" -name "*.md" 2>/dev/null | wc -l)
      HAS_ORDERS="no"
      [ -f "$agent_dir/standing-orders.md" ] && HAS_ORDERS="yes"
      LATEST=$(ls -t "$agent_dir"/*_findings.md 2>/dev/null | head -1)
      LAST_DATE=""
      [ -n "$LATEST" ] && LAST_DATE=$(basename "$LATEST" | cut -d_ -f1)

      printf "  %-15s %3d files  orders: %-3s  last: %s\n" "$AGENT" "$FILES" "$HAS_ORDERS" "${LAST_DATE:-never}"
    done
    echo ""
    ;;

  load)
    AGENT="${1:?Usage: mailbox.sh load <agent>}"
    AGENT_DIR="$MAILBOX_DIR/$AGENT"

    # Output context suitable for injecting into spawn prompt
    if [ ! -d "$AGENT_DIR" ]; then
      echo "No previous context for $AGENT."
      exit 0
    fi

    echo "## Previous Context for $AGENT"
    echo ""

    if [ -f "$AGENT_DIR/standing-orders.md" ]; then
      echo "### Standing Orders"
      cat "$AGENT_DIR/standing-orders.md"
      echo ""
    fi

    LATEST=$(ls -t "$AGENT_DIR"/*_findings.md 2>/dev/null | head -1)
    if [ -n "$LATEST" ]; then
      echo "### Last Session Findings ($(basename "$LATEST"))"
      # Last 30 lines to keep prompt size manageable
      tail -30 "$LATEST"
      echo ""
    fi

    if [ -f "$AGENT_DIR/context.md" ]; then
      echo "### Saved Context"
      cat "$AGENT_DIR/context.md"
      echo ""
    fi
    ;;

  standing-orders|orders)
    AGENT="${1:?Usage: mailbox.sh standing-orders <agent> <orders>}"
    shift
    ORDERS="$*"

    mkdir -p "$MAILBOX_DIR/$AGENT"

    if [ -z "$ORDERS" ]; then
      # Read existing
      if [ -f "$MAILBOX_DIR/$AGENT/standing-orders.md" ]; then
        echo "📋 Standing orders for $AGENT:"
        cat "$MAILBOX_DIR/$AGENT/standing-orders.md"
      else
        echo "📋 No standing orders for $AGENT"
      fi
    else
      # Write
      echo "$ORDERS" > "$MAILBOX_DIR/$AGENT/standing-orders.md"
      echo "📋 Standing orders set for $AGENT"
    fi
    ;;

  archive)
    AGENT="${1:?Usage: mailbox.sh archive <agent> <team>}"
    TEAM="${2:-unknown}"
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    DATE=$(date +%Y-%m-%d_%H%M%S)

    mkdir -p "$MAILBOX_DIR/$AGENT"

    # Check if there are ephemeral skill findings to archive
    SKILL_DIR="$HOME/.claude/skills/$AGENT"
    if [ -d "$SKILL_DIR" ]; then
      cp "$SKILL_DIR/SKILL.md" "$MAILBOX_DIR/$AGENT/${DATE}_skill-snapshot.md" 2>/dev/null
      echo "📦 Archived $AGENT's skill snapshot"
    fi

    # Write archive marker
    cat >> "$MAILBOX_DIR/$AGENT/${DATE}_session-end.md" << EOF
# Session End — $AGENT

**Team**: $TEAM
**Archived**: $TIMESTAMP
**Action**: Agent session completed, findings preserved

---
EOF

    echo "📦 Session archived for $AGENT (team: $TEAM)"
    ;;

  list)
    if [ ! -d "$MAILBOX_DIR" ]; then
      echo "📭 No mailboxes"
      exit 0
    fi

    echo ""
    echo "📬 Agent Mailboxes ($MAILBOX_DIR)"
    echo ""

    for agent_dir in "$MAILBOX_DIR"/*/; do
      [ -d "$agent_dir" ] || continue
      AGENT=$(basename "$agent_dir")
      SIZE=$(du -sh "$agent_dir" 2>/dev/null | cut -f1)
      echo "  $AGENT ($SIZE)"
    done
    echo ""
    ;;

  clear)
    AGENT="${1:?Usage: mailbox.sh clear <agent>}"
    AGENT_DIR="$MAILBOX_DIR/$AGENT"

    if [ ! -d "$AGENT_DIR" ]; then
      echo "📭 No mailbox for $AGENT"
      exit 0
    fi

    # Nothing is Deleted — move to /tmp
    ARCHIVE="/tmp/mailbox-${AGENT}-$(date +%Y%m%d_%H%M%S)"
    mv "$AGENT_DIR" "$ARCHIVE"
    echo "📦 $AGENT mailbox moved to $ARCHIVE"
    echo "   Nothing is Deleted — recover from $ARCHIVE"
    ;;

  help|--help|-h)
    echo ""
    echo "📬 mailbox.sh — persistent team agent memory"
    echo ""
    echo "  Commands:"
    echo "    write <agent> <subject> <content>    Write finding"
    echo "    read <agent>                          Read mailbox"
    echo "    read-all                              Read all"
    echo "    load <agent>                          Pre-load for spawn prompt"
    echo "    orders <agent> [orders]               Get/set standing orders"
    echo "    archive <agent> <team>                Archive session end"
    echo "    list                                  List all mailboxes"
    echo "    clear <agent>                         Clear (mv to /tmp)"
    echo ""
    echo "  Storage: ψ/memory/mailbox/<agent>/"
    echo ""
    ;;

  *)
    echo "Unknown: $CMD — run: mailbox.sh help"
    exit 1
    ;;
esac
