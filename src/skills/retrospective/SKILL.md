---
name: retrospective
description: Quick session retrospective — summary, lessons, next steps. Use when user says "retrospective", "retro", "session summary", "wrap up session". Do NOT trigger for full /rrr (install arra-symbiosis-skills), session orientation (use /recap), or handoff (use /forward).
argument-hint: "[--detail]"
---

# /retrospective — Session Retrospective

Quick retrospective for any Oracle. For the full /rrr experience, install arra-symbiosis-skills.

## Steps

### 0. Anchor (date-stamp + root)

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

### 1. Gather

```bash
git log --oneline -10
```

### 2. Write

Path: `$PSI/memory/retrospectives/YYYY-MM/DD/HH.MM_slug.md`

```bash
mkdir -p "$PSI/memory/retrospectives/$(date +%Y-%m/%d)"
```

Include:
- Session Summary
- What Got Done (commits, PRs)
- Lessons Learned
- Next Steps

### 3. Sync to Oracle (two-layer pattern)

1. Write to `$PSI/memory/learnings/YYYY-MM-DD_<slug>.md` with frontmatter:
   ```yaml
   ---
   pattern: <lesson in one line>
   date: <today>
   source: retrospective: REPO
   concepts: [<tags>]
   ---

   # <lesson title>
   <body>
   ```

2. The Oracle's auto-memory layer picks up new files in `$PSI/memory/learnings/` automatically — no separate API call needed.

Do NOT git add ψ/ — vault is shared state.

### 4. Confirm (announce-mode — absolute paths required)

# announce-mode → absolute path (no ψ/, no ~/, no $VAR, no ...).
# Use:  echo "marker: $RESOLVED_PATH"  — bash substitutes. See CONVENTIONS.md.

```bash
RETRO_FILE="$PSI/memory/retrospectives/$(date +%Y-%m/%d)/$(date +%H.%M)_${SLUG}.md"
LESSON_FILE="$PSI/memory/learnings/$(date +%Y-%m-%d)_${SLUG}.md"
echo "📝 Retrospective:  $RETRO_FILE"
echo "💡 Lesson learned: $LESSON_FILE"
```

ARGUMENTS: $ARGUMENTS
