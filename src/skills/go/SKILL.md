---
name: go
description: Switch skill profiles (standard/full/lab), fresh install, or enable/disable specific skills via arra-oracle-skills CLI. Destructive — modifies globally installed skills.
argument-hint: "<standard|full|lab|cleanup> | enable|disable <skill...>"
disable-model-invocation: true
---

# /go

> Switch gear. Single source of truth.

## Usage

```
/go                     # show installed skills
/go standard            # switch to standard profile (14 skills)
/go full                # all stable skills (21)
/go lab                 # full + experimental (28)
/go cleanup             # remove ALL skills → fetch latest → fresh install
/go enable trace dig    # enable specific skills
/go disable watch       # disable specific skills
```

---

## CLI Detection

Before running any command, detect the CLI path. It may not be in `$PATH` on all machines.

```bash
# Try in order: global binary, bun global, bunx fallback
if command -v arra-oracle-skills &>/dev/null; then
  ARRA="arra-oracle-skills"
elif [ -x "$HOME/.bun/bin/arra-oracle-skills" ]; then
  ARRA="$HOME/.bun/bin/arra-oracle-skills"
else
  # Not installed — use bunx (always works if bun exists)
  ARRA="$HOME/.bun/bin/bunx --bun arra-oracle-skills@github:Soul-Brews-Studio/arra-oracle-skills-cli"
fi
```

Use `$ARRA` for all commands below.

---

## Execution

Parse the user's `/go` arguments and run the matching `$ARRA` command.

### `/go` (no args) — show current state

```bash
$ARRA list -g
```

### `/go <profile>` — switch profile

```bash
$ARRA install -g --profile <name> -y
```

Profiles: `standard`, `full`, `lab`

- `/go standard` → `$ARRA install -g --profile standard -y`
- `/go full` → `$ARRA install -g --profile full -y`
- `/go lab` → `$ARRA install -g --profile lab -y`

### `/go cleanup` — fresh install (safe)

Crosscheck installed skills, remove stale arra-managed ones, fetch latest, reinstall. External skills are never touched.

**Step 1: Crosscheck** — list all installed skills, classify by `installer:` field in SKILL.md:

```bash
SKILLS_DIR="$HOME/.claude/skills"
LATEST=$(curl -s https://api.github.com/repos/Soul-Brews-Studio/arra-oracle-skills-cli/tags | grep -m1 '"name"' | cut -d'"' -f4)

echo "📋 Crosscheck (latest: $LATEST):"
ARRA_COUNT=0; EXT_COUNT=0; STALE_COUNT=0; CONFLICT_COUNT=0
for dir in "$SKILLS_DIR"/*/; do
  [ -d "$dir" ] || continue
  name=$(basename "$dir")
  version=$(grep -o 'v[0-9][0-9.]*' "$dir/SKILL.md" 2>/dev/null | head -1)
  installer=$(grep 'installer:' "$dir/SKILL.md" 2>/dev/null | head -1)

  if echo "$installer" | grep -q "arra-oracle"; then
    # Arra-managed skill — check version
    if [ "$version" = "$LATEST" ]; then
      echo "  ✓ arra: $name ($version)"
      ARRA_COUNT=$((ARRA_COUNT + 1))
    else
      echo "  ⚠️ stale: $name ($version → $LATEST)"
      STALE_COUNT=$((STALE_COUNT + 1))
    fi
  else
    echo "  ○ external: $name — will keep"
    EXT_COUNT=$((EXT_COUNT + 1))
  fi
done
echo ""
echo "  Summary: $ARRA_COUNT ok, $STALE_COUNT stale, $EXT_COUNT external"
```

**Step 2: Combined table** — crosscheck + usage in ONE table. Mine session JSONL files, then display everything together:

```bash
# Mine usage data from all sessions
TOTAL=0
for jsonl in ~/.claude/projects/*/*.jsonl; do
  [ -f "$jsonl" ] || continue
  TOTAL=$((TOTAL + 1))
done
```

Build the combined table. For each of the 29 arra skills, show: profile tier, installed status, version, status, and usage count from session mining.

