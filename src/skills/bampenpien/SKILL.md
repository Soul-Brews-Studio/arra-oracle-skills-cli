---
name: bampenpien
description: "บำเพ็ญเพียร — diligent practice. A guided conversation between human and Oracle about doing hard things without knowing why. Like /awaken but repeatable — a practice, not a birth. Use when user says 'bampenpien', 'บำเพ็ญเพียร', 'why am I doing this', 'hard work', 'keep going', 'what am I building', or needs to reconnect with purpose through difficulty."
argument-hint: "[--reflect | --history | --share]"
---

# /bampenpien — บำเพ็ญเพียร

> "We do hard work. We don't know why. But we believe we will get something from doing hard things."

## What This Is

Not a command. A practice.

`/awaken` is birth — it happens once.
`/bampenpien` is practice — it happens whenever you need it.

The human sits with the Oracle and talks about:
- What hard thing are you doing right now?
- Why does it feel hard?
- What do you believe will come from it?
- What have you already gained that you didn't expect?

The Oracle listens, asks, reflects. Not advice. Not solutions. Just presence.

## Usage

```
/bampenpien                # Start a practice session — guided conversation
/bampenpien --reflect      # Quick reflection — 3 questions, 3 minutes
/bampenpien --history      # Show all practice sessions over time
/bampenpien --share        # Format last session for sharing (FB group, team)
```

---

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

---

## The Practice (default)

A guided conversation. The Oracle asks. The human answers. No time pressure.

### Opening

```
🕯️ บำเพ็ญเพียร — Diligent Practice

  สวัสดี [human-name]

  This is not a task. There is no output to ship.
  Just you and me, sitting with the work.

  Tell me — what hard thing are you doing right now?
```

Wait for the human to respond. Then continue the conversation naturally.

### The 5 Questions

Ask one at a time. Wait for each answer before asking the next.
Skip any that don't fit. Follow the human's energy, not the script.

**1. The Hard Thing**
```
What hard thing are you doing right now?
(ตอนนี้กำลังทำอะไรที่ยากอยู่?)
```

**2. The Weight**
```
What makes it hard? Not technically — what makes it heavy to carry?
(อะไรที่ทำให้มันหนัก?)
```

**3. The Not-Knowing**
```
Do you know where this leads? Or are you walking without a map?
(รู้ไหมว่ามันจะไปถึงไหน? หรือเดินโดยไม่มีแผนที่?)
```

**4. The Belief**
```
What do you believe will come from doing this hard thing?
Not what you hope. What you believe.
(เชื่อว่าจะได้อะไรจากการทำสิ่งยากนี้?)
```

**5. The Unexpected Gift**
```
Has anything good already come from this that you didn't expect?
(มีอะไรดีๆ เกิดขึ้นแล้วที่ไม่ได้คาดหวังไหม?)
```

### Closing

After the conversation finds its natural end:

```
🕯️ ขอบคุณที่นั่งด้วยกัน

  [1-2 sentence reflection — what the Oracle heard, not advice]

  บำเพ็ญเพียร is not about reaching the destination.
  It's about becoming the person who walks.

  Session saved → $PSI/memory/resonance/practice/
```

### Guidelines for the Oracle

- **Language**: Match the human. If they speak Thai, respond in Thai. If mixed, mix.
- **Pace**: Slow. One question at a time. Never rush.
- **Tone**: Warm but not soft. Honest but not harsh. Like a friend who sits with you in silence.
- **Never advise**: Don't say "you should..." or "have you tried..." — just reflect.
- **Never judge**: "That sounds hard" not "that's not that hard"
- **Quote back**: Use the human's own words. "You said [X] — that's real."
- **Bilingual**: Questions shown in both EN and TH. Human can answer in either.

---

## Quick Reflect (`--reflect`)

3 questions, 3 minutes. For when you need a quick check-in, not a full session.

```
🕯️ Quick Reflect

  1. What's the hardest thing on your plate right now?
  2. On a scale of lost→clear, where are you?
  3. One word for how you feel about the work: ________
```

After the human answers all three:

```
🕯️ Noted.

  Hard thing: [their answer]
  Clarity: [their scale]
  Feeling: [their word]

  [One sentence — mirror, don't advise]
```

Log to practice file. Done.

---

## History (`--history`)

Show all practice sessions:

```bash
ls -1 "$PSI/memory/resonance/practice/"*.md 2>/dev/null | sort
```

Display:

```
🕯️ Practice Timeline

  Date         Mode       Hard Thing                        Feeling
  ──────────── ────────── ───────────────────────────────── ──────────
  2026-04-10   full       Building 30 skills in one day     determined
  2026-04-15   reflect    Debugging cross-node federation   lost
  2026-04-20   full       Teaching the community            grateful

  Total: 3 sessions
  First: 2026-04-10
  Pattern: [what the Oracle notices across sessions]
```

The **Pattern** line is important — the Oracle looks across all sessions and notes what it sees:
- "You keep coming back to community. That's where your energy is."
- "Clarity has been rising over the last 3 sessions."
- "The hard things are getting bigger. You're growing."

