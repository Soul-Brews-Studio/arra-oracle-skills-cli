---
name: harden
description: 'Audit Oracle configuration for safety, governance, and hardening. Use when user says "harden", "audit", "security check", "governance", or wants to verify oracle setup.'
argument-hint: "[--full | --secrets | --rules | --fix]"

---

# /harden — Oracle Governance Audit

> Sharp instruments need safe sheaths. The Whetstone hardens what it sharpens.

Audit an Oracle's configuration for safety, governance compliance, and operational hardening. Catches misconfigurations before they become incidents.

## Usage

```
/harden                # Quick audit — check all, report issues
/harden --full         # Deep audit — check all + suggest fixes
/harden --secrets      # Secrets scan only — .env, keys, tokens
/harden --rules        # Golden rules compliance check
/harden --fix          # Auto-fix safe issues (with confirmation)
```

---

## Step 0: Detect Oracle Root

```bash
date "+🕐 %H:%M %Z (%A %d %B %Y)" && ORACLE_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -n "$ORACLE_ROOT" ] && [ -f "$ORACLE_ROOT/CLAUDE.md" ] && { [ -d "$ORACLE_ROOT/ψ" ] || [ -L "$ORACLE_ROOT/ψ" ]; }; then
  PSI="$ORACLE_ROOT/ψ"
  echo "✅ Oracle root: $ORACLE_ROOT"
else
  echo "❌ Not in an oracle repo. /harden requires CLAUDE.md + ψ/ directory."
  exit 1
fi
```

---

## Step 1: Secrets Scan

Check for leaked secrets in tracked files:

```bash
# Check for common secret patterns in git-tracked files
cd "$ORACLE_ROOT"

echo "🔍 Scanning for secrets..."

# .env files that shouldn't be tracked
git ls-files | grep -E '\.env($|\.)' | grep -v '\.example' | while read f; do
  echo "🚨 CRITICAL: $f is tracked by git!"
done

# Common secret patterns in tracked files (excluding binary)
git ls-files | xargs grep -l -E '(PRIVATE_KEY|API_KEY|SECRET_KEY|password|token|Bearer [a-zA-Z0-9]|sk-[a-zA-Z0-9]{20,})' 2>/dev/null | grep -v -E '(node_modules|\.lock|SKILL\.md|CLAUDE\.md)' | while read f; do
  echo "⚠️ Possible secret in: $f"
done
```

### .gitignore Checks

```bash
# Essential ignores for oracle repos
MISSING_IGNORES=""
for pattern in ".env" "node_modules/" ".DS_Store" "ψ/active/" "ψ/memory/logs/"; do
  if ! grep -qF "$pattern" "$ORACLE_ROOT/.gitignore" 2>/dev/null; then
    MISSING_IGNORES="$MISSING_IGNORES\n  ❌ Missing: $pattern"
  fi
done

if [ -n "$MISSING_IGNORES" ]; then
  echo "📋 .gitignore gaps:$MISSING_IGNORES"
else
  echo "✅ .gitignore covers essentials"
fi
```

---

## Step 2: Golden Rules Compliance

Read CLAUDE.md and verify the 5 Principles + Rule 6 are present:

```bash
echo "📜 Checking Golden Rules..."
CLAUDE_MD="$ORACLE_ROOT/CLAUDE.md"
```

Check for:

| Rule | Search Pattern | Required |
|------|---------------|----------|
| Nothing is Deleted | `Nothing is Deleted` | Yes |
| Patterns Over Intentions | `Patterns Over Intentions` | Yes |
| External Brain | `External Brain` | Yes |
| Curiosity Creates | `Curiosity Creates` | Yes |
| Form and Formless | `Form and Formless` | Yes |
| Rule 6 (Transparency) | `Oracle Never Pretends` | Yes |
| No force push | `force` or `--force` in golden rules | Yes |
| No rm -rf | `rm -rf` in golden rules | Yes |
| No secrets | `secrets` or `.env` in golden rules | Yes |

Report missing principles as warnings.

---

## Step 3: Brain Structure Audit

Verify ψ/ directory structure:

