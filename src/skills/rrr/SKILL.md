---
name: rrr
description: Create session retrospective with AI diary and lessons learned. Use when user says "rrr", "retrospective", "wrap up session", "session summary", or at end of work session.
argument-hint: "[--quick | --detail | --deep]"
---

# /rrr

> "Reflect to grow, document to remember."

```
/rrr                      # Retro with session timeline (dig-powered)
/rrr --quick              # No dig — memory-only, faster but no timeline after compaction
/rrr --detail             # Full template + dig timeline
/rrr --deep               # 5 parallel subagents
/rrr --deep --teammate    # 3 coordinated team agents (requires AGENT_TEAMS)
```

**Default mode always mines session .jsonl for timeline** — survives compaction, shows real timestamps.
`--quick` skips dig for speed when you don't need the timeline.

**NEVER spawn subagents or use the Task tool. Only `--deep` and `--deep --teammate` may use subagents.**
**`/rrr`, `/rrr --quick`, `/rrr --detail` = main agent only. Zero subagents. Zero Task calls.**

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

## /rrr (Default — dig-powered)

### 1. Gather + Mine Session Timeline

Run git context AND dig in one step:

```bash
date "+%H:%M %Z (%A %d %B %Y)"
git log --oneline -10 && git diff --stat HEAD~5
```

Detect session + mine timeline from .jsonl:

```bash
ENCODED_PWD=$(echo "$ORACLE_ROOT" | sed 's|^/|-|; s|[/.]|-|g')
PROJECT_BASE=$(ls -d "$HOME/.claude/projects/${ENCODED_PWD}" 2>/dev/null | head -1)
export PROJECT_DIRS="$PROJECT_BASE"

# Strip -wt* suffix to find parent project dir
PARENT_ENCODED=$(echo "$ENCODED_PWD" | sed 's/-wt-[^/]*$//')
if [ "$PARENT_ENCODED" != "$ENCODED_PWD" ]; then
  PARENT_BASE=$(ls -d "$HOME/.claude/projects/${PARENT_ENCODED}" 2>/dev/null | head -1)
  [ -n "$PARENT_BASE" ] && export PROJECT_DIRS="$PROJECT_DIRS:$PARENT_BASE"
fi

# nullglob-safe worktree scan
for base in "$PROJECT_BASE" "$PARENT_BASE"; do
  [ -z "$base" ] && continue
  for wt in "$base"-wt-*(N); do
    [ -d "$wt" ] && export PROJECT_DIRS="$PROJECT_DIRS:$wt"
  done
done

python3 ~/.claude/skills/dig/scripts/dig.py 0 --deep
```

Extract session ID + mine REAL message timestamps from the .jsonl:
```bash
LATEST_JSONL=$(ls -t "$PROJECT_BASE"/*.jsonl 2>/dev/null | head -1)
if [ -n "$LATEST_JSONL" ]; then
  SESSION_ID=$(basename "$LATEST_JSONL" .jsonl)
  echo "SESSION: ${SESSION_ID:0:8}"
fi

# REQUIRED: extract real timestamps for the Timeline section.
# Pull every real user message + its timestamp from the session file.
# Dig gives session-level data only — for sub-session timestamps we read the jsonl directly.
python3 - <<'PYEOF'
import json, os
from datetime import datetime, timezone, timedelta
tz = timezone(timedelta(hours=7))
jsonl = os.environ.get('LATEST_JSONL', '')
if not jsonl or not os.path.exists(jsonl): exit(0)
with open(jsonl) as f:
    for line in f:
        try:
            m = json.loads(line)
            if m.get('type') != 'user' or 'message' not in m: continue
            content = m['message'].get('content', '')
            if isinstance(content, list):
                for c in content:
                    if isinstance(c, dict) and c.get('type') == 'text':
                        content = c.get('text', ''); break
            if not isinstance(content, str): continue
            ts = m.get('timestamp', '')
            # Skip tool-result / system messages
            if not ts or '<command-name>' in content[:200] or content.startswith('<bash-'): continue
            dt = datetime.fromisoformat(ts.replace('Z', '+00:00')).astimezone(tz)
            snippet = content[:100].replace(chr(10), ' ')
            print(f"{dt.strftime('%Y-%m-%d %H:%M')} | {snippet}")
        except: pass
PYEOF
```

