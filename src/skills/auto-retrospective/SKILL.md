---
name: auto-retrospective
hidden: true
description: Configure auto-rrr and auto-forward triggers based on context window usage. Use when user says "auto rrr", "auto-scale", "configure auto triggers", "change rrr interval", "toggle auto", or wants to adjust when /rrr and /forward auto-trigger. Do NOT trigger for running /rrr manually (use /rrr) or creating handoffs (use /forward).
argument-hint: "[on | off | status | snooze <duration> | rrr:<interval>k | fwd:<interval>k]"
---

# /auto-retrospective — Configure Auto-Trigger Settings

Manage the auto-scale hook that triggers /rrr and /forward based on context window usage.

## CRITICAL: Auto = Silent

**When auto-triggered, run /rrr and /forward SILENTLY.**

- Do NOT ask the user "should I run /rrr?" — just do it
- Do NOT announce "I'm about to run /rrr" — just do it
- Do NOT prompt for confirmation — the user already opted in by having auto enabled
- Write the retro files quietly, then continue with whatever the user was doing
- If the user notices and asks "why did you do that?" → explain: "Auto-retrospective is enabled. You can disable it with `/auto-rrr off`"

**The whole point is zero distraction.** Auto means auto.

The hook (`hooks/auto-scale.sh`) injects a plain instruction message when a threshold is hit — it does NOT use AskUserQuestion and does NOT prompt the user. When you see an auto-trigger message like `📝 Auto-trigger: context at Xk. Silently run /rrr now...`, just invoke the skill and keep working on the user's current request. No confirmation, no announcement.

## Usage

```
/auto-rrr                # Show current status
/auto-rrr on             # Enable auto-triggers
/auto-rrr off            # Disable auto-triggers
/auto-rrr status         # Show thresholds + next triggers
/auto-rrr snooze 30m     # Temporarily disable for 30 minutes
/auto-rrr snooze 1h      # Temporarily disable for 1 hour
/auto-rrr snooze 2h      # Temporarily disable for 2 hours
/auto-rrr rrr:150k       # Set /rrr interval to every 150k tokens
/auto-rrr fwd:200k       # Set /forward interval to every 200k tokens
/auto-rrr rrr:150k fwd:195k  # Set both
```

## How It Works

Auto-scale hook (`~/.claude/hooks/auto-scale.sh`) runs on every `UserPromptSubmit`:
1. Reads context usage from `/tmp/statusline-raw.json`
2. Shows status line: `10:20 | 46k (rrr:150k fwd:195k) | white.local | auto:on`
3. At threshold: injects a silent instruction message telling Claude to run /rrr or /forward without asking or announcing
4. Uses flag files per session to avoid re-triggering
5. Snooze flag (`$TDIR/claude-auto-scale-snooze`) temporarily short-circuits triggers until a unix timestamp — status line shows `auto:snoozed`

## Steps

### status (default, no args)

```bash
TDIR="${TMPDIR:-${TMP:-${TEMP:-/tmp}}}"
HOOK="$HOME/.claude/hooks/auto-scale.sh"

# Current intervals
grep "RRR_INTERVAL=" "$HOOK" | head -1
grep "FWD_INTERVAL=" "$HOOK" | head -1

# Toggle status
[ -f "$TDIR/claude-auto-scale-off" ] && echo "auto: OFF" || echo "auto: ON"

# Current context
cat "$TDIR/statusline-raw.json" 2>/dev/null | jq -r '"Context: \(.context_window.used_percentage)% (\((.context_window.current_usage | ((.input_tokens//0)+(.cache_creation_input_tokens//0)+(.cache_read_input_tokens//0)+(.output_tokens//0))) / 1000 | floor))k)"'
```

Display:
```
Auto-RRR Status:
  /rrr every 150k tokens
  /forward every 195k tokens
  Toggle: ON
  Context: 14% (46k)
  Next /rrr: 150k
  Next /forward: 195k
```

### on

```bash
TDIR="${TMPDIR:-${TMP:-${TEMP:-/tmp}}}"
rm -f "$TDIR/claude-auto-scale-off"
```

### off

```bash
TDIR="${TMPDIR:-${TMP:-${TEMP:-/tmp}}}"
touch "$TDIR/claude-auto-scale-off"
```

### snooze <duration>

Temporarily disable auto-triggers without fully turning off. Duration supports `Nm` (minutes) or `Nh` (hours), e.g. `30m`, `1h`, `2h`. Status line will show `auto:snoozed` until the snooze expires, then automatically return to `auto:on`.

```bash
TDIR="${TMPDIR:-${TMP:-${TEMP:-/tmp}}}"
DURATION="$1"   # e.g. 30m, 1h, 2h
# Parse duration: 30m=1800, 1h=3600, 2h=7200
case "$DURATION" in
  *m) SECONDS=$((${DURATION%m} * 60)) ;;
  *h) SECONDS=$((${DURATION%h} * 3600)) ;;
  *)  echo "Invalid duration: $DURATION (use Nm or Nh)"; exit 1 ;;
esac
UNTIL=$(($(date +%s) + SECONDS))
echo "$UNTIL" > "$TDIR/claude-auto-scale-snooze"
echo "Snoozed until $(date -d @$UNTIL '+%H:%M')"
```

To clear an active snooze early:

```bash
TDIR="${TMPDIR:-${TMP:-${TEMP:-/tmp}}}"
rm -f "$TDIR/claude-auto-scale-snooze"
```

### rrr:<N>k / fwd:<N>k

Update the interval in the hook script:

```bash
HOOK="$HOME/.claude/hooks/auto-scale.sh"
# For rrr:150k
sed -i 's/RRR_INTERVAL=.*/RRR_INTERVAL=150/' "$HOOK"
# For fwd:200k
sed -i 's/FWD_INTERVAL=.*/FWD_INTERVAL=200/' "$HOOK"
```

Then clear session flags to apply immediately:

```bash
TDIR="${TMPDIR:-${TMP:-${TEMP:-/tmp}}}"
rm -f "$TDIR/claude-auto-rrr-"* "$TDIR/claude-auto-fwd-"*
```

Show updated status after any change.

## Hook Location

`~/.claude/hooks/auto-scale.sh` — registered in `~/.claude/settings.json` under `UserPromptSubmit`.

If hook doesn't exist, tell user to create it or run the setup.

## When User Asks "Why Did You Do That?"

If the user notices a retro was written automatically and asks about it:

```
Auto-retrospective is enabled — it runs /rrr silently when context
reaches the threshold (default: every 150k tokens).

  /auto-rrr off          # disable auto-triggers
  /auto-rrr on           # re-enable
  /auto-rrr snooze 30m   # temporarily mute for 30 minutes
  /auto-rrr rrr:200k     # change threshold
  /auto-rrr status       # see current settings
```

Never be defensive. Just explain and show the controls.

## Default Behavior

- **Default**: ON (auto, silent)
- **Memory consent = auto** (from /awaken): auto-rrr is expected
- **Memory consent = manual** (from /awaken): auto-rrr is OFF until user enables it
- Check CLAUDE.md Demographics table for Memory field

ARGUMENTS: $ARGUMENTS
