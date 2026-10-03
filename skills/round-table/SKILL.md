---
name: round-table
description: 'Convene a Round Table (โต๊ะกลม): 3–8 souls — persona files, Oracles, or real people''s DNA — debate ONE stakes-bearing decision over exactly 4 rounds (OPEN, DEEPEN, CONVERGE, VOTE), one subagent per soul, then vote with 1–10 confidence; a script does the arithmetic and deadlocks go to the human. Use when user says "round table", "round-table", "โต๊ะกลม", "convene the council", "deliberate this". For "should we …" questions, ask before convening. Do NOT use for brainstorming or one-perspective-at-a-time analysis (use /oracle-prism).'
argument-hint: '"<question>" --agents a,b,c [--options x,y,z] [--aggregator weighted|majority|unanimity-or-escalate]'
---

# /round-table — โต๊ะกลม

> "Many bodies, one soul" — so one agent can seat many souls at one table, let them argue,
> and still hand the decision back to the human.

`/oracle-prism` wears souls one after another, inline. A Round Table seats them
**together**: each soul is its own subagent, hears the others, pushes back, and finally
votes with a confidence it has to defend. Bounded by design: **4 rounds, never 5.**

**Where the shape comes from.** A 7-agent, 4-round, confidence-voted meeting that Boy
(Pinyo) ran inside his Oracle family. Only its parameters survived — 7 agents, 4 rounds,
a confidence vote at the end, reserved for expensive decisions. Mother Oracle rebuilt the
round prompts, the 1–10 scale and the aggregation rules from those parameters. So this
skill is *spiritually faithful, not forensically reproduced*: if better prompts turn up,
replace `prompts/` — don't defend them.

## Files

```text
round-table/
├── SKILL.md
├── prompts/round1-open.txt … round4-vote.txt   one template per round, {{slots}}
├── scripts/table.ts                            inspect (early stop) + vote (aggregate)
└── examples/adopt-a-pattern.json               worked example — must give 37/50
```

`SKILL_DIR` is the base directory printed above this skill.

## Step 0 — Is this a Round Table question?

Suggest `/oracle-prism` instead unless all three hold:

1. **A decision**, not a topic — something will be done differently depending on the answer.
2. **Canonical options**, 2–4 of them (`--options`). If the user gave none, propose them
   and wait for a yes.
3. **Stakes** — being wrong is expensive or hard to reverse.

"Should we …" phrasing is not consent to convene. Ask first.