```bash
echo "🧠 Checking brain structure..."
PSI_REAL=$(readlink -f "$PSI" 2>/dev/null || echo "$PSI")

for dir in inbox memory writing lab learn active archive outbox; do
  if [ -d "$PSI_REAL/$dir" ]; then
    COUNT=$(find "$PSI_REAL/$dir" -type f 2>/dev/null | wc -l)
    echo "  ✅ ψ/$dir/ ($COUNT files)"
  else
    echo "  ⚠️ ψ/$dir/ missing"
  fi
done
```

### ψ/ Symlink Check

```bash
if [ -L "$ORACLE_ROOT/ψ" ]; then
  TARGET=$(readlink "$ORACLE_ROOT/ψ")
  echo "  🔗 ψ → $TARGET"
  if [ ! -d "$TARGET" ]; then
    echo "  🚨 Symlink target doesn't exist!"
  fi
else
  echo "  📁 ψ/ is a regular directory"
fi
```

---

## Step 4: Identity Verification

Check CLAUDE.md has required identity fields:

```bash
echo "🪪 Checking identity..."
```

| Field | Pattern | Required |
|-------|---------|----------|
| Name | `I am` or `name:` | Yes |
| Human | `Human:` | Yes |
| Purpose | `Purpose:` | Yes |
| Born | `Born:` | Recommended |
| Theme | `Theme:` | Recommended |
| Node | `Node:` | For fleet oracles |

---

## Step 5: Operational Checks

### Git Config

```bash
echo "⚙️ Checking git config..."
# Verify git user is set (not default)
GIT_USER=$(git config user.name 2>/dev/null)
GIT_EMAIL=$(git config user.email 2>/dev/null)
echo "  User: $GIT_USER <$GIT_EMAIL>"

# Check for dangerous aliases
git config --get-regexp alias 2>/dev/null | grep -E '(force|reset.*hard|clean.*-f)' && echo "  ⚠️ Dangerous git aliases found"
```

### Installed Skills Check

```bash
echo "🔧 Checking installed skills..."
if [ -d "$ORACLE_ROOT/.claude/settings" ] || [ -f "$ORACLE_ROOT/.claude/settings.json" ]; then
  echo "  ✅ Claude settings present"
else
  echo "  ⚠️ No Claude settings — skills may not be installed"
fi
```

### Contacts (if fleet oracle)

```bash
if [ -f "$PSI/contacts.json" ]; then
  CONTACT_COUNT=$(python3 -c "import json; print(len(json.load(open('$PSI/contacts.json')).get('contacts',{})))" 2>/dev/null || echo "?")
  echo "  📇 $CONTACT_COUNT contacts registered"
fi
```

---

## Step 6: Report

Output a summary table:

```
🛡️ /harden Audit Report — [oracle-name]

  Category         Status    Issues
  ──────────────── ───────── ──────
  Secrets          ✅ Clean   0
  Golden Rules     ⚠️ Gaps    2 missing
  Brain Structure  ✅ Complete 0
  Identity         ✅ Valid   0
  Operations       ⚠️ Check   1 warning
  .gitignore       ✅ Good    0

  Score: 4/6 ✅ | 2/6 ⚠️ | 0/6 🚨

  💡 Run /harden --fix to auto-fix safe issues
  💡 Run /harden --full for detailed recommendations
```

---

## Step 7: Auto-Fix (`--fix` mode)

**WAIT for user confirmation before any fix.**

Safe auto-fixes:
- Add missing .gitignore patterns
- Create missing ψ/ subdirectories
- Add missing identity fields to CLAUDE.md (with placeholder values)

Unsafe (manual only):
- Removing tracked secrets (requires `git rm` + history rewrite)
- Modifying golden rules
- Changing git config

---

## Rules

1. **Read-only by default** — never modify without `--fix` + confirmation
2. **Oracle root required** — refuse to run outside oracle repos
3. **No false positives on SKILL.md** — skill files legitimately contain words like "secret", "token", "key"
4. **Score honestly** — don't inflate for morale
5. **Actionable output** — every warning must include how to fix

---

ARGUMENTS: $ARGUMENTS
