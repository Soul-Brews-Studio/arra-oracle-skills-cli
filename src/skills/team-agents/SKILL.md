---
name: team-agents
description: Spin up coordinated agent teams for any task. Reusable framework for TeamCreate/SendMessage/TaskList patterns. Use when user says "team-agents", "spin up a team", "use teammates", "parallel agents", "coordinate agents", "fan out", or wants multiple agents working together with coordination. Do NOT trigger for simple subagent work (use Agent tool directly) or inter-Oracle messaging (use /talk-to).
argument-hint: "<task-description> [--roles N] [--model sonnet|opus|haiku] [--plan] [--worktree] | who | zoom <agent> | sync | merge <agent> | compile"
---

# /team-agents — Coordinated Agent Teams

## Config

```json
// ~/.claude/settings.json — required
{ "env": { "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1" } }
```

```json
// ~/.claude.json — display mode (default: "auto")
{ "teammateMode": "in-process" }   // all in main terminal
{ "teammateMode": "tmux" }         // split panes (requires tmux/iTerm2)
```

```bash
claude --teammate-mode in-process   # per-session override
```

Requires Claude Code **v2.1.32+**. Without env var, TeamCreate/SendMessage/TaskList tools don't exist — fall back to parallel subagents.

**In-process keys**: `Shift+Down` cycle teammates, `Enter` view, `Escape` interrupt, `Ctrl+T` toggle tasks.

### Quality Gate Hooks

```json
// ~/.claude/settings.json
{
  "hooks": {
    "TeammateIdle": [{ "matcher": "", "hooks": [{ "type": "command", "command": "..." }] }],
    "TaskCreated": [{ "matcher": "", "hooks": [{ "type": "command", "command": "..." }] }],
    "TaskCompleted": [{ "matcher": "", "hooks": [{ "type": "command", "command": "..." }] }]
  }
}
```

Exit code 2 from any hook = reject action + send feedback to agent.

---

## Usage

```
/team-agents "review this PR for security, perf, and tests"
/team-agents "refactor auth module" --roles 3
/team-agents "research X" --model haiku
/team-agents "implement feature Y" --plan
/team-agents --manual "build feature Z"
/team-agents --manual "build feature" --worktree

/team-agents who                    # presence dots + task state
/team-agents --panes                # tmux pane scan
/team-agents zoom scout             # toggle zoom on agent's pane
/team-agents sync                   # git sync all worktrees to main
/team-agents merge scout            # merge agent's branch to main
/team-agents compile                # gather all reports
/team-agents shutdown               # graceful shutdown
/team-agents cleanup                # kill idle orphan panes
/team-agents killshot               # kill ALL non-lead panes
/team-agents doctor [--fix]         # detect ghosts + orphans
```

| Flag | Effect |
|------|--------|
| `--manual` | Human controls agents via lead relay |
| `--worktree` | Each agent gets git worktree + branch |
| `--panes` | Peek at tmux panes |
| `--plan` | Plans are AUTO-APPROVED by leader's inbox poller — generation gate, not human review |
| `--roles N` | Override agent count |
| `--model X` | Override model (sonnet/opus/haiku) |

---

## When to Use

| Tier | When | Tools |
|------|------|-------|
| **Subagents** | < 3 agents, independent work | Agent tool |
| **Team Agents** | 3-5 agents, need coordination | TeamCreate + SendMessage + TaskList |
| **Cross-Oracle** | Inter-session, multi-repo | /talk-to + contacts |

**Rule**: 2 independent agents → subagents. Coordinated work → team-agents.
**Sizing**: 3-5 teammates, 5-6 tasks each. Tokens scale linearly per teammate.

### Subagent Definitions

Reference `.claude/agents/` definitions when spawning: honors `tools` + `model`. Team tools (SendMessage, TaskUpdate) always available. `skills`/`mcpServers` frontmatter NOT applied to teammates.

---

## Lifecycle

### 1. Create Team

```
TeamCreate("team-name")   // slugified from task
```

### 2. Create Tasks (with dependencies)

```
TaskCreate({ subject: "Security review", description: "..." })
TaskCreate({ subject: "Perf review", description: "..." })
TaskUpdate({ taskId: "2", addBlockedBy: ["1"] })   // task 2 waits for 1
```

### 3. Spawn Teammates

Spawn all in parallel via Agent tool. **Prompt template** (every teammate gets this):

