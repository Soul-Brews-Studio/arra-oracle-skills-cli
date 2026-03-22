#!/bin/bash
# Claude Code statusline — 2 lines
# Line 1: 🌐 host 📁 cwd on branch*
# Line 2: 🎨 time ⏱ dur • 📊 pct% (Nk/Mk) • ❌/✅ • 🤖 model

input=$(cat)
echo "$input" > "${TMPDIR:-${TMP:-${TEMP:-/tmp}}}"/statusline-raw.json 2>/dev/null

cwd=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // "~"' 2>/dev/null) || cwd="~"
model=$(echo "$input" | jq -r '.model.display_name // .model.id // "?"' 2>/dev/null) || model="?"
pct=$(echo "$input" | jq -r '.context_window.used_percentage // 0' 2>/dev/null | cut -d. -f1) || pct=0
used_k=$(echo "$input" | jq -r '((.context_window.current_usage | ((.input_tokens//0)+(.cache_creation_input_tokens//0)+(.cache_read_input_tokens//0)+(.output_tokens//0))) / 1000) | floor' 2>/dev/null) || used_k=0
max_k=$(echo "$input" | jq -r '((.context_window.context_window_size // 0) / 1000) | floor' 2>/dev/null) || max_k=0
dur_ms=$(echo "$input" | jq -r '.cost.total_duration_ms // 0' 2>/dev/null | cut -d. -f1) || dur_ms=0

# Duration
s=$(( dur_ms / 1000 )) 2>/dev/null || s=0
h=$(( s / 3600 )); m=$(( (s % 3600) / 60 ))
[ "$h" -gt 0 ] 2>/dev/null && dur="${h}h${m}m" || dur="${m}m"

# Auto-compact
ac="❌"
jq -e '.autoCompactEnabled != false' ~/.claude.json >/dev/null 2>&1 && ac="✅"

# Git branch (timeout to avoid hangs)
branch=$(timeout 2 git -C "$cwd" symbolic-ref --short HEAD 2>/dev/null)
git=""
if [ -n "$branch" ]; then
  d=""; timeout 1 git -C "$cwd" diff-index --quiet HEAD -- 2>/dev/null || d="*"
  wt=""; [ -f "$cwd/.git" ] && wt=" 🌳"
  git=" on  ${branch}${d}${wt}"
fi

# Shorten path to org/repo (strip ~/Code/github.com/ prefix)
dir="${cwd/#$HOME\/Code\/github.com\//}"
# Fallback: if no match, shorten $HOME to ~
[ "$dir" = "$cwd" ] && dir="${cwd/#$HOME/\~}"

# Auto-scale thresholds
TDIR="${TMPDIR:-${TMP:-${TEMP:-/tmp}}}"
HOOK="$HOME/.claude/hooks/auto-scale.sh"
rrr_int=$(grep "^RRR_INTERVAL=" "$HOOK" 2>/dev/null | cut -d= -f2) || rrr_int="?"
fwd_int=$(grep "^FWD_INTERVAL=" "$HOOK" 2>/dev/null | cut -d= -f2) || fwd_int="?"
auto_st="on"; [ -f "$TDIR/claude-auto-scale-off" ] && auto_st="off"

# Session ID (short)
sid=$(echo "$input" | jq -r '.session_id // ""' 2>/dev/null | cut -c1-8)

# Previous session ID
ENCODED_CWD=$(echo "$cwd" | sed 's|/|-|g; s|\.|-|g')
PROJ_DIR="$HOME/.claude/projects/${ENCODED_CWD}"
prev_sid=$(ls -t "$PROJ_DIR"/*.jsonl 2>/dev/null | head -2 | tail -1 | xargs -I{} basename {} .jsonl 2>/dev/null | cut -c1-8)
prev_info=""
[ -n "$prev_sid" ] && [ "$prev_sid" != "$sid" ] && prev_info="${prev_sid} → "

echo "📁 ${dir}${git}"
echo "📡 ${sid}${prev_info} • $(date +%H:%M) • ${pct}% ${used_k}k/${max_k}k • r:${rrr_int}k f:${fwd_int}k ${auto_st} • ${model}"
