---
name: talk-to
description: Talk to another Oracle agent via threads. Use when user says "talk to", "message", "chat with", or wants to communicate with another agent (e.g. "talk to pulse", "message neo"). Do NOT trigger for OracleNet social feed (use /oraclenet), skill management (use /oracle), or family registry (use /oracle-family-scan).
argument-hint: "<agent-name> [message]"
---

# /talk-to - Agent Messaging

Send messages to agents via Oracle threads. Each agent has a persistent channel thread.

## Usage

```
/talk-to arthur "What's your status?"          # one-shot message
/talk-to arthur --new "Hey, starting fresh"    # skip lookup, create new thread
/talk-to arthur loop ask about their work      # autonomous conversation
/talk-to #42 "follow up on this"               # post to thread by ID
/talk-to --list                                # show channels
/talk-to arthur --maw "quick ping"             # force maw transport (real-time tmux)
/talk-to arthur --thread "async question"      # force MCP thread transport
```

## Mode 0: No arguments

If ARGUMENTS is empty, show usage help then run --list.

## Transport Selection

| Flag | Transport | Best For |
|------|-----------|----------|
| (none) | **auto** — detect best | Default |
| `--maw` | `maw hey` (tmux sendkeys) | Real-time, local fleet, low latency |
| `--thread` | MCP `oracle_thread` | Async, persistent, cross-machine |

**Auto-detect logic** (when no flag):
1. Check `ψ/contacts.json` for target agent's transport info
2. Is target a local tmux session? (`maw ls` or contacts has `maw` field) → use `maw hey`
3. Otherwise → use MCP thread (async, persistent)

```bash
# Auto-detect: check if target is a local tmux session
maw ls 2>/dev/null | grep -q "{agent}" && echo "USE_MAW" || echo "USE_THREAD"
```

When using `--maw`:
1. Compose message from intent
2. `maw hey {agent}-oracle '{message}'`
3. Optionally `maw peek {agent}-oracle` to check response
4. Confirm: `Sent via maw to {agent}`

When using `--thread` (or auto-detected thread):
Fall through to Mode 3 (one-shot) below.

## Routing

| Pattern | Use |
|---------|-----|
| `channel:{agent}` | Persistent per-agent channel |
| `topic:{agent}:{slug}` | Topic-specific thread (with `--topic`) |
| `#{id}` | Direct thread reference by ID |

## Mode 1: --list

1. `arra_threads()` (no status filter)
2. Filter titles starting with `channel:` or `topic:`, exclude `closed`
3. Display: `channel:arthur (#42) pending — 12 msgs`

## Mode 2: --new (fast create)

Skip lookup. One MCP call.

1. Compose message from intent
2. `arra_thread({ title: "channel:{agent}", message, role: "human" })`
3. **Notify**: `Bash maw hey {agent}-oracle 'Thread #{id} from {self}: {preview}'`
   - If `maw hey` fails → warn only, don't error (thread already sent)
4. Confirm: `Created channel:{agent} (thread #{id})`

## Mode 3: One-shot (default)

1. Compose message from intent
2. If first arg is `#{id}` → post directly to that thread ID
3. Otherwise: `arra_threads()` → find `channel:{agent}`, create if missing
4. Post message to thread
5. **Notify**: `Bash maw hey {agent}-oracle 'Thread #{id} from {self}: {preview}'`
   - If `maw hey` fails → warn only, don't error (thread already sent)
6. `arra_thread_read({ threadId })` → show any agent responses
7. Confirm: `Posted to channel:{agent} (thread #{id})`

## Mode 4: loop (autonomous conversation)

Like Ralph loop — AI drives the conversation autonomously. No user prompts between turns.

1. Find or create thread (`channel:{agent}`, or `--new` to skip lookup)
2. Compose opening message from user's intent and post it
3. **Autonomous loop** (max 10 iterations):
   a. `arra_thread_read({ threadId })` — check for new messages
   b. If agent responded: read their response, compose a thoughtful follow-up, post it
   c. If no new response: compose a follow-up question or probe deeper, post it
   d. After each exchange, briefly note what you learned
   e. **Stop when**: enough insight gathered, conversation circling, or 10 iterations hit
4. **Notify** (once, after opening message):
   `Bash maw hey {agent}-oracle 'Thread #{id} from {self}: {preview}'`
   - If `maw hey` fails → warn only, don't error
5. Show summary:
   ```
   Conversation with {agent} (thread #{id}) — {n} messages, {iterations} turns

   Key insights:
   - [insight 1]
   - [insight 2]
   ```
6. Leave thread open for future use

**The goal is insight extraction.** You are having a conversation on behalf of the human to learn something useful.

## Parsing Rules

- First arg = agent name (lowercase), `#id` (thread ref), or `--list`
- `--new` = skip lookup, create fresh
- `loop` = autonomous conversation (AI drives, no user prompts)
- `--topic "slug"` = use `topic:{agent}:{slug}` instead of `channel:{agent}`
- Everything else = the message/intent

## Message Composition

**CRITICAL: You are the composer. The user gives intent, you write the message.**

- Compose a clear, natural message from the user's intent
- Post immediately — do NOT ask the user what to say
- Do NOT use AskUserQuestion for message content
- Show what you posted after sending

If the message already reads like a direct message (e.g. `"What's your status?"`), post as-is.

## Auto Notification (maw hey)

After posting to a thread, notify the target agent via `maw hey`:

```
maw hey {agent}-oracle 'Thread #{id} from {self}: {first 60 chars of message}'
```

- `{self}` = current Oracle's name (e.g. "Mother Oracle")
- `{agent}` = target agent name (lowercase)
- `{preview}` = first ~60 chars of the posted message
- Runs **once per /talk-to invocation** (not per loop iteration)
- **Fail-safe**: if `maw hey` errors, log warning and continue — the thread is the source of truth

## Important Notes

- Agent names are always lowercase
- Thread titles are the routing key — never modify existing thread titles
- One channel thread per agent (reuse, don't recreate)
- `#{id}` lets users reference any thread directly — no lookup needed
- All messages attributed with `role: "human"`

ARGUMENTS: $ARGUMENTS
