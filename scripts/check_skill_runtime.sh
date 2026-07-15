#!/usr/bin/env bash
# check_skill_runtime.sh — apply CONVENTIONS.md announce-mode rules to
# arbitrary skill RUNTIME output (vs check_skill_convention.sh which checks
# SKILL.md source).
#
# Usage:
#   bash scripts/check_skill_runtime.sh /path/to/output.txt
#   echo "📥 Written: $INBOX/foo.md" | bash scripts/check_skill_runtime.sh
#   /skill | bash scripts/check_skill_runtime.sh -
#
# Exit: 0 = pass, 2 = announce-mode violations
#
# See: skills/CONVENTIONS.md
# Companion: scripts/check_skill_convention.sh (checks SKILL.md text)
#
set -euo pipefail

# Read input: arg = file, or stdin
if [ $# -eq 0 ] || [ "${1:-}" = "-" ]; then
  input=$(cat)
else
  if [ ! -f "$1" ]; then
    echo "❌ File not found: $1" >&2
    exit 1
  fi
  input=$(cat "$1")
fi

# Strip fenced code blocks (announce-mode rules don't apply inside ```)
stripped=$(awk 'BEGIN{f=0} /^```/{f=!f; next} !f' <<< "$input")

FAIL=0
SOURCE="${1:-stdin}"

# 5 anti-patterns — same categories as check_skill_convention.sh, but using
# `.*` instead of `[^\n]*`. In POSIX ERE (BSD grep AND GNU grep), `[^\n]`
# is the negation of the literal characters `\` and `n` — NOT "not newline".
# Since grep is line-oriented, `.` already excludes the newline, so `.*`
# matches anything-up-to-end-of-line. This is the working form.
patterns=(
  '(📍|📥|📤|📝|📊|🔬|✅|🪶).*:[[:space:]]*\$[A-Z_]'    # unsubstituted $VAR
  '(📍|📥|📤|📝|📊|🔬|✅|🪶).*:[[:space:]]*~/'           # tilde
  '(📍|📥|📤|📝|📊|🔬|✅|🪶).*:[[:space:]]*ψ/'           # bare ψ/
  '(📍|📥|📤|📝|📊|🔬|✅|🪶).*:[[:space:]]*.*\.{3}'    # ellipsis
  '(📍|📥|📤|📝|📊|🔬|✅|🪶).*:[[:space:]]*\[[A-Z_]+\]'  # [PLACEHOLDER]
)
labels=(
  "unsubstituted \$VAR"
  "tilde path (~/)"
  "bare ψ/ (not absolute)"
  "ellipsis (...) in path"
  "[PLACEHOLDER] in path position"
)

for i in "${!patterns[@]}"; do
  p="${patterns[$i]}"
  l="${labels[$i]}"
  if echo "$stripped" | grep -E -n "$p" >/dev/null; then
    echo "❌ $SOURCE violates: $l" >&2
    echo "$stripped" | grep -E -n --color=always "$p" >&2
    echo "" >&2
    FAIL=1
  fi
done

[ $FAIL -eq 0 ] && echo "✅ $SOURCE: all announce-mode lines clickable"
exit $FAIL
