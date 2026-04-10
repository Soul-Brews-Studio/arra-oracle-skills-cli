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

## Actions

### learn [url|slug]

Clone repo for **study** (read-only reference).

```bash
# 1. Clone via ghq
ghq get -u https://github.com/owner/repo

# 2. Create org/repo symlink structure
GHQ_ROOT=$(ghq root)
mkdir -p ψ/learn/owner
ln -sf "$GHQ_ROOT/github.com/owner/repo" ψ/learn/owner/repo
```

**Output**: "✓ Linked [repo] to ψ/learn/owner/repo"

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
find ψ/learn ψ/incubate -type l 2>/dev/null | grep -i "query"
```

**Output**: List matches with their ghq paths

### list

Show all tracked projects:

```bash
echo "📚 Learn"
find ψ/learn -type l 2>/dev/null | while read link; do
  target=$(readlink "$link")
  echo "  ${link#ψ/learn/} → $target"
done

echo "🌱 Incubate"
find ψ/incubate -type l 2>/dev/null | while read link; do
  target=$(readlink "$link")
  echo "  ${link#ψ/incubate/} → $target"
done

echo "🏠 External (ghq)"
ghq list | grep -v "laris-co/Nat-s-Agents" | head -10
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
find ψ/learn ψ/incubate -type l ! -exec test -e {} \; -print 2>/dev/null
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
ghq get -u URL && mkdir -p ψ/learn/owner && ln -sf "$(ghq root)/github.com/owner/repo" ψ/learn/owner/repo

# Incubate (use standalone /incubate skill)
/incubate URL [--flash | --contribute | --status | --offload]

# Update source
ghq get -u URL

# Find repo
ghq list | grep name
```
