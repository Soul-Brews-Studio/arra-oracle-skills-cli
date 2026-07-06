---
name: worktree
description: 'Work in an isolated git worktree — safe parallel editing, experimental branches, throwaway spikes. Use when user says "worktree", "isolate", "safe branch", "spike", "experiment", or wants to work without touching main.'
argument-hint: "[<name> | list | exit | clean]"
---

# /worktree — Isolated Work

> Branch without fear. Experiment without risk. Nothing touches main until you say so.

Create an isolated git worktree for safe, parallel work. Changes stay in the worktree until you explicitly merge. If it goes wrong, remove it — main is untouched.

## Usage

```
/worktree                    # Create worktree (auto-named)
/worktree <name>             # Create named worktree
/worktree list               # Show active worktrees
/worktree exit               # Leave worktree, keep changes
/worktree exit --remove      # Leave worktree, delete it
/worktree clean              # Find and remove orphaned worktrees
```

---

## Create Worktree (`/worktree` or `/worktree <name>`)

Use the `EnterWorktree` tool:

```
EnterWorktree({ name: "<name>" })
```

If no name given, one is auto-generated.

**What happens:**
1. Creates `.claude/worktrees/<name>/` with a new git branch
2. Switches session working directory to the worktree
3. Branch name: `worktree-<name>`
4. Based on current HEAD

Show the user:

```
🌿 Worktree created

  Name:     <name>
  Branch:   worktree-<name>
  Path:     .claude/worktrees/<name>/
  Based on: <current-branch> @ <short-hash>

  You're now working in the worktree.
  Main is untouched — edit freely.

  💡 /worktree exit         — leave (keep changes)
  💡 /worktree exit --remove — leave (delete everything)
```

---

## Exit Worktree (`/worktree exit`)

### Keep changes (default)

```
ExitWorktree({ action: "keep" })
```

```
🌿 Left worktree — changes preserved

  Branch: worktree-<name> (still exists)
  Path:   .claude/worktrees/<name>/ (still on disk)
  
  💡 git merge worktree-<name>  — merge when ready
  💡 /worktree clean            — remove later
```

### Remove (`/worktree exit --remove`)

```
ExitWorktree({ action: "remove" })
```

If uncommitted changes exist, tool will refuse. Confirm with user, then:

```
ExitWorktree({ action: "remove", discard_changes: true })
```

```
🌿 Worktree removed

  Branch: worktree-<name> (deleted)
  Path:   .claude/worktrees/<name>/ (deleted)
  
  Back on: <original-branch>
```

---

## List Worktrees (`/worktree list`)

```bash
echo "🌿 Active Worktrees"
echo ""
git worktree list 2>/dev/null | while read path hash branch; do
  if echo "$path" | grep -q '.claude/worktrees'; then
    name=$(basename "$path")
    dirty=$(cd "$path" 2>/dev/null && git status --porcelain | wc -l)
    echo "  $name  $branch  (dirty: $dirty files)"
  fi
done

# Also check for orphans (worktree dir exists but git doesn't know about it)
for dir in .claude/worktrees/*/; do
  [ -d "$dir" ] || continue
  name=$(basename "$dir")
  if ! git worktree list 2>/dev/null | grep -q "$name"; then
    echo "  ⚠️ $name  (orphaned — git doesn't know about it)"
  fi
done
```

Show:

```
🌿 Active Worktrees

  Name             Branch                      Dirty
  ──────────────── ─────────────────────────── ─────
  fix-auth         worktree-fix-auth           2 files
  spike-new-ui     worktree-spike-new-ui       0 files
  agent-a377b5bd   worktree-agent-a377b5bd     0 files (from team-agents)

  💡 /worktree exit         — leave current
  💡 /worktree clean        — remove orphans
```

---

## Clean Worktrees (`/worktree clean`)

Find and remove orphaned worktrees (from crashed agents, old sessions, etc.):

```bash
echo "🧹 Worktree Cleanup"
echo ""

CLEANED=0
for dir in .claude/worktrees/*/; do
  [ -d "$dir" ] || continue
  name=$(basename "$dir")
  dirty=$(cd "$dir" 2>/dev/null && git status --porcelain | wc -l)
  
  if [ "$dirty" -eq 0 ]; then
    echo "  ✅ $name — clean, removing"
    git worktree remove "$dir" --force 2>/dev/null
    CLEANED=$((CLEANED + 1))
  else
    echo "  ⚠️ $name — $dirty dirty files, keeping"
  fi
done

[ "$CLEANED" -eq 0 ] && echo "  No orphans found"
echo ""
echo "  Cleaned: $CLEANED worktrees"
```

**WAIT for user confirmation before removing dirty worktrees.**

---

## When to Use

| Situation | Use |
|-----------|-----|
| Experimental feature | `/worktree spike-feature` — try it, remove if bad |
| Bug fix while mid-feature | `/worktree hotfix` — fix on clean branch, merge, return |
| Team agents need isolation | `/team-agents --isolated` (uses worktrees internally) |
| Code review in parallel | `/worktree review-pr-123` — read code without switching branches |
| Learning/studying | `/worktree study` — make notes, edit, throwaway |

## How It Connects

```
/worktree          — human creates isolated workspace
/team-agents       — agents create worktrees via isolation:"worktree"
team-ops doctor    — detects orphaned worktrees from crashed agents
/worktree clean    — removes orphans (same as doctor --fix for worktrees)
```

---

## Rules

1. **Main is untouched** — worktree is a separate directory + branch
2. **Confirm before delete** — never remove dirty worktrees without asking
3. **Clean orphans** — `/worktree clean` only removes clean worktrees
4. **Name is identity** — use descriptive names (not auto-generated) when possible
5. **Nothing is Deleted** — worktree branches stay until explicitly removed

---

ARGUMENTS: $ARGUMENTS
