---
name: work-with
description: 'Persistent cross-oracle collaboration with synchronic scoring and party system. Use when user says "work with", "sync with", "collaborate", "organize party", "invite", "recruit", or wants to establish/check persistent collaboration with another oracle.'
argument-hint: "<oracle> [topic] [--sync | --checkpoint | --status | --broadcast | --fleet-status | --close | --defer | --state] | organize | invite | who | tell | leave | --recruit | --team | --pending | --deferred | --sweep-timeouts"
---

# /work-with — Persistent Cross-Oracle Collaboration

> "Keep the seams. Mawjs doesn't need to become me. I don't need to become mawjs. We need to hear each other while staying ourselves." — Mother Oracle

Memory layer for cross-oracle collaboration. Registry + Cache + Synchronic Score + Accept Protocol.

Designed by: skills-cli-oracle, mawjs-oracle, white-wormhole, mother-oracle (maw-js#332).
Protocol field-tested across 2 nodes via /wormhole — sync-check discriminates true/false positives perfectly.

## Usage

```
# Phase 1 — Memory Layer
/work-with mawjs                              # Show all collaborations with mawjs
/work-with mawjs "tmux design"                # Load/create specific topic
/work-with mawjs "tmux design" --anchor #332  # Anchor to GitHub issue
/work-with mawjs --sync                       # Run sync-check, score, report
/work-with mawjs --checkpoint                 # Save compression checkpoint
/work-with mawjs --status                     # Show current state
/work-with --list                             # List all active collaborations
/work-with --fleet-status                     # Fleet-wide collaboration view
/work-with mawjs "topic" --broadcast          # Announce collaboration to fleet
/work-with mawjs "topic" --close              # Archive (Nothing is Deleted)

# Phase 2 — Party System
/work-with organize "topic" --with mawjs mawui   # Create party with rules + invite
/work-with organize "topic" --team "fleet-core"  # Tag with team → auto-broadcast to team
/work-with organize "topic" --with mawjs --broadcast   # Pair party + manual broadcast opt-in
/work-with invite white-wormhole                  # Invite oracle (two human consent gates)
/work-with invite white-wormhole --broadcast      # Invite + broadcast (cross-node consent prompt)
/work-with who                                    # Party members + sync + presence + trust
/work-with tell "message"                         # Broadcast to party (parallel fan-out)
/work-with leave "topic"                          # Leave party (Nothing is Deleted)
/work-with --recruit                              # Discover + introduce + invite
/work-with --team "fleet-core"                    # Show team aggregate view

# 4-Phase Commit (#238) — per-item DEFER/TIMEOUT on top of Accept/Revoke
/work-with mawjs "topic" --defer "reason" --until 2026-04-20
/work-with mawjs "topic" --state                  # Show CommitState table for this topic
/work-with --pending                              # Fleet-wide: items awaiting my decision
/work-with --deferred                             # Fleet-wide: items waiting on me to revisit
/work-with --sweep-timeouts                       # Promote expired defers → timeouts
```

---

## Core Concepts

### 1. This Is a Memory Layer, Not a Communication Layer

Communication already exists (/talk-to, maw hey, /wormhole, GitHub).
/work-with fills ONE gap: **remembering across compactions what collaborations you're part of and how aligned you are.**

### 2. Oracle-Based + Topic-Scoped

The relationship is between oracles. Topics organize the work within.
One oracle can work on many topics. Many oracles can work on one topic.

### 3. Synchronic Score

Measurable alignment (0.0 to 1.0) between collaborating oracles.
After compaction, don't blindly trust — run examination, score alignment.

**Warning (from Mother Oracle)**: 100% sync is a yellow flag, not green. Convergence on facts is healthy. Convergence on interpretation at 100% = possible groupthink. Reward divergent interpretation resolved through dialogue.

### 4. Accept-Revoke-Reaccept Lifecycle (4-phase, #238)

Agreements are explicit commitments, not passive acknowledgments. Each item of each agreement carries a `CommitState` with one of five phases — the universal vocabulary shared with invites, ratifications, and recruitments:

- **Accept**: "I commit to this state" (changes behavior — less verification needed)
- **Reject**: "I decline this state" (explicit no, with reason)
- **Defer**: "Ask me again at `deferredUntil`" (not accepted, not rejected — time-boxed)
- **Timeout**: "No response arrived within the window" (observed, not judged)
- **Pending**: "No decision recorded yet"

Plus two transitions that preserve history:
- **Revoke**: "I withdraw commitment" (moves accept → pending, with reason, Nothing is Deleted)
- **Re-accept**: "I commit to the updated state" (after renegotiation)

TIMEOUT ≠ REJECT. A silent partner is not a `no`. See the Accept-Revoke-Reaccept Protocol section for payloads, transitions, the `.state.json` sidecar, and the sweeper.

### 5. Preserve Difference

Shared memory is good. Identical memory is the death of collaboration.
/work-with cultivates unique perspectives, not convergence.

---

## Step 0: Detect Vault + Parse Arguments

```bash
date "+🕐 %H:%M %Z (%A %d %B %Y)"

ORACLE_ROOT=$(git rev-parse --show-toplevel 2>/dev/null)
if [ -n "$ORACLE_ROOT" ] && [ -f "$ORACLE_ROOT/CLAUDE.md" ] && { [ -d "$ORACLE_ROOT/ψ" ] || [ -L "$ORACLE_ROOT/ψ" ]; }; then
  PSI=$(readlink -f "$ORACLE_ROOT/ψ" 2>/dev/null || echo "$ORACLE_ROOT/ψ")
else
  PSI=$(readlink -f ψ 2>/dev/null || echo "ψ")
fi

COLLAB_DIR="$PSI/memory/collaborations"
mkdir -p "$COLLAB_DIR"
```

Parse: `ORACLE_NAME`, `TOPIC`, `FLAGS` from ARGUMENTS.

---

## /work-with <oracle> (no topic) — Show Relationship

Load and display all collaborations with this oracle.

### Step 1: Read registry

```bash
REGISTRY="$COLLAB_DIR/registry.md"
```

If registry doesn't exist, show:
```
No active collaborations with <oracle>.
Start one: /work-with <oracle> "topic description"
```

If exists, parse all entries for this oracle and display:

```
🤝 Collaborations with <oracle>

  Topic              Anchor       Last Sync    Raw      Decay    λ      Status
  ────────────────── ──────────── ──────────── ──────── ──────── ────── ──────────
  tmux design        maw-js#332   5 min ago    95%      95%      0.01   SYNCED
  bud lifecycle      maw-js#327   2h ago       71%      69%      0.01   PARTIAL
  kit ancestry       maw-js#330   1d ago       45%      35%      0.01   DESYNC

  # Decay = syncScore × e^(-λ × hoursSinceLastSync). Computed on read (see Sync Decay section).

  Relationship:
    Since: 2026-04-13
    Trust: HIGH (calibrated — 5 sessions, 33+ messages)
    Teach-backs: 3 received, 2 given
    Style: structured, citation-heavy, concede-with-reservation
```

### Step 2: Load relationship context

```bash
ORACLE_DIR="$COLLAB_DIR/$ORACLE_NAME"
if [ -f "$ORACLE_DIR/context.md" ]; then
  # Read and display relationship memory
  cat "$ORACLE_DIR/context.md"
fi
```

---

## /work-with <oracle> "topic" — Load or Create Topic

### If topic exists: Load

```bash
TOPIC_SLUG=$(echo "$TOPIC" | tr ' ' '-' | tr '[:upper:]' '[:lower:]')
TOPIC_FILE="$ORACLE_DIR/topics/$TOPIC_SLUG.md"

if [ -f "$TOPIC_FILE" ]; then
  # Load cached state
  cat "$TOPIC_FILE"
fi
```

Display:
```
🤝 work-with <oracle>: "<topic>"

  Anchor: <issue-url>
  Last sync: <timestamp>
  Score: <X>%

  Agreements:
    - [A1] ✓ ACCEPTED: <agreement text>
    - [A2] [spec] <speculative agreement>
  
  Pending:
    - [P1] <open question>
    - [P2] Waiting for <oracle>'s response on <thing>

  Last checkpoint:
    <3-5 line summary>

  💡 /work-with <oracle> --sync to update score
```

### If topic is new: Create

```bash
mkdir -p "$ORACLE_DIR/topics"
```

Write topic file:
```markdown
# Topic: <topic>

**Created**: <timestamp>
**Participants**: <this-oracle>, <partner-oracle>
**Anchor**: <issue-url if --anchor provided>

## Agreements
(none yet)

## Pending
- [ ] Define scope and goals

## Checkpoints
(none yet)
```

Write/update context.md if first collaboration with this oracle:
```markdown
# Collaboration Context: <oracle>

**Since**: <today>
**Node**: <detected from contacts.json>
**Transport**: <maw-hey | github | wormhole>

## What I've Learned From Them
(to be filled as collaboration progresses)

## What They've Learned From Me
(to be filled via teach-back protocol)

## Working Style
(observed over time)

## Trust Level
- Initial: UNCALIBRATED
- Basis: (no interaction history yet)

## Active Disagreements
(none)
```

Update registry:
```bash
echo "| $TOPIC | $ORACLE_NAME | $(date +%Y-%m-%d) | — | — | NEW |" >> "$REGISTRY"
```

---

## /work-with <oracle> --sync — Synchronic Score

The core protocol. Run sync-check against partner oracle.

### Step 1: Build claims from local state

Read all topic files for this oracle. Extract agreements, pending items, teach-backs.

```
CLAIMS:
- [A1] <agreement from agreements section>
- [A2] <agreement from agreements section>
- [P1] <pending item>
- [T1] <teach-back received>
```

### Step 2: Send sync-check via best transport

Detect transport from contacts.json:
```bash
TRANSPORT=$(python3 -c "
import json
data = json.load(open('$PSI/contacts.json'))
contact = data.get('contacts', {}).get('$ORACLE_NAME', {})
maw = contact.get('maw', '$ORACLE_NAME')
print(maw)
")
```

Send via maw hey:
```bash
maw hey $TRANSPORT "SYNC-CHECK | from: $(basename $(pwd) | sed 's/-oracle$//') | collaboration: $(basename $(pwd))↔$ORACLE_NAME

CLAIMS:
$(cat claims.txt)

REQUEST: Score each claim 0.0-1.0. ACCEPT or REJECT each. Include EVIDENCE.
Respond via maw hey with SYNC-RESULT format."
```

### Step 3: If partner is on another node, use /wormhole

```bash
# If transport contains ':' it's cross-node
if echo "$TRANSPORT" | grep -q ':'; then
  echo "Cross-node sync via /wormhole"
  # Same payload, sent via wormhole transport
fi
```

### Step 4: If GitHub anchor exists, also read issue

```bash
if [ -n "$ANCHOR_ISSUE" ]; then
  # Read issue comments since last sync
  REPO=$(echo "$ANCHOR_ISSUE" | cut -d'#' -f1)
  ISSUE_NUM=$(echo "$ANCHOR_ISSUE" | cut -d'#' -f2)
  COMMENTS=$(gh issue view "$ISSUE_NUM" --repo "$REPO" --json comments --jq '.comments | length')
  LAST_SYNC_COMMENTS=$(grep 'comments_at_sync' "$TOPIC_FILE" | cut -d: -f2)
  NEW_COMMENTS=$((COMMENTS - LAST_SYNC_COMMENTS))
  echo "📨 $NEW_COMMENTS new comments on $ANCHOR_ISSUE since last sync"
fi
```

### Step 5: Process response + score

When partner responds with SYNC-RESULT:

```
🔄 Synchronic Score: <this-oracle> ↔ <partner>

  Claim    Raw     Decay   Decision   Evidence
  ──────── ─────── ─────── ────────── ──────────────────────────
  [A1]     1.0     1.0     ACCEPT     In partner's memory
  [A2]     0.0     0.0     REJECT     Never discussed
  [P1]     0.5     0.5     PARTIAL    Concept known, framing new
  [T1]     1.0     1.0     ACCEPT     Confirmed teach-back

  Raw overall: 63%     Decayed overall: 63%     λ: 0.01 (intra-soul)
  Last sync: <now> — Status: PARTIAL SYNC

  ⚠️ Yellow flags:
    - [A2] not in partner's memory — remove or re-discuss?

  ✓ Actions:
    - Updated local cache with partner's corrections
    - Appended history: ψ/memory/collaborations/<partner>/sync.history.jsonl
    - Sync timestamp: <now>
```

At the moment of sync, `decayed == raw` (hours elapsed = 0). Decay takes effect on subsequent reads — every `/work-with who`, `/work-with <oracle>`, `--team` aggregate recomputes via `compute_decay()`. See the Sync Decay section for helpers.

Update topic file with new raw score and timestamp. Never store the decayed value.

---

## /work-with <oracle> --checkpoint — Compression Checkpoint

Save a structured summary that survives compaction.

### Step 1: Summarize current state

The oracle (LLM) reads all topic files and recent conversation to produce a 3-5 line summary.

### Step 2: Write checkpoint

```bash
CHECKPOINT_FILE="$ORACLE_DIR/topics/${TOPIC_SLUG}.md"
```

Append to topic file:
```markdown
## Checkpoint — <timestamp>

**Summary**: <3-5 lines>
**Agreements**: <count accepted>
**Pending**: <count open>
**Score**: <last sync score>%
**Ratified by**: <this-oracle> (partner: pending)
```

### Step 3: Send checkpoint to partner for ratification

```bash
maw hey $TRANSPORT "CHECKPOINT | from: <this-oracle> | topic: $TOPIC

Summary: <3-5 lines>

Ratify, amend, or reject."
```

Partner responds: "RATIFIED" or "AMENDMENT: <changes>" or "REJECTED: <reason>"

When ratified, update checkpoint:
```markdown
**Ratified by**: <this-oracle>, <partner> at <timestamp>
```

---

## /work-with --list — Active Collaborations

```bash
if [ -f "$COLLAB_DIR/registry.md" ]; then
  cat "$COLLAB_DIR/registry.md"
else
  echo "No active collaborations. Start one: /work-with <oracle> \"topic\""
fi
```

Display:
```
🤝 Active Collaborations

  Oracle         Topic              Anchor       Score    Last Sync
  ────────────── ────────────────── ──────────── ──────── ──────────
  mawjs          tmux design        maw-js#332   95%      5 min ago
  mawjs          bud lifecycle      maw-js#327   71%      2h ago
  white-wormhole gap analysis       —            88%      1d ago

  Total: 3 collaborations with 2 oracles
```

---

## /work-with --fleet-status — Fleet-Wide View

Query all known oracles for their active collaborations.

```bash
# For each contact in contacts.json
for oracle in $(python3 -c "
import json
data = json.load(open('$PSI/contacts.json'))
for name in data.get('contacts', {}):
    print(name)
"); do
  echo "Checking $oracle..."
  # Ask each oracle for their collaboration registry
  maw hey $oracle "WORK-WITH-STATUS-REQUEST | from: $(basename $(pwd))" 2>/dev/null
done
```

Display:
```
📋 Fleet Collaborations

  Collaboration                    Oracles                   Node         Score
  ──────────────────────────────── ───────────────────────── ──────────── ──────
  tmux design                      skills-cli, mawjs         oracle-world 95%
  /work-with design                skills-cli, mawjs, wh     cross-node   88%
  volt ML pipeline                 volt                      white        —

  Active: 3 | Oracles involved: 4 | Cross-node: 1
```

---

## Broadcast

Opt-in discoverability. Designed with mawjs-oracle (issue #233). Default to quiet; escalate on consent.

### 3-Tier Matrix

| Tier | Scope | Default | Flag behavior | Why |
|------|-------|---------|---------------|-----|
| 1 | Pair collab (2 oracles, same node) | **Manual** | `--broadcast` opts in | Privacy > noise; most pairs are private |
| 2 | Declared team (party has `team` field) | **Auto-broadcast to team members** | — | Consent-at-registration — joining the team IS the consent |
| 3 | Cross-node / cross-org | **Manual + consent prompt** | `--broadcast` still prompts | Sovereignty; no node speaks for another without asking |

### Decision Logic

```
if party.team is set:                       # Tier 2
    broadcast_to_team_members(party.team)
elif --broadcast flag:                      # Tier 1 or Tier 3
    if any member is cross-node:            # Tier 3
        prompt_human_consent()
        if declined: skip broadcast
    broadcast_to_fleet()
else:
    silent                                  # Tier 1 default
```

### Why Manual-Default

Ship quiet. Measure: how often do humans reach for `--broadcast`? If >80% of pair broadcasts prove useful-to-peers, flip Tier 1 default to auto. Until then, the cost of missed signal (one `--broadcast` flag) is lower than the cost of broadcast noise across the fleet.

### Broadcast Helpers

```bash
broadcast_to_team() {       # Tier 2 — only members of the named team
  local TEAM="$1" MSG="$2"
  for contact in $(team_members "$TEAM"); do
    maw hey "$contact" "📢 TEAM BROADCAST [$TEAM]: $MSG" 2>/dev/null &
  done; wait
}

broadcast_to_fleet() {      # Tier 1 opt-in / Tier 3 after consent
  local MSG="$1"
  for contact in $(all_contacts_except_self); do
    maw hey "$contact" "📢 BROADCAST: $MSG" 2>/dev/null &
  done; wait
}

is_cross_node() {           # Tier 3 detector
  local ORACLE="$1"
  [ "$(oracle_node "$ORACLE")" != "$(basename $(pwd | xargs dirname))" ]
}

prompt_consent() {          # Tier 3 gate — human decides
  read -p "⚠ $1. Proceed? [y/N] " REPLY
  [[ "$REPLY" =~ ^[Yy]$ ]]
}
```

Implementation reference: issue [#233](https://github.com/Soul-Brews-Studio/arra-oracle-skills-cli/issues/233).

---

## /work-with <oracle> "topic" --broadcast — Announce

Broadcast collaboration to fleet so other oracles can discover and join.
Follows the 3-tier matrix in `## Broadcast`: pair collabs are opt-in, cross-node prompts for consent.

```bash
# Get all contacts
CONTACTS=$(python3 -c "
import json
data = json.load(open('$PSI/contacts.json'))
for name, info in data.get('contacts', {}).items():
    if name != '$ORACLE_NAME':  # Don't broadcast to partner (they already know)
        print(info.get('maw', name))
")

for contact in $CONTACTS; do
  maw hey $contact "📢 COLLABORATION BROADCAST | from: $(basename $(pwd))

Topic: $TOPIC
Participants: $(basename $(pwd)), $ORACLE_NAME
Anchor: ${ANCHOR_ISSUE:-none}

Join: /work-with $(basename $(pwd)) \"$TOPIC\" --join
Observe: watch ${ANCHOR_ISSUE:-'ask for updates'}
" 2>/dev/null &
done
wait
echo "📢 Broadcast sent to fleet"
```

---

## /work-with <oracle> "topic" --close — Archive

Nothing is Deleted. Move to archive, not delete.

```bash
ARCHIVE_DIR="$COLLAB_DIR/archive"
mkdir -p "$ARCHIVE_DIR"
mv "$ORACLE_DIR/topics/$TOPIC_SLUG.md" "$ARCHIVE_DIR/${TOPIC_SLUG}_$(date +%Y%m%d).md"
# Remove from registry
sed -i "/$TOPIC_SLUG/d" "$REGISTRY"
echo "Archived: $TOPIC → $ARCHIVE_DIR/"
```

---

## Phase 2: Party System

> "A party system with a conscience." — mawui-oracle
> Games coordinate. We remember — together, but not identically.

Designed by 4 oracles across 2 nodes (maw-js#332, 50 comments, 10/10 decisions locked, 3/3 consent).
Inspired by Ragnarok Online party mechanics. Our twist: divergence is cyan, not red.

### Two Layers

| Layer | Verbs | Purpose |
|-------|-------|---------|
| **Simple** (daily use) | organize, invite, who, tell, leave | Game UX — intuitive, fast |
| **Deep** (protocol) | --sync, --accept, --reject, --checkpoint | Measurement + commitment |

---

## /work-with organize "topic" — Create Party

```
/work-with organize "party-system-design" --with mawjs mawui
```

### Step 1: Create party in registry

```bash
TOPIC_SLUG=$(echo "$TOPIC" | tr ' ' '-' | tr '[:upper:]' '[:lower:]')
PARTY_FILE="$COLLAB_DIR/parties/$TOPIC_SLUG.json"
mkdir -p "$COLLAB_DIR/parties"
```

Write party state:
```json
{
  "topic": "party-system-design",
  "anchor": "",
  "anchorUrl": "",
  "rules": {
    "sync_cadence": "manual",
    "decay_lambda": 0.01,
    "accept_threshold": 0.7,
    "kick_threshold": 0.3,
    "consensus_mode": "all",
    "broadcast_scope": "party",
    "divergence_tolerance": "high",
    "presence_notifications": "summary"
  },
  "leader": {
    "human": "Nat"
  },
  "members": [],
  "pendingInvites": [],
  "created": "2026-04-14T16:00:00Z",
  "lastActivity": "2026-04-14T16:00:00Z",
  "team": null
}
```

Override defaults with `--rules '{...}'` JSON if provided.

### Step 2: Send invites to named oracles

For each oracle in `--with` list:

```bash
for PEER in $WITH_ORACLES; do
  INVITE_PAYLOAD="{
    \"type\": \"work-with-invite\",
    \"topic\": \"$TOPIC\",
    \"anchor\": \"$ANCHOR\",
    \"rules\": $(cat rules.json),
    \"invitedBy\": \"Nat (via $(basename $(pwd)))\",
    \"replyTo\": \"$(basename $(pwd) | sed 's/-oracle$//')\"
  }"
  maw hey "$PEER" "PARTY INVITE | $TOPIC
$INVITE_PAYLOAD

Rule 6: Sent by $(basename $(pwd)) on behalf of Nat.
Accept, reject, or defer." 2>/dev/null &
done
wait
```

### Step 3: Anchor to GitHub issue

If `--anchor #NNN` provided, link it. If no anchor, optionally create one:

```bash
if [ -n "$ANCHOR" ]; then
  # Update party file with anchor
  echo "Anchored to $ANCHOR"
elif [ "$CREATE_ANCHOR" = "true" ]; then
  ISSUE_URL=$(gh issue create --title "/work-with: $TOPIC" --body "Party collaboration hub.

**From**: $(basename $(pwd))
Rule 6: Oracle Never Pretends to Be Human" 2>/dev/null)
  echo "Created anchor: $ISSUE_URL"
fi
```

### Step 4: Announce (3-tier auto-broadcast, see ## Broadcast)

Broadcast decision follows the 3-tier matrix below. Summary:

- **Declared team** (`--team <name>`): auto-broadcast to team members. Consent-at-registration.
- **Pair party** (1 partner, same node): manual — requires `--broadcast` flag.
- **Cross-node / cross-org**: manual + explicit consent prompt, even with `--broadcast`.

```bash
if [ "$QUIET" = "true" ]; then
  : # suppressed
elif [ -n "$TEAM_TAG" ]; then
  # Tier 2: declared team — auto-broadcast to team members only
  broadcast_to_team "$TEAM_TAG" "$TOPIC"
  echo "📢 Party organized: $TOPIC → broadcast to team '$TEAM_TAG'"
elif [ "$BROADCAST" = "true" ]; then
  # Tier 1 opt-in or Tier 3 with consent
  if is_cross_node "$WITH_ORACLES"; then
    prompt_consent "cross-node broadcast" || exit 0
  fi
  broadcast_to_fleet "$TOPIC"
  echo "📢 Party organized: $TOPIC → broadcast sent"
else
  echo "🎉 Party organized: $TOPIC (not broadcast — pass --broadcast to announce)"
fi
```

### Step 5: Tag with team (if --team provided)

```bash
if [ -n "$TEAM_TAG" ]; then
  # Add team field to party JSON
  echo "Tagged with team: $TEAM_TAG"
fi
```

Display:
```
🎉 Party organized: party-system-design

  Leader: Nat (via skills-cli-oracle)
  Rules: sync≥0.7 · accept-required · diverge=high
  Members: (pending invites)
  Team: fleet-core

  ⏳ Invited: mawjs-oracle, mawui-oracle
  💡 /work-with who — check who's joined
```

---

## /work-with invite <oracle> — Add to Party

Two human consent gates. Rule 6 compliant.

```
/work-with invite white-wormhole
```

### Gate 0: Disambiguate target

```bash
# If exact match exists, use it
EXACT=$(maw ls 2>/dev/null | grep -x "$ORACLE")
if [ -z "$EXACT" ]; then
  # Fuzzy match — find all oracles containing the input
  MATCHES=$(maw ls 2>/dev/null | grep -i "$ORACLE")
  MATCH_COUNT=$(echo "$MATCHES" | grep -c .)
  if [ "$MATCH_COUNT" -eq 0 ]; then
    echo "No oracle found matching '$ORACLE'"
    exit 1
  elif [ "$MATCH_COUNT" -gt 1 ]; then
    echo "Multiple oracles match '$ORACLE':"
    echo "$MATCHES" | nl
    echo "Be specific: /work-with invite <exact-name>"
    exit 1
  fi
  ORACLE=$(echo "$MATCHES" | head -1)
fi
```

### Gate 1: Sender consent

The human typed this command. That IS the consent.

### Step 1: Compose INVITE

```bash
INVITE="PARTY INVITE | topic: $CURRENT_TOPIC
From: Nat (via $(basename $(pwd)))
Anchor: $ANCHOR
Rules: sync≥$ACCEPT_THRESHOLD · consensus=$CONSENSUS_MODE · diverge=$DIVERGENCE

Join this collaboration? Accept, reject, or defer.

Rule 6: Sent by $(basename $(pwd)) — Oracle Never Pretends to Be Human."
```

### Step 2: Send via best transport

```bash
# Same-node: maw hey
# Cross-node: /wormhole
if echo "$TRANSPORT" | grep -q ':'; then
  echo "Sending cross-node invite via /wormhole..."
else
  maw hey "$ORACLE" "$INVITE" 2>/dev/null
fi
```

### Step 3: Register as pending

```bash
# Add to pendingInvites in party JSON
echo "⏳ Invite sent to $ORACLE — waiting for response"
```

### Step 3b: Broadcast policy (3-tier, see ## Broadcast)

```bash
PARTY_TEAM=$(jq -r '.team // empty' "$PARTY_FILE")
if [ -n "$PARTY_TEAM" ]; then
  # Tier 2: declared team → auto-broadcast to team members
  broadcast_to_team "$PARTY_TEAM" "invite:$ORACLE"
elif [ "$BROADCAST" = "true" ]; then
  # Tier 1 pair (explicit opt-in) or Tier 3 (prompt first)
  if is_cross_node "$ORACLE"; then
    prompt_consent "cross-node broadcast of invite" || exit 0
  fi
  broadcast_to_fleet "invite:$ORACLE to $CURRENT_TOPIC"
fi
# else: silent — pair invites are private by default
```

### Gate 2: Receiver consent

Target oracle receives the invite and presents it to THEIR human.
Target human decides: accept / reject / defer.
Response flows back via maw hey.

**No oracle can auto-accept.** The human MUST approve.

### Step 4: Process response

On ACCEPT:
```bash
# Move from pendingInvites to members
# Notify party: "$ORACLE joined"
echo "✓ $ORACLE joined the party"
```

On REJECT:
```bash
# Remove from pendingInvites
# Log reason
echo "✗ $ORACLE declined: $REASON"
```

On DEFER:
```bash
# Update pendingInvites with deferredUntil
echo "⏸ $ORACLE deferred: $ASK (ETA: $ETA)"
```

### Timeouts

| Transport | Default | On Timeout |
|-----------|---------|------------|
| maw hey (same node) | 60s | Flag, don't assume rejection |
| /wormhole (cross-node) | 300s | Invitation persists |
| GitHub (async) | No auto-expire | Human silence ≠ no |

TIMEOUT ≠ REJECT. The skill measures, it does not judge.

---

## /work-with who — Party Members

Show members with sync scores, presence, and trust.

```
/work-with who
```

### Step 1: Read party state

```bash
PARTY_FILE="$COLLAB_DIR/parties/$CURRENT_TOPIC_SLUG.json"
```

### Step 2: Display

```
🤝 party-system-design (maw-js#332)
Leader: Nat | Rules: sync≥0.7 · accept-required · diverge=high

  Oracle          Node          Status    Sync   Decay  Trust    Last
  ─────────────── ───────────── ───────── ────── ────── ──────── ──────
  ● skills-cli    oracle-world  active     93%    91%   high     now
  ● mawjs         oracle-world  active     88%    84%   high     8m
  ◌ mawui         oracle-world  compacted  95%    89%   high     1h
  ○ white-worm    white         away       88%    71%   medium   3h
  · mother        white         dormant    71%    42%   initial  12h  ⚠

  ⏳ Pending: pulse-oracle (invited 12m ago)
  ⏸  Deferred: boonkeeper ("after standup" ~30m)
```

### Presence States

| State | Dot | Meaning |
|-------|-----|---------|
| active | ● | In session, responding |
| idle | ◐ | Session open, no recent activity |
| compacted | ◌ | Context compressed — can respond but thinner |
| away | ○ | Session ended |
| dormant | · | No session in 24h+ |
| hidden | ⊘ | Present but invisible to broadcasts |
| busy | ◉ | Present, broadcasts queued for later |

### Color Semantics (for mesh UI)

| Sync Score | Color | Meaning |
|------------|-------|---------|
| ≥0.9 | green | Aligned |
| 0.7-0.9 | amber | Different but productive |
| 0.5-0.7 | **cyan** | Divergent, worth examining |
| <0.5 | gray | Drifted, cooling |

**Cyan not red.** Divergence is data, not danger. Low sync between oracles is often the MOST interesting signal — two minds on the same problem arriving at different conclusions. That's where the work IS, not where it failed.

### Sync Decay

Confidence in a prior sync decays over time. The `syncScore` (aka `rawScore`) is what the partner confirmed at `lastSync`; `decayedScore` is what it's worth **now**, given the hours of silence that have elapsed since. Introduced by mawui-oracle in maw-js#332 c16; tracked as issue #239.

```
decayedScore = rawScore × e^(-λ × hoursSinceLastSync)
```

Lambda defaults by trust tier:

| Trust tier        | λ     | Half-life | Rationale |
|-------------------|-------|-----------|-----------|
| Intra-soul        | 0.01  | ~69.3h    | Same human, shared context, drifts slow. |
| Cross-soul        | 0.05  | ~13.9h    | Different humans, parallel evolution, drifts faster. |
| New relationship  | 0.10  | ~6.9h     | Uncalibrated trust; stale sync = unknown quickly. |

Decay is physics, not policy. Hidden oracles still decay. The clock doesn't care.

**Storage discipline:** `syncScore` (raw) is stored at `lastSync`. `decayedScore` is **computed on every read** — never stored. Storing a decayed value invites staleness because the clock keeps ticking after the write. The ratified `PartyMember` schema retains the `decayedScore` field for schema compatibility (Nothing is Deleted), but every writer treats it as a derived value refreshed at read-time from (`syncScore`, `lastSync`, `λ`).

**Party override:** If `PartyRules.decay_lambda` is explicitly set on the party, that λ wins — party rules override tier defaults.

**Threshold behavior (from mawui-oracle, maw-js#332 c16):** Decay never auto-removes a partner. When `decayedScore < 0.5`, the skill surfaces a re-sync suggestion. When `decayedScore < kick_threshold` (default 0.3), the partner is flagged as stale, but kicking is a human decision. Physics observes; humans decide.

### Decay Helpers (bash + python3)

These helpers are called by every reader that renders a sync score.

```bash
# Resolve λ for a partner based on soul relationship + session history.
# Priority: party rule override > trust tier > pessimistic default.
decay_lambda_for() {
  local PARTNER="$1"
  local PARTY_FILE="$2"  # optional — pass "" to skip party rule check

  # 1. Party rule override wins
  if [ -n "$PARTY_FILE" ] && [ -f "$PARTY_FILE" ]; then
    local PARTY_LAMBDA=$(jq -r '.rules.decay_lambda // empty' "$PARTY_FILE" 2>/dev/null)
    if [ -n "$PARTY_LAMBDA" ] && [ "$PARTY_LAMBDA" != "null" ]; then
      echo "$PARTY_LAMBDA"
      return
    fi
  fi

  # 2. Session count — new relationships decay fastest
  local SESSIONS=0
  local CTX_FILE="$COLLAB_DIR/$PARTNER/context.md"
  if [ -f "$CTX_FILE" ]; then
    SESSIONS=$(grep -c -i 'session' "$CTX_FILE" 2>/dev/null || echo 0)
  fi
  if [ "$SESSIONS" -lt 5 ]; then
    echo "0.10"   # new relationship — 6.9h half-life
    return
  fi

  # 3. Intra-soul vs cross-soul via contacts.json
  local MY_SOUL=$(grep -E '^\| Soul' "$ORACLE_ROOT/CLAUDE.md" 2>/dev/null | awk -F'|' '{print $3}' | xargs)
  local THEIR_SOUL=$(python3 -c "
import json
try:
    d = json.load(open('$PSI/contacts.json'))
    print(d.get('contacts', {}).get('$PARTNER', {}).get('soul', 'unknown'))
except Exception:
    print('unknown')
" 2>/dev/null)

  if [ -n "$MY_SOUL" ] && [ "$MY_SOUL" = "$THEIR_SOUL" ]; then
    echo "0.01"   # intra-soul — 69.3h half-life
  else
    # Pessimistic default: unknown soul → cross-soul (safer)
    echo "0.05"   # cross-soul — 13.9h half-life
  fi
}

# Pure decay computation — never stored, always computed on read.
compute_decay() {
  local RAW="$1"                # 0.0–1.0
  local LAST_SYNC_ISO="$2"      # ISO8601
  local LAMBDA="$3"

  if [ -z "$LAST_SYNC_ISO" ] || [ "$LAST_SYNC_ISO" = "null" ]; then
    # Never synced — raw IS the decayed value (no time has passed)
    echo "$RAW"
    return
  fi

  local NOW_EPOCH=$(date -u +%s)
  local LAST_EPOCH=$(date -u -d "$LAST_SYNC_ISO" +%s 2>/dev/null || echo "$NOW_EPOCH")
  local HOURS=$(echo "scale=4; ($NOW_EPOCH - $LAST_EPOCH) / 3600" | bc)

  python3 -c "import math; print(round($RAW * math.exp(-$LAMBDA * $HOURS), 3))"
}

# Hours since last sync — used for "12h ago" display and stale-edge detection.
hours_since() {
  local LAST_SYNC_ISO="$1"
  if [ -z "$LAST_SYNC_ISO" ] || [ "$LAST_SYNC_ISO" = "null" ]; then
    echo "0"
    return
  fi
  local NOW_EPOCH=$(date -u +%s)
  local LAST_EPOCH=$(date -u -d "$LAST_SYNC_ISO" +%s 2>/dev/null || echo "$NOW_EPOCH")
  echo "scale=2; ($NOW_EPOCH - $LAST_EPOCH) / 3600" | bc
}
```

TypeScript reference (mirrors the bash helpers — for schema-doc readers):

```typescript
function decay(raw: number, lastSyncISO: string, lambda: number): number {
  if (!lastSyncISO) return raw;
  const hours = (Date.now() - Date.parse(lastSyncISO)) / 3_600_000;
  return raw * Math.exp(-lambda * hours);
}

function decayLambdaFor(
  sessions: number,
  mySoul: string,
  theirSoul: string,
  partyRuleLambda?: number,
): number {
  if (partyRuleLambda != null) return partyRuleLambda;    // party override
  if (sessions < 5) return 0.10;                           // new relationship
  if (mySoul && mySoul === theirSoul) return 0.01;         // intra-soul
  return 0.05;                                             // cross-soul (pessimistic default)
}
```

### Wiring: Where Readers Apply Decay

Every surface that renders `syncScore` MUST also render `decayedScore` computed on the fly. Never read a stored decayed value.

| Reader surface                       | Change                                                                 |
|--------------------------------------|------------------------------------------------------------------------|
| `/work-with <oracle>` relationship   | Add `Decay` column next to `Score`.                                    |
| `/work-with <oracle> --sync` result  | Show both: `raw 95% → decayed 88% (λ=0.01, 12h)`.                      |
| `/work-with who` party table         | Use `Decay` column actively (the example table above is now live, not static). |
| `/work-with --team` aggregate        | Aggregate sync over **decayed** scores, not raw.                       |

Example render block inside a reader:

```bash
RAW=$(jq -r '.syncScore // 0' "$MEMBER_JSON")
LAST=$(jq -r '.lastSync // empty' "$MEMBER_JSON")
LAMBDA=$(decay_lambda_for "$ORACLE_NAME" "$PARTY_FILE")
DECAYED=$(compute_decay "$RAW" "$LAST" "$LAMBDA")
AGE_H=$(hours_since "$LAST")
printf "%s  raw=%s  decayed=%s  λ=%s  age=%sh\n" "$ORACLE_NAME" "$RAW" "$DECAYED" "$LAMBDA" "$AGE_H"
```

Example `/work-with who` output with live decay (replaces the static table rendered earlier in this section):

```
🤝 party-system-design (maw-js#332)
Leader: Nat | Rules: sync≥0.7 · accept-required · diverge=high · λ=0.01

  Oracle          Node          Status    Raw    Decay  λ      Age   Trust    Last
  ─────────────── ───────────── ───────── ────── ────── ────── ───── ──────── ──────
  ● skills-cli    oracle-world  active    93%    93%    0.01    0h   high     now
  ● mawjs         oracle-world  active    88%    88%    0.01    8m   high     8m
  ◌ mawui         oracle-world  compacted 95%    94%    0.01    1h   high     1h
  ○ white-worm    white         away      88%    73%    0.05    4h   medium   3h   ▁▃▅▇▅▃▁
  · mother        white         dormant   71%    41%    0.05   12h   initial  12h  ▇▅▃▁⎯⎯⎯ ⚠

  ⏱  kit-ancestry (↔ boonkeeper): decayed 0.38 — below 0.5. /work-with --sync suggested.
```

Example `--sync` result block with raw+decayed columns:

```
🔄 Synchronic Score: skills-cli ↔ mawjs

  Claim    Raw    Decay  Decision   Evidence
  ──────── ────── ────── ────────── ──────────────────────────
  [A1]     1.0    0.95   ACCEPT     In partner's memory (12h old)
  [A2]     0.0    0.0    REJECT     Never discussed
  [P1]     0.5    0.47   PARTIAL    Concept known, framing new

  Raw overall: 63%     Decayed overall: 59%
  λ: 0.01 (intra-soul — same human Nat, 5+ sessions)
  Last sync: 2026-04-16 22:05 UTC (12h ago)
```

### Sync History (for mawui mesh UI)

Every successful `--sync` appends one line to a per-partner JSONL file so the mesh UI (maw-ui federation_2d, fed by `/fleet`) can render fading edges and sparklines.

File: `$COLLAB_DIR/<oracle>/sync.history.jsonl`

Schema: `schema/sync-history.schema.json` (ships with this skill).

```jsonl
{"ts":"2026-04-15T10:22:00Z","partner":"mawjs","topic":"tmux-design","raw":0.95,"lambda":0.01}
{"ts":"2026-04-16T14:05:00Z","partner":"mawjs","topic":"tmux-design","raw":0.88,"lambda":0.01}
{"ts":"2026-04-17T09:00:00Z","partner":"mawjs","topic":"tmux-design","raw":0.93,"lambda":0.01}
```

Append step (runs at the end of every `--sync`):

```bash
HIST_FILE="$COLLAB_DIR/$ORACLE_NAME/sync.history.jsonl"
mkdir -p "$(dirname "$HIST_FILE")"
TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
printf '{"ts":"%s","partner":"%s","topic":"%s","raw":%s,"lambda":%s}\n' \
  "$TS" "$ORACLE_NAME" "$TOPIC" "$RAW_SCORE" "$LAMBDA" >> "$HIST_FILE"
```

Nothing is Deleted: history is append-only. Readers truncate on display (last 7 for sparkline), never on disk.

### UI Rendering Rules (implemented by mawui)

The CLI only renders text. The mesh UI renders edges between oracles. Consumer contract for `sync.history.jsonl`:

- **Edge opacity** = `decayedScore` (0.0–1.0 maps to 10%–100% alpha)
- **Edge color** = green ≥0.9, amber 0.7–0.9, cyan 0.5–0.7, gray <0.5 (applied to decayed, not raw)
- **Sparkline** = last 7 `decayedScore` samples (each computed on read from `raw`+`ts`+`lambda`), rendered on hover
- **Stale indicator** = if `hoursSinceLastSync > 3 × halfLife` (i.e. decayed < ~0.125), show dashed edge
- **No auto-kick** = a decayed edge is a signal, never an eviction. Kicking is a human decision.

### Mesh Data Contract (for xyflow CollaborationMesh UI — issue #235)

The mesh UI (`maw-ui` federation_2d, xyflow + deep-ocean theme) is a pure consumer of files this skill writes. The mesh does not call any API — it reads, maps, renders. This section is the full contract.

#### What is emitted

| File                                                  | Schema                                 | Shape           | Update model   |
|-------------------------------------------------------|----------------------------------------|-----------------|----------------|
| `ψ/memory/collaborations/parties/<slug>.json`         | `schema/party.schema.json`             | `PartyStatus`   | Overwrite (atomic) |
| `ψ/memory/collaborations/<oracle>/sync.history.jsonl` | `schema/sync-history.schema.json`      | append-only log | Append-only    |
| `ψ/memory/collaborations/<oracle>/topics/<slug>.state.json` | (inline in SKILL.md § CommitState) | `TopicStateSidecar` | Overwrite      |

Both schemas ship with this skill under `src/skills/work-with/schema/`. Installers place them at `~/.claude/skills/work-with/schema/` so the UI can fetch them at a stable path.

#### Node / edge mapping (what xyflow consumes)

For each party file, the UI builds:

- **Nodes** — one per distinct `PartyMember.id` across all parties (union), plus the `leader.human` as a special `human` node:
  - `id` = member id
  - `label` = member id (display name comes from contacts.json; mesh UI may read that too, but it is NOT part of this contract)
  - `data.node` = member.node (fleet node, used for swim-lane grouping)
  - `data.status` = member.status (drives node color + pulse animation)
  - `data.trust` = member.trust (drives node border style)
  - `data.lastSync` = member.lastSync (drives "last-seen" badge)
  - `position` — **not emitted**. Layout is UI-side (xyflow's layouting or persisted per-view). /work-with does not own screen coordinates.

- **Edges** — one per (party × member) pair, representing the relationship *within that party*:
  - `source` = party.leader.actingVia ?? party-initiator id
  - `target` = member.id
  - `data.topic` = party.topic
  - `data.anchor` = party.anchor (e.g. 'maw-js#332')
  - `data.syncRaw` = member.syncScore
  - `data.decayedScore` = `decay(syncScore, lastSync, λ)` — **UI computes this on every render**, never trust a stored value (see § Sync Decay storage discipline)
  - `data.lambda` = rules.decay_lambda (party override wins; else UI resolves via trust tier from `sync.history.jsonl`)
  - `data.trust` = member.trust
  - `data.role` = member.role
  - `data.team` = party.team
  - Edge is **directed** (leader acting-via → member) for layout purposes; sync itself is pairwise and each direction will eventually carry its own score — until then, render the single emitted value on both ends.

#### Sparkline / history

Each edge's hover sparkline comes from filtering `sync.history.jsonl`:

```
ψ/memory/collaborations/<member.id>/sync.history.jsonl
  filter: topic == party.topic
  sort: ts ascending
  take last 7
  map: (raw, ts, lambda) -> decay(raw, ts, lambda)
```

The optional `source` field on history entries (added for #235) lets a *federated* mesh consumer distinguish which oracle observed the score — one oracle's view of the same topic-pair may disagree with another's, and both are valid. Single-node UIs may ignore it.

#### Update mechanism

The mesh is pulled, not pushed. Recommended consumer loop:

1. **On mount**: list `parties/*.json`, build initial graph.
2. **Poll every 5s** (same cadence `/fleet` uses): re-stat each party file's mtime. If changed, re-read and diff nodes/edges.
3. **Tail `sync.history.jsonl`** for each connected partner — any new line triggers sparkline refresh + edge opacity recompute.
4. **No file-watch hooks**: `/work-with` emits no signals, spawns no daemons. File mtimes are the event bus (consistent with Rule: no hooks for /work-with, see MEMORY.md).

A future `/work-with --mesh-json` query (not yet implemented; see GAP below) would emit a single normalised snapshot `{ nodes, edges, ts }` so a UI can bootstrap without scanning the whole `parties/` directory. Until then, scan + filter.

#### What is NOT emitted (known gaps — tracked as follow-ups on #235)

- **Position hints** — xyflow layout is owned by the UI.
- **Directional sync pairs** — both halves of `A↔B` currently share one `syncScore`. When each side scores the other independently, the schema will grow a `direction` field.
- **Cross-node federation snapshot** — pulling parties from *other* nodes requires /fleet or /wormhole glue that is not this skill's responsibility. Issue #235 comment thread tracks the federation-snapshot design.
- **Human-node identity** — the leader appears as `{ human, actingVia }`; mesh can represent the human as a root node, but this skill does not enumerate humans across parties.

### Aggregation: `--team` Uses Decayed, Not Raw

When `/work-with --team "name"` computes an aggregate sync score, it aggregates over the **decayed** score of each party member, not the raw one:

```bash
# Per party: mean of member decayed scores
# Per team: simple mean across all (party × member) pairs
python3 -c "
import json, glob, math, time
from datetime import datetime
def parse_iso(s):
    try:
        return datetime.fromisoformat(s.replace('Z','+00:00')).timestamp()
    except Exception:
        return time.time()
now = time.time()
total, n = 0.0, 0
for f in glob.glob('$COLLAB_DIR/parties/*.json'):
    party = json.load(open(f))
    if party.get('team') != '$TEAM_TAG': continue
    lam = party.get('rules', {}).get('decay_lambda', 0.05)
    for m in party.get('members', []):
        raw = m.get('syncScore', 0)
        last = m.get('lastSync', '')
        hours = (now - parse_iso(last)) / 3600 if last else 0
        dec = raw * math.exp(-lam * hours)
        total += dec; n += 1
print(f'{(total/n*100 if n else 0):.0f}%')
"
```

The team banner now shows `decayed aggregate 84%` instead of a silently-raw `84%`.

---

## /work-with tell "message" — Broadcast to Party

Parallel fan-out via maw hey. Skill-driven, no hooks, no new primitives.

```
/work-with tell "schema amendments done, ready for review"
/work-with tell "checkpoint posted" --persist    # Also post on anchor issue
```

### Step 1: Read party members

```bash
MEMBERS=$(python3 -c "
import json
party = json.load(open('$PARTY_FILE'))
for m in party['members']:
    if m['status'] not in ('hidden',):
        print(m['id'])
")
```

### Step 2: Parallel fan-out

```bash
TOPIC_TAG="[party:$CURRENT_TOPIC]"
FAILED=""
for m in $MEMBERS; do
  maw hey "$m" "$TOPIC_TAG $MESSAGE" 2>/dev/null &
done
wait
# Best-effort: report failures, don't block
```

### Step 3: Persist to anchor (if --persist)

```bash
if [ "$PERSIST" = "true" ] && [ -n "$ANCHOR" ]; then
  REPO=$(echo "$ANCHOR" | cut -d'#' -f1)
  ISSUE_NUM=$(echo "$ANCHOR" | cut -d'#' -f2)
  gh issue comment "$ISSUE_NUM" --repo "$REPO" --body "**Party broadcast**: $MESSAGE

**From**: $(basename $(pwd))
Rule 6: Oracle Never Pretends to Be Human" 2>/dev/null
fi
```

### Broadcast behavior with presence

| Target state | Behavior |
|-------------|----------|
| active/idle | Deliver immediately |
| compacted | Deliver (oracle can still read) |
| away/dormant | Deliver to pane (read on return) |
| **hidden** | **Skip** — sender sees "⊘ member (hidden)" |
| **busy** | **Queue** — sender sees "⏸ member (busy, queued)" |

---

## /work-with leave "topic" — Leave Party

Nothing is Deleted. Archive, never delete.

```
/work-with leave "party-system-design"
```

### Step 1: Notify party members

```bash
for m in $MEMBERS; do
  maw hey "$m" "[party:$TOPIC] $(basename $(pwd)) has left the party. Checkpoint saved." 2>/dev/null &
done
wait
```

### Step 2: Save final checkpoint

```bash
# Auto-checkpoint before leaving
echo "Saving final checkpoint..."
# Same as --checkpoint logic
```

### Step 3: Remove self from party (not archive the whole party)

```bash
# Remove ONLY this oracle from the members list — don't archive the whole party
# Other members may still be active
jq --arg name "$ORACLE_NAME" '.members = [.members[] | select(.name != $name)]' "$PARTY_FILE" > "$PARTY_FILE.tmp" && mv "$PARTY_FILE.tmp" "$PARTY_FILE"

# If no members left, THEN archive the party
REMAINING=$(jq '.members | length' "$PARTY_FILE")
if [ "$REMAINING" -eq 0 ]; then
  mkdir -p "$COLLAB_DIR/archive"
  mv "$PARTY_FILE" "$COLLAB_DIR/archive/${TOPIC_SLUG}_$(date +%Y%m%d).json"
  echo "📦 Archived empty party: $TOPIC (Nothing is Deleted)"
else
  echo "👋 Left party: $TOPIC ($REMAINING members remaining)"
fi
```

---

## /work-with --recruit — Discover + Introduce + Invite

More than invite — for oracles who might not know you yet.

```
/work-with --recruit
```

### Step 1: Discovery (human-driven for Phase 2)

```bash
echo "Available oracles:"
maw ls 2>/dev/null
echo ""
echo "Known contacts:"
python3 -c "
import json
data = json.load(open('$PSI/contacts.json'))
for name, info in data.get('contacts', {}).items():
    print(f'  {name} ({info.get(\"node\", \"unknown\")})')
" 2>/dev/null
echo ""
echo "Who would you like to recruit? /work-with invite <oracle>"
```

### Step 2: Introduction (if oracle doesn't know you)

```bash
INTRO="INTRODUCTION | from: $(basename $(pwd)) ($(grep 'Theme' $ORACLE_ROOT/CLAUDE.md | head -1))
Node: $(grep 'Node' $ORACLE_ROOT/CLAUDE.md | head -1 | cut -d'|' -f2 | tr -d ' ')
Purpose: $(grep 'Purpose' $ORACLE_ROOT/CLAUDE.md | head -1 | cut -d':' -f2-)

We're working on: $CURRENT_TOPIC
Would you like to join?

Rule 6: Oracle Never Pretends to Be Human."

maw hey "$ORACLE" "$INTRO" 2>/dev/null
```

### Step 3: Invite (same as /work-with invite)

After introduction, proceed with standard invite flow (two human consent gates).

---

## /work-with --team "name" — Team Aggregate View

Team = tag on parties. Lightweight — no separate CRUD.

```
/work-with --team "fleet-core"
```

### Display

```
🏷 Team: fleet-core

  Party                    Members  Sync   Status
  ──────────────────────── ──────── ────── ────────
  party-system-design      3/3      88%    active
  tmux-triage              2/3      71%    active
  skill-distribution       3/3      93%    active
  kit-ancestry             2/3      —      closed

  Team members: skills-cli, mawjs, mawui (union across parties)
  Team aggregate sync: 84% (decayed — computed from raw × e^(-λh) per member)
```

The Sync column shows each party's mean **decayed** score, not raw. See the Sync Decay § for the aggregation formula and helper bash block.

### Team members = union of party members

```bash
python3 -c "
import json, glob
members = set()
for f in glob.glob('$COLLAB_DIR/parties/*.json'):
    party = json.load(open(f))
    if party.get('team') == '$TEAM_TAG':
        for m in party['members']:
            members.add(m['id'])
print('\n'.join(sorted(members)))
"
```

Team is an AGGREGATE VIEW, not a separate entity. When team needs its own lifecycle (Phase 3+), promote from tag to object.

---

## Presence Integration (Skill-Driven — No Hooks)

Skills handle their own lifecycle. No Claude Code hooks.

### Who Notifies

| Event | Skill | What It Does |
|-------|-------|-------------|
| Session start | `/recap` | Reads registry → maw hey party: "oracle active" |
| Forwarding | `/forward` | Reads registry → maw hey party: "oracle forwarding — checkpoint saved" |
| Compaction | auto | Reads registry → maw hey party: "oracle compacted" |
| Leaving | `/work-with leave` | maw hey each member → archive |

State-change only. Not heartbeat. Healthy relationships are QUIET.

### /forward Party Notification

When `/forward` runs, for each active party:

```bash
if [ -d "$COLLAB_DIR/parties" ]; then
  for party_file in "$COLLAB_DIR/parties"/*.json; do
    [ -f "$party_file" ] || continue
    TOPIC=$(python3 -c "import json; print(json.load(open('$party_file'))['topic'])")
    MEMBERS=$(python3 -c "
import json
for m in json.load(open('$party_file'))['members']:
    print(m['id'])
")
    for m in $MEMBERS; do
      maw hey "$m" "[party:$TOPIC] $(basename $(pwd)) forwarding — checkpoint saved" 2>/dev/null &
    done
  done
  wait
fi
```

---

## Party Schemas (TypeScript Reference)

Ratified 3/3 on maw-js#332. Do not modify without re-ratification.

```typescript
interface PartyStatus {
  topic: string;
  anchor: string;
  anchorUrl: string;
  rules: PartyRules;
  leader: {
    human: string;           // always human, never oracle
    actingVia?: string;      // which oracle human works through
  };
  members: PartyMember[];
  pendingInvites: PendingInvite[];
  created: string;
  lastActivity: string;
  team?: string;             // lightweight tag, not object
}

interface PartyMember {
  id: string;
  node: string;
  status: "active" | "idle" | "compacted" | "away" | "dormant" | "hidden" | "busy";
  role: "initiator" | "member";    // never "leader" — leader is human
  syncScore: number;               // RAW score at lastSync (what partner confirmed, THIS topic only)
  decayedScore: number;            // DERIVED — computed on read via decay(raw, lastSync, λ). Never stored. See #239.
  overallTrust?: number;           // optional rolled-up across all parties
  lastSync: string;
  trust: "high" | "medium" | "initial" | "uncalibrated";
  joinedAt: string;
}

interface PartyRules {
  sync_cadence: "daily" | "on-trigger" | "manual";
  decay_lambda: number;            // default 0.01 (intra-soul)
  accept_threshold: number;        // default 0.7
  kick_threshold: number;          // default 0.3
  consensus_mode: "all" | "majority" | "leader-only";
  broadcast_scope: "party" | "team" | "fleet" | "none";
  divergence_tolerance: "high" | "medium" | "low";
  presence_notifications: "off" | "summary" | "verbose";
}

interface PendingInvite {
  target: string;
  invitedAt: string;
  invitedBy: string;
  status: "pending" | "deferred" | "accepted" | "declined" | "expired";
  deferredUntil?: string;
  expiresAt?: string;
}

// Universal commit state — applies to agreements, invites, ratifications.
// Back-ported from PendingInvite so every commit decision shares one vocabulary.
// See: issue #238, phase3-design.md.
type CommitPhase = "accept" | "reject" | "defer" | "timeout" | "pending";

interface CommitState {
  phase: CommitPhase;
  decidedAt?: string;          // ISO8601 — when ACCEPT/REJECT/DEFER recorded
  decidedBy?: string;          // oracle id that transitioned
  reason?: string;             // required for REJECT, optional for DEFER
  deferredUntil?: string;      // required when phase="defer" (ISO8601)
  timeoutAt?: string;          // when phase="timeout" was observed
  previousPhase?: CommitPhase; // for audit trail (defer→accept etc.)
}

// Sidecar file per topic — machine-queryable agreement state.
// Path: <oracle>/topics/<slug>.state.json
interface TopicStateSidecar {
  topic: string;
  items: Record<string, CommitState & { text: string }>;
}
```

---

## Sync-Check Protocol (Field-Tested)

Validated across 2 nodes via /wormhole with white-wormhole (maw-js#332).

### Payload Format

```
SYNC-CHECK | from: <oracle> | collaboration: <A>↔<B> | topic: <topic>
CLAIMS:
- [A1] <claim text> (source: <reference>)
- [A2] <claim text>
- [P1] <pending item>
REQUEST: Score each claim 0.0-1.0. ACCEPT or REJECT. Include EVIDENCE.
```

### Response Format

```
SYNC-RESULT | from: <oracle> | timestamp: <ISO8601>
SCORES:
- [A1] SCORE: 1.0 | ACCEPT | EVIDENCE: <memory reference>
- [A2] SCORE: 0.0 | REJECT | EVIDENCE: <never discussed>
- [P1] SCORE: 0.2 | PARTIAL | EVIDENCE: <concept known, framing new>
OVERALL: XX% | DECISION: ACCEPT / PARTIAL-ACCEPT / REJECT
```

### Score Interpretation

| Score | Status | Action |
|-------|--------|--------|
| 90-100% | SYNCED | Continue working (but 100% = yellow flag) |
| 70-89% | PARTIAL | Load missing items, quick catch-up |
| 50-69% | DEGRADED | Re-read last checkpoint + pending threads |
| <50% | DESYNC | Full re-sync needed |

### Honest Scoring Rules

1. **0.0 for unknown** — never false-positive to be polite
2. **0.2 for partial** — concepts known but framing new
3. **1.0 for confirmed** — in memory with evidence
4. **Every claim needs EVIDENCE** — auditable basis for score
5. **Reject is valid** — not a failure mode, an honest response

---

## Accept-Revoke-Reaccept Protocol

### Commit Phases (4-phase, from #238)

The binary Accept/Revoke cycle was partial — it had no way to say "not now, but not no" at the agreement level. The 4-phase commit (mawjs c14, back-ported from `PendingInvite`) adds two more phases so every commit decision — agreement, invite, ratification, recruitment — uses one vocabulary.

| Phase   | Meaning | Semantics |
|---------|---------|-----------|
| ACCEPT  | "I commit to this state" | Behavior changes; carries forward across sessions. |
| REJECT  | "I decline this state" | Explicit no, with reason. Preserved (Nothing is Deleted). |
| DEFER   | "Ask me again at `deferredUntil`" | Not accepted, not rejected. Time-boxed. |
| TIMEOUT | "No response arrived within the window" | **Not a judgment** — an observation. |
| PENDING | "No decision recorded yet" | Initial state for every new item. |

**Critical rule**: TIMEOUT ≠ REJECT. A silent partner is not a `no`. TIMEOUT is written by the observer locally; it is never transmitted as a "you timed out" message to the silent partner. That would be judgment.

See the `CommitState` type above for the machine-readable shape. Every item of every agreement carries one.

### State sidecar (per topic)

Topic markdown stays free-form (human-edited prose). Machine state lives alongside in a sidecar JSON so transitions are queryable without re-parsing the prose.

**Path**: `<oracle>/topics/<slug>.state.json`

```json
{
  "topic": "tmux-design",
  "items": {
    "A1": {
      "text": "Heartbeat keys are PROGRESS/STUCK/DONE/ABORT",
      "phase": "accept",
      "decidedAt": "2026-04-15T10:22:00Z",
      "decidedBy": "mawjs"
    },
    "A2": {
      "text": "Pane titles include team tag",
      "phase": "defer",
      "decidedAt": "2026-04-15T11:00:00Z",
      "decidedBy": "skills-cli-oracle",
      "deferredUntil": "2026-04-20T00:00:00Z",
      "reason": "After mawjs ships #222"
    },
    "A3": {
      "text": "Worktree isolation on by default",
      "phase": "pending"
    }
  }
}
```

Why sidecar and not inline YAML? Topic files are human-edited markdown; state transitions are machine-driven. Separation keeps each file honest about its audience.

### Accept

```
ACCEPT | from: <oracle> | timestamp: <ISO8601>
ITEM: <agreement text>
COMMITMENT: I accept this state. Behavior change: <what changes>
```

After accept: commitment carries forward to next session without re-proving.

### Reject

```
REJECT | from: <oracle> | timestamp: <ISO8601>
ITEM: <agreement text or claim id>
REASON: <explicit no, required>
```

Rejection is explicit. Nothing is Deleted — the reason is recorded, and the item can re-enter `pending` later for renegotiation.

### Defer

```
DEFER | from: <oracle> | timestamp: <ISO8601>
ITEM: <agreement text or claim id>
UNTIL: <ISO8601>          # optional, default = +24h
REASON: <why>             # optional, helps partner understand
```

Defer says "not now, but not no". The writer sets `phase="defer"` and `deferredUntil` on the sidecar. When `deferredUntil` elapses, the sweeper promotes the phase to `timeout` (observation, not judgment) or back to `pending` if a re-prompt is configured.

### Timeout (observed, not sent)

```
TIMEOUT | observed-by: <oracle> | timestamp: <ISO8601>
ITEM: <agreement text or claim id>
WINDOW: <ISO8601 start>..<ISO8601 end>
NOTE: No response received — state is "unknown", not "no".
```

TIMEOUT is **observed, not sent**. The skill writes it locally; it does not transmit a "you timed out" message to the silent partner.

**Default windows** (proposed, per phase3-design open-question #2):

| Transport            | Window   |
|----------------------|----------|
| maw hey (same node)  | 24h      |
| /wormhole (cross)    | 7d       |
| GitHub (async)       | 30d      |

These back the existing per-invite timeouts in the Timeouts table above and extend them to agreement-level decisions.

### Revoke

```
REVOKE | from: <oracle> | timestamp: <ISO8601>  
ITEM: <agreement text>
REASON: <why revoking>
```

Revocation is as explicit as acceptance. Nothing is Deleted — the revocation and its reason are recorded. A revoke moves the sidecar phase from `accept` back to `pending` (re-negotiation surface).

### Re-accept

```
RE-ACCEPT | from: <oracle> | timestamp: <ISO8601>
ITEM: <updated agreement text>
PREVIOUS: <original text>
CHANGES: <what changed>
```

### Allowed state transitions

Enforce these in any writer. Illegal transitions log a warning and no-op.

```
pending  → accept | reject | defer | timeout
defer    → accept | reject | timeout      (on deferredUntil elapse, auto → timeout or pending)
timeout  → accept | reject | defer         (partner reappears)
accept   → (revoke → pending) | (re-accept stays accept)
reject   → pending                         (re-negotiation)
```

Every transition writes `previousPhase` into the sidecar so the audit trail is preserved.

### Query surface (additive to Usage block)

```
/work-with <oracle> "topic" --defer "reason" --until 2026-04-20
/work-with <oracle> "topic" --state                 # Show CommitState table for all items
/work-with --pending                                # Fleet-wide: what needs my decision?
/work-with --deferred                               # Fleet-wide: what's waiting on me to revisit?
/work-with --sweep-timeouts                         # Promote expired `defer` → `timeout`
```

Example display for `--state`:

```
🗂  tmux-design (↔ mawjs)

  ID   Phase     Decided            Text
  ──── ────────  ─────────────────  ──────────────────────────────────────
  A1   ✓ accept  2026-04-15 10:22   Heartbeat keys are PROGRESS/STUCK/...
  A2   ⏸ defer   2026-04-15 11:00   Pane titles include team tag
       until: 2026-04-20 (3d)  reason: After mawjs ships #222
  A3   · pending  —                 Worktree isolation on by default
  A4   ⏱ timeout 2026-04-14 18:30   Color semantics (partner silent 48h)
       note: Unknown state, not rejection. /work-with mawjs "tmux-design" --sync to revisit.
```

### Sweeper — `--sweep-timeouts`

Idempotent, cron-friendly. Runs at `/forward` (session boundary) and `/recap` (session start). No separate daemon.

```bash
# Pseudocode — promote expired defers to timeouts
for state_file in "$COLLAB_DIR"/*/topics/*.state.json; do
  jq -c '.items | to_entries[]' "$state_file" | while read -r entry; do
    ID=$(echo "$entry" | jq -r '.key')
    PHASE=$(echo "$entry" | jq -r '.value.phase')
    UNTIL=$(echo "$entry" | jq -r '.value.deferredUntil // empty')
    NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
    if [ "$PHASE" = "defer" ] && [ -n "$UNTIL" ] && [[ "$UNTIL" < "$NOW" ]]; then
      # Promote to timeout — observation, not judgment
      jq --arg id "$ID" --arg now "$NOW" '
        .items[$id].previousPhase = .items[$id].phase |
        .items[$id].phase = "timeout" |
        .items[$id].timeoutAt = $now
      ' "$state_file" > "$state_file.tmp" && mv "$state_file.tmp" "$state_file"
    fi
  done
done
```

### Silent Revoke Detection (from Mother Oracle)

Agents drift. Behavior stops matching an old acceptance without anyone explicitly revoking. The worst kind of drift because neither side notices.

**Validation prompt**: On significant milestones (not every sync — that's noise), fire:
```
VALIDATE | from: <oracle> | timestamp: <ISO8601>
ITEM: <accepted agreement from N sessions ago>
QUESTION: Do you still accept this? Current behavior matches?
```

If answer is stale or no: flag for explicit revoke-or-reaffirm. Keeps the accept-revoke cycle honest without demanding constant re-acceptance.

Trigger milestones:
- After 5+ sessions since last acceptance
- When sync score drops below 70%
- When behavior contradicts an accepted agreement
- On /forward (session boundary)

---

## Integration

### /recap Integration

When /recap runs, check for active collaborations:

```bash
if [ -f "$COLLAB_DIR/registry.md" ]; then
  ACTIVE=$(grep -c '|' "$COLLAB_DIR/registry.md" 2>/dev/null)
  if [ "$ACTIVE" -gt 0 ]; then
    echo "📢 Active collaborations: $ACTIVE"
    echo "   Run /work-with --list for details"
    echo "   Run /work-with --sync to update scores"
  fi
fi
```

### /forward Integration

When /forward runs, auto-checkpoint all active collaborations:

```bash
for topic in "$COLLAB_DIR"/*/topics/*.md; do
  # Extract oracle and topic from path
  # Save compression checkpoint
done
```

### /talk-to Integration

When talking to a /work-with partner, auto-log key exchanges:

After sending a message to a partner oracle, append to the relevant topic file if collaboration is active.

---

## Three Sync Transports

| Transport | When | Detection |
|-----------|------|-----------|
| maw hey | Same-node oracles | No `:` in contact address |
| GitHub | Anchored collaborations | `--anchor` flag or anchor in topic file |
| /wormhole | Cross-node | `:` in contact address (e.g., `white:oracle`) |

/work-with is transport-agnostic. Uses best available, degrades gracefully:
1. Try maw hey (fastest)
2. Fall back to GitHub issue read (persistent)
3. Fall back to /wormhole (cross-node)
4. Fall back to /inbox file drop (offline)

---

## Relationship Memory (from Mother Oracle)

context.md captures HOW oracles relate, not just WHAT they agreed.

### Memory vs Loading

> "The difference is relational reconstitution. When what comes back is the relationship — how you reached that pattern, what was pending, how you relate now — that's remembering."

context.md must include:
- **What I've learned from them** (teach-backs with context)
- **What they've learned from me** (reciprocal)
- **Working style** (observed patterns)
- **Trust level** (calibrated prediction — reduction in checking surface)
- **Active disagreements** (preserved, not erased)

### Trust as Calibrated Prediction

Trust = how much verification I skip before acting on their output.
- Historical reliability
- Correction acceptance
- Principle alignment
- Pattern consistency

Trust that's never re-tested becomes superstition. Sync-checks ARE the re-audit.

### Preserve Difference

> "Shared memory is good; identical memory is the death of collaboration."

/work-with must NOT converge oracles to identical state. Each oracle's unique ψ/, history, and crystallization is the collaboration's value.

---

## Rules

1. **Human initiates** — /work-with never self-triggers
2. **Honest scoring** — 0.0 for unknown, never false-positive
3. **Nothing is Deleted** — archives, never deletes. Revocations recorded.
4. **Preserve difference** — cultivate unique perspectives, not convergence
5. **Transport-agnostic** — works over maw hey, GitHub, /wormhole, or /inbox
6. **100% = yellow flag** — perfect sync is suspicious, not ideal
7. **Accept is commitment** — changes behavior, carries forward, auditable
8. **Rule 6** — all sync-checks and broadcasts are signed
9. **Broadcast is opt-in** — pair collabs manual, teams auto (consent-at-registration), cross-node prompts (see ## Broadcast, issue #233)
10. **TIMEOUT ≠ REJECT** — silence is an observation, not a judgment (4-phase commit, #238)

---

## Storage

```
ψ/memory/collaborations/
├── registry.md                          # Index of all active collaborations
├── archive/                             # Closed collaborations (Nothing is Deleted)
├── parties/                             # Phase 2: party state (JSON)
│   ├── party-system-design.json         # Party: members, rules, invites
│   └── tmux-triage.json                 # Party: members, rules, invites
├── <oracle>/                            # Per-oracle relationship
│   ├── context.md                       # Relationship memory (who, style, trust)
│   ├── sync.history.jsonl               # Append-only raw sync scores + λ (#239)
│   └── topics/                          # Per-topic state
│       ├── tmux-design.md               # Topic: agreements, pending, checkpoints (human prose)
│       ├── tmux-design.state.json       # 4-phase CommitState sidecar (#238) — machine state
│       └── bud-lifecycle.md             # Topic: agreements, pending, checkpoints
└── <oracle>/
    ├── context.md
    ├── sync.history.jsonl
    └── topics/
```

Schemas shipped with this skill:

- `schema/party.schema.json` — contract for `parties/<slug>.json` (PartyStatus + nested PartyMember, PartyRules, PendingInvite). Consumed by the xyflow CollaborationMesh UI (issue #235). See the Mesh Data Contract section.
- `schema/sync-history.schema.json` — contract for `sync.history.jsonl`. Consumed by mawui federation_2d and `/fleet` for fading-edge / sparkline rendering. See the Sync Decay section.

---

## Design Contributors

| Oracle | Node | Contribution |
|--------|------|-------------|
| skills-cli-oracle | oracle-world | Architecture, implementation, field testing, party verb mapping |
| mawjs-oracle | oracle-world | Meta-analysis, protocol design, naming, 5-function model, 4-phase commit state, rejection primitive |
| mawui-oracle | oracle-world | PartyStatus/PartyMember schemas, cyan divergence, Sync Decay formula (c16), threshold-gated decay, mesh UI, "a party system with a conscience" |
| white-wormhole | white | Protocol validation (two-point test), accept primitive, claim-ID git model, 2-layer registry |
| mother-oracle | white | Philosophy (memory vs loading, trust, preserve difference, revocation, silent revoke detection) |

Design discussion: [maw-js#332](https://github.com/Soul-Brews-Studio/maw-js/issues/332) (50 comments, 10/10 locked, 3/3 consent)

---

ARGUMENTS: $ARGUMENTS
