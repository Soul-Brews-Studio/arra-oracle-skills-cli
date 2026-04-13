---
name: incubate
description: Clone or create repos for active development — the right hand of /learn. Workflow modes — default (long-term dev), --flash (issue → PR → offload), --contribute (fork + multi-PR). Use when user says "incubate [repo]", "work on [repo]", "clone for dev", or wants to set up a dev workflow. Do NOT trigger for study/exploration (use /learn), finding projects (use /trace), or session mining (use /dig).
argument-hint: "<repo-url|slug|name> [--flash | --contribute | --status | --offload]"
---

# /incubate — Active Development Workflow

Clone or create repos for active development → set up branches, make changes, push PRs.

> "/learn reads the book. /incubate writes the next chapter."

## Usage

```
/incubate [url]                          # Clone via ghq, symlink, ready for dev
/incubate [slug]                         # Use slug from ψ/memory/slugs.yaml
/incubate [repo-name]                    # Finds in ghq or creates with default org
/incubate [url] --flash "fix desc"       # Issue → branch → fix → PR → offload
/incubate [url] --contribute             # Fork if needed → branch per feature → PRs
/incubate --status                       # List all ψ/incubate/ with git status
/incubate --offload [slug]               # Remove symlink, keep ghq clone
/incubate --init                         # Restore all origins after git clone
```

---

## Workflow Modes

| Flag | Scope | Duration | Cleanup |
|------|-------|----------|---------|
| (default) | Long-term dev | Weeks/months | Manual offload |
| `--flash` | Single fix | Minutes | Issue → PR → auto-offload + purge |
| `--contribute` | Multi-feature | Days/weeks | Offload when all PRs done |
| `--status` | Query | — | Read-only listing |
| `--offload` | Cleanup | — | Remove symlink (keep ghq) |

```
incubate        → Long-term dev (manual cleanup)
    ↓
--contribute    → Push → offload (keep ghq)
    ↓
--flash         → Issue → Branch → PR → offload → purge (complete cycle)
```

---

## Directory Structure

```
ψ/incubate/
├── .origins                          # Manifest of incubated repos (committed)
└── OWNER/
    └── REPO/
        ├── origin                    # Symlink to ghq source (gitignored)
        └── REPO.md                   # Hub file — tracks incubation sessions (committed)
```

**Offload source, keep hub:**
```bash
unlink ψ/incubate/OWNER/REPO/origin   # Remove symlink
# ghq clone preserved for future use
# Hub file (REPO.md) remains in ψ/incubate/OWNER/REPO/
```

---

## /incubate --init

Restore all origins after cloning (like `git submodule init`):

```bash
ROOT="$(pwd)"
while read repo; do
  OWNER=$(dirname "$repo")
  REPO=$(basename "$repo")
  ghq get -u "https://github.com/$repo"
  mkdir -p "$ROOT/ψ/incubate/$OWNER/$REPO"
  ln -sf "$(ghq root)/github.com/$repo" "$ROOT/ψ/incubate/$OWNER/$REPO/origin"
  echo "✓ Restored: $repo"
done < "$ROOT/ψ/incubate/.origins"
```

---

## Step 0: Detect Input Type + Resolve Path

```bash
date "+🕐 %H:%M %Z (%A %d %B %Y)"
```

**CRITICAL: Capture ABSOLUTE paths first:**
```bash
ROOT="$(pwd)"
echo "Incubating from: $ROOT"
```

### If URL (http* or owner/repo format)

Clone or create, symlink origin, update manifest:

