---
name: shortcut
description: Create, list, or remove quick skills on-the-fly. Hot-reloads instantly. Use when user says "shortcut", "create skill for me", "quick skill", "I want a /something", or describes a new command they want. Do NOT trigger for full skill development (use /alpha-feature) or profile management (use /go).
argument-hint: "create <free text> | list | remove <name>"
---

# /shortcut — Create Skills On-The-Fly

Create a skill from a prompt. Available instantly via hot-reload.

## Usage

```
/shortcut create plan for me
/shortcut deploy to production
/shortcut morning routine
/shortcut list
/shortcut remove deploy
```

Free text — no quotes needed. AI infers the skill name and description.

## create

### 1. Parse (free text)

User types natural language after "create". AI must:
1. Convert the free text to a **kebab-case name** (e.g. "create plan for me" → `create-plan-for-me`)
2. Use the full text as the **skill description/instructions**
3. If the meaning is unclear, ask the user what the skill should do

### 2. Generate SKILL.md

Write to `~/.claude/skills/<name>/SKILL.md`:

```markdown
---
name: <name>
description: User shortcut. <first 100 chars of prompt>
---

# /<name>

<Full prompt as instructions>

ARGUMENTS: $ARGUMENTS
```

```bash
mkdir -p ~/.claude/skills/<name>
# Write SKILL.md with content above
```

### 3. Confirm

```
✨ Created /<name>
   → ~/.claude/skills/<name>/SKILL.md
   Hot-reloaded. Type /<name> to use.
```

## list

Show all user-created shortcuts:

```bash
for dir in ~/.claude/skills/*/; do
  skill=$(basename "$dir")
  desc=$(head -5 "$dir/SKILL.md" 2>/dev/null | grep "description:" | sed 's/description: //')
  echo "/$skill — $desc"
done
```

Filter: show only skills with "User shortcut" in description.

## remove

```bash
rm -rf ~/.claude/skills/<name>
```

```
Removed /<name>
```

## Rules

- Name must be kebab-case (lowercase, hyphens)
- Description starts with "User shortcut." so we can identify them
- Hot-reload means no restart needed
- If skill already exists, ask before overwriting
- The prompt IS the skill — write it as instructions the AI follows

## Examples

```
/shortcut create "create-plan-for-me" "Analyze what the user just described. Break it into steps. Create GitHub issues for each step with /new-issue. Then enter plan mode (EnterPlanMode) showing all steps for user approval."

/shortcut create "quick-pr" "Check git status, commit all changes, push to current branch, create PR with auto-generated title and body."

/shortcut create "check-all" "Run: bun test, then gh pr checks, then gh issue list --state open. Show summary."
```

ARGUMENTS: $ARGUMENTS
