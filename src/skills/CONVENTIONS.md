# Skill Output Conventions

> Canonical reference for path display in SKILL.md files.
> Source of truth for `scripts/eval_clickable_paths.py` and `scripts/check_skill_convention.sh`.
> Inline reminders live adjacent to print sites; this file carries the why.

## TL;DR

Skill output appears in three modes. The path-display rule depends on mode:

| Mode | Where it appears | Path style |
|---|---|---|
| **announce** | "Written:", "Saved:", "📥 …", final summary lines | **absolute, fully literal, no ellipsis** |
| **structure** | directory diagrams, conceptual layout, file-tree comments | **bare relative** (`ψ/inbox/`, `ψ/memory/...`) — labels, not click targets |
| **code** | bash code fences | `$VAR/$FILE` — bash substitutes at execution |

Modern terminals (iTerm2, Ghostty, VS Code, Warp) only make paths starting with `/` clickable. The announce-mode rule exists because announce sites are the human's click targets; structure sites are reading material.

## Why this exists

PR #304 (`/learn`) and PR #306 (`/rrr`, `/forward`, `/recap`, `/trace`, `/inbox`) made the daily-driver skills print absolute paths. Audit issue #305 tracks the remaining 22 skills. This file generalises the pattern so every skill author (human or AI) applies it the same way — and stops over-correcting structure diagrams or under-correcting announce sites.

---

## Mode 1 — announce-mode (STRICT)

A line that tells the human a file was just written, read, or referenced. The human's terminal must be able to ⌘-click it.

**Required**:
- Path begins with `/`.
- Path is the FULL literal resolved path. No ellipsis (`...`, `…`). No `~/`. No unsubstituted `$VAR`. No `[PLACEHOLDER]` brackets.
- Canonical mechanism: emit via `bash` code fence using `echo`. Bash substitutes the variable; the AI cannot mistakenly print the literal token.

**Canonical example** (the only kind that belongs in an announce-mode SKILL.md template):

```bash
echo "📥 Written: $ABS_PATH"
# renders as:
# 📥 Written: /Users/nat/Code/github.com/Soul-Brews-Studio/arra-oracle-skills-cli-oracle/ψ/memory/retrospectives/2026-05/13/12.20_slug.md
```

**Forbidden in announce-mode** (the ban list):

| Anti-pattern | Example | Why |
|---|---|---|
| Bare relative | `📥 Written: ψ/inbox/foo.md` | Not clickable |
| Tilde | `📥 Written: ~/Code/oracle/ψ/inbox/foo.md` | Not clickable in most terminals (treated as text starting with `~`) |
| Ellipsis | `📥 Written: /opt/Code/.../oracle/ψ/inbox/foo.md` | Looks clickable, isn't — the most insidious failure |
| Unsubstituted variable | `📥 Written: $INBOX/foo.md` | AI mirrored the template instead of substituting |
| Placeholder bracket | `📥 Written: [TODAY]/[TIME]_foo.md` | Template leaked into output |

---

## Mode 2 — structure-mode (relative is correct)

Diagrams of where things live conceptually. The human is reading a tree, not clicking files.

**Example (correct as-is — do NOT rewrite as absolute)**:

```
ψ/
├── inbox/
│   ├── handoff/
│   └── YYYY-MM-DD_*.md
├── memory/
│   ├── retrospectives/
│   └── learnings/
└── outbox/
```

Rewriting these as `/Users/nat/.../ψ/inbox/` is noise. Relative paths are the right shape for layout. The mode rule says: bare `ψ/` is fine here.

---

## Mode 3 — code-mode (variables OK)

Inside ```bash``` code fences the AI runs. Bash substitutes; the human sees the resolved output, not the source.

**Correct**:

```bash
ROOT=$(git rev-parse --show-toplevel)
PSI="$ROOT/ψ"
mkdir -p "$PSI/inbox"
FILE="$PSI/inbox/$(date +%Y%m%d_%H%M)_note.md"
```

`$ROOT`, `$PSI`, `$FILE` in source — absolute path in execution. No need to render manually.

---

## Step 0 — root detection (canonical block)

Every skill that writes to `ψ/` must capture the oracle root before any write. Copy this block verbatim into Step 0:

```bash
# Find oracle root — git toplevel that has CLAUDE.md + ψ/
ORACLE_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -n "$ORACLE_ROOT" ] && [ -f "$ORACLE_ROOT/CLAUDE.md" ] && { [ -d "$ORACLE_ROOT/ψ" ] || [ -L "$ORACLE_ROOT/ψ" ]; }; then
  PSI="$ORACLE_ROOT/ψ"
elif [ -f "$(pwd)/CLAUDE.md" ] && { [ -d "$(pwd)/ψ" ] || [ -L "$(pwd)/ψ" ]; }; then
  ORACLE_ROOT="$(pwd)"
  PSI="$ORACLE_ROOT/ψ"
else
  echo "⚠️ Not in oracle repo (no CLAUDE.md + ψ/ at git root). Writing to pwd."
  ORACLE_ROOT="$(pwd)"
  PSI="$ORACLE_ROOT/ψ"
fi
```

After this block, `$PSI` is guaranteed absolute. Use `$PSI/...` (never bare `ψ/...`) when writing or printing.

Skill-specific roots (`$INBOX`, `$RETRO`, `$LEARN`, `$HANDOFF`) derive from `$PSI` and inherit absoluteness.

---

## Terminal compatibility

The announce-mode rule targets the daily-driver set.

| Terminal | Click-to-open absolute paths | Notes |
|---|---|---|
| iTerm2 | ✅ | Cmd+click; Smart Selection on by default |
| Ghostty | ✅ | Built-in |
| VS Code integrated terminal | ✅ | Cmd+click |
| Warp | ✅ | Built-in |
| Kitty | ⚠️ | Ctrl+Shift+click; requires `editor` mapping |
| Alacritty | ❌ | Needs OSC 8 hyperlinks or external tool |
| GNOME Terminal | ⚠️ | OSC 8 hyperlinks only |
| macOS Terminal.app | ⚠️ | Cmd+double-click selects; click-to-open unreliable |

Daily-driver coverage: 4/4 ✅. Tilde-expansion behaviour varies even on the ✅ row — that's why the announce rule mandates `/`-prefix unconditionally, not per-terminal detection.

---

## The per-skill inline reminder

Every announce-mode site must carry this one-liner directly above it:

```
# announce-mode → absolute path (no ψ/, no ~/, no $VAR, no ...).
# Use: echo "marker: $RESOLVED_PATH"  — bash substitutes; never print $VAR literally. See CONVENTIONS.md.
```

This is the actionable instruction the AI reads at the call site. CONVENTIONS.md is the why; the one-liner is the what-to-do-now.

---

## Eval reference

`scripts/eval_clickable_paths.py` (eval-architect's deliverable) runs these checks on real session output:

- **Q1 BARE_RELATIVE** — announce-marker followed by `ψ/`
- **Q2 UNSUBSTITUTED_VAR** — announce-marker followed by `$`
- **Q3 MARKER_MISSING_ABS** — announce-marker not followed by `/`
- **Q4 HALLUCINATED_PATH** — path in output that doesn't exist on disk
- **Q5 BARE_PSI** — bare ψ outside structure-mode blocks
- **Q6 SKILL_TEMPLATE_DRIFT** — `[BRACKET]` placeholder leaked to output
- **Q7 NOT_CLICKABLE_PROVEN** — ellipsis or `~/` in announce-mode

CI runs lexical Q1/Q2/Q5/Q6/Q7 against SKILL.md text (catches author drift). Eval runs Q1–Q7 against real session output (catches runtime drift).
