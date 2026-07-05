---
name: mine-notes
description: Run the arra mine ingest flow for notes folders: dry-run, one-shot, watch mode, Docker volume setup, and post-ingest smoke. Use when the user wants to ingest, mine, import, or watch a notes directory.
argument-hint: "<notes-dir> [--dry-run | --watch] [--docker]"
---

# /mine-notes — Arra Mine Ingest Flow

Use the current `arra mine` CLI path to ingest Markdown, MDX, and text notes into
Arra Oracle. Do not use the archived `/mine` zombie skill for session mining.

## Contract

- Dry-run first unless the user explicitly asks to ingest now.
- Never edit or delete source notes.
- Prefer Docker-first for product smoke because it writes to the same `/data`
  volume as the HTTP server.
- Re-runs are safe: unchanged files are skipped by deterministic IDs.
- Finish by proving search/ask can see the ingested content.

## Docker-first preflight

```bash
export ARRA_PORT="${ARRA_PORT:-47778}"
export ARRA_URL="http://127.0.0.1:${ARRA_PORT}"
export ARRA_CONTAINER="${ARRA_CONTAINER:-arra-oracle}"
export ARRA_VOLUME="${ARRA_VOLUME:-arra-oracle-data}"
export ARRA_NOTES_DIR="${ARRA_NOTES_DIR:-$HOME/notes}"

mkdir -p "$ARRA_NOTES_DIR"
docker volume create "$ARRA_VOLUME" >/dev/null
```

Start Oracle if it is not already running:

```bash
docker run --rm -d --name "$ARRA_CONTAINER" \
  -p "${ARRA_PORT}:47778" \
  -v "${ARRA_VOLUME}:/data" \
  -v "${ARRA_NOTES_DIR}:${ARRA_NOTES_DIR}:ro" \
  ghcr.io/soul-brews-studio/arra-oracle-v3:http

until curl -sf "$ARRA_URL/api/health" >/dev/null; do sleep 1; done
```

Helper for the CLI inside the running container:

```bash
arra() { docker exec "$ARRA_CONTAINER" bun dist-cli/index.js "$@"; }
```

## Dry-run

```bash
arra mine "$ARRA_NOTES_DIR" --dry-run
```

Report scanned/stored/skipped counts and detected project. If `stored` is zero,
call out whether it was an empty folder or all files were unchanged.

## One-shot ingest

```bash
arra mine "$ARRA_NOTES_DIR"
```

Expected output:

```text
Mined N documents from M files (K skipped) into project "<project>".
```

## Watch mode

Only run watch mode when the user wants a long-running watcher:

```bash
arra mine "$ARRA_NOTES_DIR" --watch
```

Stop with Ctrl-C. If running in a remote session, warn the user that watch mode
keeps the process attached until stopped.

## Local/dev variant

When working inside a source checkout instead of Docker:

```bash
bun run src/cli/index.ts mine "$ARRA_NOTES_DIR" --dry-run
bun run src/cli/index.ts mine "$ARRA_NOTES_DIR"
bun run src/cli/index.ts mine "$ARRA_NOTES_DIR" --watch
```

Use `--db-path <file>` only for isolated test databases.

## Post-ingest smoke

```bash
curl -sfS "$ARRA_URL/api/health"
curl -sfS "$ARRA_URL/api/v1/search?q=runbook&mode=fts&limit=5"
curl -sfS -X POST "$ARRA_URL/api/v1/ask" \
  -H 'content-type: application/json' \
  -d '{"q":"What did I write about runbooks?","limit":5,"llm":false}'
```

Pass criteria:
- health is OK;
- search returns results or a clear zero-result response for the chosen query;
- ask returns JSON with `answer`, `citations`, `sources`, and `warnings`.

## Output to user

Summarize:

```markdown
Mined <stored> docs from <scanned> files (<skipped> skipped) into project `<project>`.
Smoke: health <ok/fail>, search <N results>, ask <cited/no evidence>.
UI: <ARRA_URL>/simple
```
