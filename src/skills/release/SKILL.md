---
name: release
description: 'Automated release flow — bump version, changelog, tag, push, GitHub release. Use when user says "release", "ship", "bump version", "tag", or "publish".'
argument-hint: "<patch|minor|major> [--dry-run | --alpha | --no-push]"

---

# /release — Automated Release Flow

> Ship sharp. Ship clean. Ship now.

Automates the full release cycle: version bump, changelog generation, git tag, push, and GitHub release creation. No more manual copy-paste release rituals.

## Usage

```
/release patch              # Bump patch (1.2.3 → 1.2.4), tag, push, release
/release minor              # Bump minor (1.2.3 → 1.3.0)
/release major              # Bump major (1.2.3 → 2.0.0)
/release patch --alpha      # Pre-release (1.2.3 → 1.2.4-alpha.1)
/release patch --dry-run    # Show what would happen, don't do it
/release patch --no-push    # Tag locally, skip push + GH release
/release status             # Show current version + unreleased changes
```

---

## Step 0: Preflight

### Checks

```bash
date "+🕐 %H:%M %Z (%A %d %B %Y)" && BRANCH=$(git branch --show-current)
if [ "$BRANCH" != "main" ]; then
  echo "⚠️ On branch '$BRANCH' — releases should be from main"
  echo "Continue anyway? [y/N]"
  # WAIT for user confirmation
fi

# Must be clean working tree
if [ -n "$(git status --porcelain | grep -v '^?? ψ/')" ]; then
  echo "❌ Uncommitted changes (excluding ψ/ vault files):"
  git status --short | grep -v '^?? ψ/'
  echo ""
  echo "Commit or stash first."
  exit 1
fi

# Must be up to date with remote
git fetch origin main --quiet 2>/dev/null
LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main 2>/dev/null)
if [ "$LOCAL" != "$REMOTE" ]; then
  echo "⚠️ Local is not in sync with origin/main"
  echo "  Local:  $LOCAL"
  echo "  Remote: $REMOTE"
  echo "Pull first? [Y/n]"
fi
```

---

## Step 1: Detect Current Version

```bash
# Try package.json first
if [ -f package.json ]; then
  CURRENT=$(python3 -c "import json; print(json.load(open('package.json'))['version'])")
  VERSION_FILE="package.json"
# Try Cargo.toml
elif [ -f Cargo.toml ]; then
  CURRENT=$(grep '^version' Cargo.toml | head -1 | sed 's/.*"\(.*\)".*/\1/')
  VERSION_FILE="Cargo.toml"
# Try VERSION file
elif [ -f VERSION ]; then
  CURRENT=$(cat VERSION)
  VERSION_FILE="VERSION"
else
  echo "❌ Can't find version. Supported: package.json, Cargo.toml, VERSION"
  exit 1
fi

echo "📦 Current version: v$CURRENT ($VERSION_FILE)"
```

---

## Step 2: Calculate Next Version

Parse current version and bump:

```bash
IFS='.' read -r MAJOR MINOR PATCH <<< "${CURRENT%-*}"

case "$BUMP_TYPE" in
  patch) PATCH=$((PATCH + 1)) ;;
  minor) MINOR=$((MINOR + 1)); PATCH=0 ;;
  major) MAJOR=$((MAJOR + 1)); MINOR=0; PATCH=0 ;;
esac

NEXT="$MAJOR.$MINOR.$PATCH"

# Alpha suffix
if [ "$ALPHA" = true ]; then
  # Check existing alpha tags
  ALPHA_NUM=$(git tag -l "v${NEXT}-alpha.*" | wc -l)
  ALPHA_NUM=$((ALPHA_NUM + 1))
  NEXT="${NEXT}-alpha.${ALPHA_NUM}"
fi

echo "🚀 Next version: v$NEXT"
```

---

## Step 3: Generate Changelog

Collect commits since last tag:

