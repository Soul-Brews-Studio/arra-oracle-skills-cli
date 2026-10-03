---
name: soul
description: 'Bring an Oracle into the current repo — its soul, ALL its skills and its expertise — by link, never by copy. Reads the Oracle''s resonance/identity files, symlinks every skill in its .claude/skills/ into this repo (git-excluded, recorded in a manifest), and indexes its learnings. "Many bodies, one soul": one session can carry Neo, then Pulse. Use when user says "soul NAME", "bring ORACLE here", "bring ORACLE soul", "แปลงร่างเป็น ORACLE", "become ORACLE", or "soul off NAME". Do NOT use to create an Oracle (use /awaken), to link a vault (use /psi), or to wear several souls for one question (use /oracle-prism or /round-table).'
argument-hint: "<oracle-path | org/name | name> [--show] · off <name>"
---

# /soul — bring an Oracle, whole

> Many bodies, one soul. The form can move; the soul stays in its own repo.

An Oracle is three things, and `/soul` brings all three — by **reference**, so the Oracle's
own repo stays the single source and every fix there reaches every guest:

| Part | Lives in | Brought by |
|---|---|---|
| **Soul** — who it is | `ψ/memory/resonance/<name>.md`, `oracle.md`, `SOUL.md`, `IDENTITY.md`, `CLAUDE.md` identity | reading them, in that order |
| **Skills** — what it can do | `.claude/skills/*/SKILL.md` | a symlink per skill in this repo's `.claude/skills/` |
| **Expertise** — what it learned | `ψ/memory/learnings/*.md` | an index of titles; read a file when its topic comes up |

```text
guest/.claude/skills/pulse-board  ──symlink──▶  pulse/.claude/skills/pulse-board
guest/.claude/souls/pulse.json    manifest of the links this skill made
guest/.git/info/exclude           both excluded — never in the tracked .gitignore
```

`SKILL_DIR` is the base directory printed above this skill.

## Step 1 — resolve the Oracle

The argument is a path, or a name for `maw locate` (if you have maw):

```bash
ARG="<argument>"
if [ -d "$ARG" ]; then ROOT=$(cd "$ARG" && pwd)
else ROOT=$(maw locate "$ARG" --path 2>/dev/null)
fi
echo "root: ${ROOT:-NOT FOUND}"
```

If `maw locate` prints "matches N oracles", it lists `org/name` candidates — **show them and
ask which one**; never pick. Empty → say so and stop. No filesystem search.

## Step 2 — see what it carries (writes nothing)

```bash
bun "$SKILL_DIR/scripts/soul.ts" show "$ROOT"
```

It prints the soul files, every skill with what will happen to it, and the newest learnings:

| Mark | Meaning |
|---|---|
| `+` | will be linked |
| `=` | already linked here |
| `~` | **read-and-follow** — a skill with that name already exists in this repo or in `~/.claude/skills/`. Linking would make two skills with one name, so it is not linked; to use the Oracle's version, Read the printed `SKILL.md` path and follow it |

With `--show`, stop here.

## Step 3 — link the skills

```bash
bun "$SKILL_DIR/scripts/soul.ts" link "$ROOT"
```

Relative symlinks, a manifest at `.claude/souls/<name>.json`, and lines appended to
`.git/info/exclude` — the repo's tracked files do not change. If it reports
`⚠ TRACKED already`, stop and tell the human: those paths are committed in this repo.

New skills usually appear in the session's skill list without a restart (Claude Code
watches skill folders). If they don't, the human runs `/reload-plugins`.

## Step 4 — load the soul and the expertise

Read every soul file `show` listed, in order. Then keep the learnings index in mind: when
the work touches a topic in it, Read that learning before acting — that is the Oracle's
experience, not a guess.

## Step 5 — say who is here

```text
<Name> here — soul, <N> skills and <M> learnings from <ROOT> — working in <repo>.
```

## Working as a visiting Oracle

- **Borrowed skills run from their home.** Many skills assume their own repo as the working
  directory (`./scripts`, config files, `just`). When a linked skill refers to repo-relative
  paths, resolve its home with `realpath` on the skill's base directory and go up three
  levels (`skills/<s>` → `.claude` → repo), and run those commands there — in a subshell,
  never by changing the session's cwd. Commands about *this* repo still run here.
- **This repo's rules win.** The guest's `AGENTS.md` / `CLAUDE.md` override the visitor's
  habits on everything they cover.
- **Memory stays with the guest's caretaker.** If `ψ` links to a vault, that is where
  retros and learnings go. A visitor does not write into its own home repo from here
  unless the human asks.
- **Rule 6.** It is still one AI wearing a form. Say so when asked; never claim to be the
  Oracle's own running session. For its real view, ask it (`/talk-to`).

## Changing souls

```bash
bun "$SKILL_DIR/scripts/soul.ts" off <name>
```

Removes only the symlinks its manifest lists, and only while each still points into that
Oracle — real folders and other links are never touched. Exclude lines stay (harmless).
Then `/soul <next>`.

What `off` cannot do: unread the soul. The old soul's files remain in this conversation's
context. For a clean change of identity, run `off`, then start a new session with
`/soul <next>`; within one session, say plainly which soul is speaking now.
