---
name: recap
description: Session orientation and awareness — retro summaries, handoffs, git state, focus. Use when starting a session, after /jump, lost your place, switching context, or when user asks "now", "where are we", "what are we doing", "status", "recap". Do NOT trigger for "standup" or "morning check" (use /standup), or session mining "dig", "past sessions" (use /dig).
argument-hint: "[--now | --deep]"
trigger: /recap
---

# /recap — Session Orientation & Awareness

**Goal**: Orient yourself fast. Rich context by default. Mid-session awareness with `--now`.

## Usage

```
/recap           # Rich: retro summary, handoff, tracks, git
/recap --quick   # Minimal: git + focus only, no file reads
/recap --now     # Mid-session: timeline + jumps from AI memory
/recap --now deep # Mid-session: + handoff + tracks + connections
```

---

## DEFAULT MODE (Rich)

**Run the rich script, then add suggestions:**

```bash
bun ~/.claude/skills/recap/recap-rich.ts
```

Script reads retro summaries, handoff content, tracks, git state. Then LLM adds:
- **What's next?** (2-3 options based on context)

### Step 1.5: Detect INCUBATED_BY (#229)

The recap-rich.ts script auto-detects `.claude/INCUBATED_BY` breadcrumbs. If present, shows:

```
## ⚠️ INCUBATED REPO
oracle: mawui-oracle
date: 2026-04-13
source: https://github.com/...
```

This tells the oracle: "You are in a repo tracked by another oracle. Check the breadcrumb for context."

### Step 2: Git context

```bash
git status --short
git log --oneline -1
```

Check what's appropriate from git status:
- **Uncommitted changes?** → show them, suggest commit or stash
- **On a branch (not main)?** → `git log main..HEAD --oneline` to see branch work
- **Branch ahead of remote?** → suggest push or PR
- **Clean on main?** → just show last commit, move on

Only read what matters — don't dump 10 commits if status is clean.

### Step 3: Read latest ψ/ brain files

Sort all ψ/ files by modification time, read the most recent:

```bash
find ψ/ -name '*.md' -not -name 'CLAUDE.md' -not -name 'README.md' -not -name '.gitkeep' 2>/dev/null | xargs ls -t 2>/dev/null | head -5
```

Read those top 5 files. This recovers the same context `/compact` restores — handoffs, retros, learnings, drafts, whatever was touched last.

### Step 4: Dig last session

```bash
ORACLE_ROOT=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
ENCODED_PWD=$(echo "$ORACLE_ROOT" | sed 's|^/|-|; s|[/.]|-|g')
PROJECT_BASE=$(ls -d "$HOME/.claude/projects/${ENCODED_PWD}" 2>/dev/null | head -1)
export PROJECT_DIRS="$PROJECT_BASE"
python3 ~/.claude/skills/dig/scripts/dig.py 1
```

Include in recap:
```
📡 Last session: HH:MM–HH:MM (Xm, N msgs) — [topic]
```

Need more? `/dig 5` or `/dig --timeline`.

**Total**: 1 bash call + LLM analysis

---

## QUICK MODE (`/recap --quick`)

**Minimal, no content reads:**

```bash
bun ~/.claude/skills/recap/recap.ts
```

Script outputs git status + focus state (~0.1s). Then LLM adds:
- **What's next?** (2-3 options based on git state)

---

## "What's next?" Rules

| If you see... | Suggest... |
|---------------|------------|
| Handoff exists | Continue from handoff |
| Untracked files | Commit them |
| Focus = completed | Pick from tracks or start fresh |
| Branch ahead | Push or create PR |
| Streak active | Keep momentum going |

---

## Hard Rules

1. **ONE bash call** — never multiple parallel calls (adds latency)
2. **No subagents** — everything in main agent
3. **Ask, don't suggest** — "What next?" not "You should..."

---

---

## NOW MODE (`/recap --now`)

**Mid-session awareness from AI memory** — no file reading needed. Use when user asks "where are we", "now", "status", "what are we doing".

AI reconstructs session timeline from conversation memory:

```markdown
## This Session

| Time | Duration | Topic | Jump |
|------|----------|-------|------|
| HH:MM | ~Xm | First topic | - |
| HH:MM | ~Xm | Second topic | spark |
| HH:MM | ongoing | **Now**: Current | complete |

**Noticed**:
- [Pattern - energy/mode]
- [Jump pattern: sparks vs escapes vs completions]

**Status**:
- Energy: [level]
- Loose ends: [unfinished]
- Parked: [topics we'll return to]

**My Read**: [1-2 sentences]

---
**Next?**
```

### Jump Types

| Icon | Type | Meaning |
|------|------|---------|
| spark | New idea, exciting |
| complete | Finished, moving on |
| return | Coming back to parked |
| park | Intentional pause |
| escape | Avoiding difficulty |

**Healthy session**: Mostly sparks and completes
**Warning sign**: Too many escapes = avoidance pattern

---

## NOW DEEP MODE (`/recap --now deep`)

Same as `--now` but adds bigger picture context.

### Step 1: Gather (parallel)

```
1. Current session from AI memory
2. Read latest handoff: ls -t ψ/inbox/handoff/*.md | head -1
3. Git status: git status --short
4. Tracks: cat ψ/inbox/tracks/INDEX.md 2>/dev/null
```

### Step 2: Output

Everything from `--now`, plus:

```markdown
### Bigger Picture

**Came from**: [Last session/handoff summary - 1 line]
**Working on**: [Current thread/goal]
**Thread**: [Larger pattern this connects to]

### Pending

| Priority | Item | Source |
|----------|------|--------|
| Now | [Current task] | This session |
| Soon | [Next up] | Tracks/discussion |
| Later | [Backlog] | GitHub/tracks |

### Connections

**Pattern**: [What pattern emerged]
**Learning**: [Key insight from session]
**Oracle**: [Related past pattern, if any]

**My Read**: [2-3 sentences - deeper reflection]

**Next action?**
```

---

## Session Context

The recap scripts (`recap.ts` and `recap-rich.ts`) auto-detect and display the current session:

```
📡 Session: 74c32f34 | arra-oracle-skills-cli | 2h 15m
```

Detection: scans `~/.claude/projects/[encoded-pwd]/*.jsonl` for the most recent session file, extracts short ID and elapsed time from first timestamp.

If session detection fails, skip silently — it's informational only.

---

## Demographics Context

If CLAUDE.md contains demographics from `/awaken` wizard v2, include in recap output:

```markdown
**Oracle**: [name] ([pronouns]) | **Human**: [name] ([pronouns]) | **Language**: [pref]
```

Add this as one line after the timestamp in any mode. If demographics not present, skip silently.

Look for fields in CLAUDE.md: `Human Pronouns`, `Oracle Pronouns`, `Language`, `Team`, `Experience`.

---

**Philosophy**: Detect reality. Surface blockers. Offer direction. *"Not just the clock. The map."*

**Version**: 8.0 (Merged where-we-are into --now mode)
**Updated**: 2026-02-10
