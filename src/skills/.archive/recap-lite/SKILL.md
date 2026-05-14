---
name: recap-lite
description: "[DEPRECATED] Lite variant killed 2026-05-14. Use /recap instead."
zombie: true
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
