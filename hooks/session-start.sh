#!/bin/bash
# Session Start — show context on new session
# Output appears as system-reminder (SessionStart stdout is visible to AI)

INPUT=$(cat)
CWD=$(echo "$INPUT" | /usr/bin/jq -r '.cwd // ""' 2>/dev/null)

# Branch
BRANCH=$(timeout 2 git -C "$CWD" symbolic-ref --short HEAD 2>/dev/null)
WT=""; [ -f "$CWD/.git" ] && WT=" (worktree)"

# Open issues count
ISSUES=$(gh issue list --state open --limit 100 --json number 2>/dev/null | /usr/bin/jq 'length' 2>/dev/null || echo "?")

# Latest handoff
PSI=$(readlink -f "$CWD/ψ" 2>/dev/null || echo "$CWD/ψ")
HANDOFF=$(ls -t "$PSI/inbox/handoff/"*.md 2>/dev/null | head -1)
HANDOFF_NAME=$(basename "$HANDOFF" 2>/dev/null || echo "none")

# Session ID
SID=$(echo "$INPUT" | /usr/bin/jq -r '.session_id // ""' 2>/dev/null | cut -c1-8)

# Previous session — find last .jsonl in project dir
ENCODED_CWD=$(echo "$CWD" | sed 's|^/|-|; s|/|-|g')
PROJECT_DIR="$HOME/.claude/projects/${ENCODED_CWD}"
PREV_JSONL=$(ls -t "$PROJECT_DIR"/*.jsonl 2>/dev/null | head -2 | tail -1)
if [ -n "$PREV_JSONL" ]; then
  PREV_SID=$(basename "$PREV_JSONL" .jsonl | cut -c1-8)
  PREV_SIZE=$(du -h "$PREV_JSONL" 2>/dev/null | cut -f1)
  PREV_DATE=$(stat -c %y "$PREV_JSONL" 2>/dev/null | cut -d. -f1)
  PREV_INFO="Previous: ${PREV_SID} (${PREV_SIZE}, ${PREV_DATE})"
else
  PREV_INFO="Previous: first session"
fi

echo "📡 Session ${SID} | Branch: ${BRANCH:-?}${WT} | Issues: ${ISSUES} open"
echo "📋 ${PREV_INFO} | Handoff: ${HANDOFF_NAME}"
echo "💡 /recap to orient, /whats-next for suggestions, /where-we-are for status"
