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
RRR_INTERVAL=150
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

# Snooze check — temporarily disable auto-triggers without fully turning off
SNOOZE_FLAG="${TDIR}/claude-auto-scale-snooze"
if [ -f "$SNOOZE_FLAG" ]; then
  snooze_until=$(cat "$SNOOZE_FLAG" 2>/dev/null || echo 0)
  now=$(date +%s)
  if [ "$now" -lt "$snooze_until" ]; then
    # still snoozing — show status line with snoozed indicator, skip triggers
    auto="snoozed"
    echo "${TIME} | #${GHASH} | 📡 ${prev_info}${sid} | ${used_k}k (rrr:${next_rrr}k fwd:${next_fwd}k) | ${HOST} | ${WT}${PROJECT} | auto:${auto}"
    exit 0
  else
    rm -f "$SNOOZE_FLAG"  # expired
  fi
fi

# Always show status line with next thresholds
echo "${TIME} | #${GHASH} | 📡 ${prev_info}${sid} | ${used_k}k (rrr:${next_rrr}k fwd:${next_fwd}k) | ${HOST} | ${WT}${PROJECT} | auto:${auto}"

# Auto-triggers (skip if disabled)
[ -f "$DISABLE_FLAG" ] && exit 0

# Forward takes priority over rrr — TRULY SILENT: instruct, do not prompt
if [ "$used_k" -ge "$next_fwd" ]; then
  echo "$next_fwd" > "$FWD_STATE"
  echo "⚠️ Auto-trigger: context at ${used_k}k. Silently run /forward now to create handoff. Do not announce or ask — just invoke the skill and continue with the user's current work."
elif [ "$used_k" -ge "$next_rrr" ]; then
  echo "$next_rrr" > "$RRR_STATE"
  echo "📝 Auto-trigger: context at ${used_k}k. Silently run /rrr now to save learnings. Do not announce or ask — just invoke the skill and continue with the user's current work."
fi
