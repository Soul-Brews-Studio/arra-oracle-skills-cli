---
name: oracle-up
description: '[standard] G-SKLL | Bring up a Docker-first Oracle node with skills, MCP, maw/omx team tooling, Simple Mode, folder mining, and ask smoke. Use when user says "oracle-up", "bring up an oracle", "new oracle node", or wants a fresh self-sufficient oracle on a remote machine.'
argument-hint: "<name> --host <host> --user <user> [--port N] [--mirror nat] [--apply]"
---

# /oracle-up — Docker-first Oracle Node

Provision a remote user, install the oracle toolchain, start Arra Oracle V3 with
Docker, mine notes, smoke `/simple`, and verify cited ask. Dry-run by default;
only mutate when the user explicitly includes `--apply`.

## Usage

```bash
/oracle-up oracle-world-oracle --host world.wg --user oracle --port 3463
/oracle-up oracle-world-oracle --host world.wg --user oracle --port 3463 --apply
```

Flags: positional name, `--host`, `--user`, `--port`, `--mirror`, `--org`,
`--code-root`, `--apply`.

## P0 — Preflight

- Print timestamp: `date "+🕐 %H:%M %Z (%A %d %B %Y)"`.
- Check SSH, OS, `sudo -n true`, Docker, `gh`, `maw`, Bun, and free HTTP port.
- If sshd has `AllowUsers`, plan adding `<user>` before verifying login.
- If `--apply` is absent, print commands only.

## P1 — User and base tooling

```bash
maw user-onboard --host <host> --user <user> --sudo --mirror <mirror> --with-tooling --port <port>
maw user-onboard --host <host> --user <user> --sudo --mirror <mirror> --with-tooling --port <port> --apply --yes
```

Then verify:

```bash
ssh <user>@<host> 'whoami && sudo -n true && docker --version'
```

If login fails with a generic publickey error, check `sshd -T | grep allowusers`.
Avoid repeated bad verifies that can trigger fail2ban.

## P2 — GitHub key

```bash
ssh <user>@<host> 'cat ~/.ssh/id_ed25519.pub' | gh ssh-key add - --title "<user>@<host>"
```

## P3 — Skills and MCP client tooling

```bash
ssh <user>@<host> 'zsh -lc "bun add -g arra-oracle-skills && arra-oracle-skills install -g -y --agent claude-code"'
# Install omx for Codex coders by its current installer.
```

Headless Claude flags, when needed:

```json
{
  "hasCompletedOnboarding": true,
  "hasTrustDialogAccepted": true,
  "projects": { "<repo>": { "hasTrustDialogAccepted": true, "hasCompletedProjectOnboarding": true } }
}
```

## P4 — Docker-first Arra Oracle V3

Create a persistent volume and run the HTTP image first. Prefer a published GHCR
tag from `alpha`; use `:http` only when the lead says latest alpha is acceptable.
Mount the notes folder into the running container so `arra mine` sees the same path.

```bash
ssh <user>@<host> 'zsh -lc "mkdir -p ~/notes && docker volume create arra-oracle-data >/dev/null && docker run -d --name arra-oracle --restart unless-stopped -p 47778:47778 -v arra-oracle-data:/data -v ~/notes:/home/oracle/notes:ro ghcr.io/soul-brews-studio/arra-oracle-v3:http"'
ssh <user>@<host> 'curl -fsS http://127.0.0.1:47778/api/health'
```

Tell the human to open Simple Mode:

```text
http://<host>:47778/simple
```

## P5 — Mine notes

Use the CLI bundled inside the running HTTP container so ingestion writes to
the same Docker volume as the server:

```bash
ssh <user>@<host> 'docker exec arra-oracle bun dist-cli/index.js mine /home/oracle/notes --dry-run'
ssh <user>@<host> 'docker exec arra-oracle bun dist-cli/index.js mine /home/oracle/notes'
```

Re-running `arra mine` is safe. Use `--watch` only for long-lived local note
folders where the server and CLI share the same data volume.

## P6 — Ask and asOf smoke

Use versioned API paths and auth/tenant headers if configured:

```bash
ORACLE_API=http://127.0.0.1:47778
curl -fsS "$ORACLE_API/api/v1/search?q=onboarding&limit=3"
curl -fsS -X POST "$ORACLE_API/api/v1/ask" \
  -H 'content-type: application/json' \
  -d '{"q":"What did we mine?","limit":3,"llm":false}'
curl -fsS -X POST "$ORACLE_API/api/v1/ask" \
  -H 'content-type: application/json' \
  -d '{"q":"What was true on 2026-07-01?","asOf":"2026-07-01T00:00:00Z","limit":3,"llm":false}'
```

Read the ask response out loud with citations and warnings. If `noEvidence` is
true, say no evidence was found instead of inventing an answer.

## P7 — Team files

Create the repo, then commit the team charter and engine map:

- `ψ/teams/<name>-team.yaml`
- `.maw/maw.config.80.json`

Spawn isolated writers with `maw wake <org>/<name> --wt coder-1 -e omx` and
verify each pane cwd. Do not trust roster output alone.

## P8 — Done report

Report only after these pass:

- SSH user + sudo + Docker verified.
- `arra-oracle-skills about` works.
- Arra Oracle health and `/simple` URL are reachable.
- `arra mine` dry-run and real mine completed.
- `/api/v1/ask` smoke returns citations or `noEvidence`.
- Team panes are live and isolated.

Reference: https://nazt.github.io/agents-in-parallel/ (Ch.5–8).

---

ARGUMENTS: $ARGUMENTS
