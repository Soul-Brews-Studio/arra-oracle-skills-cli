---
name: alpha-feature
description: 'Full skill development pipeline — create, compile, test, commit, install. Use when user says "new skill", "create skill", "alpha-feature", or wants to build a skill end-to-end.'
argument-hint: "<name> [description]"
zombie: true
origin: arra-symbiosis-skills
---

# /alpha-feature — Create Skill + Install Locally

Create skill -> compile -> test -> commit -> push -> install. No release — use `/release` when ready.

## Usage

```
/alpha-feature whats-next "Suggest next action from context"
/alpha-feature my-skill                # Interactive — ask for description
```

## Steps

### 1. Parse Input

- `$ARGUMENTS[0]` = skill name (kebab-case)
- Rest = description (optional, ask if missing)

If no arguments, ask:
- "What should the skill be called?" (kebab-case)
- "What does it do?" (one sentence)
- "When should it trigger?" (user phrases)

### 2. Create Skill

Create `src/skills/<name>/SKILL.md`:

```markdown
---
name: <name>
description: <description>. Use when user says "<triggers>". Do NOT trigger for <anti-triggers>.
argument-hint: "<hint>"
---

# /<name>

<Instructions based on user's description>

ARGUMENTS: $ARGUMENTS
```

Follow best practices:
- Description 50+ words with explicit triggers
- Anti-triggers to avoid conflicts with existing skills
- Imperative form instructions
- Keep under 100 lines for simple skills

### 3. Compile + Test

```bash
bun run compile
bun test
```

If tests fail -> fix before continuing.

### 4. Commit + Push

```bash
git add -A
git commit -m "feat: add /<name> skill — <short description>"
git push origin main
```

### 5. Install Locally

```bash
bun run dev -- install -g -y
```

### 6. Output

```
## New Skill: /<name>

**Tests**: pass
**Installed**: locally (restart session to activate)

When ready to release: `/release`
```

## Rules

- Always add anti-triggers based on existing skill conflicts
- Always run tests before committing
- Never create skills that duplicate existing ones — check skill list first
- Keep SKILL.md lean — under 100 lines for simple skills
- Do NOT bump version or create tags — that's `/release`'s job

ARGUMENTS: $ARGUMENTS
