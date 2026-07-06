---
name: oracle-up
description: '[standard] G-SKLL | Bring up a whole oracle node on a remote host — provision the user, install the full toolchain (maw-js, arra-oracle-skills, arra-oracle MCP v3, omx), create the oracle repo, and stand up its Claude-leader + omx-coder team. Idempotent, dry-run by default. Use when user says "oracle-up", "bring up an oracle", "new oracle node", "provision oracle on <host>", or wants a fresh self-sufficient oracle on a remote machine. Do NOT trigger for local identity setup (use /awaken), repo-only creation (use /bud), or cloning for dev (use /incubate).'
argument-hint: "<name> --host <host> --user <user> [--port N] [--mirror nat] [--apply]"
---

# /oracle-up — Bring Up a Whole Oracle Node

> "/bud makes a body, /awaken gives a soul — /oracle-up puts the body on a host, hands it tools, and wakes its team."

Provisions a remote user, installs the full oracle toolchain, creates the oracle repo, and brings up
the standard team (Claude leader + 2 omx coders + 1 sonnet digger) — the proven `noah`/`world.wg` recipe.

**Idempotent. Dry-run by default. Each phase verifies before the next.** Real mutation only with `--apply`.

## Usage

```
/oracle-up oracle-world-oracle --host world.wg --user oracle --port 3463          # dry-run (default)
/oracle-up oracle-world-oracle --host world.wg --user oracle --port 3463 --apply  # execute, 1-by-1
```

Flags: `--name` (positional), `--host`, `--user`, `--port` (maw bind port; pick an unused one),
`--mirror` (default `nat`), `--org` (default `Soul-Brews-Studio`), `--code-root` (default `~/Code`), `--apply`.

## Step 0: Timestamp + preflight context

```bash
date "+🕐 %H:%M %Z (%A %d %B %Y)"
```

## The recipe (each phase idempotent; prints "would" unless --apply)

### P0 — Preflight (read-only)
- Connectivity: WireGuard ping + `ssh <host> 'whoami'`; out-of-band path (e.g. cloudflared alias) noted as fallback.
- `ssh <host> 'sudo -n true'` (need NOPASSWD sudo on the mirror account), OS check, `getent passwd <user>`.

### P1 — User + base tooling
```
maw user-onboard --host <host> --user <user> --sudo --mirror <mirror> --with-tooling --port <port>   # dry-run
maw user-onboard ... --apply --yes                                                                    # apply
```
Installs: useradd `-m -s /bin/zsh`, sudo group + mirrored `/etc/sudoers.d/<user>`, mirrored
authorized_keys, bun, maw-js, pm2, claude, ghq, fzf, .zshrc v4, .tmux.conf, git-config, maw.config(port), ed25519.

### P2 — sshd AllowUsers (the gap user-onboard misses — see homelab#20)
If `/etc/ssh/sshd_config` has an `AllowUsers` line, the new user is denied login with a *generic*
`Permission denied (publickey)` even with perfect keys. Fix:
```
sudo sed -i -E '/^AllowUsers /{/\b<user>\b/!s/$/ <user>/}' /etc/ssh/sshd_config
sudo sshd -t && sudo systemctl reload ssh
```
Then verify: `ssh <user>@<host> 'whoami && sudo -n true && echo SUDO-OK'`.
⚠ **fail2ban hazard**: user-onboard's `verify` phase ssh's in *before* the user can log in →
publickey failures → can self-ban your IP (esp. `bantime=-1`). Recover via the out-of-band path:
`fail2ban-client set sshd unbanip <ip>`; persist `ignoreip` for the trusted subnet.

### P3 — GitHub key (tool does not push it)
```
ssh <user>@<host> 'cat ~/.ssh/id_ed25519.pub' | gh ssh-key add - --title "<user>@<host>"
```

### P4 — Oracle toolchain
```
ssh <user>@<host> 'zsh -lc "bun add -g arra-oracle-skills && arra-oracle-skills install -g -y --agent claude-code"'
# omx (oh-my-codex) for the codex coders — install per its own method
# arra-oracle MCP v3 into the user's ~/.claude.json mcpServers (stdio: bunx --bun arra-oracle-v2@github:Soul-Brews-Studio/arra-oracle-v3#main)
# HEADLESS FLAGS (else claude stops at onboarding/trust dialog): set in ~/.claude.json:
#   hasCompletedOnboarding=true, hasTrustDialogAccepted=true,
#   projects[<repo>].hasTrustDialogAccepted=true + hasCompletedProjectOnboarding=true
```

### P4.5 — Code root override (Nat prefers ~/Code, not /opt/<user>/Code)
```
ssh <user>@<host> 'git config --global ghq.root /home/<user>/Code && mkdir -p ~/Code'
```

### P5 — Oracle repo
```
gh repo create <org>/<name> --private
# on host as <user>: clone into ~/Code, scaffold ψ/ + CLAUDE.md (or maw bud / run /awaken)
```

### P6 — Team (the-team-is-a-file, 3-file pattern)
Write **charter** `ψ/teams/<name>-team.yaml` (lead claude48 + coder-1/2 omx + digger sonnet) and
**engine map** `.maw/maw.config.80.json` (commit both; live state in `~/.claude/teams/` is never committed). Spawn:
```
maw wake <org>/<name> --wt coder-1 -e omx    --session <s>   # org-qualified REQUIRED
maw wake <org>/<name> --wt coder-2 -e omx    --session <s>
maw wake <org>/<name> --wt digger  -e sonnet --session <s>
# lead = claude48
```
**Verify isolation by cwd** (walk each pane pid→cwd; distinct paths), never trust the roster.
Or just `/team-up --gather` (reads the charter). `maw swarm` = shared cwd (read-only); `maw wake --wt` = isolated (writers).

### P7 — Token
`maw token use <name>` if a Claude token is already in the host pass-store (`maw token ls`), else note + skip.

### P8 — Verify + report
- `ssh <user>@<host> 'whoami && sudo -n true'`; `maw user-onboard ... ` (dry-run) → "everything already in place".
- `ssh <user>@<host> 'zsh -lc "maw --version && arra-oracle-skills about"'`; MCP reachable; team panes live & isolated.
- Report to the federation lead via `maw hey <lead-addr> '...'`.

## Lessons baked in
- sshd `AllowUsers` denial looks exactly like a key failure — check `sshd -T | grep allowusers` early (homelab#20).
- `verify` before login self-bans via fail2ban; recover out-of-band; persist `ignoreip` for the WG mesh.
- `maw wake` names must be **org-qualified** or they silently resolve to the wrong repo.
- Each writer needs its own `--wt` worktree; prove isolation by cwd.

Reference: https://nazt.github.io/agents-in-parallel/ (Ch.5–8).

---

ARGUMENTS: $ARGUMENTS
