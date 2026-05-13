---
name: skills-list
description: 'List all Oracle skills with profile tier, type, and script status. Use when user says "skills list", "show skills", "what skills", "list all skills", "how many skills", or wants to see available skills by profile.'
argument-hint: "[--json]"
zombie: true
archived_reason: 'moved to zombie tier via #327 (usage audit, 3,685 sessions mined)'
archived_date: 2026-05-13
---

# /skills-list — Show All Skills

> See everything at a glance. Single source of truth.

## Usage

```
/skills-list          # Pretty table
/skills-list --json   # Machine-readable JSON
```

## Run

```bash
python3 .claude/scripts/skills-list.py
```

The script lives at `.claude/scripts/skills-list.py` in the repo (not in src/skills/). It reads STANDARD_SKILLS and LAB_SKILLS from `profiles.ts` (single source of truth) and scans all skill directories.

If not in the repo directory, fall back:
```bash
python3 ~/.claude/skills/skills-list/scripts/skills-list.py
```

### Output

```
📦 Oracle Skills — 41 total

  standard   15  /go standard
  full       23  /go full
  lab        41  /go lab

  #  Skill                    Profile    Type         Scripts
  ── ──────────────────────── ────────── ────────���─── ───────
   1 about-oracle             standard   skill+agent  
   2 recap                    standard   skill        
   3 awaken                   standard   skill        
   ...
  41 xray                     standard   skill        

  standard=15 | full=23 | lab=41
```

### JSON mode

```bash
python3 ~/.claude/skills/skills-list/scripts/skills-list.py --json
```

Returns structured JSON with all skill metadata — useful for piping to other tools.

---

ARGUMENTS: $ARGUMENTS