```
You are the [ROLE] specialist on team "[TEAM_NAME]".

REPO: [WORKTREE_PATH if --worktree, else ABSOLUTE_PATH_TO_MAIN_REPO]
TASK: [TASK_DESCRIPTION]
COLOR: [AGENT_COLOR — e.g. blue, green, yellow]
WORKTREE: [yes — write freely | no — do NOT write files]

Instructions:
1. Do your work
2. Mark task done: TaskUpdate({ taskId: [ID], status: "completed" })
3. Report to lead: SendMessage({
     to: "team-lead@[TEAM_NAME]",
     summary: "[5-10 words]",
     message: "[findings, max 500 words]"
   })

HEARTBEAT (mandatory):
- Every 5 min: SendMessage PROGRESS: <what you did>
- Blocked: SendMessage STUCK: <what you need>
- Done: SendMessage DONE: <branch if worktree> <summary>
- Failed: SendMessage ABORT: <reason>
- NEVER go idle without reporting.

Rules:
- ALWAYS SendMessage BEFORE finishing
- If worktree: write to YOUR worktree only
- If shared repo: do NOT write files
- Max 500 words per report
- Be specific — paths, lines, evidence
```

**Critical**: Always include literal `REPO:` path (never shell vars), `COLOR:` from spawn opts, `team-lead@[TEAM_NAME]`, heartbeat protocol, 500-word limit.

### 4. Wait + Compile

- Idle notifications are normal — teammates are working
- Real content arrives via SendMessage with summary
- If teammate crashes: SendMessage to stopped agent **auto-resumes** from disk transcript
- `isActive()` always returns true for tmux agents (bug) — check pane directly if suspect dead

Compile into:
```markdown
# [Task] — Team Report
**Team**: [name] | **Agents**: [N] | **Duration**: ~[N]min
## [Role]: [Summary]    (per agent)
## Synthesis            (lead's cross-cutting observations)
## Action Items
```

### 5. Shutdown Strategies

**Strategy A: All-at-once** (default) — wait for all agents, then shutdown all:
```
# After ALL agents report DONE:
SendMessage({ to: "agent-1", message: { type: "shutdown_request" } })
SendMessage({ to: "agent-2", message: { type: "shutdown_request" } })
# Wait for shutdown_response (~10s)
TeamDelete()
```