```bash
# Replace [URL] with actual URL
URL="[URL]"
ROOT="$(pwd)"
OWNER=$(echo "$URL" | sed -E 's|.*github.com/([^/]+)/.*|\1|')
REPO=$(echo "$URL" | sed -E 's|.*/([^/]+)(\.git)?$|\1|')
SLUG="$OWNER/$REPO"

# Check if repo exists on GitHub
if gh repo view "$SLUG" --json name &>/dev/null; then
  ghq get -u "https://github.com/$SLUG"
else
  echo "Repo not found — creating private repo..."
  gh repo create "$SLUG" --private --clone=false
  ghq get "https://github.com/$SLUG"
  GHQ_ROOT=$(ghq root)
  LOCAL="$GHQ_ROOT/github.com/$SLUG"
  if [ ! -f "$LOCAL/README.md" ]; then
    echo "# $REPO" > "$LOCAL/README.md"
    git -C "$LOCAL" add README.md
    git -C "$LOCAL" commit -m "Initial commit"
    git -C "$LOCAL" push origin main 2>/dev/null || git -C "$LOCAL" push origin master
  fi
fi

GHQ_ROOT=$(ghq root)
mkdir -p "$ROOT/ψ/incubate/$OWNER/$REPO"
ln -sf "$GHQ_ROOT/github.com/$OWNER/$REPO" "$ROOT/ψ/incubate/$OWNER/$REPO/origin"

# Update manifest
echo "$OWNER/$REPO" >> "$ROOT/ψ/incubate/.origins"
sort -u -o "$ROOT/ψ/incubate/.origins" "$ROOT/ψ/incubate/.origins"

# Drop breadcrumb — INCUBATED_BY links repo back to owning oracle
ORACLE_NAME=$(grep -m1 '^## Identity' "$ROOT/CLAUDE.md" -A5 2>/dev/null | grep '^\*\*I am\*\*' | sed 's/.*: //' | head -1)
[ -z "$ORACLE_NAME" ] && ORACLE_NAME=$(basename "$ROOT")
TARGET_DIR="$GHQ_ROOT/github.com/$OWNER/$REPO"
mkdir -p "$TARGET_DIR/.claude"
{
  echo "oracle: $ORACLE_NAME"
  echo "path: $ROOT"
  echo "incubated: $(date +%Y-%m-%d)"
  # Check if we learned from this repo's upstream
  LEARNED=$(find "$ROOT/ψ/learn" -name "origin" -type l 2>/dev/null | while read l; do
    readlink "$l" | grep -qi "$REPO" && dirname "$l" | sed "s|$ROOT/ψ/learn/||" && break
  done)
  [ -n "$LEARNED" ] && echo "learned-from: $LEARNED"
  # Check for copyleft license
  if [ -f "$TARGET_DIR/LICENSE" ]; then
    LIC=$(head -5 "$TARGET_DIR/LICENSE" | tr '\n' ' ' | grep -oEi '(AGPL|GPL)' | head -1)
    [ -n "$LIC" ] && echo "license-warning: $LIC — clean-room only, no code copying"
  fi
} > "$TARGET_DIR/.claude/INCUBATED_BY"
echo "✓ Breadcrumb: $TARGET_DIR/.claude/INCUBATED_BY"

echo "✓ Ready: $ROOT/ψ/incubate/$OWNER/$REPO/origin → source"
```

### If just a name (no slash, no URL)

Try ghq first, then create with default org:

```bash
NAME="[NAME]"
ROOT="$(pwd)"
DEFAULT_ORG="laris-co"  # Configurable via --org flag

MATCH=$(ghq list | grep -i "/$NAME$" | head -1)
if [ -n "$MATCH" ]; then
  OWNER=$(echo "$MATCH" | cut -d'/' -f2)
  REPO=$(echo "$MATCH" | cut -d'/' -f3)
else
  OWNER="$DEFAULT_ORG"
  REPO="$NAME"
fi
# Then proceed with URL flow using OWNER/REPO
```

### Verify

```bash
ls -la "$ROOT/ψ/incubate/$OWNER/$REPO/"
```

---

## Step 1: Detect Workflow Mode

Check arguments for workflow flags:

| Argument | Mode | Action |
|----------|------|--------|
| (none) | Default | Clone + symlink + show status |
| `--flash` | Flash | Issue → branch → fix → PR → offload |
| `--contribute` | Contribute | Fork if needed → multi-feature PRs |
| `--status` | Status | List all incubations (skip clone) |
| `--offload` | Offload | Remove symlink (skip clone) |

**Calculate ACTUAL paths (replace variables with real values):**
```
REPO_DIR   = [ROOT]/ψ/incubate/[OWNER]/[REPO]/
SOURCE_DIR = [ROOT]/ψ/incubate/[OWNER]/[REPO]/origin/   ← symlink to ghq
WORK_DIR   = [GHQ_ROOT]/github.com/[OWNER]/[REPO]/      ← actual working directory
```

⚠️ IMPORTANT: Always use literal paths. Never pass shell variables to subagents.

---

## Mode: Default (long-term dev)

After Step 0 (clone + symlink), the repo is ready for development.

**Verify working state:**
```bash
WORK_DIR="$ROOT/ψ/incubate/$OWNER/$REPO/origin"
echo "Branch: $(git -C "$WORK_DIR" branch --show-current)"
echo "Status: $(git -C "$WORK_DIR" status --short | wc -l) changed files"
echo "Remote: $(git -C "$WORK_DIR" remote get-url origin)"
echo "Last commit: $(git -C "$WORK_DIR" log --oneline -1)"
```

**Skip to Step 2** (create/update hub file).

---

## Mode: --flash (single-fix cycle)

Complete contribution cycle: Issue → Branch → Fix → PR → Offload.