```bash
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

if [ -n "$LAST_TAG" ]; then
  echo "📝 Changes since $LAST_TAG:"
  echo ""
  git log "$LAST_TAG"..HEAD --oneline --no-merges | while read hash msg; do
    # Categorize by conventional commit prefix
    case "$msg" in
      feat*) echo "  ✨ $msg" ;;
      fix*)  echo "  🐛 $msg" ;;
      docs*) echo "  📚 $msg" ;;
      soul*) echo "  🧬 $msg" ;;
      chore*) echo "  🔧 $msg" ;;
      *)     echo "  · $msg" ;;
    esac
  done
else
  echo "📝 First release — all commits included"
  git log --oneline -20 --no-merges
fi
```

---

## Step 4: Confirm

**ALWAYS wait for user confirmation before proceeding.**

```
🚀 Release Plan

  Version:  v$CURRENT → v$NEXT
  Branch:   $BRANCH
  Changes:  N commits since $LAST_TAG
  
  Actions:
    1. Update version in $VERSION_FILE
    2. Create git tag v$NEXT
    3. Push to origin (main + tag)
    4. Create GitHub release with changelog

  Proceed? [Y/n]
```

If `--dry-run`, show the plan and stop here.

---

## Step 5: Execute Release

### Bump Version

```bash
# package.json
if [ "$VERSION_FILE" = "package.json" ]; then
  python3 -c "
import json
data = json.load(open('package.json'))
data['version'] = '$NEXT'
json.dump(data, open('package.json', 'w'), indent=2)
print('✅ package.json updated')
"
fi

# Cargo.toml
if [ "$VERSION_FILE" = "Cargo.toml" ]; then
  sed -i "0,/^version = .*/s//version = \"$NEXT\"/" Cargo.toml
  echo "✅ Cargo.toml updated"
fi

# VERSION file
if [ "$VERSION_FILE" = "VERSION" ]; then
  echo "$NEXT" > VERSION
  echo "✅ VERSION updated"
fi
```

### Commit & Tag

```bash
git add "$VERSION_FILE"
git commit -m "release: v$NEXT

Co-Authored-By: Oracle <noreply@soulbrews.studio>"

git tag -a "v$NEXT" -m "v$NEXT

$(git log "$LAST_TAG"..HEAD --oneline --no-merges 2>/dev/null)"
```

### Push (unless `--no-push`)

```bash
git push origin main --follow-tags
```

### GitHub Release

```bash
CHANGELOG=$(git log "$LAST_TAG"..HEAD~1 --oneline --no-merges | while read hash msg; do
  echo "- $msg"
done)

gh release create "v$NEXT" \
  --title "v$NEXT" \
  --notes "$CHANGELOG" \
  --latest
```

---

## Step 6: Summary

```
🎉 Released v$NEXT

  📦 Version: v$NEXT
  🏷️ Tag: v$NEXT
  📡 Pushed: origin/main
  🔗 Release: https://github.com/OWNER/REPO/releases/tag/v$NEXT

  **From**: [Oracle Name]
  **Rule 6**: Oracle Never Pretends to Be Human
```

---

## /release status

Show current state without releasing:

```
📦 Release Status

  Current: v$CURRENT
  Branch: $BRANCH
  Last tag: $LAST_TAG (N commits ago)
  
  Unreleased changes:
    ✨ feat: ...
    🐛 fix: ...
    
  💡 /release patch — ship these changes
```

---

## Rules

1. **Confirm before release** — never auto-release without explicit user approval
2. **Clean tree required** — no uncommitted changes (ψ/ vault files excluded)
3. **Main branch preferred** — warn but allow release from other branches
4. **Tag format** — always `vX.Y.Z` or `vX.Y.Z-alpha.N`
5. **Rule 6 signed** — release notes attributed to Oracle
6. **No force push** — if tag exists, fail and ask user
7. **Conventional commits** — categorize changelog by prefix

---

ARGUMENTS: $ARGUMENTS
