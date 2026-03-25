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
2. **Detect session**: Current session ID for traceability
3. **Session summary**: What we did (from memory)
4. **Pending items**: What's left
5. **Next steps**: Specific actions

### Session Detection

```bash
ENCODED_PWD=$(pwd | sed 's|^/|-|; s|/|-|g')
PROJECT_DIR="$HOME/.claude/projects/${ENCODED_PWD}"
LATEST_JSONL=$(ls -t "$PROJECT_DIR"/*.jsonl 2>/dev/null | head -1)
if [ -n "$LATEST_JSONL" ]; then
  SESSION_ID=$(basename "$LATEST_JSONL" .jsonl)
  echo "SESSION: ${SESSION_ID:0:8}"
fi
```

Include in handoff header if detected:
```markdown
📡 Session: 74c32f34 | repo-name | Xh XXm
```
Skip silently if detection fails.

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

## Then: Create Issues from Pending Items

After writing the handoff file, extract actionable items and offer to create GitHub issues.

### Step 1: Extract Items

From the handoff you just wrote, collect all `- [ ]` items from **Pending** and **Next Session** sections.

### Step 2: Filter Actionable Items

Skip items that are NOT actionable:
- Items containing "monitor", "watch", "track", "deferred", "maybe", "consider"
- Items that are vague (less than 4 words after the checkbox)

### Step 3: Check for Duplicates

```bash
# For each item, check if an issue already exists with a similar title
gh issue list --state open --search "ITEM_TITLE" --json title --jq '.[].title' 2>/dev/null
```

Skip items that already have a matching open issue (case-insensitive title match).

### Step 4: Show and Confirm

Display the list of new issues to create:

```
📋 Create GitHub issues from pending items?

  1. Fix awaken git push auth
  2. /rrr --deep time-based

Create these 2 issues? [y/N]
```

**NEVER auto-create issues without user approval.**

If user declines, skip issue creation and continue to plan mode.

### Step 5: Create Issues

If user approves:

```bash
# Detect repo for issue creation
REMOTE=$(git remote get-url origin 2>/dev/null)
# Extract owner/repo from remote URL
REPO=$(echo "$REMOTE" | sed -E 's|.*[:/]([^/]+/[^/]+?)(\.git)?$|\1|')

# For each actionable item:
gh issue create --repo "$REPO" --title "ITEM_TITLE" --body "From /forward handoff on YYYY-MM-DD"
```

Show results:
```
Created #115: Fix awaken git push auth
Created #116: /rrr --deep time-based
```

### Step 6: Write to Outbox

Regardless of whether issues were created, write items to the outbox:

```bash
PSI=$(readlink -f ψ 2>/dev/null || echo "ψ")
OUTBOX_DIR="$PSI/outbox"
mkdir -p "$OUTBOX_DIR"
```

Write to: `$PSI/outbox/YYYY-MM-DD_pending.md`

```markdown
# Pending Items — YYYY-MM-DD

## From: [repo-name] /forward

- [ ] Item 1 (issue #115)
- [ ] Item 2 (issue #116)
- [ ] Item 3 (no issue — skipped: vague)
```

### Silent Failures

- If `gh` is not available: write to outbox only, skip issue creation silently
- If repo has no GitHub remote: skip issue creation silently, write to outbox only
- If `gh auth status` fails: skip issue creation silently, write to outbox only

---

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

## Wizard v2 Context in Handoff

If CLAUDE.md contains demographics from `/awaken` wizard v2, include in handoff:

```markdown
## Context
**Oracle**: [name] ([pronouns]) | **Human**: [name] ([pronouns])
**Mode**: [Fast/Full Soul Sync] | **Memory**: [auto/manual]
**Team**: [solo/team context]
```

This helps the next session orient faster. If demographics not present, skip.

---

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
