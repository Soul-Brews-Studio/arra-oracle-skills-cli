---
name: oracle-soul-sync-update
description: Sync Oracle instruments with the family. Check and update skills to latest version. Use when user says "soul-sync", "sync", "calibrate", "update", or before /awaken.
---

# /oracle-soul-sync-update

> "Sync your soul with the family."

All-in-one skill: `/soul-sync` + `/calibrate` + `/update` combined.

## Usage

```
/oracle-soul-sync-update           # Check version and update
/oracle-soul-sync-update --check   # Only check, don't update
/oracle-soul-sync-update --cleanup # Uninstall first, then reinstall (removes old skills)
```

## Step 0: Timestamp + Check Current Version

Your current version is shown in the skill description above (e.g., `v1.5.37 G-SKLL`).

Extract just the version number:
```bash
date "+🕐 %H:%M %Z (%A %d %B %Y)" && CURRENT="v1.5.37" && echo "Current installed: $CURRENT"
```

---

## Step 2: Check Latest Version

```bash
# Get latest version from GitHub
LATEST=$(curl -s https://api.github.com/repos/Soul-Brews-Studio/arra-oracle-skills-cli/tags | grep -m1 '"name"' | cut -d'"' -f4)
echo "Latest available: $LATEST"
```

---

## Step 3: Compare Versions

```bash
if [ "$CURRENT" = "$LATEST" ]; then
  echo "✅ Soul synced! ($CURRENT)"
else
  echo "⚠️ Sync needed: $CURRENT → $LATEST"
fi
```

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
