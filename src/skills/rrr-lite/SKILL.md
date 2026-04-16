---
name: rrr-lite
description: Quick session retrospective — what we did, what we learned. Lite version for starter profile. Use when user says "rrr", "retrospective", "wrap up". For full version with AI diary and anti-rationalization guard, upgrade to standard (/go standard → /rrr).
---

# /rrr-lite

Quick retro. No subagents, no diary.

```bash
date "+🕐 %H:%M %Z (%A %d %B %Y)" && git log --oneline -10 && echo "---" && git diff --stat HEAD~5
```

Write a short retrospective to vault:

```bash
PSI=$(readlink -f ψ 2>/dev/null || echo "ψ")
mkdir -p "$PSI/memory/retrospectives/$(date +%Y-%m/%d)"
```

Include:
- **Summary**: What we did (3-5 bullet points from git log)
- **Learned**: 1 key lesson
- **Next**: What to do next session

Write to: `$PSI/memory/retrospectives/YYYY-MM/DD/HH.MM_slug.md`

Upgrade: `/go standard` for full `/rrr` with AI diary (150+ words), anti-rationalization guard, and oracle sync.

---

ARGUMENTS: $ARGUMENTS
