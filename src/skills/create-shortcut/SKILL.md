---
name: create-shortcut
description: Create local skills as shortcuts — makes real /commands in .claude/skills/. Use when user says "create shortcut", "create skill", "make a command for", "add shortcut", or wants a quick custom /slash-command. Also lists and deletes local skills. ALSO triggers on "Unknown skill", "skill not found", or any unrecognized /slash-command — auto-creates it on the fly.
argument-hint: "[list [--mine|--untagged] | create <name> <description> | delete <name> | --cleanup [--auto]]"
---

# /create-shortcut - Local Skill Factory

Create real local skills (`.claude/skills/<name>/SKILL.md`) that show up as `/commands` in autocomplete.

## Usage

```
/create-shortcut                              # list local skills
/create-shortcut list                         # same, with numbers
/create-shortcut list --mine                  # only stamped skills (installer: create-shortcut)
/create-shortcut list --untagged              # only skills with no installer: field
/create-shortcut create deploy "Run tests then deploy"
/create-shortcut delete deploy                # delete by name
/create-shortcut delete 3                     # delete by number
/create-shortcut --cleanup                    # interactive bulk-archive of --mine skills
/create-shortcut --cleanup --auto             # auto-archive anything stamped + unused 30d+
```

## How It Works

Creates a SKILL.md in `.claude/skills/<name>/` (project-local) or `~/.claude/skills/<name>/` (global with `--global`).

The skill immediately appears in `/` autocomplete after creation.

---

## Mode 1: List (default)

Scan both local and global skills directories:

```bash
LOCAL_DIR=".claude/skills"
GLOBAL_DIR="$HOME/.claude/skills"
```

For each directory, list skill folders and show:

```
⚡ Local Skills (.claude/skills/)

   1. deploy              Run tests then deploy to prod
   2. lint-fix            Fix all linting errors
   3. db-migrate          Run database migrations

⚡ Global Skills (~/.claude/skills/)

   4. trace (v3.4.8)      [core] Find projects, code...
   5. recap (v3.4.8)      [core] Session orientation...
   ...

Delete local: /create-shortcut delete <name or number>
```

Mark **core** (arra-oracle-skills-cli installed) skills with `[core]`.
Mark **stamped** skills (with `installer: create-shortcut` in frontmatter) with `[mine]` plus a relative-age hint (e.g. `2d ago`).
Local skills with no `installer:` field have no tag (origin unknown).

### Filter flags

```
/create-shortcut list                # default — all local + global, marks [core] / [mine]
/create-shortcut list --mine         # only skills with `installer: create-shortcut`
/create-shortcut list --untagged     # only skills with NO `installer:` field (origin unknown)
```

For `--mine` and `--untagged`, the listing additionally shows:

- `created_at` age (e.g. "2 days ago", "3 weeks ago") — pulled from the frontmatter `created_at:` field for `--mine`; absent for `--untagged`.
- Approximate **usage count** — derived by greping the command name across `~/.claude/projects/*/*.jsonl` session files (read-only, no stored counter — counts stay computed, not persisted).

Example `--mine` output:

```
⚡ Your skills (installer: create-shortcut)

   1. deploy              [mine] 2d ago      · used 7×    Run tests then deploy
   2. read-and-deep-...   [mine] 1d ago      · used 1×    Read a target and deep-analyse...
   3. resonance           [mine] 3w ago      · used 24×   Capture a resonance moment...

Bulk-archive: /create-shortcut --cleanup
```

Implementation hint: parse each SKILL.md frontmatter (top YAML block between `---` lines) and check for the `installer:` key. `--mine` keeps only `installer: create-shortcut`; `--untagged` keeps only entries with no `installer:` key at all. Core skills (`installer: arra-oracle-skills-cli ...`) are excluded from both filtered views.

---

## Mode 2: Create

### `/create-shortcut create <name> [description]`

If description not provided, ask:

```
What should /<name> do?
```

Then create the skill:

```bash
SKILL_DIR=".claude/skills/<name>"
mkdir -p "$SKILL_DIR"
```

