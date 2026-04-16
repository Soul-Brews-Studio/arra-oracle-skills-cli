---
name: dig
description: Mine Claude Code sessions — timeline, gaps, repo attribution, session history. Use when user says "dig", "sessions", "past sessions", "timeline", "what did I work on", or wants to see session history. Do NOT trigger for finding code/projects (use /trace), exploring repos (use /learn), or current session status (use /recap).
argument-hint: "[N] | --all | --timeline | --deep"
---

# /dig - Session Goldminer v2

Mine Claude Code session data for timelines, gaps, and repo attribution. No query needed.

## Usage

```
/dig                    # Current repo, 10 most recent
/dig [N]                # Current repo, N most recent
/dig --all              # All repos, ALL sessions (auto-detect count)
/dig --all [N]          # All repos, N most recent
/dig --deep             # Deep scan — ALL .jsonl files (not just most-recent per project)
/dig --deep [N]         # Deep scan, N most recent
/dig --all --deep       # All repos, deep scan — full coverage
/dig --timeline         # Day-by-day grouped (current repo)
/dig --all --timeline   # Day-by-day grouped (all repos, ALL sessions)
```

### Deep Mode (#216)

Standard `/dig` deduplicates by session basename — only showing the most recent file per session. This misses historical sessions, subagent sessions, and worktree sessions.

`--deep` scans ALL `.jsonl` files across all project directories. Output includes extra fields:
- `toolCalls` — number of tool invocations in the session
- `fileSizeKB` — session file size in KB
- Coverage metadata: `"X of Y sessions"` showing how many were returned vs found

### Timezone (#214)

dig.py v2 auto-detects timezone instead of hardcoding GMT+7:
1. `MAW_DISPLAY_TZ` env var (e.g., `Asia/Bangkok`, `7`, `America/New_York`)
2. `TZ` env var
3. System timezone
4. Fallback: UTC

Output metadata includes detected timezone name and offset.

## Step 0: Timestamp

```bash
date "+🕐 %H:%M %Z (%A %d %B %Y)" && ENCODED_PWD=$(pwd | sed 's|^/|-|; s|[/.]|-|g')
PROJECT_BASE=$(ls -d "$HOME/.claude/projects/${ENCODED_PWD}" 2>/dev/null | head -1)
export PROJECT_DIRS="$PROJECT_BASE"
for wt in "$HOME/.claude/projects/${ENCODED_PWD}"-wt*; do [ -d "$wt" ] && export PROJECT_DIRS="$PROJECT_DIRS:$wt"; done
```

Encodes `pwd` the same way Claude does (replace `/` and `.` with `-`, prepend `-`) to match the `.claude/projects/` directory naming (e.g. `github.com` → `github-com`). Also picks up worktree dirs (`-wt`, `-wt-1`, etc.).

**With `--all`** (all repos):
```bash
export PROJECT_DIRS=$(ls -d "$HOME/.claude/projects/"*/ | tr '\n' ':')
```

## Step 2: Extract Session Data

Run the dig script. Pass `0` for `--all` (no limit), or N if user specified a count, default 10:

```bash
python3 ~/.claude/skills/dig/scripts/dig.py [N] [--deep]
# N=10 (default), N=0 (scan all sessions), N=50 (50 most recent)
# --deep: scan ALL .jsonl files (not just most-recent per basename)
```

### Deep Mode Display

When `--deep` is used, add extra columns to the table:

```markdown
| # | Date | Session | Min | Repo | Msgs | Tools | Size | Focus |
```

And show coverage in the footer:

```markdown
**Coverage**: [returned]/[found] sessions | **Timezone**: [tz_name] (GMT+[offset])
```

## Step 3: Display Timeline

Read the JSON output and display as a table. Sessions are chronological (oldest first). Gap rows (`type: "gap"`) span the session column with `· · ·` prefix:

```markdown
## Session Timeline

| # | Date | Session | Min | Repo | Msgs | Focus |
|---|------|---------|-----|------|------|-------|
|   |      | · · · sleeping / offline | | | | |
| 1 | 02-21 | 08:40–09:08 | 28m | oracle-skills-cli | 5 | Wire /rrr to read pulse data |
|   |      | · · · 45m gap | | | | |
| 2 | 02-21 | 09:55–10:23 | 28m | homelab | 3 | oracle-pulse birth + CLI flag |
|   |      | · · · no session yet | | | | |

**Dirs scanned**: [list PROJECT_DIRS]
**Total sessions found**: [count]
```

Column rendering rules:
- **Gap rows**: `|   |      | · · · [label] | | | | |` — number + date empty, label in Session col
- **Date**: `MM-DD` short format (strip year)
- **Session**: `HH:MM–HH:MM` using `startGMT7` and `endGMT7` (strip date, keep time only)
- **Min**: `[durationMin]m`
- **Repo**: use `repoName` field from dig.py output (resolved via ghq)
- **Msgs**: `realHumanMessages` count

"Msgs" = real typed human messages (not tool approvals).

---

## With --timeline: Group by Date

When `--timeline` flag is present, group sessions by date instead of a flat table. Use `--all` to see all repos (recommended for timeline).

**Step 1**: Run dig.py with `0` for `--all` (scans all sessions), or user-specified count

**Step 2**: Group sessions by date from `startGMT7`. Render each day as:

```markdown
## Feb 22 (Sun) — [vibe label]

                  · · ·   sleeping / offline
08:48–09:11    23m   homelab        Update Fleet Runbook + Explore black.local
09:11–11:30   139m   homelab        Set Up KVM OpenClaw Node on black.local
09:37–12:51   194m   Nat-s-Agents   /recap → supergateway → CF ZT → arra-oracle-v3 dig
                  · · ·   45m gap
12:51–13:03    12m   Nat-s-Agents   Dig All + Design arra-oracle-v3 ← current
                  · · ·   no session yet

## Feb 21 (Sat) — Long day: Fleet + Brewing + Skills

06:19–08:38   139m   homelab        Moltworker Gateway + MBP Node
08:40           (bg)  openclaw       ClawHub Build Script (idle long)
09:23–16:08   405m   homelab        Debug MBP Node 401 — Gateway Token Auth
```

**Rendering rules**:
- **Day header**: `## MMM DD (Day) — [vibe label]` — infer vibe from session summaries (e.g. "Infrastructure Day", "Brewing + Skills")
- **Session rows**: `HH:MM–HH:MM  [N]m  REPO  Summary` — use `repoName` for repo, `summary` for focus
- **Gap rows**: `· · ·  [label]` between sessions when gap > 30 min
- **Sidechain**: prefix `(bg)` for sessions with `isSidechain: true`
- **Current**: append `← current` marker on the last session of the current day (today only)
- **Sort**: days newest-first, sessions within each day oldest-first (chronological)
- **Date format**: `startGMT7` time portion only (HH:MM), `endGMT7` time portion (HH:MM)
- **Repo width**: pad repo names to align columns

**Step 3**: Show summary footer:
```markdown
**Days**: [count] | **Sessions**: [count] | **Total time**: [sum of durationMin]m
```

---

## Trace Connection

After displaying the timeline, log the discovery to Oracle so it's searchable later:

```
arra_trace({
  query: "dig session [N]",
  project: "[repo-name]",
  foundFiles: [],
  foundCommits: [list of commit hashes from timeline],
  foundIssues: []
})
```

This connects `/dig` discoveries to `/trace` — "When did we first work on X?" becomes answerable.

---

ARGUMENTS: $ARGUMENTS
