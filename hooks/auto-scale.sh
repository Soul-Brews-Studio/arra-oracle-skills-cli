#!/bin/bash
# Auto-scale: context awareness + interval-based auto-triggers
# Shows: 📊 Opus 4.6 14% (140k/1000k) | 🕐 08:24 | 15 Mar 2026 | white
# Triggers: /rrr every 140k, /forward every 195k (repeating intervals)
# Toggle: touch /tmp/claude-auto-scale-off to disable triggers (status line still shows)

TDIR="${TMPDIR:-${TMP:-${TEMP:-/tmp}}}"
CACHE="${TDIR}/statusline-raw.json"
[ ! -f "$CACHE" ] && exit 0

# Read hook stdin first (has session_id + cwd)
INPUT=$(cat)
CWD=$(echo "$INPUT" | /usr/bin/jq -r '.cwd // ""' 2>/dev/null)
hook_sid=$(echo "$INPUT" | /usr/bin/jq -r '.session_id // empty' 2>/dev/null)

# Read context data from statusline cache
model=$(/usr/bin/jq -r '.model.display_name // "?"' "$CACHE" 2>/dev/null)
used_k=$(/usr/bin/jq -r '((.context_window.current_usage | ((.input_tokens//0)+(.cache_creation_input_tokens//0)+(.cache_read_input_tokens//0)+(.output_tokens//0))) / 1000) | floor' "$CACHE" 2>/dev/null) || exit 0
max_k=$(/usr/bin/jq -r '((.context_window.context_window_size // 0) / 1000) | floor' "$CACHE" 2>/dev/null)
pct=$(/usr/bin/jq -r '.context_window.used_percentage // 0' "$CACHE" 2>/dev/null | cut -d. -f1)

# Session ID: prefer hook stdin (accurate), fallback to cache
session_id="${hook_sid:-$(/usr/bin/jq -r '.session_id // empty' "$CACHE" 2>/dev/null)}"

TIME=$(date '+%H:%M')
HOST="$(hostname -s).local"
# Last 2 path segments (org/repo or parent/dir)
PROJECT=$(echo "$CWD" | rev | cut -d/ -f1-2 | rev)
# Worktree: prefix with 🌳
WT=""
[ -f "$CWD/.git" ] && WT="🌳 "

# Git hash
GHASH=$(timeout 1 git -C "$CWD" rev-parse --short HEAD 2>/dev/null)

# Previous session
ENCODED_CWD=$(echo "$CWD" | sed 's|/|-|g; s|\.|-|g')
PROJ_DIR="$HOME/.claude/projects/${ENCODED_CWD}"
JSONL_COUNT=$(ls "$PROJ_DIR"/*.jsonl 2>/dev/null | wc -l)
prev_sid=""
[ "$JSONL_COUNT" -gt 1 ] && prev_sid=$(ls -t "$PROJ_DIR"/*.jsonl 2>/dev/null | sed -n '2p' | xargs -I{} basename {} .jsonl 2>/dev/null | cut -c1-8)
prev_info=""
[ -n "$prev_sid" ] && [ "x$prev_sid" != "x$sid" ] && prev_info="${prev_sid} → "

# Interval config
RRR_INTERVAL=100
FWD_INTERVAL=195

# Session-scoped state files (store last triggered threshold)
sid=$(echo "$session_id" | cut -c1-8)
RRR_STATE="${TDIR}/claude-auto-rrr-${sid}"
FWD_STATE="${TDIR}/claude-auto-fwd-${sid}"
DISABLE_FLAG="${TDIR}/claude-auto-scale-off"

# Last triggered thresholds (0 = never triggered)
last_rrr=$(cat "$RRR_STATE" 2>/dev/null || echo 0)
last_fwd=$(cat "$FWD_STATE" 2>/dev/null || echo 0)

# Next thresholds
next_rrr=$((last_rrr + RRR_INTERVAL))
next_fwd=$((last_fwd + FWD_INTERVAL))

# Auto-trigger mode indicator
auto="on"
[ -f "$DISABLE_FLAG" ] && auto="off"

# Determine urgency level for status line
if [ "$used_k" -ge "$next_fwd" ]; then
  icon="🚨"
elif [ "$used_k" -ge "$next_rrr" ]; then
  icon="⚠️"
else
  icon="📊"
fi

# Always show status line with next thresholds
echo "${TIME} | #${GHASH} | 📡 ${prev_info}${sid} | ${used_k}k (rrr:${next_rrr}k fwd:${next_fwd}k) | ${HOST} | ${WT}${PROJECT} | auto:${auto}"

# Auto-triggers (skip if disabled)
[ -f "$DISABLE_FLAG" ] && exit 0

# Forward takes priority over rrr
if [ "$used_k" -ge "$next_fwd" ]; then
  echo "$next_fwd" > "$FWD_STATE"
  echo "⚠️ Context at ${used_k}k — You MUST use AskUserQuestion tool to ask: 'Time for /forward to create handoff?' with options ['Yes, run /forward', 'No, skip']. If yes, invoke /forward skill. If no, continue normally."
elif [ "$used_k" -ge "$next_rrr" ]; then
  echo "$next_rrr" > "$RRR_STATE"
  echo "📝 Context at ${used_k}k — You MUST use AskUserQuestion tool to ask: 'Time for /rrr to save learnings?' with options ['Yes, run /rrr', 'No, skip']. If yes, invoke /rrr skill. If no, continue normally."
fi
