#!/usr/bin/env bash
# Sync scripts/calver.ts + test from the canonical source.
#
# Canonical = Soul-Brews-Studio/maw-js (the most-evolved fork; this repo was the
# birthplace per PR #262, but maw-js has since iterated #766/#783/#786 etc.)
#
# Why this script exists: there are 5 copies of scripts/calver.ts across SBS
# repos and they have drifted. This is the one-command way to re-converge.
#
# Usage:
#   bash scripts/sync-calver-from-canonical.sh           # sync + diff
#   bash scripts/sync-calver-from-canonical.sh --check   # diff only, no write

set -euo pipefail

CHECK_ONLY=0
[[ "${1:-}" == "--check" ]] && CHECK_ONLY=1

REPO_ROOT="$(git rev-parse --show-toplevel)"
LOCAL_SCRIPT="$REPO_ROOT/scripts/calver.ts"
LOCAL_TEST="$REPO_ROOT/__tests__/calver.test.ts"

# Canonical: resolve via ghq so this works on any machine with the standard layout
CANONICAL_REPO="$(ghq list -p --exact Soul-Brews-Studio/maw-js 2>/dev/null | head -1)"
if [ -z "$CANONICAL_REPO" ]; then
  echo "❌ Canonical maw-js not found via ghq. Run: ghq get github.com/Soul-Brews-Studio/maw-js"
  exit 1
fi

CANONICAL_SCRIPT="$CANONICAL_REPO/scripts/calver.ts"
CANONICAL_TEST="$CANONICAL_REPO/test/calver.test.ts"

[ -f "$CANONICAL_SCRIPT" ] || { echo "❌ $CANONICAL_SCRIPT missing"; exit 1; }
[ -f "$CANONICAL_TEST" ]   || { echo "❌ $CANONICAL_TEST missing"; exit 1; }

# Diff first — exit 0 if already in sync
SCRIPT_DRIFT=0
TEST_DRIFT=0
diff -q "$LOCAL_SCRIPT" "$CANONICAL_SCRIPT" >/dev/null 2>&1 || SCRIPT_DRIFT=1
diff -q "$LOCAL_TEST" "$CANONICAL_TEST"     >/dev/null 2>&1 || TEST_DRIFT=1

if [ "$SCRIPT_DRIFT" = "0" ] && [ "$TEST_DRIFT" = "0" ]; then
  echo "✓ Already in sync with canonical (maw-js)"
  exit 0
fi

echo "Drift detected:"
[ "$SCRIPT_DRIFT" = "1" ] && echo "  ✗ scripts/calver.ts        (local ≠ canonical)"
[ "$TEST_DRIFT" = "1" ]   && echo "  ✗ __tests__/calver.test.ts (local ≠ canonical)"

if [ "$CHECK_ONLY" = "1" ]; then
  echo ""
  echo "To sync: bash $0"
  exit 1
fi

echo ""
echo "Syncing ← $CANONICAL_REPO"
[ "$SCRIPT_DRIFT" = "1" ] && cp "$CANONICAL_SCRIPT" "$LOCAL_SCRIPT" && echo "  ✓ scripts/calver.ts        synced"
[ "$TEST_DRIFT" = "1" ]   && cp "$CANONICAL_TEST"   "$LOCAL_TEST"   && echo "  ✓ __tests__/calver.test.ts synced"

echo ""
echo "Next: review the diff with 'git diff scripts/calver.ts __tests__/calver.test.ts'"
echo "      then commit when satisfied."