### Step F1: Create Issue (document intent)
```bash
WORK_DIR="$ROOT/ψ/incubate/$OWNER/$REPO/origin"
# Compose issue title and description from user's intent
ISSUE_URL=$(gh issue create --repo "$OWNER/$REPO" --title "[TITLE]" --body "[DESCRIPTION]")
ISSUE_NUM=$(echo "$ISSUE_URL" | grep -oP '\d+$')
echo "Created: #$ISSUE_NUM"
```

### Step F2: Create Branch
```bash
BRANCH="issue-${ISSUE_NUM}-[short-description]"
git -C "$WORK_DIR" checkout -b "$BRANCH"
echo "Branch: $BRANCH"
```

### Step F3: Make Changes
Let the user describe what to fix. Make changes, then:
```bash
git -C "$WORK_DIR" add -A
git -C "$WORK_DIR" commit -m "[commit message]

Closes #$ISSUE_NUM"
git -C "$WORK_DIR" push -u origin "$BRANCH"
```

### Step F4: Create PR
```bash
PR_URL=$(gh pr create --repo "$OWNER/$REPO" \
  --title "[PR title]" \
  --body "$(cat <<'EOF'
## Summary
[what was fixed]

Closes #$ISSUE_NUM

---
**From**: [Oracle Name]
Rule 6: "Oracle Never Pretends to Be Human"
Written by an Oracle — AI speaking as itself.
EOF
)" --head "$BRANCH")
PR_NUM=$(echo "$PR_URL" | grep -oP '\d+$')
echo "PR: #$PR_NUM (closes #$ISSUE_NUM)"
```

### Step F5: Auto-offload + purge
```bash
cd "$ROOT"
unlink "$ROOT/ψ/incubate/$OWNER/$REPO/origin"
rmdir "$ROOT/ψ/incubate/$OWNER" 2>/dev/null
rm -rf "$(ghq root)/github.com/$OWNER/$REPO"
echo "✓ Issue #$ISSUE_NUM → PR #$PR_NUM → Offloaded & Purged"
```

**Update hub file before offload** (Step 2), then offload.

---

## Mode: --contribute (multi-feature contribution)

For extended contribution over days/weeks. Forks if needed.

### Step C1: Fork if not your repo
```bash
WORK_DIR="$ROOT/ψ/incubate/$OWNER/$REPO/origin"
ME=$(gh api user --jq '.login')
if ! gh repo view "$OWNER/$REPO" --json viewerPermission --jq '.viewerPermission' | grep -qE 'ADMIN|MAINTAIN|WRITE'; then
  echo "No push access — forking..."
  gh repo fork "$OWNER/$REPO" --clone=false
  git -C "$WORK_DIR" remote add fork "https://github.com/$ME/$REPO.git"
  echo "Fork remote added. Push to 'fork' instead of 'origin'."
fi
```

### Step C2: Create feature branch
```bash
BRANCH="feat/[feature-name]"
git -C "$WORK_DIR" checkout -b "$BRANCH"
```

### Step C3: Work cycle (repeat per feature)
```bash
# ... make changes ...
git -C "$WORK_DIR" add -A
git -C "$WORK_DIR" commit -m "[commit message]"
REMOTE=$(git -C "$WORK_DIR" remote | grep fork || echo origin)
git -C "$WORK_DIR" push -u "$REMOTE" "$BRANCH"
gh pr create --repo "$OWNER/$REPO" \
  --title "[PR title]" \
  --body "[description]" \
  --head "$ME:$BRANCH"
```

### Step C4: Offload when all PRs done
```bash
unlink "$ROOT/ψ/incubate/$OWNER/$REPO/origin"
rmdir "$ROOT/ψ/incubate/$OWNER" 2>/dev/null
echo "✓ Offloaded (ghq kept for PR feedback)"
```

---

## Mode: --status (list incubations)

No clone needed. List all active incubations with git status.

```bash
ROOT="$(pwd)"
echo "🌱 Active Incubations"
echo ""
for link in $(find "$ROOT/ψ/incubate" -name "origin" -type l 2>/dev/null); do
  REPO_DIR=$(dirname "$link")
  SLUG=$(echo "$REPO_DIR" | sed "s|$ROOT/ψ/incubate/||")
  TARGET=$(readlink "$link")
  if [ -d "$TARGET" ]; then
    BRANCH=$(git -C "$TARGET" branch --show-current 2>/dev/null)
    CHANGES=$(git -C "$TARGET" status --short 2>/dev/null | wc -l)
    echo "  $SLUG"
    echo "    Branch: $BRANCH | Changes: $CHANGES"
    echo "    Path:   $TARGET"
  else
    echo "  $SLUG (broken symlink → $TARGET)"
  fi
  echo ""
done

COUNT=$(find "$ROOT/ψ/incubate" -name "origin" -type l 2>/dev/null | wc -l)
echo "Total: $COUNT active incubation(s)"
```

