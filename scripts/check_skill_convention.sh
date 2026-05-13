#!/usr/bin/env bash
#
# check_skill_convention.sh — enforce the clickable-paths convention
# (announce-mode) on every src/skills/*/SKILL.md.
#
# What it checks: every line in SKILL.md prose (NOT inside fenced ``` code
# blocks) that begins with an announce marker (📍 📥 📤 📝 📊 🔬 ✅ 🪶)
# must use clickable, fully-substituted absolute paths.
#
# Five anti-patterns fail the check:
#   1. Unsubstituted   $VAR  (e.g. "📥 Written: $INBOX/foo.md")
#   2. Tilde paths     ~/    (must be absolute, not shell-relative)
#   3. Bare ψ/         (must be prefixed with $ROOT/ or $PSI/ substituted)
#   4. Ellipsis        ...   (truncated/non-clickable path)
#   5. [PLACEHOLDER]   square-bracketed token in path position
#
# See: src/skills/CONVENTIONS.md
# Spec: ψ/memory/mailbox/clickable-paths/convention-designer/2026-05-13_round3.md §5
#
set -euo pipefail
FAIL=0
for f in src/skills/*/SKILL.md; do
  [ -e "$f" ] || continue
  stripped=$(awk 'BEGIN{f=0} /^```/{f=!f; next} !f' "$f")
  patterns=(
    '(📍|📥|📤|📝|📊|🔬|✅|🪶)[^\n]*:[[:space:]]*\$[A-Z_]'    # unsubstituted $VAR
    '(📍|📥|📤|📝|📊|🔬|✅|🪶)[^\n]*:[[:space:]]*~/'           # tilde
    '(📍|📥|📤|📝|📊|🔬|✅|🪶)[^\n]*:[[:space:]]*ψ/'           # bare ψ/
    '(📍|📥|📤|📝|📊|🔬|✅|🪶)[^\n]*:[[:space:]]*[^/\n]*\.{3}' # ellipsis
    '(📍|📥|📤|📝|📊|🔬|✅|🪶)[^\n]*:[[:space:]]*\[[A-Z_]+\]'  # [PLACEHOLDER]
  )
  for p in "${patterns[@]}"; do
    if echo "$stripped" | grep -E -n "$p" >/dev/null; then
      echo "❌ $f violates: $p"
      echo "$stripped" | grep -E -n --color=always "$p"
      FAIL=1
    fi
  done
done
[ $FAIL -eq 0 ] && echo "✅ All SKILL.md pass announce-mode."
exit $FAIL
