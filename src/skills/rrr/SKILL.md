---
name: rrr
description: Create session retrospective with AI diary and lessons learned. Use when user says "rrr", "retrospective", "wrap up session", "session summary", or at end of work session.
argument-hint: "[--detail | --dig | --deep]"
---

# /rrr

> "Reflect to grow, document to remember."

```
/rrr                      # Quick retro, main agent
/rrr --detail             # Full template, main agent
/rrr --dig                # Reconstruct past timeline from session .jsonl
/rrr --deep               # 5 parallel subagents
/rrr --deep --teammate    # 3 coordinated team agents (requires AGENT_TEAMS)
```

**NEVER spawn subagents or use the Task tool. Only `--deep` and `--deep --teammate` may use subagents.**
**`/rrr`, `/rrr --detail`, and `/rrr --dig` = main agent only. Zero subagents. Zero Task calls.**

---

## Oracle Root Detection (REQUIRED — run before any ψ/ write)

**Every skill that writes to ψ/ MUST detect the oracle root first.** Do not assume `pwd` is the oracle repo.

```bash
# Step 1: Find git root
ORACLE_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)

# Step 2: Cross-check — oracle repo has CLAUDE.md + ψ/
if [ -n "$ORACLE_ROOT" ] && [ -f "$ORACLE_ROOT/CLAUDE.md" ] && { [ -d "$ORACLE_ROOT/ψ" ] || [ -L "$ORACLE_ROOT/ψ" ]; }; then
  PSI="$ORACLE_ROOT/ψ"
elif [ -f "$(pwd)/CLAUDE.md" ] && { [ -d "$(pwd)/ψ" ] || [ -L "$(pwd)/ψ" ]; }; then
  # Fallback: pwd has oracle markers
  ORACLE_ROOT="$(pwd)"
  PSI="$ORACLE_ROOT/ψ"
else
  # Last resort: warn and use pwd
  echo "⚠️ Not in oracle repo (no CLAUDE.md + ψ/ at git root). Writing to pwd."
  ORACLE_ROOT="$(pwd)"
  PSI="$ORACLE_ROOT/ψ"
fi
```

**Why**: prevents retros writing to `~/ψ/` (home) or incubated repo's `ψ/` instead of the oracle's own vault.

All paths below use `$PSI/` instead of bare `ψ/`.

---

## /rrr (Default)

### 1. Gather

```bash
date "+%H:%M %Z (%A %d %B %Y)"
git log --oneline -10 && git diff --stat HEAD~5
```

### 1.5. Detect Session (optional)

```bash
ENCODED_PWD=$(echo "$ORACLE_ROOT" | sed 's|^/|-|; s|[/.]|-|g')
PROJECT_DIR="$HOME/.claude/projects/${ENCODED_PWD}"
LATEST_JSONL=$(ls -t "$PROJECT_DIR"/*.jsonl 2>/dev/null | head -1)
if [ -n "$LATEST_JSONL" ]; then
  SESSION_ID=$(basename "$LATEST_JSONL" .jsonl)
  echo "SESSION: ${SESSION_ID:0:8}"
fi
```

If detected, include in retrospective header:
```
📡 Session: 74c32f34 | repo-name | Xh XXm
```
If detection fails, skip silently.

### 2. Write Retrospective

**Path**: `$PSI/memory/retrospectives/YYYY-MM/DD/HH.MM_slug.md`

```bash
mkdir -p "$PSI/memory/retrospectives/$(date +%Y-%m/%d)"
```

Write immediately, no prompts. Include:
- Session Summary
- Timeline
- Files Modified
- AI Diary (150+ words, first-person)
- Honest Feedback (100+ words, 3 friction points)
- Lessons Learned
- Next Steps

### 3. Write Lesson Learned

**Path**: `$PSI/memory/learnings/YYYY-MM-DD_slug.md`

### 4. Oracle Sync (two-layer pattern)

1. Write to `ψ/memory/learnings/YYYY-MM-DD_<slug>.md` with frontmatter:
   ```yaml
   ---
   pattern: <lesson learned in one line>
   date: <today>
   source: rrr: REPO
   concepts: [<tags>]
   ---

   # <lesson title>
   <body>
   ```

2. The Oracle's auto-memory layer picks up new files in `ψ/memory/learnings/` automatically — no separate API call needed.

### 5. Save

Retro files are written to vault (wherever `ψ` symlink resolves).

**Do NOT `git add ψ/`** — it may be a symlink to the vault. Vault files are shared state, not committed to repos.

---

## /rrr --detail

Same flow as default but use full template:

```markdown
# Session Retrospective

**Session Date**: YYYY-MM-DD
**Start/End**: HH:MM - HH:MM GMT+7
**Duration**: ~X min
**Focus**: [description]
**Type**: [Feature | Bug Fix | Research | Refactoring]

## Session Summary
## Timeline
## Files Modified
## Key Code Changes
## Architecture Decisions
## AI Diary (150+ words, vulnerable, first-person)
## What Went Well
## What Could Improve
## Blockers & Resolutions
## Honest Feedback (100+ words, 3 friction points)
## Lessons Learned
## Next Steps
## Metrics (commits, files, lines)
```

