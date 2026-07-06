# Oracle Skills CLI

## Skills are the Only Source of Truth

There is **no `src/commands/` directory anymore**. Command stubs are generated
inline by the installer at install time (`src/cli/installer.ts`) for agents that
need them (OpenCode, Codex, Gemini). Claude Code invokes SKILL.md directly as `/name`.

### How It Works

```
src/skills/         →  bun run compile  →  .claude-plugin/marketplace.json
(SKILL.md files)       (validate +          (curated allowlist manifest)
                        manifest)
```

### Workflow

1. Edit skill in `src/skills/{name}/SKILL.md`
2. Run `bun run compile` — validates frontmatter + regenerates marketplace.json
3. Commit the marketplace.json change with your skill change (CI fails on drift)

### Creating New Skills

**IMPORTANT:** Every SKILL.md must have frontmatter with `name` and `description`:

```markdown
---
name: my-skill
description: Short description shown in skill list. Use when user says "trigger words".
---

# /my-skill

Full documentation here...
```

The compile script validates against the official Agent Skills spec and **fails on**:
- `name` >64 chars, not lowercase/digits/hyphens, or containing "claude"/"anthropic"
- `description` missing, >1024 chars, or containing XML tags
- missing frontmatter block

It **warns** (doesn't fail) when SKILL.md exceeds 500 lines — move detail to `references/`.

### Curation tiers → marketplace.json

`.claude-plugin/marketplace.json` is the explicit allowlist external ecosystems
read. Skills flagged `secret: true`, `hidden: true`, or `zombie: true` in
frontmatter (and everything under `src/skills/.archive/`) are **never listed**.
Note: unlisted ≠ private — files in this public repo are still readable by
anyone; see issue #441.

**Deciding what to zombie/archive** is data-driven, not vibes. Run the usage
census over your real Claude Code transcripts before demoting anything:

```bash
scripts/skill-usage-census.py                       # all skills, markdown table
scripts/skill-usage-census.py --skills recap,dig    # just these
scripts/skill-usage-census.py --json                # + monthly histogram
```

It counts user-typed (`/name`) and agent-invoked (Skill tool) hits separately by
parsing JSONL structurally (not `grep` — tool_result echoes and prose mentions
would inflate a raw count), and dedups cross-file copies left behind by repo
renames. `__tests__/census.test.ts` locks in those four behaviours.

### Installing Skills (Auto-Reload)

**DO NOT manually copy to `~/.claude/skills/`** — use the installer!

```bash
# Install specific skills (auto-reloads in Claude Code)
bun run src/cli/index.ts install -y -g --skill my-skill

# Install all skills
bun run src/cli/index.ts install -y -g
```

The installer:
1. Copies to `~/.claude/skills/`
2. Adds `installer: oracle-skills-cli v{version}` to frontmatter
3. Prepends `v{version} G-SKLL |` to description
4. Updates `.oracle-skills.json` manifest
5. **Auto-reloads** in Claude Code (no restart needed!)

### What Gets Generated

Each skill gets a command stub:

```markdown
---
description: v1.5.37 | [skill description]
---

# /{skill-name}

Execute the `{skill-name}` skill with the provided arguments.

## Instructions

1. Read the skill file: `{skillPath}/{skill-name}/SKILL.md`
2. Follow all instructions in the skill file
3. Pass these arguments to the skill: `$ARGUMENTS`
```

## Script Permissions

**All `.ts` and `.sh` scripts in `src/skills/*/scripts/` must have executable permission!**

```bash
# When creating new scripts, always set +x
chmod +x src/skills/my-skill/scripts/my-script.ts
```

**Why:** Scripts with shebang (`#!/usr/bin/env bun`) require `+x` to be invoked directly. Without it, you get "permission denied" even with correct shebang.

**Check all scripts:**
```bash
find src/skills -name "*.ts" ! -name "*.test.ts" -exec ls -la {} \; | grep -v rwx
```

## Skills with Hooks

Skills with `hooks/hooks.json` are installed as Claude Code plugins:

- Regular skills → `~/.claude/skills/`
- Skills with hooks → `~/.claude/plugins/`

Currently `ralph-loop-soulbrews` has hooks.

## Branch Strategy — **always alpha, never main**

**Every PR targets `alpha`. No exceptions for bug fixes or features.** `main` is reserved for stable cuts that happen as alpha → main release PRs (and only those).

| Work Type | Branch | PR base |
|-----------|--------|---------|
| Anything (feature, fix, refactor, docs) | `feat/*` or `fix/*` | **always `--base alpha`** |
| Stable cut | `alpha` | `--base main` (rare, deliberate, by /release-alpha or similar) |

`gh pr create` defaults to the repo's default branch (`main`) — that default is the bug. You MUST pass `--base alpha` explicitly:

```bash
gh pr create --base alpha --head feat/my-thing --title "..."
```

A PreToolUse safety hook at `~/.claude/hooks/safety-pr-base.sh` blocks any `gh pr create` against this repo that targets `main` or omits `--base`. If the hook fires, fix the flag — don't bypass it.

```bash
# Alpha work (default)
git checkout alpha
# ... work, commit, push, PR → alpha ...

# Stable release (rare)
gh pr create --base main --head alpha --title "release: vYY.M.D"
```

**`/alpha-feature`** commits to `alpha` branch.
**`/release-alpha`** tags from `alpha` branch (and only it should ever target main).

## Version Workflow — always /calver, never manual

Versions are **CalVer computed from date + time**: `v{yy}.{m}.{d}-alpha.{HMM}`
(e.g. 2026-07-06 10:44 → `v26.7.6-alpha.1044`). Never type a version by hand.

```bash
# Preview what the next version would be (no writes)
bun run calver -- --check

# Bump (writes package.json) — do this on alpha branch, at release time only
bun run calver

# Compile + test
bun run compile
bun test

# Commit + push (on alpha branch!) — CI tags + publishes from the bump commit
git add -A && git commit -m "bump: vYY.M.D-alpha.HMM"
git push origin alpha
```

Note: `bun run calver` writes package.json immediately — it is NOT a dry run.
marketplace.json intentionally carries no version field, so calver bumps never
touch it.
