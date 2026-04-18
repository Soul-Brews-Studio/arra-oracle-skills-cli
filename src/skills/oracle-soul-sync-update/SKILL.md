---
name: oracle-soul-sync-update
description: Sync Oracle instruments with the family. Check and update skills to latest version. Use when user says "soul-sync", "sync", "calibrate", "update", or before /awaken.
---

# /oracle-soul-sync-update

> "Sync your soul with the family."

All-in-one skill: `/soul-sync` + `/calibrate` + `/update` combined.

## Usage

```
/oracle-soul-sync-update           # Check + update to latest STABLE
/oracle-soul-sync-update --alpha   # Check + update to latest alpha (dev track)
/oracle-soul-sync-update --check   # Only check, don't update
/oracle-soul-sync-update --cleanup # Uninstall first, then reinstall
```

## Step 0: Timestamp + Check Current Version

Read the installed version from `~/.claude/skills/VERSION.md` (the installer writes this on every install). Fall back to `arra-oracle-skills --version` if the file is missing.

```bash
date "+🕐 %H:%M %Z (%A %d %B %Y)"
CURRENT=$(grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+(-alpha\.[0-9]+)?' ~/.claude/skills/VERSION.md 2>/dev/null | head -1)
if [ -z "$CURRENT" ]; then
  CURRENT=$(arra-oracle-skills --version 2>/dev/null | grep -oE 'v?[0-9]+\.[0-9]+\.[0-9]+(-alpha\.[0-9]+)?' | head -1)
  [ -n "$CURRENT" ] && [ "${CURRENT:0:1}" != "v" ] && CURRENT="v$CURRENT"
fi
echo "Current installed: ${CURRENT:-unknown}"
```

---

## Step 2: Check Latest Version (stable vs alpha)

Tag format moved to CalVer (`v{YY}.{M}.{D}`, first number ≥ 25) in April 2026. Older tags are SemVer (`v3.x.x`). The latest-check picks CalVer first and treats SemVer as legacy.

```bash
# Get ALL tags via jq, separate stable from alpha
TAGS=$(curl -s https://api.github.com/repos/Soul-Brews-Studio/arra-oracle-skills-cli/tags | jq -r '.[].name')
LATEST_STABLE=$(echo "$TAGS" | grep -v 'alpha\|beta\|rc' | head -1)
LATEST_ALPHA=$(echo "$TAGS" | grep 'alpha' | head -1)
echo "Latest stable: $LATEST_STABLE"
echo "Latest alpha:  $LATEST_ALPHA"
```

**Default = stable.** Only `--alpha` flag switches to alpha track. Newcomers always get stable.

```bash
# Default: stable track. --alpha opts into dev track.
TRACK="stable"
LATEST="$LATEST_STABLE"

# Override with --alpha flag
# (check ARGUMENTS for --alpha)
if [ "$1" = "--alpha" ] || echo "$ARGUMENTS" | grep -q '\-\-alpha'; then
  TRACK="alpha"
  LATEST="$LATEST_ALPHA"
fi
echo "Track: $TRACK → comparing against $LATEST"
```

---

## Step 3: Compare Versions — date-drift, not semver-drift (#265)

CalVer tags encode the release date directly (`v26.4.18` = 2026-04-18). Staleness is more useful as "N days behind" than as a semver gap. Legacy SemVer tags (`v3.x.x`) are flagged for migration.