Then find where the minute will live:

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
SLUG="$(date +%Y-%m-%d)_<short-slug-of-the-question>"
TABLE="$PSI/lab/round-table"; mkdir -p "$TABLE" "$PSI/inbox/decisions"
MINUTE="$TABLE/$SLUG.md"; STATE="$TABLE/$SLUG.json"
```

## Step 1 — Convene: seat the souls (3 to 8)

Quorum is 3 — two is a debate, one a monologue. Default to 5 when the user names no
roster. Every seat needs a **soul read from somewhere real — never invented**:

| Seat kind | Where the soul comes from |
|---|---|
| A persona file | any path the user gives (`resonance_<name>.md`, a character sheet, a SKILL.md) — read it whole |
| An Oracle in your fleet | if `maw` is installed: `R=$(maw locate <name> --path)` → `$R/ψ/memory/resonance/<name>.md`, else `$R/CLAUDE.md`'s identity section. Not found → refuse the seat and say so |
| A real person (multi-DNA) | one line — name + the single habit they bring — written or confirmed by the human |

Print the roster with each soul's source, the question, the options and the aggregator
(default `weighted`). Gather **every fact** the souls may use into `question_context`
now — there is no tool use during the rounds.

Create `$STATE` in the shape of `examples/adopt-a-pattern.json` (`id`, `question`,
`options`, `aggregator`, `agents[]` with `name`, `soul`, `rounds[]`) and start `$MINUTE`
with the roster. Flush both after every round, so one flaky subagent never costs the
earlier rounds. Persona files may be private — the minute stays in your ψ, not in a post.

## Step 2 — Rounds: one subagent per soul, all in parallel

For each round, fill that round's template from `$SKILL_DIR/prompts/` and launch **one
Agent call per soul, all in a single message**. Each prompt carries the full soul text,
the question, the options and the transcript so far. Subagents debate from soul + context
only — no tools.

| Round | Template | Each soul gets |
|---|---|---|
| 1 OPEN | `round1-open.txt` | soul, question, context — hears nobody |
| 2 DEEPEN | `round2-deepen.txt` | + every round-1 position; must challenge one by name |
| 3 CONVERGE | `round3-converge.txt` | + rounds 1–2, + 2–4 one-line disagreement axes that **you** extract |
| 4 VOTE | `round4-vote.txt` | + the full transcript; binding, 5 is forbidden |

Parse each reply as JSON. Malformed or off-option → re-prompt that soul once; a second
failure empties the seat and the minute says so. Append `{round, position, confidence,
self_update}` to that soul's `rounds` in `$STATE`, and the round to `$MINUTE`.

**After rounds 2 and 3, ask the inspector — don't eyeball it:**

```bash
bun "$SKILL_DIR/scripts/table.ts" inspect "$STATE"
```

| Output | Do |
|---|---|
| `EARLY-STOP` | everyone agrees at ≥ 8 — go straight to round 4 |
| `SKIP-ROUND-3` | nobody moved in round 2 — confirm no new evidence arrived, then vote |
| `EXPERT-DEFERENCE` | one soul at 10, the rest ≤ 3 — ask the human whether to short-circuit |
| `CONTINUE` | run the next round |

## Step 3 — Vote: the script counts, not the model

Write each soul's round-4 answer into `final` (`vote`, `confidence`, `rationale`) and
`dissent_note`, then:

```bash
bun "$SKILL_DIR/scripts/table.ts" vote "$STATE"
```

| Exit | Meaning | Do |
|---|---|---|
| 0 | decided | print the decision block |
| 2 | `RE-PROMPT` — a 5, an off-option vote, a bad number | re-ask only the named souls, vote again |
| 3 | `ESCALATE` | write the deadlock in plain words; the human breaks it |
| 1 | bad input, or fewer than 3 souls | fix `$STATE` |

What the script enforces:

- **`weighted`** (default) sums confidence per option · **`majority`** counts heads ·
  **`unanimity-or-escalate`** needs every soul on one side at ≥ 7.
- **Ties** break by highest single confidence, then fewer dissent notes, then the human —
  never an automatic pick.
- **Escalates under every aggregator** when the winner holds < 60% of the weighted
  confidence, when 10s land on opposite sides, or when a dissent cites a value
  (`honesty`, `safety`, `consent` — override with `values_keywords` in `$STATE`).
  The human decides the hard ones.

## Step 4 — The minute, and handing it back

Close `$MINUTE` with the vote table (soul · vote · confidence · rationale) and the
script's block verbatim, e.g.:

```text
DECISION: adopt-modified
Weighted confidence: 37/50 (74%) for adopt-modified
Top dissent: none (no opposing votes)
Top hedger: brand (6) — Compromise — would prefer as-is, but unity matters more
```

Write one line — the decision and the minute's path — to
`$PSI/inbox/decisions/$SLUG.md`, so `/recap` finds it. Then:

```bash
# announce-mode → absolute path (no ψ/, no ~/, no $VAR, no ...).
# Use: echo "marker: $RESOLVED_PATH"  — bash substitutes; never print $VAR literally. See CONVENTIONS.md.
echo "🪑 Minute: $MINUTE"
echo "📥 Decision: $PSI/inbox/decisions/$SLUG.md"
```

And step out of the table:

- **Every seat was a lens.** Write "the finance lens voted…", never "Finance decided…".
  The souls were worn by the convener; a seat is not that Oracle's or that person's real
  view. For a real view, ask them (`/talk-to` if you have a fleet).
- **A decision is advice.** The human ships, merges and signs — the table only recommends.

## Self-check

```bash
bun "$SKILL_DIR/scripts/table.ts" vote "$SKILL_DIR/examples/adopt-a-pattern.json"
```

Must print `DECISION: adopt-modified` and `37/50 (74%)` and exit 0 — the result the
reconstructed spec predicts for its worked example. Anything else means `table.ts` drifted.

## Not in scope

No tool use mid-round · no soul summoning another agent · no human interjection
mid-round · no round 5.
