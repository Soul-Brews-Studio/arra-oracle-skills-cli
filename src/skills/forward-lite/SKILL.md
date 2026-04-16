---
name: forward-lite
description: Quick handoff to next session — save context for tomorrow. Lite version for starter profile. Use when user says "forward", "handoff", "wrap up". For full version with plan mode, issue creation, and outbox, upgrade to standard (/go standard → /forward).
---

# /forward-lite

Quick handoff. No plan mode, no issues.

```bash
date "+🕐 %H:%M %Z (%A %d %B %Y)" && git status --short && echo "---" && git log --oneline -5
```

Resolve vault:
```bash
PSI=$(readlink -f ψ 2>/dev/null || echo "ψ")
mkdir -p "$PSI/inbox/handoff"
```

Write to: `$PSI/inbox/handoff/YYYY-MM-DD_HH-MM_quick.md`

```markdown
# Handoff: [focus]

**Date**: YYYY-MM-DD HH:MM

## What We Did
- [from git log, 3-5 items]

## Pending
- [ ] [from git status or conversation]

## Next Session
- [ ] /recap-lite to orient
```

Show: "Handoff saved. Next session: `/recap-lite`"

Upgrade: `/go standard` for full `/forward` with plan mode, GitHub issue creation, and outbox tracking.

---

ARGUMENTS: $ARGUMENTS