Write `SKILL.md` with a **provenance stamp** in the frontmatter (so the skill can later be filtered via `--mine` and bulk-cleaned via `--cleanup`):

```markdown
---
name: <name>
description: <description>
installer: create-shortcut
created_at: <ISO 8601 timestamp with timezone, e.g. 2026-05-14T04:15:00+07:00>
created_session: <first 8 chars of $CLAUDE_SESSION_ID, optional but nice>
---

# /<name>

<description>

## Step 0: Init

Chain date with the first real command — never call date alone (saves 1 tool call):

\```bash
date "+🕐 %H:%M %Z (%A %d %B %Y)" && <first-real-command-here>
\```

## Instructions

<Ask user what the skill should do, or generate from description>

---

ARGUMENTS: $ARGUMENTS
```

**Generating the stamp values**:

```bash
# created_at — ISO 8601 with local timezone offset
CREATED_AT="$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S%z)"

# created_session — first 8 chars of session id (skip silently if unset)
CREATED_SESSION="${CLAUDE_SESSION_ID:0:8}"
```

These three fields (`installer`, `created_at`, `created_session`) are **always written** for new skills created via this mode. They are the audit trail — without them, a skill created here is indistinguishable from one created by hand.

**After creating**, confirm:

```
✅ Created /<name>

  📁 .claude/skills/<name>/SKILL.md
  📝 <description>

  Try it: /<name>
```

### With --global flag

```
/create-shortcut create deploy "Deploy to prod" --global
```

Creates in `~/.claude/skills/` instead of `.claude/skills/`.

---

## Mode 3: Delete

### `/create-shortcut delete <name or number>`

1. Find the skill (by name or list number)
2. Show its content
3. Ask confirmation: "Delete /<name>? (yes/no)"
4. If yes:
   - Move to trash (Nothing is Deleted): `mv .claude/skills/<name> .claude/skills/.trash/<name>_$(date +%Y%m%d_%H%M%S)`
   - Create `.trash/` if needed: `mkdir -p .claude/skills/.trash`
   - Confirm: "Archived: /<name> → .claude/skills/.trash/"
5. If no: "Kept: /<name>"

**Only delete local skills.** Never delete global/core skills — warn instead:

```
⚠️ <name> is a core skill (installed by arra-oracle-skills-cli).
   Use 'arra-oracle-skills uninstall -s <name>' to remove it.
```

---

## Mode 4: Auto-Create (catch unknown commands)

When the agent encounters an unknown `/slash-command` (e.g. "Unknown skill: resonance", "skill not found: push-further", or any unrecognized `/command`), this skill activates automatically.

### Flow

1. **Parse** the command name from the error or user input (e.g. `/resonance` → `resonance`)
2. **Infer intent** from the command name + current conversation context
   - `/resonance` → "capture a resonance moment to ψ/memory/resonance/"
   - `/push-further` → "challenge the current approach, suggest improvements"
   - `/deploy-staging` → "deploy the project to staging environment"
3. **Execute immediately** — do what the user intended, don't block on skill creation
4. **Offer to save**: after executing, ask:
   ```
   Save as /command for next time? (yes/no)
   ```
5. **If yes** → create a minimal SKILL.md stub using Mode 2 (create), pre-filled with:
   - Name from the command
   - Description inferred from what was just executed
   - Instructions based on the action taken
   - **Provenance stamp** — same as Mode 2: `installer: create-shortcut`, `created_at:` (ISO 8601 + tz), `created_session:` (first 8 chars of `$CLAUDE_SESSION_ID`). Auto-created skills must be stamped too — that's how `--cleanup` later finds them.
6. **If no** → done, one-shot execution only

### Intent Inference Rules

- Treat the command name as a natural language hint: split on `-`, read as phrase
- Use conversation context (last few messages) to disambiguate
- If intent is truly ambiguous, ask ONE clarifying question before executing
- Never refuse — always attempt something reasonable

### Example

