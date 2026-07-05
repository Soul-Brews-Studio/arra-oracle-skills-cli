---
name: consolidation-review
description: Review Arra Oracle memory consolidation suggestions safely: list pending suggestions, inspect evidence, then explicitly approve or reject. Use when the user asks to review consolidation, dedupe memory, or clear consolidation queue.
argument-hint: "[list | approve <id> | reject <id>] [--limit N]"
---

# /consolidation-review — Suggest-only Memory Cleanup

Review memory consolidation suggestions without auto-applying them. Approval can
supersede evidence, so every action requires an explicit user decision.

## Hard rules

- Default action is **list only**.
- Never auto-apply, approve-all, or reject-all from a vague instruction like
  “clean it up”. Show suggestions first.
- Approve or reject only when the user explicitly names the action and ID(s)
  after seeing the evidence.
- Preserve tenant isolation by passing tenant headers when configured.
- Include a reason for every approve/reject.

## Setup

```bash
ORACLE_API=${ORACLE_API:-${ARRA_API:-http://localhost:47778}}
LIMIT=${LIMIT:-20}
ACTOR=${ORACLE_ACTOR:-${USER:-oracle-reviewer}}
```

Use these headers when present:

```bash
${ARRA_API_TOKEN:+-H "Authorization: Bearer $ARRA_API_TOKEN"}
${ORACLE_TENANT:+-H "X-Oracle-Tenant: $ORACLE_TENANT"}
${ORACLE_TENANT_TOKEN:+-H "X-Oracle-Tenant-Token: $ORACLE_TENANT_TOKEN"}
-H "X-Oracle-Actor: $ACTOR"
```

## List pending suggestions

```bash
curl -fsS "$ORACLE_API/api/v1/memory/consolidation/pending?limit=$LIMIT"
```

Equivalent endpoint:

```bash
curl -fsS "$ORACLE_API/api/v1/memory/consolidation/suggestions?limit=$LIMIT"
```

Render a review table:

```markdown
| ID | Confidence | Original | Suggested successor | Reason |
|----|------------|----------|---------------------|--------|
| old->new | 0.91 | notes/old.md | notes/new.md | async duplicate... |
```

For each row include:
- `id`, `confidence`/`score`, and `metrics.cosine`/`metrics.ftsOverlap`;
- `original.id`, `original.sourceFile`, and preview;
- `suggested.id`, `suggested.sourceFile`, and preview;
- warning that approve supersedes `oldId` with `newId`.

Then stop and ask for explicit IDs if the user has not already provided them.

## Approve one suggestion

Approve only after explicit user approval for that ID:

```bash
ID='old-doc-id->new-doc-id'
ID_ENC=$(python3 -c 'import sys,urllib.parse; print(urllib.parse.quote(sys.argv[1], safe=""))' "$ID")
REASON='reviewed matching evidence; suggested successor is newer and more complete'

curl -fsS -X POST "$ORACLE_API/api/v1/memory/consolidation/$ID_ENC/approve" \
  ${ARRA_API_TOKEN:+-H "Authorization: Bearer $ARRA_API_TOKEN"} \
  ${ORACLE_TENANT:+-H "X-Oracle-Tenant: $ORACLE_TENANT"} \
  ${ORACLE_TENANT_TOKEN:+-H "X-Oracle-Tenant-Token: $ORACLE_TENANT_TOKEN"} \
  -H "X-Oracle-Actor: $ACTOR" \
  -H 'content-type: application/json' \
  -d "$(jq -nc --arg reason "$REASON" '{reason:$reason}')"
```

Expected response includes `success: true`, `suggestion`, `result`, and `audit`.

## Reject one suggestion

Reject only after explicit user rejection for that ID:

```bash
ID='old-doc-id->new-doc-id'
ID_ENC=$(python3 -c 'import sys,urllib.parse; print(urllib.parse.quote(sys.argv[1], safe=""))' "$ID")
REASON='not a duplicate; keep both facts visible'

curl -fsS -X POST "$ORACLE_API/api/v1/memory/consolidation/suggestions/$ID_ENC/reject" \
  ${ARRA_API_TOKEN:+-H "Authorization: Bearer $ARRA_API_TOKEN"} \
  ${ORACLE_TENANT:+-H "X-Oracle-Tenant: $ORACLE_TENANT"} \
  ${ORACLE_TENANT_TOKEN:+-H "X-Oracle-Tenant-Token: $ORACLE_TENANT_TOKEN"} \
  -H "X-Oracle-Actor: $ACTOR" \
  -H 'content-type: application/json' \
  -d "$(jq -nc --arg reason "$REASON" '{reason:$reason}')"
```

Expected response includes `success: true`, `suggestion`, and `audit`. Rejecting a
suggestion dismisses it for the active tenant; it does not delete memory.

## Final response

```markdown
Consolidation review
- Listed: <N> suggestions
- Approved: <IDs or none>
- Rejected: <IDs or none>
- Skipped: <IDs + reason>
- Audit actor: <actor>
```
