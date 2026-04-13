#!/usr/bin/env bash
# /projects list — one-line-per-repo table
# Called by the /projects skill

# Find repo root (walk up from script or cwd to find ψ/)
ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
PSI=$(readlink -f "$ROOT/ψ" 2>/dev/null || echo "$ROOT/ψ")

trunc() { echo "$1" | fold -s -w 80 | head -1 | sed 's/ *$//'; }

get_desc() {
  local T="$1" D=""
  [ -f "$T/package.json" ] && D=$(jq -r '.description // empty' "$T/package.json" 2>/dev/null)
  if [ -z "$D" ] && [ -f "$T/README.md" ]; then
    D=$(sed -n '/^[^#<\[!>| \t{}`-]/p' "$T/README.md" | grep -v '^\s*$' | head -1)
  fi
  [ -n "$D" ] && trunc "$D" || echo "—"
}

get_lic() {
  local T="$1" L="—"
  if [ -f "$T/LICENSE" ]; then
    L=$(head -5 "$T/LICENSE" | tr '\n' ' ' | grep -oEi '(MIT|Apache[- ]2|AGPL|GPL|BSD|ISC|Business Source|Mozilla)' | head -1)
    case "$L" in
      Business*) L="BSL" ;;
      AGPL|agpl) L="AGPL" ;;
      GPL|gpl)   L="GPL" ;;
      "")        L="—" ;;
    esac
  fi
  [ "$L" = "—" ] && [ -f "$T/package.json" ] && L=$(jq -r '.license // "—"' "$T/package.json" 2>/dev/null)
  echo "$L"
}

# Learn
printf "\n📚 Learn\n"
printf "  %-35s %4s  %-5s  %s\n" "REPO" "★" "LIC" "DESCRIPTION"
printf "  %-35s %4s  %-5s  %s\n" "───────────────────────────────────" "────" "─────" "────────────────────────────────────────────────────────────────────────────────"
for link in $(find "$PSI/learn" -name "origin" -type l 2>/dev/null | sort); do
  DIR=$(dirname "$link")
  SLUG=$(echo "$DIR" | sed "s|$PSI/learn/||")
  TARGET=$(readlink "$link")
  DESC=$(get_desc "$TARGET")
  LICENSE=$(get_lic "$TARGET")
  STARS=$(gh repo view "$SLUG" --json stargazerCount --jq '.stargazerCount' 2>/dev/null || echo "—")
  printf "  %-35s %4s  %-5s  %s\n" "$SLUG" "$STARS" "$LICENSE" "$DESC"
done

# Incubate
printf "\n🌱 Incubate\n"
printf "  %-35s %-22s %3s  %-5s  %s\n" "REPO" "BRANCH" "Δ" "LIC" "LAST COMMIT"
printf "  %-35s %-22s %3s  %-5s  %s\n" "───────────────────────────────────" "──────────────────────" "───" "─────" "────────────────────────────────────────────────────────────────────────────────"
for link in $(find "$PSI/incubate" -name "origin" -type l 2>/dev/null | sort); do
  DIR=$(dirname "$link")
  SLUG=$(echo "$DIR" | sed "s|$PSI/incubate/||")
  TARGET=$(readlink "$link")
  BRANCH=$(git -C "$TARGET" branch --show-current 2>/dev/null || echo "?")
  CHANGES=$(git -C "$TARGET" status --short 2>/dev/null | wc -l)
  LAST=$(git -C "$TARGET" log -1 --pretty=format:"%s" 2>/dev/null | fold -s -w 55 | head -1 | sed 's/ *$//')
  LICENSE=$(get_lic "$TARGET")
  printf "  %-35s %-22s %3s  %-5s  %s\n" "$SLUG" "$BRANCH" "$CHANGES" "$LICENSE" "$LAST"
done

# Health
printf "\n🔗 Health\n"
BROKEN=$(find "$PSI/learn" "$PSI/incubate" -type l ! -exec test -e {} \; -print 2>/dev/null)
if [ -z "$BROKEN" ]; then
  printf "  All symlinks valid ✓\n"
else
  printf "  ⚠ Broken symlinks:\n"
  echo "$BROKEN" | while read link; do echo "    $link"; done
fi
