---
name: schedule
description: Query schedule via Oracle API (Drizzle DB). Use when user says "schedule", "upcoming events", "what's on today", "calendar".
argument-hint: "[today | tomorrow | week]"
---

# /schedule - Query Schedule

Query the Oracle schedule database via HTTP API. Backed by Drizzle DB with proper date indexing.

## Usage

- `/schedule` → Upcoming events (next 30 days)
- `/schedule week` → Next 7 days
- `/schedule today` → Today's events
- `/schedule tomorrow` → Tomorrow's events
- `/schedule month` → This month
- `/schedule march` → March events
- `/schedule standup` → Search by keyword
- `/schedule all` → Everything (all statuses)

## Implementation

Run the query script:

```bash
bun .claude/skills/schedule/scripts/query.ts [filter]
```

The script queries `GET /api/v1/schedule` on the Oracle HTTP server (port 47778). It uses `ORACLE_API`, `ARRA_API_TOKEN`, `X_ORACLE_TENANT`/`ORACLE_TENANT`, and `X_ORACLE_TENANT_TOKEN`/`ORACLE_TENANT_TOKEN` when present.

## Output Format

**Do NOT show raw bash output.** Parse the script output and render as a box-drawn table:

```
Upcoming (5 events)

┌────────┬───────┬──────────────────────────────────┐
│  Date  │ Time  │ Event                            │
├────────┼───────┼──────────────────────────────────┤
│ Mar 1  │ TBD   │ งานบ้านสมาธิ ครั้ง 4                  │
├────────┼───────┼──────────────────────────────────┤
│ Mar 10 │ 15:00 │ นัดอ.เศรษฐ์ (ที่คลินิก)                │
└────────┴───────┴──────────────────────────────────┘

📄 `~/.arra/ψ/inbox/schedule.md`
```

Rules:
- Merge Notes into Event column (parenthesized if short, omit if too long)
- Hide Status column unless `all` filter (done/cancelled rows exist)
- Show ground truth file path at the bottom
- Title: filter name + count, e.g. "Upcoming (5 events)", "March (8 events)"

## API Reference

```
GET /api/v1/schedule                         → next 14 days (pending)
GET /api/v1/schedule?date=2026-03-05         → specific day
GET /api/v1/schedule?date=today              → today
GET /api/v1/schedule?from=2026-03-01&to=2026-03-31  → range
GET /api/v1/schedule?filter=keyword          → search
GET /api/v1/schedule?status=all              → include done/cancelled
```

## See Also

- `scripts/query.ts` - Query script (hits Oracle API)
- Oracle DB: `~/.arra/arra.db` → `schedule` table
- Auto-export: `~/.arra/ψ/inbox/schedule.md` (generated on write)
