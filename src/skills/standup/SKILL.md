---
name: standup
description: Daily standup check — pending tasks, appointments, recent progress, schedule. Use when user says "standup", "morning check", "what's pending", or at the start of a work day. Do NOT trigger for mid-session status (use /recap --now), session orientation (use /recap), or retrospectives (use /rrr).
---

# /standup - Daily Standup

Quick check: pending tasks, appointments, recent progress.

## Usage

```
/standup          # Full standup check
```

---

## Action

Gather info from multiple sources:

### 0. Timestamp + Physical Location (auto)
```bash
date "+🕐 %H:%M %Z (%A %d %B %Y)" && gh api repos/laris-co/nat-location-data/contents/current.csv --jq '.content' | base64 -d | grep iPhone | head -1 | cut -d',' -f9
```
Show: "📍 Currently at: [place]"

### 1. Open Issues (งานค้าง)
```bash
gh issue list --state open --limit 10 --json number,title,updatedAt --jq '.[] | "#\(.number) \(.title)"'
```

### 2. Resolve Vault Path
```bash
PSI=$(readlink -f ψ 2>/dev/null || echo "ψ")
```

### 3. Current Focus
```bash
cat "$PSI/inbox/focus-agent-main.md" 2>/dev/null | head -20
```

### 4. Schedule/Appointments
```bash
grep "^|" "$PSI/inbox/schedule.md" 2>/dev/null | grep -v "Date\|---" | head -5
```

### 5. Recent Progress (24h)
```bash
git log --since="24 hours ago" --format="%h %s" | head -10
```

### 6. Latest Retrospective
```bash
ls -t "$PSI/memory/retrospectives"/**/*.md 2>/dev/null | head -1
```

### 7. LINE Appointment Scan (optional)

Scan recent LINE messages for potential appointments:

1. Read contacts from vault: `$PSI/memory/resonance/contacts.md`
   - If file doesn't exist, skip this section silently
   - Look for LINE group names/aliases listed there
2. Call `line_groups` (date: "today") to see active groups
3. For each active group, call `line_digest` (group: name, date: "today")
   - Also check yesterday: `line_digest` (group: name, date: yesterday's YYYY-MM-DD)
4. Extract messages containing date/time patterns:
   - Thai: `วันที่`, `พรุ่งนี้`, `มะรืน`, `นัด`, `ประชุม`, `เจอกัน`
   - English: dates, "meeting", "appointment", "schedule"
   - Times: `HH:MM`, `X โมง`, `บ่าย`, `เช้า`
5. Cross-reference with existing schedule (step 4) to skip duplicates
6. Present found appointments:
   ```
   ### LINE Appointments Found
   - [date] [event] (from: [group]) — Add? Y/N
   ```
7. On user approval → call `arra_schedule_add` for each confirmed appointment

### 8. Auto-post to Pulse Discussion

After generating the standup output, post it as a comment on today's Pulse standup discussion.

1. **Find today's discussion**:
```bash
TODAY=$(date "+%Y-%m-%d")
TODAY_THAI=$(date "+%A" | sed 's/Monday/จันทร์/;s/Tuesday/อังคาร/;s/Wednesday/พุธ/;s/Thursday/พฤหัสบดี/;s/Friday/ศุกร์/;s/Saturday/เสาร์/;s/Sunday/อาทิตย์/')
DISCUSSION_ID=$(gh api graphql -f query="{ repository(owner: \"laris-co\", name: \"pulse-oracle\") { discussions(first: 5, orderBy: {field: CREATED_AT, direction: DESC}) { nodes { id title } } } }" --jq ".data.repository.discussions.nodes[] | select(.title | test(\"Standup.*$TODAY|Standup.*$TODAY_THAI\")) | .id" | head -1)
```

2. **If discussion found** → post standup as comment:
```bash
gh api graphql -f query='mutation($id: ID!, $body: String!) { addDiscussionComment(input: {discussionId: $id, body: $body}) { comment { url } } }' -f id="$DISCUSSION_ID" -f body="$STANDUP_BODY"
```

Format the comment body as:
```markdown
## [Oracle Name] — Standup

### Done (24h)
- [commits/progress]

### In Progress
- [current focus]

### Pending Issues
- [open issues summary]

### Appointments
- [schedule items]

### Focus
- [next action]

---
🤖 Auto-posted by /standup
```

3. **If no matching discussion found** → skip silently (Pulse hasn't created today's discussion yet). Do NOT create one.

4. Show confirmation: `✅ Posted to Pulse Discussion #[number]` or skip silently.

---

## Output Format

```markdown
## Standup @ [TIME]

### Done (24h)
- [commit 1]
- [commit 2]

### In Progress
- [from focus.md]

### Pending Issues
| # | Task | Updated |
|---|------|---------|
| #N | title | date |

### Appointments Today
- [from schedule.md or "ไม่มีนัด"]

### Next Action
- [suggest based on priorities]

---
💡 `/schedule` to see full calendar
```

---

## Related

- `/schedule` - Full calendar view
- `/recap` - Full context summary

---

ARGUMENTS: $ARGUMENTS