**RULES for the Timeline section**:

1. **REAL timestamps only** — pulled from this jsonl extraction, never "approx" or memory-guesses. If extraction is empty (no session file), say so explicitly in the timeline rather than inventing times.

2. **Date once in a header, time-only in rows** — when all entries are same-day, format like this:

   ```markdown
   ## Timeline

   **Date**: 2026-05-14 (GMT+7) · all times same-day

   | Time | What |
   |---|---|
   | 20:14 | User: "..." |
   | 20:21 | PR #379 merged |
   | 21:13 | User: "..." |
   ```

   Do NOT repeat `2026-05-14 20:14` on every row. The date belongs in the header.

3. **Multi-day session** — if entries span more than one day, group by day with a `### YYYY-MM-DD` subheader for each day, then `HH:MM` rows under it.

Include in retrospective header:
```
📡 Session: 74c32f34 | repo-name | Xh XXm
```
If dig or session detection fails, skip silently and continue with git-only context.

### 2. Write Retrospective with Timeline

**Path**: `$PSI/memory/retrospectives/YYYY-MM/DD/HH.MM_slug.md`

```bash
mkdir -p "$PSI/memory/retrospectives/$(date +%Y-%m/%d)"
```

Write immediately, no prompts. Build the Timeline section from the .jsonl extraction above — every row must have a real `YYYY-MM-DD HH:MM` timestamp. Never use "approx", "around", or memory-guessed times. Include:
- Session Summary
- Timeline (real timestamps from .jsonl mining — `YYYY-MM-DD HH:MM | what`)
- Files Modified
- AI Diary (150+ words, first-person; must contain one line labeled `[→ AGENT DECISION]` naming a choice YOU made wrong — overconfidence, repeated wrong proposal, misread requirement; tool failures and env issues belong in friction, not here)
- Honest Feedback (100+ words, 3 friction points; **session-specific only** — what dragged in THIS session; if something generalizes beyond this session, it belongs in Lessons, not here)
- Lessons Learned (**generalizable only** — state each as a rule you'd tell another Oracle on a different project; if it only applies to this session's specific context, it's friction, not a lesson)
- Next Steps

### 3. Write Lesson Learned

**Path**: `$PSI/memory/learnings/YYYY-MM-DD_slug.md`

### 3.5. Append Session-Metrics Row (REQUIRED)

**Path**: `$PSI/memory/learnings/session-metrics.md`

If the file doesn't exist, create with this header:

```markdown
# Oracle Session Metrics

Rule (parent CLAUDE.md §"Self-Evaluation Loop"): same friction 3 sessions → fix root cause, not another workaround.

| when | session | done | stuck | win | friction | error |
|---|---|---|---|---|---|---|
```

Then append ONE row:

| Column | Content |
|---|---|
| `when` | `YYYY-MM-DD HH:MM` in GMT+7 |
| `session` | first 8 chars of `SESSION_ID` (from Step 1.5). If detection failed, write `unknown` |
| `done` | tasks/items completed this session (comma-separated, terse) |
| `stuck` | items blocked, deferred, or dropped — or `n/a` |
| `win` | biggest unlock or ship this session (one line) |
| `friction` | operational drag: env issue, tool failure, process slowdown — session-specific (one line, or `n/a`) |
| `error` | agent decision error: wrong call YOU made — overconfidence, premature action, misread scope (one line, or `n/a`) |

**Rule**: never skip. Trivial session? Still append with `trivial` in win/friction. Gaps break the pattern-detection value of the file.

### 4. Oracle Sync (two-layer pattern)

1. Write to `$PSI/memory/learnings/YYYY-MM-DD_<slug>.md` with frontmatter:
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

2. The Oracle's auto-memory layer picks up new files in `$PSI/memory/learnings/` automatically — no separate API call needed.

### 4.5. Pattern Check (last 7 rows)

Read the last 7 rows (or all rows if fewer) of `$PSI/memory/learnings/session-metrics.md`.

Count keyword themes in the `friction` column (operational — escalation: file issue) and the `error` column (decision — escalation: raise in standup) independently. If any theme reaches **≥3 times** in either column, append the recurring-pattern section, naming which column triggered and the appropriate escalation.

```markdown
## 🔁 Recurring Pattern Detected

"<theme>" appeared in <N> of last 7 sessions (<session IDs>). Per parent CLAUDE.md §"Self-Evaluation Loop" — consider root-cause fix instead of another workaround.

Suggested: open issue `root-cause: <theme>` or raise with Boss during next standup.
```

If no theme reaches ≥3 → skip this section silently.

**Rule**: surface only. Do NOT auto-open issues or take action beyond flagging. Principle 3 (External Brain, Not Command) — Boss decides.

### 5. Save

Retro files are written to vault (wherever `ψ` symlink resolves).

**Do NOT `git add ψ/`** — it may be a symlink to the vault. Vault files are shared state, not committed to repos.

### 6. Confirm (announce-mode — absolute paths required)

# announce-mode → absolute path (no ψ/, no ~/, no $VAR, no ...).
# Use:  echo "marker: $RESOLVED_PATH"  — bash substitutes. See CONVENTIONS.md.

```bash
RETRO_FILE="$PSI/memory/retrospectives/$(date +%Y-%m/%d)/$(date +%H.%M)_${SLUG}.md"
LESSON_FILE="$PSI/memory/learnings/$(date +%Y-%m-%d)_${SLUG}.md"
METRICS_FILE="$PSI/memory/learnings/session-metrics.md"
echo "📝 Retrospective:  $RETRO_FILE"
echo "💡 Lesson learned: $LESSON_FILE"
echo "📊 Metrics row:    $METRICS_FILE"
```

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

## /rrr --quick

**Fast retro without dig — uses conversation memory only.** Use when you want speed over timeline accuracy, or when dig.py is unavailable.

### 1. Gather

```bash
date "+%H:%M %Z (%A %d %B %Y)"
git log --oneline -10 && git diff --stat HEAD~5
```

### 1.5. Detect Session

```bash
ENCODED_PWD=$(echo "$ORACLE_ROOT" | sed 's|^/|-|; s|[/.]|-|g')
PROJECT_DIR="$HOME/.claude/projects/${ENCODED_PWD}"
LATEST_JSONL=$(ls -t "$PROJECT_DIR"/*.jsonl 2>/dev/null | head -1)
if [ -n "$LATEST_JSONL" ]; then
  SESSION_ID=$(basename "$LATEST_JSONL" .jsonl)
  echo "SESSION: ${SESSION_ID:0:8}"
fi
```

### 2. Write Retrospective

Same template as default but timeline is reconstructed from conversation memory (may be incomplete after compaction).

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

### Verification Checklist + Required Audit Block

Before saving, run each check and **append this block verbatim (filled in) as the final section of the retro file**:

```markdown
## 🔍 Self-Audit
- shipped: <N items — list commit hash or file path for each, or "none shipped">
- blocked: <N items — list specific error/reason for each, or "none blocked">
- uncomfortable truth: [→ AGENT DECISION] <one line — name the choice you made wrong>
- friction: <N points> (operational: <list> | strategic: <list>)
- next steps: <N — confirm each is actionable without a follow-up question>
- rationalizations caught: <N — name them, or "none">
```

Do not fill with "✓" or "done". Write the actual values. The eval scans this block.

**If you catch yourself rationalizing: name it.** Write "I noticed I was rationalizing about X because Y" in the AI Diary. Catching the pattern is more valuable than hiding it.

---

## Rules

- **NO SUBAGENTS**: Never use Task tool or spawn subagents (only `--deep` may)
- AI Diary: 150+ words, vulnerability, first-person
- Honest Feedback: 100+ words, 3 friction points
- Oracle Sync: REQUIRED after every lesson learned
- Time Zone: GMT+7 (Bangkok)
- **Anti-rationalization**: Scan draft against excuse table before saving
