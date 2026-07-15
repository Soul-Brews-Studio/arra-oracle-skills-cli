# /dig — Deep Knowledge

Companion to SKILL.md. Teaches the Oracle (and future siblings) how /dig timeline works under the hood, when to reach for it, and where it breaks.

## Real Timeline Output

### Flat mode: `/dig --all 20`

```markdown
## Session Timeline

| # | Date | Session | Min | Repo | Msgs | Focus |
|---|------|---------|-----|------|------|-------|
|   |      | · · · sleeping / offline | | | | |
| 1 | 05-19 | 06:19–08:38 | 139m | homelab | 8 | Moltworker Gateway + MBP Node |
|   |      | · · · 45m gap | | | | |
| 2 | 05-19 | 09:23–16:08 | 405m | homelab | 22 | Debug MBP Node 401 — Gateway Token Auth |
|   |      | · · · sleeping / offline | | | | |
| 3 | 05-20 | 08:40–09:08 | 28m | oracle-skills-cli | 5 | Wire /rrr to read pulse data |
|   |      | · · · no session yet | | | | |

**Dirs scanned**: 3
**Total sessions found**: 3
```

### Grouped mode: `/dig --all --timeline`

```markdown
## May 20 (Tue) — Skills Day

                  · · ·   sleeping / offline
08:40–09:08    28m   oracle-skills-cli   Wire /rrr to read pulse data
09:55–10:23    28m   homelab             oracle-pulse birth + CLI flag
                  · · ·   no session yet

## May 19 (Mon) — Long Infrastructure Day

06:19–08:38   139m   homelab        Moltworker Gateway + MBP Node
08:40           (bg)  openclaw       ClawHub Build Script (idle long)
09:23–16:08   405m   homelab        Debug MBP Node 401 — Gateway Token Auth

**Days**: 2 | **Sessions**: 5 | **Total time**: 600m
```

### Deep mode: `/dig --deep --all`

Adds columns for tool calls, file size, and subagent identification:

```markdown
| # | Date | Session | Min | Repo | Msgs | Tools | Size | Focus |
|---|------|---------|-----|------|------|-------|------|-------|
| 1 | 05-19 | 06:19–08:38 | 139m | homelab | 8 | 47 | 312KB | Moltworker Gateway |
| 2 | 05-19 | 06:25–06:31 | 6m | homelab | 0 | 12 | 45KB | (subagent: Explore) |

**Coverage**: 14/14 sessions | **Timezone**: GMT+07:00
```

## Date/Time Extraction Logic

dig.py does NOT extract dates from filenames. The pipeline:

1. **Primary**: Parse `timestamp` field from each JSON line in the `.jsonl` session file. Track `first_ts` (earliest) and `last_ts` (latest).
2. **Format**: ISO 8601 with Z suffix (e.g., `2026-05-19T06:19:00Z`). Converted to local time via detected timezone offset.
3. **Duration**: `(last_ts - first_ts)` in minutes.
4. **Timezone detection priority**: `MAW_DISPLAY_TZ` env > `TZ` env > `date +%z` system call > UTC fallback.

There is no filename-based date extraction or mtime fallback — if a session has no `timestamp` fields, it's skipped entirely (`if not first_ts: continue`).

### Session identity

- **Session ID**: derived from the `.jsonl` filename (e.g., `a0a0531d-77ea-...jsonl` → `a0a0531d-77ea`).
- **Standard mode**: deduplicates by basename — keeps the most recently modified file when the same session ID appears in multiple project dirs.
- **Deep mode**: deduplicates by full path — shows every `.jsonl` file including subagent sessions in `<uuid>/subagents/`.

### Summary resolution

Cascading fallback: `sessions-index.json` summary → in-file `type: "summary"` entry → first human message text → `"No summary"`.

## When to Use /dig vs Alternatives

| Need | Tool | Why |
|------|------|-----|
| "What did I work on this week?" | `/dig --all --timeline` | Groups sessions by day, shows time spent per repo |
| "When did I first touch repo X?" | `/dig --all` then scan for repo | Flat list makes it easy to spot first appearance |
| "Find the code/commit where X was built" | `/trace --deep` | Searches git history, file content — /dig only shows session metadata |
| "What's happening right now?" | `/recap --now` or `/where-we-are` | Current session awareness, not historical |
| "Show me yesterday's standup data" | `/standup` | Pulls recent sessions + calendar, formatted for standup |
| "How many sessions hit repo X?" | `/dig --deep --all` | Deep mode shows coverage counts and subagent sessions |
| "Find a specific conversation" | `/dig --deep --all 50` | Then scan summaries for keywords — no text search, but summaries are searchable |

### /dig timeline vs /trace --deep

- **/dig** answers **when** — temporal questions about sessions, duration, gaps, patterns.
- **/trace** answers **where** — locating code, commits, files, projects across the codebase.

They complement each other: `/dig` finds the session, `/trace` finds the artifact. The `Trace Connection` section in SKILL.md bridges them — dig results get logged so `/trace` can answer "when did we first work on X?"

## Limits and Performance

### Scale

- **Session count**: no hard limit in deep mode (`--deep --all` with `count=0` scans everything). Practically, 200+ sessions per project dir is where you'll notice latency.
- **File parsing**: every `.jsonl` is fully line-scanned. A 500KB session file with 2000 lines takes ~50ms. A 5MB session (long Opus conversation) can take 500ms+.
- **Subagent explosion**: `--deep` scans `<uuid>/subagents/*.jsonl` — a single session with 10 subagents adds 10 entries. Heavy `team-agents` usage can produce 50+ subagent files per session.

### Known limits

- **No full-text search**: dig doesn't search message content. It reads summaries and first prompts only. For "find the conversation where I discussed X", you need to grep `.jsonl` files directly.
- **Gap detection is naive**: gaps > 30 min are shown. Overlapping sessions (e.g., background sidechain running alongside main session) can produce negative or zero gaps — these render correctly but look odd.
- **Repo name resolution depends on ghq**: if `ghq list -p` fails or isn't installed, repo names fall back to the last segment of the project dir path, which can be ambiguous.
- **Worktree dirs**: the Step 0 shell setup handles `-wt-*` suffixed dirs, but if worktrees are created with non-standard naming, they'll be missed.

## Enrichment Checklist (for future siblings)

When budding a new Oracle that needs /dig:
1. Verify `ghq` is installed (for repo name resolution)
2. Check timezone: `echo $MAW_DISPLAY_TZ` or `date +%z`
3. Test with `/dig 3` first (small, fast) before `/dig --deep --all`
4. If sessions seem missing, check `PROJECT_DIRS` — the Step 0 shell encoding must match Claude's internal project dir naming
