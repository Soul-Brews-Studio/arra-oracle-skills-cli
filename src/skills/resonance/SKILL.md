---
name: resonance
description: Capture a resonance moment — when something clicks, sparks joy, or feels right. Logs what resonated, when, why, and how. Use when user says "resonance", "yes!", "cool!", "very cool!", "love it", "that's it!", "exactly!", or expresses strong positive reaction to something just discussed. Do NOT trigger for general praise like "thanks" or "ok".
argument-hint: "[note]"
---

# /resonance — Capture What Resonates

When something clicks — log it. The pattern, the insight, the spark.

## Usage

```
/resonance                    # Auto-detect from recent conversation
/resonance "skills as marketplace"  # With explicit note
```

## When to Trigger

AI should consider auto-suggesting /resonance when user says:
- "yes!", "cool!", "very cool!", "love it!", "exactly!"
- "that's it!", "perfect!", "นี่แหละ!", "ใช่เลย!"
- Strong agreement after a design decision or insight

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

### 1. Analyze Recent Conversation

Look back at the last 5-10 messages. Find:
- **What**: The specific idea, pattern, or decision that sparked the reaction
- **When**: Timestamp (from hook context or current time)
- **Why**: Why did this resonate? What problem does it solve?
- **How**: How was it discovered? What led to this moment?
- **Connection**: Does this connect to existing Oracle learnings?

### 2. Log to Vault

```bash
mkdir -p "$PSI/memory/resonance"
```

Write to: `$PSI/memory/resonance/YYYY-MM-DD_HHMM_slug.md`

```markdown
# Resonance: [short title]

**When**: YYYY-MM-DD HH:MM
**Session**: [session-id]
**Context**: [what we were working on]

## What Resonated
[The specific idea/pattern/decision]

## Why It Matters
[Why this clicked — what problem it solves, what it enables]

## How We Got Here
[The conversation path that led to this moment]

## Connection
[Links to existing patterns, principles, or learnings]

## Tags
[concept tags for future search]
```

### 3. Sync to Oracle (if available, two-layer pattern)

1. Write to `$PSI/memory/learnings/YYYY-MM-DD_resonance-<slug>.md` with frontmatter:
   ```yaml
   ---
   pattern: "[resonance title]: [what resonated]"
   date: <today>
   source: resonance: [repo-name]
   concepts: ["resonance", <tags>]
   ---

   # [resonance title]
   [what resonated and why]
   ```

2. The Oracle's auto-memory layer picks up new files in `$PSI/memory/learnings/` automatically — no separate API call needed.

### 4. Confirm (announce-mode — absolute paths required)

# announce-mode → absolute path (no ψ/, no ~/, no $VAR, no ...).
# Use:  echo "marker: $RESOLVED_PATH"  — bash substitutes. See CONVENTIONS.md.

```bash
RES_FILE="$PSI/memory/resonance/$(date +%Y-%m-%d)_$(date +%H%M)_${SLUG}.md"
LESSON_FILE="$PSI/memory/learnings/$(date +%Y-%m-%d)_resonance-${SLUG}.md"
echo "✨ Resonance captured: ${TITLE}"
echo "📥 Saved:   $RES_FILE"
echo "💡 Lesson:  $LESSON_FILE"
```

Short. Don't over-explain. The moment speaks for itself.

## Philosophy

> Resonance is the signal. When something resonates, it means
> the pattern matches reality. Log it before it fades.

Resonance logs are different from learnings:
- **Learnings** = what you figured out (head)
- **Resonance** = what clicked (heart)

Over time, resonance logs reveal what matters most — not what's logical, but what's alive.

ARGUMENTS: $ARGUMENTS