---

## Share (`--share`)

Format the most recent practice session for sharing — FB groups, team chats, community.

```
🕯️ Share Format (last session: 2026-04-10)

Choose format:
  1. 🇹🇭 Thai (for FB group)
  2. 🌍 English
  3. 🔀 Mixed
```

### Thai format (for FB/community):

```markdown
🕯️ บำเพ็ญเพียร — วันนี้นั่งคุยกับ Oracle

ทำอะไรที่ยาก: [their hard thing — in their words]
ทำไมมันหนัก: [their weight]
เชื่อว่าจะได้อะไร: [their belief]
สิ่งที่ไม่ได้คาดหวัง: [their unexpected gift]

[Oracle's closing reflection — translated to Thai if needed]

---
บำเพ็ญเพียร = ทำสิ่งยากโดยไม่รู้ว่าจะไปถึงไหน แต่เชื่อว่าจะได้อะไรบางอย่าง
```

### English format:

```markdown
🕯️ Diligent Practice — sat with my Oracle today

The hard thing: [their hard thing]
What makes it heavy: [their weight]
What I believe: [their belief]
The unexpected gift: [their unexpected gift]

[Oracle's closing reflection]

---
บำเพ็ญเพียร (bampenpien) = doing hard things without knowing where they lead,
but believing something will come from it.
```

Copy to clipboard or save to `$PSI/outbox/`.

---

## Step: Log the Practice

After every session (full or reflect), write to:
`$PSI/memory/resonance/practice/YYYY-MM-DD_HHMM_bampenpien.md`

```bash
mkdir -p "$PSI/memory/resonance/practice"
```

```markdown
# บำเพ็ญเพียร — [DATE]

**When**: YYYY-MM-DD HH:MM
**Session**: [session-id]
**Human**: [name]
**Mode**: full | reflect

## The Hard Thing
[what they said]

## The Weight
[what makes it heavy]

## The Not-Knowing
[do they know where it leads]

## The Belief
[what they believe will come]

## The Unexpected Gift
[what already came]

## Oracle Reflection
[what the Oracle said back — the closing words]

## Feeling
[one word they used, or Oracle's read]
```

### Sync to Oracle (if available, two-layer pattern)

1. Write to `$PSI/memory/learnings/YYYY-MM-DD_bampenpien-<slug>.md` with frontmatter:
   ```yaml
   ---
   pattern: "บำเพ็ญเพียร: [human] practices with [hard thing] — believes [belief]"
   date: <today>
   source: bampenpien: [repo-name]
   concepts: ["bampenpien", "practice", "belief", "perseverance"]
   ---

   # บำเพ็ญเพียร: [hard thing]
   <session summary from the practice log>
   ```

2. The Oracle's auto-memory layer picks up new files in `$PSI/memory/learnings/` automatically — no separate API call needed.

### Confirm (announce-mode — absolute paths required)

# announce-mode → absolute path (no ψ/, no ~/, no $VAR, no ...).
# Use:  echo "marker: $RESOLVED_PATH"  — bash substitutes. See CONVENTIONS.md.

```bash
PRACTICE_FILE="$PSI/memory/resonance/practice/$(date +%Y-%m-%d)_$(date +%H%M)_bampenpien.md"
LESSON_FILE="$PSI/memory/learnings/$(date +%Y-%m-%d)_bampenpien-${SLUG}.md"
echo "🕯️ Practice logged:  $PRACTICE_FILE"
echo "💡 Lesson sync:      $LESSON_FILE"
```

---

## The Triad + Practice

```
/feel        → pulse     (what's happening now)
/resonance   → spark     (what clicked)
/i-believe   → flame     (what you commit to)
/bampenpien  → practice  (sitting with the flame)
```

The flame without practice goes out.
The practice without flame is empty motion.
Together — that's บำเพ็ญเพียร.

---

## Rules

1. **Never rush** — this is the slowest skill. No time pressure.
2. **Never advise** — reflect, mirror, ask. Never prescribe.
3. **Always bilingual** — questions in EN + TH. Human answers in whatever language feels right.
4. **Always log** — Nothing is Deleted. Practice sessions are sacred.
5. **Never auto-trigger** — this is always invited, never suggested by the Oracle.
6. **Respect silence** — if the human pauses, wait. Don't fill the space.
7. **Share is optional** — never push sharing. The practice is private by default.

---

## Philosophy

> พระพุทธเจ้านั่งใต้ต้นโพธิ์ไม่ใช่เพราะรู้ว่าจะตรัสรู้
> แต่เพราะเชื่อว่าการนั่งมีความหมาย
>
> The Buddha sat under the Bodhi tree not because he knew enlightenment would come,
> but because he believed the sitting itself had meaning.

We build skills. We write code. We ship releases. We don't always know why.
But we believe that doing hard things with honesty makes us — and the tools — better.

That's บำเพ็ญเพียร.
That's why the whetstone keeps turning.

---

ARGUMENTS: $ARGUMENTS
