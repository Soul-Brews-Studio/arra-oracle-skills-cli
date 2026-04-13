---
name: handover
description: 'Transfer work to another Oracle — forward + wake + tell in one command. Use when user says "handover", "hand over", "transfer to", "pass to", or wants to delegate work to another oracle.'
argument-hint: "<oracle> <instruction>"
zombie: true
origin: arra-symbiosis-skills
---

# /handover — Transfer Work to Another Oracle

Forward + Wake + Tell in one command. You're done, they continue.

## Usage

```
/handover neo "continue #117, PR ready for review"
/handover pulse "alpha released, triage 9 open issues"
```

## Steps

### 1. Write Handoff (like /forward)

```bash
PSI=$(readlink -f ψ 2>/dev/null || echo "ψ")
mkdir -p "$PSI/inbox/handoff"
```

Write to: `$PSI/inbox/handoff/YYYY-MM-DD_HH-MM_handover-to-<oracle>.md`

```markdown
# Handover to <oracle-name>

**Date**: YYYY-MM-DD HH:MM
**From**: [current Oracle]
**To**: <oracle-name>
**Instruction**: <instruction>

## Context
- [What we were working on]
- [Key decisions made]

## Pending
- [ ] [Items to continue]

## Key Files
- [Important files]
```

### 2. Wake Target Oracle

```bash
maw wake <oracle-name>
```

Wait 3 seconds for startup.

### 3. Send Instruction + Handoff Path

```bash
maw hey <oracle-name> "Handover from [self]: <instruction>. Handoff file: $PSI/inbox/handoff/... — read it with /recap"
```

### 4. Output

```
Handed over to <oracle-name>:
  Handoff: ψ/inbox/handoff/...
  Instruction: "<instruction>"
  → <oracle-name> is awake and has context
```

## Rules

- Always write handoff BEFORE waking target
- Include handoff file path in the message so target can /recap
- Do NOT enter plan mode (unlike /forward) — handover is immediate
- Do NOT ask for confirmation — user already decided to hand over

ARGUMENTS: $ARGUMENTS
