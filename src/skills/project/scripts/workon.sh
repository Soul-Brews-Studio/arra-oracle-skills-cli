#!/usr/bin/env bash
# /projects workon <repo> — warp into an incubated repo's context
# Shows status, provenance, warnings, hub file, and recent activity

QUERY="$1"
if [ -z "$QUERY" ]; then
  echo "Usage: /projects workon <repo-name>"
  echo "Example: /projects workon maw-patchies"
  exit 1
fi

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
PSI=$(readlink -f "$ROOT/ψ" 2>/dev/null || echo "$ROOT/ψ")

# Find matching incubated repo
MATCH=""
for link in $(find "$PSI/incubate" -name "origin" -type l 2>/dev/null); do
  DIR=$(dirname "$link")
  REPO=$(basename "$DIR")
  SLUG=$(echo "$DIR" | sed "s|$PSI/incubate/||")
  if echo "$REPO" | grep -qi "$QUERY" || echo "$SLUG" | grep -qi "$QUERY"; then
    MATCH="$DIR"
    break
  fi
done

if [ -z "$MATCH" ]; then
  echo "❌ No incubated repo matching '$QUERY'"
  echo ""
  echo "Available:"
  find "$PSI/incubate" -name "origin" -type l 2>/dev/null | while read link; do
    DIR=$(dirname "$link")
    echo "  $(basename "$DIR")"
  done
  exit 1
fi

REPO=$(basename "$MATCH")
SLUG=$(echo "$MATCH" | sed "s|$PSI/incubate/||")
TARGET=$(readlink "$MATCH/origin")
HUB="$MATCH/$REPO.md"

# Header
printf "\n🔧 Working on: %s\n" "$SLUG"
printf "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"

# Git status
BRANCH=$(git -C "$TARGET" branch --show-current 2>/dev/null || echo "?")
CHANGES=$(git -C "$TARGET" status --short 2>/dev/null | wc -l)
LAST_HASH=$(git -C "$TARGET" log -1 --pretty=format:"%h" 2>/dev/null)
LAST_MSG=$(git -C "$TARGET" log -1 --pretty=format:"%s" 2>/dev/null)
LAST_DATE=$(git -C "$TARGET" log -1 --pretty=format:"%ar" 2>/dev/null)
printf "\n📊 Status\n"
printf "  Branch:  %s\n" "$BRANCH"
printf "  Changes: %s uncommitted\n" "$CHANGES"
printf "  Last:    %s %s (%s)\n" "$LAST_HASH" "$LAST_MSG" "$LAST_DATE"

# Breadcrumb / provenance
if [ -f "$TARGET/.claude/INCUBATED_BY" ]; then
  printf "\n🔗 Provenance\n"
  while IFS=': ' read -r key value; do
    [ -n "$key" ] && printf "  %-16s %s\n" "$key:" "$value"
  done < "$TARGET/.claude/INCUBATED_BY"
fi

# License warning
LIC_WARN=$(grep -i "license-warning" "$TARGET/.claude/INCUBATED_BY" 2>/dev/null | cut -d: -f2- | sed 's/^ *//')
if [ -n "$LIC_WARN" ]; then
  printf "\n⚠️  License: %s\n" "$LIC_WARN"
fi

# Hub file summary
if [ -f "$HUB" ]; then
  SESSIONS=$(grep -c '^### ' "$HUB" 2>/dev/null || echo "0")
  printf "\n📋 Hub: %s sessions logged\n" "$SESSIONS"
else
  printf "\n📋 Hub: ⚠ missing (run /projects fix)\n"
fi

# Paths
printf "\n📁 Paths\n"
printf "  Origin:  %s\n" "$TARGET"
printf "  Symlink: ψ/incubate/%s/origin/\n" "$SLUG"
printf "  Hub:     ψ/incubate/%s/%s.md\n" "$SLUG" "$REPO"

# Recent commits
printf "\n📜 Recent commits\n"
git -C "$TARGET" log --oneline -5 2>/dev/null | while read line; do
  printf "  %s\n" "$line"
done

printf "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
printf "Ready to work. Edit files at: ψ/incubate/%s/origin/\n\n" "$SLUG"
