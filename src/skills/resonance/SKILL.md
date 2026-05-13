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

### 1. Analyze Recent Conversation

Look back at the last 5-10 messages. Find:
- **What**: The specific idea, pattern, or decision that sparked the reaction
- **When**: Timestamp (from hook context or current time)
- **Why**: Why did this resonate? What problem does it solve?
- **How**: How was it discovered? What led to this moment?
- **Connection**: Does this connect to existing Oracle learnings?

### 2. Log to Vault

```bash
PSI=$(readlink -f ψ 2>/dev/null || echo "ψ")
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

1. Write to `ψ/memory/learnings/YYYY-MM-DD_resonance-<slug>.md` with frontmatter:
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

2. The Oracle's auto-memory layer picks up new files in `ψ/memory/learnings/` automatically — no separate API call needed.

### 4. Output

```
✨ Resonance captured: [title]
   → ψ/memory/resonance/YYYY-MM-DD_HHMM_slug.md
   Tags: [tags]
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
