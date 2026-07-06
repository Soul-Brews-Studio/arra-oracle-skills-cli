#!/usr/bin/env bash
#
# Enforce the "Script Permissions" convention from CLAUDE.md: every .ts / .sh
# script under src/skills/*/scripts/ must be committed executable (git mode
# 100755). Scripts with a shebang invoked directly (./script) fail with
# "permission denied" without +x — this gate stops that regressing.
#
# We read the git INDEX mode (not the on-disk +x bit) because that is what
# actually ships: dig.py was +x on disk yet committed 100644 for months, which
# is exactly the class of bug this catches. Excludes *.test.ts and everything
# under .archive/ (dead skills).
set -euo pipefail

offenders=$(
  git ls-files -s -- 'src/skills/' \
    | awk '$4 ~ /\/scripts\/.*\.(ts|sh)$/ \
           && $4 !~ /\.test\.ts$/ \
           && $4 !~ /\/\.archive\// \
           && $1 != "100755" { print $4 }'
)

if [ -n "$offenders" ]; then
  echo "❌ These skill scripts are committed non-executable (must be git mode 100755):"
  echo "$offenders" | sed 's/^/     /'
  echo ""
  echo "   Fix:"
  # shellcheck disable=SC2001
  echo "$offenders" | sed 's/^/     chmod +x /'
  echo "     git add <files above>"
  echo ""
  echo "   (see CLAUDE.md → \"Script Permissions\")"
  exit 1
fi

echo "✓ all skill scripts are executable"
