---
name: release-alpha
description: "Cut an alpha pre-release — bump CalVer, PR to alpha branch, CI auto-tags + publishes to npm @alpha. Use when user says 'release alpha', 'cut alpha', '/release-alpha', or wants to publish an alpha version."
argument-hint: ""
---

# /release-alpha

Cut an alpha pre-release for the current repo.

## Assumptions

- Repo has `scripts/calver.ts` that supports `--check` + apply-by-default
- Repo has an `alpha` branch on `origin`
- `calver-release.yml` auto-tags + publishes when a version-bump commit lands on `alpha`
- Current branch is NOT `main`, `alpha`, or `beta`

## Step 0: Detect repo + verify state

```bash
date "+🕐 %H:%M %Z (%A %d %B %Y)"
REPO_ROOT=$(git rev-parse --show-toplevel 2>/dev/null) || { echo "❌ Not in a git repo"; exit 1; }
BRANCH=$(git -C "$REPO_ROOT" branch --show-current)
echo "📁 $REPO_ROOT"
echo "🌿 $BRANCH"
```

Hard checks:

```bash
[ "$BRANCH" != "main" ] || { echo "❌ On main"; exit 1; }
[ "$BRANCH" != "alpha" ] || { echo "❌ On alpha"; exit 1; }
[ "$BRANCH" != "beta" ] || { echo "❌ On beta"; exit 1; }
[ -z "$(git -C "$REPO_ROOT" status --porcelain)" ] || { echo "❌ Working tree dirty"; exit 1; }
git -C "$REPO_ROOT" fetch origin alpha 2>/dev/null
```

## Step 1: Locate calver script

```bash
CALVER="$REPO_ROOT/scripts/calver.ts"
[ -f "$CALVER" ] || { echo "❌ No scripts/calver.ts"; exit 1; }
```

## Step 2: Compute target

```bash
TARGET=$(TZ=Asia/Bangkok bun "$CALVER" --check 2>&1 | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+-alpha\.[0-9]+' | head -1)
```

## Step 3: Confirm gate

Show full plan. Wait for user `y`/`yes`. Anything else → abort.

## Step 4: Execute

```bash
TZ=Asia/Bangkok bun "$CALVER"
git -C "$REPO_ROOT" add package.json
git -C "$REPO_ROOT" commit -m "bump: $TARGET"
git -C "$REPO_ROOT" push -u origin "$BRANCH"
gh pr create --base alpha --title "release: $TARGET" --body "Cuts $TARGET on merge via calver-release.yml."
```

## Step 5: Output

Print PR URL. Do NOT auto-merge.

```
✅ PR opened: [URL]
📦 On merge to alpha → calver-release.yml cuts [TARGET]
```