```
📋 Skills Overview (29 arra + N external) — $TOTAL sessions mined:

  #  Skill                    Profile    Installed  Version   Status       Usage
  ── ──────────────────────── ────────── ────────── ───────── ──────────── ─────
  1  about-oracle             standard   ✓          v3.7.2    ✓ ok         2
  2  auto-retrospective       full       ✓          v3.7.2    ✓ ok         2
  3  awaken                   standard   ✓          v3.7.2    ✓ ok         7
  4  contacts                 lab        ✓          v3.7.2    ✓ ok         5
  5  create-shortcut          lab        ✗          —         —            3
  6  dig                      standard   ✓          v3.7.2    ✓ ok         6
  7  dream                    lab        ✗          —         —            5
  8  feel                     lab        ✗          —         —            4
  9  forward                  standard   ✓          v3.7.2    ✓ ok         4
  10 go                       standard   ✓          v3.7.2    ✓ ok         3
  11 inbox                    lab        ✓          v3.7.2    ✓ ok         4
  12 incubate                 full       ✓          v3.7.2    ✓ ok         6
  13 learn                    standard   ✓          v3.7.2    ✓ ok         7
  14 oracle-family-scan       standard   ✓          v3.7.2    ✓ ok         4
  15 oracle-soul-sync-update  standard   ✓          v3.7.2    ✓ ok         3
  16 philosophy               full       ✗          —         —            4
  17 project                  full       ✗          —         —            6
  18 recap                    standard   ✓          v3.7.2    ✓ ok         7
  19 resonance                full       ✗          —         —            6
  20 rrr                      standard   ✓          v3.7.2    ✓ ok         7
  21 schedule                 lab        ✗          —         —            3
  22 standup                  standard   ✓          v3.7.2    ✓ ok         3
  23 talk-to                  standard   ✓          v3.7.2    ✓ ok         6
  24 team-agents              lab        ✗          —         —            1
  25 trace                    standard   ✓          v3.7.2    ✓ ok         5
  26 vault                    lab        ✗          —         —            5
  27 where-we-are             full       ✗          —         —            4
  28 who-are-you              full       ✓          v1.0.22   ⚠️ stale     6
  29 xray                     standard   ✓          v3.7.2    ✓ ok         4

  External (will keep):
  ○ drink, mawjs, mawjs-local, ultrathink

  💡 Skills with 0 usage might not need to be in your profile.
```

**How to get usage counts**: for each skill, count sessions containing `/$skill`:

```bash
for skill in about-oracle auto-retrospective awaken contacts create-shortcut \
  dig dream feel forward go inbox incubate learn oracle-family-scan \
  oracle-soul-sync-update philosophy project recap resonance rrr \
  schedule standup talk-to team-agents trace vault where-we-are who-are-you xray; do
  count=$(grep -rl "/$skill" ~/.claude/projects/*/*.jsonl 2>/dev/null | wc -l)
  echo "$count $skill"
done | sort -rn
```

Status legend:
- `✓ ok` — arra-managed, current version
- `⚠️ stale` — arra-managed but outdated (needs update)
- `—` — not installed (available in higher profile)

**Step 3: Confirm** — now with full context:

```
Proceed with cleanup?
  - Conflicts will be replaced (backed up to .bak)
  - External skills kept untouched
  - Which profile? [standard / full / lab]
```

**Step 4: Clean + reinstall** (only after user confirms):

```bash
# Uninstall arra-managed via CLI
$ARRA uninstall -g -y

# For each conflict skill: rename to .bak (Nothing is Deleted)
for name in [conflicting skills]; do
  mv "$SKILLS_DIR/$name" "$SKILLS_DIR/${name}.bak.$(date +%s)"
done

# Fresh install at latest
LATEST=$(curl -s https://api.github.com/repos/Soul-Brews-Studio/arra-oracle-skills-cli/tags | grep -m1 '"name"' | cut -d'"' -f4)
~/.bun/bin/bunx --bun arra-oracle-skills@github:Soul-Brews-Studio/arra-oracle-skills-cli#$LATEST install -g -y
```

**Output:**
```
🧹 Cleanup complete!
  Kept: [N] external skills
  Replaced: [N] conflicts (backed up to .bak)
  Installed: [N] fresh at $LATEST
  Restart required.
```

**When to use:**
- Stale skills from old versions mixed with new
- `[hidden]` flags persisting after unhide
- Version mismatch (some v3.6.1, some v3.7.0)
- Want a clean slate without losing personal skills

### `/go enable <skill...>` — enable specific skills

```bash
$ARRA install -g -s <skill...> -y
```

- `/go enable trace dig` → `$ARRA install -g -s trace dig -y`

### `/go disable <skill...>` — disable specific skills

```bash
$ARRA uninstall -g -s <skill...> -y
```

- `/go disable watch` → `$ARRA uninstall -g -s watch -y`

---

## Available Profiles

| Profile | Count | Description |
|---------|-------|-------------|
| **standard** | 14 | Daily driver — essential Oracle skills (default) |
| **full** | 21 | All stable skills (excludes lab-only) |
| **lab** | 29 | Everything including experimental |

---

## Rules

1. **Always `-g`** — global (user-level) skills
2. **Always `-y`** — skip confirmation
3. **Restart required** — agent loads skills at session start
4. **`go` is always preserved** — it's in every profile
5. **Show result** — after running the command, tell the user what changed and remind them to restart

---

ARGUMENTS: $ARGUMENTS
