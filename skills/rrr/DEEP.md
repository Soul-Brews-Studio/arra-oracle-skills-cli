# RRR --deep Mode (5 Parallel Agents)

**Use for complex sessions** with lots of changes, multiple features, or when you want comprehensive analysis.

## Step 0: Oracle Root + Timestamp + Paths

```bash
date "+%H:%M %Z (%A %d %B %Y)"

# Detect oracle root — don't assume pwd
ORACLE_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -n "$ORACLE_ROOT" ] && [ -f "$ORACLE_ROOT/CLAUDE.md" ] && { [ -d "$ORACLE_ROOT/ψ" ] || [ -L "$ORACLE_ROOT/ψ" ]; }; then
  PSI="$ORACLE_ROOT/ψ"
else
  echo "⚠️ Not in oracle repo. Using pwd."
  ORACLE_ROOT="$(pwd)"
  PSI="$ORACLE_ROOT/ψ"
fi

ROOT="$ORACLE_ROOT"
TODAY=$(date +%Y-%m-%d)
TIME=$(date +%H%M)
DATE_PATH=$(date "+%Y-%m/%d")
mkdir -p "$PSI/memory/retrospectives/$DATE_PATH"
```

## Step 1: Launch 5 Parallel Agents

Each agent prompt must include:
```
You are analyzing a coding session for retrospective.
ROOT: [ROOT]
Return your findings as text. The main agent will compile the retrospective.
```

### Agent 1: Git Deep Dive
```
Analyze git history thoroughly:
- git log --oneline -20
- git diff --stat HEAD~10
- git show --stat (last 5 commits)
- Branch activity
- Commit message patterns

Return: Timeline of changes, key commits, code churn analysis
```

### Agent 2: File Changes Analysis
```
Analyze what files changed and why:
- git diff --name-only HEAD~10
- Read key modified files
- Identify patterns in changes
- Architecture impact

Return: Files modified summary, architectural changes, risk areas
```

### Agent 3: Session Timeline Reconstruction
```
Reconstruct the session timeline:
- Read ψ/memory/logs/ for today
- Check git commit timestamps
- Identify session phases (start, middle, end)
- Map activities to times

Return: Detailed timeline with timestamps and activities
```

### Agent 4: Pattern & Learning Extraction
```
Extract patterns and learnings:
- What problems were solved?
- What techniques were used?
- What could be reused?
- What mistakes were made?

Return: Key patterns, learnings, mistakes, reusable solutions
```

### Agent 5: Oracle Memory Search
```
Search Oracle for related context:
- oracle_search("[session focus]")
- Check ψ/memory/learnings/ for similar topics
- Find past retrospectives on similar work
- What did we learn before?

Return: Related learnings, past insights, patterns to apply
```

## Step 2: Compile Results

After all agents return, main agent compiles into full retrospective:

**Location**: `$PSI/memory/retrospectives/$DATE_PATH/${TIME}_[slug].md`

Include all standard sections PLUS:
- Deep git analysis (from Agent 1)
- Architecture impact (from Agent 2)
- Detailed timeline (from Agent 3)
- Extracted patterns (from Agent 4)
- Oracle connections (from Agent 5)

## Step 3: Write Lesson Learned

**Location**: `$PSI/memory/learnings/${TODAY}_[slug].md`

With --deep, lesson learned should be more comprehensive:
- Multiple patterns identified
- Connections to past learnings
- Confidence levels for each insight

## Step 4: Sync to Oracle

```
oracle_learn({
  pattern: [Full lesson content],
  concepts: [tags from all 5 agents],
  source: "rrr --deep: [repo]"
})
```

## Anti-Rationalization Guard (Deep Mode)

Before compiling the final retro from agent reports, the lead agent must scan for:

### Cross-Agent Verification

| Check | How |
|-------|-----|
| Git agent claims vs file agent claims | Do commit counts match file change counts? |
| Timeline gaps | Are there periods with no activity? What happened? |
| Pattern agent excuses | Did the pattern agent flag uncomfortable truths or only victories? |
| Oracle connections | Are past learnings being applied or ignored? |

### Deep-Mode Red Flags

- Agent 1 reports 20 commits but Agent 2 only found 5 changed files → investigate
- Agent 4 found zero mistakes → suspiciously clean, push for honesty
- Agent 5 found no connections to past learnings → are we repeating patterns?
- Any agent returned < 100 words → they may have hit a wall and given up
- Multiple agents reached the same conclusion independently → high confidence
- Agents contradict each other → the truth is probably between them, investigate

### Lead's Responsibility

The lead MUST include at least one finding from the anti-rationalization scan in the AI Diary. If all agents agree and everything looks clean, say so — but name the check you ran. "I verified cross-agent consistency and found no discrepancies" is better than skipping the check.

---

## Step 5: Save

**Do NOT `git add ψ/`** — vault files are shared state, not committed to repos.