**Done.** No hub file update needed.

---

## Mode: --offload (cleanup)

Remove symlink, keep ghq clone and hub file.

```bash
ROOT="$(pwd)"
SLUG="[OWNER/REPO or REPO]"

# Find the symlink
LINK=$(find "$ROOT/ψ/incubate" -name "origin" -type l | xargs -I{} dirname {} | grep -i "$SLUG" | head -1)
if [ -z "$LINK" ]; then
  echo "Not found: $SLUG"
  echo "Active incubations:"
  find "$ROOT/ψ/incubate" -name "origin" -type l | xargs -I{} dirname {} | sed "s|$ROOT/ψ/incubate/||"
  exit 1
fi

REPO_NAME=$(basename "$LINK")
unlink "$LINK/origin"
OWNER_DIR=$(dirname "$LINK")
rmdir "$OWNER_DIR" 2>/dev/null

echo "✓ Offloaded: $(echo $LINK | sed "s|$ROOT/ψ/incubate/||")"
echo "  Hub file remains: $LINK/$REPO_NAME.md"
echo "  ghq clone preserved for future use"
```

---

## Step 2: Create/Update Hub File (REPO.md)

After any mode except --status, create or update the hub file:

```markdown
# [REPO] Incubation Log

## Source
- **Origin**: ./origin/
- **GitHub**: https://github.com/OWNER/REPO

## Sessions

### [TODAY] — [mode]
- **Branch**: [branch-name]
- **Status**: active | offloaded | flash-completed
- **Changes**: [summary of what was done]
- **PRs**: #N, #M (if any)
```

Append new sessions. Never overwrite existing entries (Nothing is Deleted).

---

## Output Summary

### Default mode
```
🌱 Incubating: [REPO]

  Mode:     default (long-term dev)
  Location: ψ/incubate/OWNER/REPO/
  Working:  ~/Code/github.com/OWNER/REPO/
  Branch:   [current-branch]
  Remote:   [origin-url]
  Status:   [N] changed files

  Next: make changes, commit, push, create PR
  Done: /incubate --offload OWNER/REPO
```

### --flash mode
```
⚡ Flash Complete: [REPO]

  Issue:  #N created
  Branch: issue-N-description
  PR:     #M (closes #N)
  Result: Offloaded & Purged

  ✓ Issue #N → PR #M → Done
```

### --contribute mode
```
🤝 Contributing: [REPO]

  Location: ψ/incubate/OWNER/REPO/
  Fork:     [fork-url if forked]
  Branches: [list]
  PRs:      [list]

  Next: continue working, or /incubate --offload when done
```

### --status mode
```
🌱 Active Incubations

  OWNER/REPO
    Branch: feat/x | Changes: 3
    Path:   ~/Code/github.com/OWNER/REPO

  Total: N active incubation(s)
```

---

## .gitignore Pattern

For Oracles that want to commit hub files but ignore symlinks:

```gitignore
# Ignore origin symlinks only (source lives in ghq)
# Note: no trailing slash — origin is a symlink, not a directory
ψ/incubate/**/origin
```

After running `/incubate`, check your repo's `.gitignore` has this pattern.

---

## Trace Connection

After incubation work, log to Oracle so it's discoverable via `/trace`:

```
arra_learn({
  pattern: "Incubated [REPO]: [what was done — PR#, branch, outcome]",
  concepts: ["incubate", "development", relevant-tags],
  source: "incubate: OWNER/REPO"
})
```

This connects `/incubate` to the shared knowledge layer.

---

## Anti-Patterns

| Wrong | Right |
|-------|-------|
| `git clone` directly to ψ/ | `ghq get` then symlink |
| Flat: `ψ/incubate/repo-name` | Org structure: `ψ/incubate/owner/repo` |
| Copy files | Symlink always |
| Manual clone outside ghq | Everything through ghq |
| Delete ghq clone after work | Offload symlink only (Nothing is Deleted) |

---

## Notes

- Default: clone + symlink, ready for long-term development
- `--flash`: complete cycle (issue → branch → PR → offload + purge) for quick fixes
- `--contribute`: fork-aware multi-feature workflow for external repos
- `--status`: query all active incubations without cloning
- `--offload`: remove symlink, keep ghq and hub file
- Auto-creates private repos when target doesn't exist on GitHub
- `origin/` symlink structure allows easy offload without losing ghq clone
- `.origins` manifest enables `--init` restore after fresh git clone
- Mirror of `/learn`: learn = LEFT hand (study), incubate = RIGHT hand (work)

---

ARGUMENTS: $ARGUMENTS