```
User: /resonance
Agent: [sees "Unknown skill: resonance"]
→ Infers: "capture a resonance moment"
→ Creates ψ/memory/resonance/<timestamp>.md with context
→ "Save as /resonance for next time? (yes/no)"
→ User: "yes"
→ Creates .claude/skills/resonance/SKILL.md
→ "/resonance is now a real command"
```

### Key Principle

> "You think it, you slash it, it exists."
>
> Skills create themselves from usage. The user never hits a dead end.

---

## Mode 5: Cleanup (interactive bulk archive)

### `/create-shortcut --cleanup`

Bulk-archive skills you created via `/create-shortcut` (anything stamped with `installer: create-shortcut`). Six months of accumulated one-shot skills, gone in one gesture — without touching `[core]` skills or hand-made externals.

### Flow

1. **Scan** both `.claude/skills/` (local) and `~/.claude/skills/` (global). Read each `SKILL.md` frontmatter and keep only entries with `installer: create-shortcut`.
2. **Enrich** each candidate with:
   - **Age** — relative form of `created_at` (e.g. "2 days ago", "3 weeks ago"). If `created_at` is missing, show "age unknown".
   - **Last invoked** — grep the command name (e.g. `/deploy`) across `~/.claude/projects/*/*.jsonl` and report days since the most recent match (e.g. "used 4d ago", "never used").
   - **Description** — first non-empty line of the `description:` field, truncated to ~60 chars.
3. **Multi-select picker** using `@clack/prompts` `multiselect` (same library + style as the existing skill picker elsewhere in the CLI). Each row:
   ```
   ◯ deploy            [local]  2d ago    used 4d ago    Build, test, deploy to prod
   ◯ resonance-lite    [global] 3w ago    never used     Capture small resonance moments
   ◯ pr-review         [local]  6mo ago   used 5mo ago   Review the current PR with checklist
   ```
   Pre-checked rows: anything **never used** OR **last-used >30 days ago**. User can toggle freely before confirming.
4. **Archive** selected skills to `.trash/<name>_<unix-timestamp>` in their respective skills directory (Nothing-is-Deleted, same convention as Mode 3):
   ```bash
   TS="$(date +%s)"
   mkdir -p "$(dirname "$SKILL")/.trash"
   mv "$SKILL" "$(dirname "$SKILL")/.trash/<name>_${TS}"
   ```
5. **Print summary**:
   ```
   ✅ Archived 7 skills.

      Recover any of them via:
        mv .claude/skills/.trash/<name>_<ts> .claude/skills/<name>
   ```

If nothing matches the scan (no stamped skills found), print:

```
No skills with `installer: create-shortcut` found.
Tip: only skills created after the provenance-stamp release show up here.
Older user skills can be retroactively migrated with `--migrate` (future).
```

### Flag: `--cleanup --auto`

```
/create-shortcut --cleanup --auto
```

Skips the interactive picker and archives everything matching the **auto-prune rule**:

- `installer: create-shortcut` (stamped by us), AND
- `created_at` is older than 30 days, AND
- last invocation is older than 30 days (or never invoked).

Default behavior is OFF — you must opt in with `--auto`. Designed for power users who trust the heuristic and want a one-keystroke sweep. Still archives to `.trash/` (recoverable, never destroyed).

### Boundaries

- **Never** touches skills with `installer: arra-oracle-skills-cli ...` (those are `[core]`; use `arra-oracle-skills uninstall` instead).
- **Never** touches skills with no `installer:` field (those are `[untagged]` — origin unknown, not safe to assume the user made them via this skill).
- **Always** moves to `.trash/`, never deletes outright. Recovery is a single `mv` away. Nothing is Deleted.

---

## Examples

```
/create-shortcut create deploy "Build, test, and deploy to Cloudflare Workers"
/create-shortcut create db-seed "Reset and seed the development database"
/create-shortcut create pr-review "Review the current PR with checklist"
/create-shortcut create morning "Run standup + check inbox + show schedule"
```

---

ARGUMENTS: $ARGUMENTS