```bash
# Helpers — parse tag → YYYY-MM-DD, diff in days
tag_era() {  # "calver" | "semver" | "unknown"
  local first=$(echo "$1" | sed 's/^v//; s/-.*$//' | cut -d. -f1)
  [ -z "$first" ] && { echo unknown; return; }
  [ "$first" -ge 25 ] 2>/dev/null && echo calver || echo semver
}
tag_to_date() {  # v26.4.18 → 2026-04-18
  local core=$(echo "$1" | sed 's/^v//; s/-alpha.*$//')
  local yy=$(echo "$core" | cut -d. -f1)
  local m=$(echo "$core" | cut -d. -f2)
  local d=$(echo "$core" | cut -d. -f3)
  printf "%04d-%02d-%02d" "$((2000 + yy))" "$m" "$d"
}
alpha_hour() { echo "$1" | grep -oE 'alpha\.[0-9]+' | cut -d. -f2; }

CUR_ERA=$(tag_era "$CURRENT")
LAT_ERA=$(tag_era "$LATEST")

if [ "$CURRENT" = "$LATEST" ]; then
  echo "✅ Soul synced! ($CURRENT) [$TRACK track]"
elif [ "$CUR_ERA" = "semver" ] && [ "$LAT_ERA" = "calver" ]; then
  echo "⚠️ Legacy version — migrate $CURRENT → $LATEST (CalVer cut-over)"
else
  CUR_DATE=$(tag_to_date "$CURRENT")
  LAT_DATE=$(tag_to_date "$LATEST")
  DAYS=$(( ( $(date -d "$LAT_DATE" +%s) - $(date -d "$CUR_DATE" +%s) ) / 86400 ))
  if [ "$DAYS" -eq 0 ]; then
    CUR_H=$(alpha_hour "$CURRENT")
    LAT_H=$(alpha_hour "$LATEST")
    if [ -n "$CUR_H" ] || [ -n "$LAT_H" ]; then
      HOURS=$(( ${LAT_H:-0} - ${CUR_H:-0} ))
      [ "$HOURS" -lt 0 ] && HOURS=$(( -HOURS ))
      echo "⚠️ ${HOURS}h stale: $CURRENT → $LATEST ($CUR_DATE, same day)"
    else
      echo "⚠️ Same day, different tag: $CURRENT → $LATEST"
    fi
  else
    echo "Current installed: $CURRENT   ($CUR_DATE)"
    echo "Latest available:  $LATEST   ($LAT_DATE)"
    echo "⚠️ $DAYS days stale [$TRACK track]"
  fi
fi
```

**Default = stable.** Use `--alpha` to check/update against dev releases.

---

## Step 4: Sync (if needed)

If versions differ (or `--cleanup` flag), run:

**Normal sync:**
```bash
~/.bun/bin/bunx --bun arra-oracle-skills@github:Soul-Brews-Studio/arra-oracle-skills-cli#$LATEST install -g -y
```

**With `--cleanup` (removes old skills first):**
```bash
arra-oracle-skills uninstall -g -y && ~/.bun/bin/bunx --bun arra-oracle-skills@github:Soul-Brews-Studio/arra-oracle-skills-cli#$LATEST install -g -y
```

Then **restart Claude Code** to load the synced skills.

---

## Step 5: Verify Sync

After restart, run:
```bash
arra-oracle-skills list -g | head -5
```

Check that the version matches `$LATEST`.

---

## What's New

To see recent changes:
```bash
gh release list --repo Soul-Brews-Studio/arra-oracle-skills-cli --limit 5
```

Or view commits:
```bash
gh api repos/Soul-Brews-Studio/arra-oracle-skills-cli/commits --jq '.[0:5] | .[] | "\(.sha[0:7]) \(.commit.message | split("\n")[0])"'
```

---

> **Skill management** has moved to `/oracle` — use `/oracle install`, `/oracle remove`, `/oracle profile`, `/oracle skills`.

---

## Timing: Before /awaken

**IMPORTANT**: `/oracle-soul-sync-update` should run **before** `/awaken`, not during.

The `/awaken` wizard v2 checks skills version in Phase 0 (System Check). If outdated:
1. Run `/oracle-soul-sync-update` first
2. **Restart Claude Code** (required to load new skills)
3. Then run `/awaken`

Do NOT run `/oracle-soul-sync-update` mid-awaken — it requires a restart which breaks the wizard flow.

---

## Quick Reference

| Command | Action |
|---------|--------|
| `/oracle-soul-sync-update` | Check and sync |
| `/oracle-soul-sync-update --cleanup` | Uninstall + reinstall (removes old) |
| `/awaken` | Full awakening (**run soul-sync before, not during**) |

---

ARGUMENTS: $ARGUMENTS
