---
name: create-shortcut
description: Create local skills as shortcuts — makes real /commands in .claude/skills/. Use when user says "create shortcut", "create skill", "make a command for", "add shortcut", or wants a quick custom /slash-command. Also lists and deletes local skills. ALSO triggers on "Unknown skill", "skill not found", or any unrecognized /slash-command — auto-creates it on the fly.
argument-hint: "[list | create <name> <description> | delete <name>]"
---

# /create-shortcut - Local Skill Factory

Create real local skills (`.claude/skills/<name>/SKILL.md`) that show up as `/commands` in autocomplete.

## Usage

```
/create-shortcut                              # list local skills
/create-shortcut list                         # same, with numbers
/create-shortcut create deploy "Run tests then deploy"
/create-shortcut delete deploy                # delete by name
/create-shortcut delete 3                     # delete by number
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

Mark core (arra-oracle-skills-cli installed) skills with `[core]`. Local skills have no tag.

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

Write `SKILL.md`:

```markdown
---
name: <name>
description: <description>
---

# /<name>

<description>

## Instructions

<Ask user what the skill should do, or generate from description>

---

ARGUMENTS: $ARGUMENTS
```

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

## Examples

```
/create-shortcut create deploy "Build, test, and deploy to Cloudflare Workers"
/create-shortcut create db-seed "Reset and seed the development database"
/create-shortcut create pr-review "Review the current PR with checklist"
/create-shortcut create morning "Run standup + check inbox + show schedule"
```

---

ARGUMENTS: $ARGUMENTS