Then steps 3-5 same as default.

---

## /rrr --dig

**Retrospective powered by session goldminer. No subagents.**

### 1. Run dig to get session timeline

Discover project dirs using full-path encoding (same as Claude's `.claude/projects/` naming), including worktree dirs:

```bash
ENCODED_PWD=$(echo "$ORACLE_ROOT" | sed 's|^/|-|; s|[/.]|-|g')
PROJECT_BASE=$(ls -d "$HOME/.claude/projects/${ENCODED_PWD}" 2>/dev/null | head -1)
export PROJECT_DIRS="$PROJECT_BASE"
for wt in "${PROJECT_BASE}"-wt*; do [ -d "$wt" ] && export PROJECT_DIRS="$PROJECT_DIRS:$wt"; done
```

Then run dig.py to get session JSON:

```bash
python3 ~/.claude/skills/dig/scripts/dig.py 0
```

Also gather git context:

```bash
date "+%H:%M %Z (%A %d %B %Y)"
git log --oneline -10 && git diff --stat HEAD~5
```

### 2. Write Retrospective with Timeline

Use the session timeline data to write a full retrospective using the `--detail` template. Add the Past Session Timeline table after Session Summary, before Timeline.

### 3-5. Same as default steps 3-5

Write lesson learned, oracle sync.

**Do NOT `git add ψ/`** — vault files are shared state, not committed to repos.

---

## /rrr --deep

Read `DEEP.md` in this skill directory. Only mode that uses subagents (5 parallel agents).

---

## /rrr --deep --teammate

Read `TEAMMATE.md` in this skill directory. Coordinated team retro (3 agents + lead). Requires `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

---

## Wizard v2 Context

If the Oracle was born via `/awaken` wizard v2, CLAUDE.md may contain:
- **Memory consent**: If `auto`, `/rrr` runs are expected and welcomed. If `manual`, only run when explicitly asked.
- **Experience level**: Adjust diary depth (beginner = simpler language, senior = technical depth)
- **Team context**: If multi-Oracle team, note cross-Oracle learnings and handoff relevance

Check CLAUDE.md for these fields. If not present, use defaults (auto memory, standard depth).

---

## Anti-Rationalization Guard

> "You didn't come here to make the choice. You've already made it. You're here to try to understand why."

Before writing the final retrospective, scan your own draft for these **excuse patterns**:

### Common Rationalizations

| Excuse | Reality |
|--------|---------|
| "This was too complex to finish" | Was it complex, or did you skip the hard part? Show the specific blocker. |
| "I ran out of context" | Context is a resource. Did you spend it well, or spiral on side quests? |
| "The API/tool didn't work" | Show the error. Show what you tried. "Didn't work" is not a diagnosis. |
| "I already tested it manually" | Manual testing doesn't persist. Where's the proof? |
| "I'll fix it next session" | Is there a concrete plan, or is this a polite way to abandon it? |
| "It's mostly done" | Define "mostly." What percentage? What's left? Be specific. |
| "The user changed direction" | Did they change, or did you misunderstand? Check the original request. |
| "This is a known issue" | Known by whom? Is there an issue filed? A workaround documented? |

### Red Flags in Your Own Retro

Stop and re-examine if your retrospective contains:

- **Vague success claims**: "Made good progress" — on what? Show commits or it didn't happen.
- **Blame-shifting**: "The build was broken" — did you break it? Did you fix it?
- **Missing friction**: Zero "What Could Improve" items = you're not being honest.
- **Inflated metrics**: Counting config changes as "features shipped."
- **Scope creep excuses**: "I also refactored X" — was that in scope? Did you choose it over the actual task?
- **Missing evidence**: Claims without git hashes, file paths, or concrete output.

### Verification Checklist

Before saving the retrospective, verify:

```
[ ] Every "shipped" item has a commit hash or file path
[ ] Every "blocked" item has a specific error or reason
[ ] AI Diary contains at least ONE uncomfortable truth
[ ] Honest Feedback has 3+ friction points (not softball ones)
[ ] "Next Steps" are specific enough to start immediately
[ ] No excuse from the table above appears unexamined
```

**If you catch yourself rationalizing: name it.** Write "I noticed I was rationalizing about X because Y" in the AI Diary. Catching the pattern is more valuable than hiding it.

---

## Rules

- **NO SUBAGENTS**: Never use Task tool or spawn subagents (only `--deep` may)
- AI Diary: 150+ words, vulnerability, first-person
- Honest Feedback: 100+ words, 3 friction points
- Oracle Sync: REQUIRED after every lesson learned
- Time Zone: GMT+7 (Bangkok)
- **Anti-rationalization**: Scan draft against excuse table before saving
