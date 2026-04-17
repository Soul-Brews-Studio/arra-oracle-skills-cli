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

## Step 3: Compare Versions

```bash
if [ "$CURRENT" = "$LATEST" ]; then
  echo "✅ Soul synced! ($CURRENT) [$TRACK track]"
else
  echo "⚠️ Sync needed: $CURRENT → $LATEST [$TRACK track]"
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