**Don't write the loop by hand** — structured messages can't broadcast (#212), but the helper script generates the per-agent `SendMessage` block for you:
```bash
bash ~/.claude/skills/team-agents/scripts/broadcast-shutdown.sh $TEAM
# → prints ready-to-paste SendMessage lines, one per teammate (lead excluded)
# → also supports --names (raw list) and --json (array) for scripted loops
# → --type=X to broadcast any structured message type, not just shutdown
```

**Strategy B: Rolling shutdown** — shutdown each agent as it completes:
```
# On each DONE report: immediately shutdown that agent
SendMessage({ to: "agent-1", message: { type: "shutdown_request" } })
# Keep other agents running
# When LAST agent reports → shutdown + TeamDelete
```
Use when: agents are independent, no cross-agent dependencies. Saves tokens — idle agents still consume context.

**Strategy C: Cron check** — for long-running teams (10+ min):
```
# Schedule a periodic check via /loop or ScheduleWakeup
Every 2-5 min: check TaskList
  - If all tasks completed → shutdown all + compile
  - If some done, some stuck → nudge stuck agents
  - If all working → skip, check again next cycle
```
Use when: team runs > 10 min, lead doesn't want to block waiting.

**Strategy D: TeammateIdle hook** (system-level):
```json
// ~/.claude/settings.json
{ "hooks": { "TaskCompleted": [{
  "matcher": "", "hooks": [{
    "type": "command",
    "command": "bash -c 'DONE=$(ls ~/.claude/tasks/*/completed 2>/dev/null | wc -l); TOTAL=$(ls ~/.claude/tasks/*/ 2>/dev/null | wc -l); [ \"$DONE\" = \"$TOTAL\" ] && echo ALL_DONE'"
  }]
}]}}
```
Exit code 0 + stdout "ALL_DONE" → lead knows to shutdown. Most reliable, no polling.

**Pick based on team duration:**

| Duration | Strategy | Why |
|----------|----------|-----|
| < 2 min | A (all-at-once) | Fast, simple |
| 2-10 min | B (rolling) | Save tokens on early finishers |
| > 10 min | C (cron) or D (hook) | Don't block lead |

```

**Post-shutdown** (always run all 3):

```bash
# Archive findings to persistent mailbox
for agent in $AGENTS; do
  bash ~/.claude/skills/mailbox/scripts/mailbox.sh archive $agent $TEAM
done

# Archive ephemeral skills to /tmp
bash ~/.claude/skills/team-agents/scripts/shutdown-skills.sh $TEAM $AGENTS

# Sweep worktrees (catches crashed sessions — #336)
bash ~/.claude/skills/team-agents/scripts/shutdown-worktrees.sh "$REPO_PATH"
```

**Rules**: Never skip shutdown. Never broadcast shutdown. Always sweep worktrees. Teams this-session auto-clean on exit; prior-session teams persist and can resume.

---

## Manual Mode (`--manual`)

Agents spawn in standby — human directs each one via lead relay.

**Standby prompt** (replace standard prompt):
```
You are [ROLE] on team "[TEAM_NAME]" in MANUAL mode.
REPO: [PATH]
COLOR: [AGENT_COLOR — e.g. blue, green, yellow]
Wait for instructions. On each message:
1. Execute the work
2. SendMessage report to team-lead@[TEAM_NAME]
3. Return to standby
```

**Create live skills** so user can `/agent-name` directly:
```bash
bash ~/.claude/skills/team-agents/scripts/spawn-skills.sh $TEAM $AGENTS
```

**Pre-load mailbox** if agent has previous findings:
```bash
MAILBOX=$(bash ~/.claude/skills/mailbox/scripts/mailbox.sh load $AGENT 2>/dev/null)
```

---

## Worktree Mode (`--worktree`)

### Mode 1: `--worktree` flag (recommended)

```bash
REPO_ROOT=$(git rev-parse --show-toplevel)
for AGENT in $AGENTS; do
  git branch "agents/$AGENT" HEAD 2>/dev/null || true
  git worktree add "$REPO_ROOT/agents/$AGENT" "agents/$AGENT" 2>/dev/null
done
```

Agent prompt gets `REPO:` set to worktree path. Merge via `/team-agents merge <agent>`.

### Mode 2: `isolation: "worktree"` in Agent tool

```
Agent({ name: "builder", isolation: "worktree", ... })
```

Creates at `.claude/worktrees/agent-<id>`. Auto-cleaned if no changes. Prefer Mode 1.

---

## Subcommands

### who — Presence Dots

| Dot | State | Meaning |
|-----|-------|---------|
| `●` | active | Heartbeat < 5 min |
| `◐` | idle | Heartbeat 5-10 min |
| `◌` | working | In progress |
| `⊘` | stuck | Reported STUCK |
| `✓` | done | Reported DONE |
| `✗` | aborted | Reported ABORT |
| `·` | silent | No heartbeat > 10 min — investigate |

### Scripts

```bash
bash ~/.claude/skills/team-agents/scripts/panes.sh [team]      # pane scan
bash ~/.claude/skills/team-agents/scripts/cleanup.sh            # kill idle panes
bash ~/.claude/skills/team-agents/scripts/cleanup.sh --dry-run  # preview
bash ~/.claude/skills/team-agents/scripts/killshot.sh           # kill ALL non-lead
bash ~/.claude/skills/team-agents/scripts/doctor.sh             # detect ghosts
bash ~/.claude/skills/team-agents/scripts/doctor.sh --fix       # auto-fix
bash ~/.claude/skills/team-agents/scripts/spawn-skills.sh $T $A # create /agent skills
bash ~/.claude/skills/team-agents/scripts/shutdown-skills.sh $T $A  # archive to /tmp
bash ~/.claude/skills/team-agents/scripts/shutdown-worktrees.sh $R  # sweep worktrees
```

### sync

```bash
REPO_ROOT=$(git rev-parse --show-toplevel)
for wt in "$REPO_ROOT/agents"/*/; do
  AGENT=$(basename "$wt")
  git -C "$wt" fetch origin main:main 2>/dev/null
  git -C "$wt" merge main --no-edit 2>/dev/null
done
```

### merge

```bash
git diff --quiet HEAD 2>/dev/null || { echo "Stash first"; exit 1; }
git checkout main
git merge "agents/$AGENT" --no-ff -m "merge: $AGENT from team $TEAM"
```

---

## Base System Facts

**Provides**: mailbox (JSON + file locking), 10 structured message types, permission escalation (worker→leader→user), auto-resume on SendMessage to stopped agent, task self-claim by idle agents, deterministic IDs (`name@team`), plan auto-approval, session resume (prior-session teams persist).

**Does NOT provide** (we add): heartbeat protocol (PROGRESS/STUCK/DONE/ABORT), presence dots, ghost detection, structured task handoff.

**Architecture**: message priority shutdown>leader>peer>FIFO, structured messages cannot broadcast, two abort controllers per agent (lifecycle vs work), pane creation uses Promise-chain mutex, 50-message UI cap.

---

## Gotchas + Limitations

1. **No session resume** — `/resume` doesn't restore in-process teammates
2. **One team per session** — clean up before starting another
3. **No nested teams** — teammates can't spawn teams
4. **Lead is fixed** — no promotion or transfer
5. **Permissions at spawn** — all teammates inherit lead's mode
6. **Task status lag** — agents sometimes forget TaskUpdate
7. **Split panes** — requires tmux/iTerm2, not VS Code/Ghostty
8. **~3-7x tokens** vs single agent
9. **Same file = overwrites** — each agent must own different files
10. **Shutdown slow** — agents finish current request first
11. **Structured messages cannot broadcast** — send individually, or use `scripts/broadcast-shutdown.sh $TEAM` to auto-generate the per-agent block (#212)

---

ARGUMENTS: $ARGUMENTS
