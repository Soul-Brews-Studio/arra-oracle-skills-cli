---
name: project
description: Clone and track external repos. Use when user shares GitHub URL to study or develop, or says "search repos", "find repo", "where is [project]". Actions - learn (clone for study), search/find (search repos), list (show tracked). For active development, use /incubate.
argument-hint: "<github-url> | search <query>"
---

# project-manager

Track and manage external repos: Learn (study) | Incubate (develop)

## Golden Rule

**ghq owns the clone → ψ/ owns the symlink**

Never copy. Always symlink. One source of truth.

## When to Use

Invoke this skill when:
- User shares a GitHub URL and wants to study/clone it
- User mentions wanting to learn from a codebase
- User wants to start developing on an external repo
- Need to find where a previously cloned project lives

## Step 0 — Anchor (date-stamp + root)

```bash
date "+🕐 %H:%M %Z (%A %d %B %Y)"

# Find oracle root — git toplevel that has CLAUDE.md + ψ/
ORACLE_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -n "$ORACLE_ROOT" ] && [ -f "$ORACLE_ROOT/CLAUDE.md" ] && { [ -d "$ORACLE_ROOT/ψ" ] || [ -L "$ORACLE_ROOT/ψ" ]; }; then
  PSI="$ORACLE_ROOT/ψ"
elif [ -f "$(pwd)/CLAUDE.md" ] && { [ -d "$(pwd)/ψ" ] || [ -L "$(pwd)/ψ" ]; }; then
  ORACLE_ROOT="$(pwd)"
  PSI="$ORACLE_ROOT/ψ"
else
  echo "⚠️ Not in oracle repo (no CLAUDE.md + ψ/ at git root). Writing to pwd."
  ORACLE_ROOT="$(pwd)"
  PSI="$ORACLE_ROOT/ψ"
fi
```

## Actions

### learn [url|slug]

Clone repo for **study** (read-only reference).

```bash
# 1. Clone via ghq
ghq get -u https://github.com/owner/repo

# 2. Create org/repo symlink structure
GHQ_ROOT=$(ghq root)
mkdir -p "$PSI/learn/owner"
ln -sf "$GHQ_ROOT/github.com/owner/repo" "$PSI/learn/owner/repo"
```

**Output** (announce-mode — absolute path):

# announce-mode → absolute path (no ψ/, no ~/, no $VAR, no ...).
# Use:  echo "marker: $RESOLVED_PATH"  — bash substitutes. See CONVENTIONS.md.

```bash
LINK="$PSI/learn/owner/repo"
echo "✅ Linked: $LINK"
```

### incubate — REDIRECTS TO /incubate

> **`/project incubate` is now `/incubate`.**
> If the user says `/project incubate [args]`, run `/incubate [args]` instead.
> Do NOT execute incubate logic here — invoke the standalone `/incubate` skill with the same arguments.

### find [query]

Search for project across all locations:

```bash
# Search ghq repos
ghq list | grep -i "query"

# Search learn/incubate symlinks (org/repo structure)
find "$PSI/learn" "$PSI/incubate" -type l 2>/dev/null | grep -i "query"
```

**Output**: List matches with their ghq paths

### list

Show all tracked projects with rich metadata (#227):

```bash
echo "📦 Projects"
echo ""

# Collect all tracked repos (learn + incubate symlinks)
REPOS=()
for link in $(find "$PSI/learn" "$PSI/incubate" -name "origin" -type l 2>/dev/null | sort); do
  dir=$(dirname "$link")
  owner=$(basename "$(dirname "$dir")")
  repo=$(basename "$dir")
  type="learn"
  echo "$link" | grep -q "incubate" && type="incubate"
  REPOS+=("$owner/$repo:$type")
done

if [ ${#REPOS[@]} -eq 0 ]; then
  echo "  No tracked projects. Use /learn or /incubate to add."
else
  printf "  %-35s %-6s %-8s %-8s %s\n" "Repo" "Stars" "License" "Type" "Description"
  printf "  %-35s %-6s %-8s %-8s %s\n" "───────────────────────────────────" "──────" "────────" "────────" "──────────────────────"

  for entry in "${REPOS[@]}"; do
    slug="${entry%%:*}"
    type="${entry##*:}"
    # Fetch metadata from GitHub (cached per session)
    meta=$(gh api "repos/$slug" --jq '"\(.stargazers_count)\t\(.license.spdx_id // "none")\t\(.description // "-" | .[0:40])"' 2>/dev/null || echo "?\tnone\t-")
    stars=$(echo "$meta" | cut -f1)
    license=$(echo "$meta" | cut -f2)
    desc=$(echo "$meta" | cut -f3)
    printf "  %-35s %-6s %-8s %-8s %s\n" "$slug" "⭐$stars" "$license" "$type" "$desc"
  done
fi

echo ""
echo "  Total: ${#REPOS[@]} tracked repos"
```

## Directory Structure

```
ψ/
├── learn/owner/repo     → ~/Code/github.com/owner/repo  (symlink)
└── incubate/owner/repo  → ~/Code/github.com/owner/repo  (symlink)

~/Code/               ← ghq root (source of truth)
└── github.com/owner/repo/  (actual clone)
```

## Health Check

When listing, verify symlinks are valid:

```bash
# Check for broken symlinks
find "$PSI/learn" "$PSI/incubate" -type l ! -exec test -e {} \; -print 2>/dev/null
```

If broken: `ghq get -u [url]` to restore source.

## Examples

```
# User shares URL to study
User: "I want to learn from https://github.com/SawyerHood/dev-browser"
→ ghq get -u https://github.com/SawyerHood/dev-browser
→ mkdir -p ψ/learn/SawyerHood
→ ln -sf ~/Code/github.com/SawyerHood/dev-browser ψ/learn/SawyerHood/dev-browser

# User wants to develop → redirect to /incubate
User: "I want to work on claude-mem"
→ /incubate https://github.com/thedotmack/claude-mem

# User says "/project incubate" → redirect to /incubate
User: "/project incubate https://github.com/Soul-Brews-Studio/arra-oracle-v3 --contribute"
→ /incubate https://github.com/Soul-Brews-Studio/arra-oracle-v3 --contribute
```

## Anti-Patterns

| ❌ Wrong | ✅ Right |
|----------|----------|
| `git clone` directly to ψ/ | `ghq get` then symlink |
| Flat: `ψ/learn/repo-name` | Org structure: `ψ/learn/owner/repo` |
| Copy files | Symlink always |
| Manual clone outside ghq | Everything through ghq |

## Quick Reference

```bash
# Add to learn
ghq get -u URL && mkdir -p "$PSI/learn/owner" && ln -sf "$(ghq root)/github.com/owner/repo" "$PSI/learn/owner/repo"

# Incubate (use standalone /incubate skill)
/incubate URL [--flash | --contribute | --status | --offload]

# Update source
ghq get -u URL

# Find repo
ghq list | grep name
```
