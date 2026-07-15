#!/bin/bash
set -e

# Release script for oracle-skills-cli
# Usage: ./scripts/release.sh [patch|minor|major]           # stable release from main
#        ./scripts/release.sh --alpha                        # alpha pre-release from alpha branch
#        ./scripts/release.sh 1.5.37                         # specific version
#
# Flow: feature → PR to alpha → test → PR to main → release
#   Alpha:  ./scripts/release.sh --alpha     → v3.2.2-alpha.1
#   Stable: ./scripts/release.sh             → v3.2.2

BRANCH=$(git branch --show-current)
ALPHA=false

# Parse --alpha flag
if [[ "$1" == "--alpha" ]]; then
  ALPHA=true
  shift
fi

# Guard: branch check
if $ALPHA; then
  if [[ "$BRANCH" != "alpha" ]]; then
    echo "ERROR: alpha releases must be cut from alpha branch (currently on '$BRANCH')"
    echo "Run: git checkout alpha"
    exit 1
  fi
else
  if [[ "$BRANCH" != "main" ]]; then
    echo "ERROR: releases must be cut from main (currently on '$BRANCH')"
    echo "Merge your PR first, then run this script on main."
    echo "For alpha pre-release: ./scripts/release.sh --alpha"
    exit 1
  fi
fi

# Guard: must not be in a worktree
if [[ "$(git rev-parse --git-common-dir)" != "$(git rev-parse --git-dir)" ]]; then
  echo "ERROR: cannot release from a worktree — switch to the main repo checkout"
  exit 1
fi

# Guard: working tree must be clean
if [[ -n "$(git status --porcelain)" ]]; then
  echo "ERROR: working tree is not clean — commit or stash changes first"
  exit 1
fi

CURRENT=$(grep '"version"' package.json | head -1 | cut -d'"' -f4)
# Strip any existing pre-release suffix for base version calculation
BASE_VERSION=$(echo "$CURRENT" | sed 's/-alpha\.[0-9]*//')
echo "Current version: $CURRENT (base: $BASE_VERSION)"

# Determine new version
if $ALPHA; then
  # Alpha: increment from base version, find next alpha number
  NEXT_BASE="$BASE_VERSION"
  if [[ -n "$1" ]]; then
    # Allow specifying base: --alpha minor → next minor alpha
    if [[ "$1" == "major" ]]; then
      NEXT_BASE=$(echo "$BASE_VERSION" | awk -F. '{print $1+1".0.0"}')
    elif [[ "$1" == "minor" ]]; then
      NEXT_BASE=$(echo "$BASE_VERSION" | awk -F. '{print $1"."$2+1".0"}')
    elif [[ "$1" == "patch" ]]; then
      NEXT_BASE=$(echo "$BASE_VERSION" | awk -F. '{print $1"."$2"."$3+1}')
    fi
  else
    # Default: patch bump from base
    NEXT_BASE=$(echo "$BASE_VERSION" | awk -F. '{print $1"."$2"."$3+1}')
  fi
  # Find next alpha number by checking existing tags
  ALPHA_NUM=1
  while git tag -l "v${NEXT_BASE}-alpha.${ALPHA_NUM}" | grep -q .; do
    ALPHA_NUM=$((ALPHA_NUM + 1))
  done
  NEW_VERSION="${NEXT_BASE}-alpha.${ALPHA_NUM}"
elif [[ "$1" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  NEW_VERSION="$1"
elif [[ "$1" == "major" ]]; then
  NEW_VERSION=$(echo "$BASE_VERSION" | awk -F. '{print $1+1".0.0"}')
elif [[ "$1" == "minor" ]]; then
  NEW_VERSION=$(echo "$BASE_VERSION" | awk -F. '{print $1"."$2+1".0"}')
else
  # Default: patch
  NEW_VERSION=$(echo "$BASE_VERSION" | awk -F. '{print $1"."$2"."$3+1}')
fi

if $ALPHA; then
  echo "Alpha version: $NEW_VERSION"
else
  echo "New version: $NEW_VERSION"
fi
echo ""

# Confirm
read -p "Release v$NEW_VERSION? [y/N] " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Aborted."
  exit 1
fi

echo ""

# Run tests first
echo "Running tests..."
bun test __tests__/
echo ""

echo "Bumping version..."

# 1. Update package.json (portable sed — works on macOS and Linux)
if [[ "$(uname)" == "Darwin" ]]; then
  sed -i '' "s/\"version\": \"$CURRENT\"/\"version\": \"$NEW_VERSION\"/" package.json
  find skills src/skills -name "SKILL.md" -exec sed -i '' "s/v$CURRENT/v$NEW_VERSION/g" {} \;
else
  sed -i "s/\"version\": \"$CURRENT\"/\"version\": \"$NEW_VERSION\"/" package.json
  find skills src/skills -name "SKILL.md" -exec sed -i "s/v$CURRENT/v$NEW_VERSION/g" {} \;
fi

# 3. Compile skills
echo "Compiling skills..."
bun run compile

# 4. Commit
echo "Committing..."
git add -A
if $ALPHA; then
  git commit -m "pre-release: v$NEW_VERSION"
else
  git commit -m "release: v$NEW_VERSION"
fi

# 5. Push
echo "Pushing to $BRANCH..."
git push origin "$BRANCH"

# 6. Tag
echo "Creating tag v$NEW_VERSION..."
git tag "v$NEW_VERSION"
git push origin "v$NEW_VERSION"

echo ""
if $ALPHA; then
  echo "Released v$NEW_VERSION (alpha)"
  echo ""
  echo "Install & test:"
  echo "  bunx --bun oracle-skills@github:Soul-Brews-Studio/oracle-skills-cli#alpha install -g -y"
  echo ""
  echo "When ready for stable:"
  echo "  1. gh pr create --base main --head alpha"
  echo "  2. Merge to main"
  echo "  3. ./scripts/release.sh"
else
  echo "Released v$NEW_VERSION!"
  echo ""
  echo "GitHub Actions will now:"
  echo "  1. Run tests"
  echo "  2. Create GitHub Release"
  echo ""
  echo "Check: https://github.com/Soul-Brews-Studio/oracle-skills-cli/actions"
fi
