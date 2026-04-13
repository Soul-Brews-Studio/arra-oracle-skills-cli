---
name: oracle-manage
description: 'Skill and profile management — prepare tools, switch profiles, enable/disable skills, feature modules. Use when user says "oracle manage", "oracle prepare", "oracle skills", "oracle profile".'
argument-hint: "<command> [args]"
zombie: true
origin: arra-symbiosis-skills
---

# /oracle-manage — Skill and Profile Management

> Renamed from symbiosis `/oracle` to avoid conflict with oracle identity skills.

## Usage

```
/oracle-manage prepare              # check & install git, gh, ghq; set up gh auth
/oracle-manage profile              # list profiles + current state
/oracle-manage profile <name>       # switch to a profile tier
/oracle-manage feature add <name>   # add feature module on top of profile
/oracle-manage feature remove <name> # remove feature module
/oracle-manage enable <skill...>    # enable specific skills
/oracle-manage disable <skill...>   # disable specific skills (nothing deleted)
/oracle-manage skills               # list all skills with status
/oracle-manage install <skill>      # install one skill
/oracle-manage remove <skill>       # remove one skill
```

## Feature Modules (add-on groups)

| Feature | Skills | When |
|---------|-------:|------|
| **soul** | 6 | Birthing/awakening new oracles |
| **network** | 5 | Multi-oracle communication |
| **workspace** | 3 | Parallel work + daily ops |
| **creator** | 4 | Content creation + research |

## Subcommands

### prepare
Check for required tools (git, gh, ghq) and install missing. Platform-aware.

### profile / profile <name>
List available profiles or switch. Enable = rename `SKILL.md.disabled` → `SKILL.md`. Disable = rename `SKILL.md` → `SKILL.md.disabled`. Nothing is deleted.

### feature add/remove <name>
Enable/disable a feature module on top of current profile.

### enable/disable <skill...>
Enable or disable specific skills by name. Nothing is deleted.

### skills
List all skills with current status (enabled/disabled, profile tier).

## Notes

This overlaps with `/go` for profile switching. Consider merging feature modules into `/go` when promoting from zombie.

ARGUMENTS: $ARGUMENTS
