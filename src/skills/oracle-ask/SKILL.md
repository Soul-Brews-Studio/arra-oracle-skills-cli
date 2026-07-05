---
name: oracle-ask
description: Ask Arra Oracle for grounded answers with citations, warnings, llm:false, and asOf support. Use when the user asks Oracle a question, wants cited RAG over indexed memory, or needs historical evidence.
argument-hint: "<question> [--as-of ISO] [--llm false] [--limit N]"
---

# /oracle-ask — Cited Oracle Answers

Answer from Arra Oracle memory/search with citations. The product contract is
**grounded answer first**: never present uncited synthesis as fact.

## Inputs

- Question text from `$ARGUMENTS` or the user message.
- Optional `--as-of <ISO>` for valid-time/historical answers.
- Optional `--llm false` for deterministic extractive answers. Prefer this for
  smoke tests, audits, and anything that must avoid provider calls.
- Optional filters: `--limit`, `--type`, `--project`, `--cwd`, `--model`.

## Contract

1. Use `oracle_ask` MCP first when available.
2. Fallback to `POST /api/v1/ask` when MCP is unavailable.
3. Render `answer`, `citations`, `warnings`, `noEvidence`, and stale metadata.
4. If `noEvidence: true` or `citations` is empty, say Oracle has no cited
   evidence. Do not fill the gap from model memory.
5. If warnings mention stale/superseded evidence, show them near the answer.
6. Outside knowledge may be added only under a clearly labeled “Not in Oracle”
   section, never as the cited answer.

## MCP-first call

Use this shape with the Oracle MCP server:

```json
{
  "tool": "oracle_ask",
  "arguments": {
    "question": "What did I write about runbooks?",
    "limit": 5,
    "llm": false
  }
}
```

Historical/asOf example:

```json
{
  "tool": "oracle_ask",
  "arguments": {
    "question": "Who owned the deploy checklist?",
    "asOf": "2026-06-17T00:00:00Z",
    "limit": 8,
    "llm": false
  }
}
```

Accepted argument aliases: `q` or `question`. Supported filters: `type`,
`limit`, `project`, `cwd`, `model`, `asOf`, `llm`.

## HTTP fallback

```bash
ORACLE_API=${ORACLE_API:-${ARRA_API:-http://localhost:47778}}
QUESTION='What did I write about runbooks?'

curl -fsS -X POST "$ORACLE_API/api/v1/ask" \
  ${ARRA_API_TOKEN:+-H "Authorization: Bearer $ARRA_API_TOKEN"} \
  ${ORACLE_TENANT:+-H "X-Oracle-Tenant: $ORACLE_TENANT"} \
  ${ORACLE_TENANT_TOKEN:+-H "X-Oracle-Tenant-Token: $ORACLE_TENANT_TOKEN"} \
  -H 'content-type: application/json' \
  -d "$(jq -nc --arg q "$QUESTION" '{q:$q,limit:5,llm:false}')"
```

As-of fallback:

```bash
curl -fsS -X POST "$ORACLE_API/api/v1/ask" \
  -H 'content-type: application/json' \
  -d '{"q":"Who owned the deploy checklist?","asOf":"2026-06-17T00:00:00Z","limit":8,"llm":false}'
```

## Rendering

Show a compact, user-facing result:

```markdown
## Oracle answer
<answer text>

### Citations
[1] <title> — <sourceFile>
    <excerpt>
[2] <title> — <sourceFile>
    <excerpt>

### Warnings
- <warning or stale/superseded note>
```

Rules:
- Keep citation indexes exactly as returned.
- Include `sourceFile`, `id`, and excerpt when present.
- Mark stale sources: `stale: true`, `supersededBy`, `valid_time`, or
  `valid_until` from the source/citation payload.
- Include `asOf` in the heading when supplied: `Oracle answer as of <ISO>`.

## Failure modes

- 400 invalid query/asOf/model: show the server error and ask for corrected input.
- Connection refused: suggest `/oracle-up` or verify `ORACLE_API`.
- Empty evidence: stop after the no-evidence message unless the user explicitly
  asks for a non-Oracle brainstorm.
