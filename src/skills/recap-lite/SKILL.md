---
name: recap-lite
description: Quick session orientation — git state + last handoff. Lite version for starter profile. Use when user says "recap", "where are we", "status". For full version with retro summaries and session mining, upgrade to standard (/go standard → /recap).
---

# /recap-lite

Quick orient. Git + last handoff.

```bash
date "+🕐 %H:%M %Z (%A %d %B %Y)" && git status --short && echo "---" && git log --oneline -3
```

Then read the most recent handoff:
```bash
ls -t ψ/inbox/handoff/*.md 2>/dev/null | head -1
```

Read it. Show:
- Last session summary (2-3 lines)
- Pending items
- Git state (clean/dirty/branch)

End with: **What's next?**

Upgrade: `/go standard` for full `/recap` with retro summaries, session mining, and deep context.

---

ARGUMENTS: $ARGUMENTS
