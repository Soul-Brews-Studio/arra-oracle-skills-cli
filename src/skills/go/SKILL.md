---
name: go
description: 'Switch skill profiles or fresh install. Profiles: standard (14), full (21), lab (28). Use when user says "go", "go standard", "go full", "go lab", "go cleanup", "switch profile", "enable skills", "disable skills", "fresh install".'
argument-hint: "<standard|full|lab|cleanup> | enable|disable <skill...>"
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

## Execution

Parse the user's `/go` arguments and run the matching `arra-oracle-skills` CLI command.

### `/go` (no args) — show current state

```bash
arra-oracle-skills list -g
```

### `/go <profile>` — switch profile

```bash
arra-oracle-skills install -g --profile <name> -y
```

Profiles: `standard`, `full`, `lab`

- `/go standard` → `arra-oracle-skills install -g --profile standard -y`
- `/go full` → `arra-oracle-skills install -g --profile full -y`
- `/go lab` → `arra-oracle-skills install -g --profile lab -y`

### `/go cleanup` — fresh install (safe)

Crosscheck installed skills, remove stale arra-managed ones, fetch latest, reinstall. External skills are never touched.

**Step 1: Crosscheck** — list all installed skills, classify each:

```bash
SKILLS_DIR="$HOME/.claude/skills"
# Arra's known skill names (from the CLI)
ARRA_SKILLS=$(arra-oracle-skills list --all --json 2>/dev/null | jq -r '.[].name' || echo "")

echo "📋 Crosscheck:"
for dir in "$SKILLS_DIR"/*/; do
  [ -d "$dir" ] || continue
  name=$(basename "$dir")
  version=$(grep -o 'v[0-9.]*' "$dir/SKILL.md" 2>/dev/null | head -1)
  installer=$(grep -o 'installer: .*' "$dir/SKILL.md" 2>/dev/null | head -1)

  if echo "$ARRA_SKILLS" | grep -qx "$name"; then
    if [ -n "$installer" ]; then
      echo "  ✓ arra: $name ($version)"
    else
      echo "  ⚠️ conflict: $name ($version) — same name as arra skill but installed separately"
    fi
  else
    echo "  ○ external: $name (not in arra — will keep)"
  fi
done
```

**Step 2: Show full table** — display ALL 28 arra skills with status:

```
📋 Skills Overview (28 arra + N external):

  #  Skill                    Profile    Installed  Version   Status
  ── ──────────────────────── ────────── ────────── ───────── ──────
  1  about-oracle             standard   ✓          v3.7.0    ✓ ok
  2  auto-retrospective       full       ✓          v3.7.0    ✓ ok
  3  awaken                   standard   ✓          v3.7.0    ✓ ok
  4  contacts                 lab        ✓          v3.7.0    ✓ ok
  5  create-shortcut          lab        ✗          —         —
  6  dig                      standard   ✓          v3.7.0    ✓ ok
  7  dream                    lab        ✗          —         —
  8  feel                     lab        ✗          —         —
  9  forward                  standard   ✓          v3.7.0    ✓ ok
  10 go                       standard   ✓          v3.7.0    ✓ ok
  11 inbox                    lab        ✓          v3.7.0    ✓ ok
  12 incubate                 full       ✓          v3.7.0    ✓ ok
  13 learn                    standard   ✓          v3.7.0    ✓ ok
  14 oracle-family-scan       standard   ✓          v3.7.0    ✓ ok
  15 oracle-soul-sync-update  standard   ✓          v3.7.0    ✓ ok
  16 philosophy               full       ✗          —         —
  17 project                  full       ✗          —         —
  18 recap                    standard   ✓          v3.7.0    ✓ ok
  19 resonance                full       ✗          —         —
  20 rrr                      standard   ✓          v3.7.0    ✓ ok
  21 schedule                 lab        ✗          —         —
  22 standup                  standard   ✓          v3.7.0    ✓ ok
  23 talk-to                  standard   ✓          v3.7.0    ✓ ok
  24 trace                    standard   ✓          v3.7.0    ✓ ok
  25 vault                    lab        ✗          —         —
  26 where-we-are             full       ✗          —         —
  27 who-are-you              full       ✓          v1.0.22   ⚠️ conflict
  28 xray                     standard   ✓          v3.7.0    ✓ ok

  External (will keep):
  ○ drink, mawjs, mawjs-local, ultrathink
```

Status legend:
- `✓ ok` — arra-managed, correct version
- `⚠️ conflict` — same name as arra skill but installed separately or wrong version
- `⚠️ stale` — arra-managed but outdated version

**Step 2.5: Ask about usage data** — before confirming, offer insight:

```
📊 Want to see which skills you use most? (mines session history via /dig)
   This helps choose the right profile after cleanup.
   [Y/n]
```

If yes, mine all session JSONL files for skill invocations:

```bash
# Scan all sessions for skill triggers
echo "📊 Skill Usage (mining sessions...):"
TOTAL=0
for jsonl in ~/.claude/projects/*/*.jsonl; do
  [ -f "$jsonl" ] || continue
  TOTAL=$((TOTAL + 1))
done
echo "  Scanned: $TOTAL sessions"
echo ""

# Count skill invocations (look for /skill-name patterns in user messages)
# Display as table sorted by usage count (descending)
for skill in about-oracle auto-retrospective awaken contacts create-shortcut \
  dig dream feel forward go inbox incubate learn oracle-family-scan \
  oracle-soul-sync-update philosophy project recap resonance rrr \
  schedule standup talk-to trace vault where-we-are who-are-you xray; do

  count=$(grep -l "\"/$skill\"\\|\"/$skill " ~/.claude/projects/*/*.jsonl 2>/dev/null | wc -l)
  echo "$count $skill"
done | sort -rn | awk '{printf "  %-3s %-28s %s sessions\n", NR".", $2, $1}'
```

Output:
```
📊 Skill Usage (74 sessions):

  #   Skill                        Sessions
  ──  ────────────────────────────  ────────
  1.  rrr                          42 sessions
  2.  trace                        38 sessions
  3.  recap                        35 sessions
  4.  learn                        28 sessions
  5.  dig                          22 sessions
  ...
  27. schedule                     0 sessions
  28. create-shortcut              0 sessions

  💡 Skills with 0 usage might not need to be in your profile.
```

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
arra-oracle-skills uninstall -g -y

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
arra-oracle-skills install -g -s <skill...> -y
```

- `/go enable trace dig` → `arra-oracle-skills install -g -s trace dig -y`

### `/go disable <skill...>` — disable specific skills

```bash
arra-oracle-skills uninstall -g -s <skill...> -y
```

- `/go disable watch` → `arra-oracle-skills uninstall -g -s watch -y`

---

## Available Profiles

| Profile | Count | Description |
|---------|-------|-------------|
| **standard** | 14 | Daily driver — essential Oracle skills (default) |
| **full** | 21 | All stable skills (excludes lab-only) |
| **lab** | 28 | Everything including experimental |

---

## Rules

1. **Always `-g`** — global (user-level) skills
2. **Always `-y`** — skip confirmation
3. **Restart required** — agent loads skills at session start
4. **`go` is always preserved** — it's in every profile
5. **Show result** — after running the command, tell the user what changed and remind them to restart

---

ARGUMENTS: $ARGUMENTS
