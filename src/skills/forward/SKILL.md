---
name: forward
description: Create handoff + enter plan mode for next session. Use when user says "forward", "handoff", "wrap up", or before ending session.
argument-hint: "[asap | --only]"
---

# /forward - Handoff to Next Session

Create context for next session, then enter plan mode to define next steps.

## Usage

```
/forward              # Create handoff, show plan, wait for approval
/forward asap         # Create handoff + commit immediately (no approval needed)
/forward --only       # Create handoff only, skip plan mode
```

## Steps

1. **Git status**: Check uncommitted work
2. **Session summary**: What we did (from memory)
3. **Pending items**: What's left
4. **Next steps**: Specific actions

## Output

Resolve vault path first:
```bash
PSI=$(readlink -f ψ 2>/dev/null || echo "ψ")
```

Write to: `$PSI/inbox/handoff/YYYY-MM-DD_HH-MM_slug.md`

**IMPORTANT**: Always use the resolved `$PSI` path, never the `ψ/` symlink directly.
This ensures handoffs go to the project's vault (wherever ψ points).
Do NOT `git add` vault files — they are shared state, not committed to repos.

```markdown
# Handoff: [Session Focus]

**Date**: YYYY-MM-DD HH:MM
**Context**: [%]

## What We Did
- [Accomplishment 1]
- [Accomplishment 2]

## Pending
- [ ] Item 1
- [ ] Item 2

## Next Session
- [ ] Specific action 1
- [ ] Specific action 2

## Key Files
- [Important file 1]
- [Important file 2]
```

## Then: MUST Show Plan Approval Box

**CRITICAL — DO NOT SKIP**: The whole point of /forward is the plan approval UI.
You MUST do ALL 3 steps in order. If you skip any step, the user cannot approve and clear the session.

1. `EnterPlanMode` — enters plan mode
2. Write plan file — session summary + next steps
3. `ExitPlanMode` — **THIS shows the approval box** where user can approve/reject/clear

If you only do EnterPlanMode without ExitPlanMode, the user sees nothing.
If you skip EnterPlanMode entirely, the user sees nothing.
ALL 3 STEPS ARE REQUIRED.

**Do NOT commit the handoff file** — it lives in the vault, not the repo.
After writing the handoff, gather cleanup context:

```bash
# Check for things next session might need to clean up
git status --short
git branch --list | grep -v '^\* main$' | grep -v '^  main$'
gh pr list --state open --json number,title,headRefName --jq '.[] | "#\(.number) \(.title) (\(.headRefName))"' 2>/dev/null
gh issue list --state open --limit 5 --json number,title --jq '.[] | "#\(.number) \(.title)"' 2>/dev/null
```

Then:

1. **Call `EnterPlanMode`** tool
3. In plan mode, write a plan file with:
   - What we accomplished this session
   - Pending items carried forward
   - Cleanup needed (stale branches, open PRs, uncommitted files)
   - Next session goals and scope
   - Reference to handoff file path
   - **Always end plan with a choice table:**

```markdown
## Next Session: Pick Your Path

| Option | Command | What It Does |
|--------|---------|--------------|
| **Continue** | `/recap` | Pick up where we left off |
| **Clean up first** | See cleanup list below, then `/recap` | Merge PRs, delete branches, close issues, then continue |
| **Fresh start** | `/recap --quick` | Minimal context, start something new |

### Cleanup Checklist (if any)
- [ ] [Open PR to merge]
- [ ] [Stale branch to delete]
- [ ] [Issue to close]
- [ ] [Uncommitted work to commit or stash]
```

4. **Call `ExitPlanMode`** — user sees the built-in plan approval UI

The user gets the standard plan approval screen with options to approve, modify, or reject. This is the proper way to show plans.

If user calls `/forward` again — just show the existing plan, do not re-create the handoff file.

## ASAP Mode

If user says `/forward asap` or `/forward now`:
- Write handoff file
- **Immediately commit and push** — no approval needed
- Skip plan mode
- User wants to close fast

## Skip Plan Mode

If user says `/forward --only`:
- Skip plan mode after commit
- Just tell user: "💡 Run /plan to plan next session"

ARGUMENTS: $ARGUMENTS
