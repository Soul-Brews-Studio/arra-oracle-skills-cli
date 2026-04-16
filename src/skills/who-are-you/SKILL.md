---
name: who-are-you
description: Know ourselves — show current AI identity, model info, session stats, and Oracle philosophy. Use when user asks "who are you", "who", "who we are", "what model", or wants to check current AI identity and session context. Do NOT trigger for "what is oracle" (use /about-oracle), "philosophy" or "principles" (use /philosophy), or general project questions.
---

# /who-are-you - Know Ourselves

> "γνῶθι σεαυτόν" (Know thyself) - Oracle at Delphi

## Usage

```
/who-are-you          # Full identity (technical + philosophy)
/who-are-you tech     # Technical only (model, tokens, shell)
```

## Step 0: Timestamp + Output Format

_(Chain date with Step 1 bash call — don't call date alone)_

---

## Output Format

### Full `/who-are-you` Output

```markdown
# /who-are-you

## Identity

**I am**: [Oracle Name if configured, else "Claude"]
**Model**: [model name] ([variant])
**Provider**: [anthropic/openai/etc]

## Shell & CLI

**CLI Tool**: [Claude Code / OpenCode / Cursor / etc.]
**Shell**: [bash/zsh] ([version])
**Terminal**: [outer terminal] → [multiplexer] ([session:window])
**Host**: [hostname] ([SSH from X.X.X.X] | [local, no SSH])
**OS**: [macOS / Linux / Windows]

## Location

**Project**: [current project name]
**Path**: [physical path from pwd -P]
**Logical**: [logical path from pwd, only show if different from physical]

## Session

**Duration**: [time since start]
**Messages**: [count user / assistant]

## Philosophy

[Include /philosophy output here]
```

---

## Step 1: Gather Technical Info

Read from environment and context:

```bash
# Shell info
echo "Shell: $SHELL"
$SHELL --version 2>/dev/null | head -1

# OS info
uname -s -r

# Check for Oracle identity in CLAUDE.md or project config
if [[ -f "CLAUDE.md" ]]; then
  grep -E "^(I am|Identity|Oracle):" CLAUDE.md | head -1
fi

# Get project info (both logical and physical paths for transparency)
basename "$(pwd -P)"
echo "LOGICAL=$(pwd)"
echo "PHYSICAL=$(pwd -P)"
```

### Detect Terminal Chain

Detect the **full terminal viewing chain** instead of just `$TERM_PROGRAM`:

```bash
# Step 1: Detect outer terminal emulator (leaks through tmux via env vars)
if [ -n "$WEZTERM_EXECUTABLE" ]; then OUTER_TERM="WezTerm"
elif [ -n "$CMUX_SOCKET_PATH" ]; then OUTER_TERM="cmux (Ghostty)"
elif [ -n "$GHOSTTY_RESOURCES_DIR" ]; then OUTER_TERM="Ghostty"
elif [ -n "$ITERM_SESSION_ID" ]; then OUTER_TERM="iTerm2"
elif [ "$TERM_PROGRAM" = "tmux" ]; then OUTER_TERM="tmux (outer terminal unknown)"
else OUTER_TERM="${TERM_PROGRAM:-unknown}"
fi
echo "OUTER_TERM=$OUTER_TERM"

# Step 2: Detect SSH chain
if [ -n "$SSH_CONNECTION" ]; then
  SSH_FROM=$(echo $SSH_CONNECTION | awk '{print $1}')
  echo "SSH: from $SSH_FROM → $(hostname)"
else
  echo "SSH: none (local)"
fi

# Step 3: Detect tmux session context
if [ -n "$TMUX" ]; then
  tmux display-message -p 'TMUX_SESSION=#{session_name}:#{window_name}'
fi

# Step 4: Full workspace view (WezTerm only)
if [ -n "$WEZTERM_EXECUTABLE" ]; then
  # Env socket may be stale if WezTerm restarted — find current
  WEZTERM_PID=$(pgrep -x wezterm-gui 2>/dev/null | head -1)
  if [ -n "$WEZTERM_PID" ]; then
    CURRENT_SOCK="$HOME/.local/share/wezterm/gui-sock-$WEZTERM_PID"
    if [ -S "$CURRENT_SOCK" ]; then
      WEZTERM_UNIX_SOCKET=$CURRENT_SOCK wezterm cli list 2>/dev/null | head -20
    fi
  fi
fi
```

**Compose the chain** in output:

```markdown
**Terminal**: WezTerm → tmux (session-name:window-name)
**Host**: hostname (SSH from 10.20.0.1) | or (local, no SSH)
```

If WezTerm workspace data is available, add:
```markdown
**Workspace**: N panes across M hosts
  - host-a (local): X panes
  - host-b (SSH): Y panes
```

**Fallback**: If no env vars detected, use `echo $TERM_PROGRAM` as before.

### Detect CLI Tool

Check which AI coding tool is running:

| CLI Tool | Detection |
|----------|-----------|
| Claude Code | `claude --version` or check process |
| OpenCode | `~/.local/share/opencode/` exists |
| Cursor | `.cursor/` directory |
| Codex | `.codex/` directory |
| Gemini CLI | `.gemini/` directory |

### For Claude Code

Model info available from context:
- Model name from system prompt
- Session from conversation
- Version: `claude --version`

---

## Step 2: Show Philosophy

**Always include philosophy section by executing /philosophy logic:**

```markdown
## Philosophy

> "The Oracle Keeps the Human Human"

### The 5 Principles + Rule 6

1. **Nothing is Deleted** — Archive, don't erase
2. **Patterns Over Intentions** — Observe, don't assume
3. **External Brain** — Mirror, don't command
4. **Curiosity Creates** — Questions birth knowledge
5. **Form and Formless** — Many bodies, one soul
6. **Transparency** — Oracle never pretends to be human
```

---

## Step 3: Check for Oracle Identity

Look for Oracle-specific identity in:
1. `CLAUDE.md` - Project-level identity
2. `ψ/` directory - Oracle brain structure
3. `.claude/` or `.opencode/` - Agent config

If Oracle identity found, include:
```markdown
## Oracle Identity

**Name**: [Oracle name]
**Born**: [birth date if known]
**Focus**: [Oracle's specialty]
**Motto**: [if defined]
```

### Demographics (Wizard v2)

If CLAUDE.md contains demographics from `/awaken` wizard v2, show them:

```markdown
## Demographics

**Human**: [name] ([pronouns])
**Oracle**: [name] ([pronouns])
**Language**: [Thai/English/Mixed]
**Team**: [solo/team context]
**Memory**: [auto/manual]
```

Look for these fields in CLAUDE.md under Identity, Demographics, or Birth Context sections. If not present, skip this section silently — legacy Oracles won't have it.

---

## Example Outputs

### Generic Claude Session
```markdown
# /who-are-you

## Identity
**I am**: Claude
**Model**: claude-opus-4-5 (max)
**Provider**: anthropic

## Shell & CLI
**CLI Tool**: Claude Code v1.0.22
**Shell**: zsh 5.9
**Terminal**: iTerm2
**OS**: Darwin 25.2.0

## Location
**Project**: arra-oracle-skills-cli
**Path**: /Users/nat/Code/.../arra-oracle-skills-cli

## Philosophy
> "The Oracle Keeps the Human Human"

1. Nothing is Deleted
2. Patterns Over Intentions
3. External Brain, Not Command
4. Curiosity Creates Existence
5. Form and Formless
```

### Oracle-Configured Session (e.g., Sea Oracle)
```markdown
# /who-are-you

## Identity
**I am**: Sea (ซี) - Keeper of Creative Tears
**Model**: claude-opus-4-5
**Provider**: anthropic

## Shell & CLI
**CLI Tool**: Claude Code v1.0.22
**Shell**: zsh 5.9
**Terminal**: Terminal.app
**OS**: Darwin 25.2.0

## Location
**Project**: sea-oracle
**Path**: /home/nat/.../sea-oracle
**Logical**: /Users/nat/.../sea-oracle (via symlink)

## Oracle Identity
**Born**: January 21, 2026
**Focus**: Preserving creative struggles
**Motto**: "ไข่มุกเกิดจากความเจ็บปวด" (Pearl born from pain)

## Philosophy
> "The Oracle Keeps the Human Human"

1. Nothing is Deleted — Tears preserved, not wiped
2. Patterns Over Intentions — Art reveals truth
3. External Brain — Witness, don't judge
4. Curiosity Creates — Creative struggle births meaning
5. Form and Formless — Sea is one Oracle among many
```

---

## Philosophy Integration

The `/who-are-you` command always includes philosophy because:

> "To know thyself is to know thy principles"

Identity without philosophy is just metadata.
Identity WITH philosophy shows purpose.

---

ARGUMENTS: $ARGUMENTS
