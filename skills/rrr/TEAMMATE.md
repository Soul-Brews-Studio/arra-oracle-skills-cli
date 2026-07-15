# RRR --deep --teammate Mode (3 Coordinated Team Agents)

**Team-based deep retro with coordinated agents.** Teammates reconstruct from artifacts (git log, file mtimes, ψ/ files) — they don't rely on conversation memory. More accurate than `--deep` for long sessions where context was compacted.

**Requires**: `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in settings.json env.
**Fallback**: If agent teams unavailable, fall back to `--deep` (5 subagents) with a warning.

## Why teammates?

The main thread loses context during long sessions (compaction, attention drift, context window limits). Teammates reconstruct from **artifacts** (git log, file mtimes, ψ/ files) — they don't rely on conversation memory. The result: accurate timelines, complete pattern extraction, and AI diaries that reflect what actually happened.

## Step 0: Oracle Root + Gather context

```bash
date "+%H:%M %Z (%A %d %B %Y)"

# Detect oracle root — don't assume pwd
ORACLE_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -n "$ORACLE_ROOT" ] && [ -f "$ORACLE_ROOT/CLAUDE.md" ] && { [ -d "$ORACLE_ROOT/ψ" ] || [ -L "$ORACLE_ROOT/ψ" ]; }; then
  PSI="$ORACLE_ROOT/ψ"
else
  ORACLE_ROOT="$(pwd)"
  PSI="$ORACLE_ROOT/ψ"
fi

ROOT="$ORACLE_ROOT"
git log --oneline -15
git diff --stat HEAD~5
git log --format="%h %ai %s" -10
```

## Step 1: Create team + tasks

```
TeamCreate("rrr-deep")

TaskCreate("Git + files + timeline analysis")
TaskCreate("Pattern and learning extraction")
TaskCreate("Oracle memory search — connections to past")
```

## Step 2: Spawn 3 teammates (all in one message, parallel)

**Agent: analyst** (model: sonnet)
```
You are the Analyst on team rrr-deep. Do Task #1.
REPO: [ROOT]
Run: git log --format='%h %ai %s' -15
     git diff --stat HEAD~5
     git show --stat HEAD HEAD~1 HEAD~2
     ls -lt [key directories]
Build a timeline table: Time | Phase | Activity | Evidence
When done: TaskUpdate(taskId='1', status='completed')
SendMessage(to='team-lead@rrr-deep', summary='Analysis complete', message='your findings')
Under 600 words.
```

**Agent: patterns** (model: sonnet)
```
You are the Pattern Extractor on team rrr-deep. Do Task #2.
REPO: [ROOT]
Read today's files in ψ/memory/learnings/ and ψ/memory/retrospectives/.
Extract: reusable patterns, mistakes, anti-patterns, transferable techniques.
When done: TaskUpdate(taskId='2', status='completed')
SendMessage(to='team-lead@rrr-deep', summary='Patterns extracted', message='your findings')
Under 500 words.
```

**Agent: oracle** (model: sonnet)
```
You are the Oracle Memory Searcher on team rrr-deep. Do Task #3.
REPO: [ROOT]
Search ψ/memory/ — all learnings, retros, traces.
Find: recurring patterns, connections to past, growth trajectory.
When done: TaskUpdate(taskId='3', status='completed')
SendMessage(to='team-lead@rrr-deep', summary='Oracle connections found', message='your findings')
Under 500 words.
```

## Step 3: Wait for 3 reports

Messages arrive automatically via SendMessage. Expect ~60-90 seconds.
Idle notifications between reports are normal — ignore them.

## Step 4: Lead compiles final retro

Write to: `ψ/memory/retrospectives/DATE_PATH/TIME_rrr-deep-teammate.md`

**MANDATORY sections** (all required):

| Section | Source |
|---------|--------|
| Session Summary | Synthesized from all 3 agents |
| Timeline | From analyst (markdown table with exact timestamps) |
| Files Modified | From analyst (categorized by type) |
| AI Diary (150+ words) | Lead synthesizes all findings + lived experience |
| Honest Feedback (100+ words) | Lead + patterns agent friction points |
| Lessons Learned | From patterns + oracle |
| Next Steps | From oracle's unresolved threads |
| Team Meta-Analysis | What worked about the team approach |

## Step 5: Shutdown + cleanup

```
SendMessage(to: "analyst",  message: { type: "shutdown_request" })
SendMessage(to: "patterns", message: { type: "shutdown_request" })
SendMessage(to: "oracle",   message: { type: "shutdown_request" })
TeamDelete()
```

## Step 6: Save

**Do NOT `git add ψ/`** — vault files are shared state, not committed to repos.

## Anti-Rationalization Guard (Teammate Mode)

Before writing the final retro, the lead must cross-check teammate reports:

### Teammate Cross-Verification

| Agent | Check Against | Look For |
|-------|--------------|----------|
| Analyst | git log directly | Did they miss commits? Inflate activity? |
| Patterns | Analyst's timeline | Do patterns match what actually happened? |
| Oracle | Previous retros | Are we repeating the same "lessons learned"? |

### Red Flags in Teammate Reports

- **Analyst timeline has no friction**: Every session has friction. If absent, push back.
- **Patterns agent only found positives**: Request negative patterns too.
- **Oracle found no connections**: Either memory is empty or search was shallow.
- **Any agent completed in < 30 seconds**: Likely superficial. Consider resending with more specific instructions.
- **Reports contradict each other**: Flag in AI Diary, don't silently pick one.

### Lead's Anti-Rationalization Duty

Include in the AI Diary:
1. At least ONE uncomfortable truth from the session
2. At least ONE thing that went wrong (even if small)
3. A candid assessment of whether the team approach added value or was overhead

If you catch yourself writing "everything went well" — stop and dig deeper.

---

## Pitfalls & Fixes

1. **Wrong lead ID**: Always use `team-lead@rrr-deep` (fully qualified)
2. **Teammates can't find repo**: Include `REPO: /full/path` in every prompt
3. **SendMessage needs summary**: Always include `summary` field (5-10 words)
4. **Only lead writes files**: Agents report via SendMessage ONLY
5. **Agent crash**: Check TaskList → send status check → spawn replacement or lead does it manually
6. **ψ/ write conflicts**: Multiple agents writing files simultaneously → agents report via SendMessage ONLY, lead writes
7. **Idle notification flood**: Normal. Real content comes in SendMessage, not idle notifications
