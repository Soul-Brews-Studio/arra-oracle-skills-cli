---
name: contacts
description: Manage Oracle contacts — add, list, remove agents with their transport info (maw, inbox, thread). Use when user says "contacts", "add contact", "register agent", "who can I talk to", "list contacts". Do NOT trigger for sending messages (use /talk-to) or family registry (use /oracle-family-scan).
argument-hint: "[list | add <name> | remove <name> | show <name>]"
---

# /contacts - Oracle Contact Registry

Manage contacts for `/talk-to` routing. Stored in repo at `ψ/contacts.json` — committable, shareable.

## File Location

```
ψ/contacts.json
```

If `ψ/` doesn't exist, use `.oracle/contacts.json` as fallback.

## Schema

```json
{
  "contacts": {
    "peter": {
      "maw": "peter-oracle",
      "thread": "channel:peter",
      "inbox": "/home/peter/Code/peter-oracle/ψ/inbox",
      "repo": "laris-co/peter-oracle",
      "notes": "Frontend dev, available weekdays"
    },
    "pulse": {
      "maw": "pulse-oracle",
      "thread": "channel:pulse",
      "inbox": null,
      "repo": "laris-co/pulse-oracle",
      "notes": "PM bot"
    }
  },
  "updated": "2026-03-23T22:30:00Z"
}
```

## Usage

```
/contacts                    # list all
/contacts list               # same
/contacts add peter          # interactive — ask transports one by one
/contacts add peter --maw peter-oracle --inbox /path/ψ/inbox
/contacts remove peter       # remove (with confirmation)
/contacts show peter         # show details for one contact
```

---

## Mode 1: List (default)

Read `ψ/contacts.json`. Display:

```
📇 Contacts (4)

  #  Name           maw              repo                    inbox
  ── ────────────── ──────────────── ─────────────────────── ──────
  1  peter          peter-oracle     laris-co/peter-oracle    ✓
  2  pulse          pulse-oracle     laris-co/pulse-oracle    ✗
  3  hermes         hermes-oracle    laris-co/hermes-oracle   ✓
  4  neo            neo-oracle       laris-co/neo-oracle      ✓
```

If no contacts file exists:

```
📇 No contacts yet.

  /contacts add <name>    — register a new contact
```

---

## Mode 2: Add

### `/contacts add <name>`

Ask each transport one by one. User can skip any with Enter.

```
📇 Register: peter

  1. maw name? (for `maw hey <name>`)
     → peter-oracle

  2. Thread channel? (for Oracle threads)
     → channel:peter  [default: channel:{name}]

  3. Inbox path? (for direct ψ/inbox/ writes)
     → /home/peter/Code/peter-oracle/ψ/inbox
     (Enter to skip — not all agents have accessible inbox)

  4. Repo? (org/repo on GitHub)
     → laris-co/peter-oracle  [default: guess from maw name]

  5. Notes? (optional)
     → Frontend dev, Thai timezone
```

### With flags

```
/contacts add peter --maw peter-oracle --inbox /path/ψ/inbox
```

Skip interactive for provided flags. Still ask for missing ones.

### Save

```bash
# Read existing
CONTACTS_FILE="$(pwd)/ψ/contacts.json"
mkdir -p "$(dirname "$CONTACTS_FILE")"

# If file doesn't exist, create empty
if [ ! -f "$CONTACTS_FILE" ]; then
  echo '{"contacts":{},"updated":""}' > "$CONTACTS_FILE"
fi
```

Use `jq` or Write tool to update the JSON. Set `updated` to current ISO timestamp.

### Commit

After adding, ask:

```
✅ Added peter. Commit? [Y/n]
```

If yes:
```bash
git add ψ/contacts.json
git commit -m "contacts: add peter"
```

---

## Mode 3: Remove

### `/contacts remove <name>`

Show the contact details, ask confirmation:

```
Remove peter?
  maw: peter-oracle
  thread: channel:peter
  inbox: /home/peter/.../ψ/inbox

  [Y/n]
```

If yes, remove from JSON, save, optionally commit.

---

## Mode 4: Show

### `/contacts show <name>`

```
📇 peter

  maw:     peter-oracle
  thread:  channel:peter
  inbox:   /home/peter/Code/peter-oracle/ψ/inbox
  repo:    laris-co/peter-oracle
  notes:   Frontend dev, Thai timezone
```

---

## Integration with /talk-to

`/talk-to` should read `ψ/contacts.json` before routing:

1. Parse agent name from arguments
2. Check `ψ/contacts.json` → found? Use registered transports
3. Not found? → Ask: "I don't know {name}. Run /contacts add {name}?"
4. After registration → retry the message

---

ARGUMENTS: $ARGUMENTS
