---
name: oracle-prism
description: 'Multi-perspective analysis — one agent transforms through 5 lenses (Archaeologist, Bug Hunter, Skeptic, Architect, Auditor) inline, no subagents. Use when user says "prism", "oracle-prism", "multi-perspective", "มองหลายมุม", "did we miss anything", "analyze from all angles", or before closing a session/migration/design decision. Presets: --preset retro/design/incident, --lenses N, --custom. Do NOT trigger for adversarial disproving (use /adversarial-analysis) or plain retrospectives (use /rrr).'
---

# /oracle-prism — Multi-Perspective Analysis

> "แสงเดียวผ่านปริซึม แตกเป็นหลายสี — เรื่องเดียวกัน มองจากหลายมุม เห็นต่างกัน"

One agent, five perspectives, no subagents. Transform inline — shift between lenses to dig through work, decisions, or problems from angles that a single viewpoint would miss.

## Usage

```
/oracle-prism                        # Analyze current session (default)
/oracle-prism "the rename migration"  # Analyze a specific topic
/oracle-prism --lenses 3              # Use 3 lenses instead of 5
/oracle-prism --custom "Security Auditor,Performance Engineer,UX Designer"
```

## How It Works

**No subagents.** The main agent transforms between perspectives sequentially, producing one section per lens. Each lens sees the same facts but asks different questions.

This is NOT adversarial analysis (which tries to disprove). This is **prismatic analysis** — same light, different colors.

## Default 5 Lenses

| # | Lens | Emoji | Question it asks |
|---|------|-------|-----------------|
| 1 | Archaeologist | `🔍` | "What actually happened? Timeline, sequence, facts." |
| 2 | Bug Hunter | `🐛` | "What problems did we hit? What's still broken?" |
| 3 | Skeptic | `💀` | "What did we do wrong? What would we redo?" |
| 4 | Architect | `🏗️` | "What changed structurally? What's the before/after?" |
| 5 | Auditor | `📋` | "What's left undone? What's inconsistent?" |

## Alternate Lens Sets

Use `--custom` to define your own, or pick a preset:

### `--preset retro` (session retrospective)
| Lens | Question |
|------|----------|
| Historian | What happened, in what order? |
| Critic | What went poorly or slowly? |
| Cheerleader | What went well? What should we repeat? |
| Connector | What patterns connect to past work? |
| Planner | What's the next move? |

### `--preset design` (design review)
| Lens | Question |
|------|----------|
| User | Is this easy to use? What's confusing? |
| Maintainer | Is this easy to change later? |
| Breaker | How can this fail? Edge cases? |
| Simplifier | What can be removed? |
| Integrator | How does this fit with everything else? |

### `--preset incident` (post-incident)
| Lens | Question |
|------|----------|
| Firefighter | What happened and how was it fixed? |
| Detective | What was the root cause chain? |
| Defender | What guards existed? Why didn't they catch it? |
| Forecaster | What similar things could happen next? |
| Builder | What systemic fix prevents recurrence? |

## Output Format

```markdown
## 🔍 Lens 1: Archaeologist — "What happened?"

[Timeline table or narrative]

---

## 🐛 Lens 2: Bug Hunter — "What broke?"

[Problems found, with evidence]

---

## 💀 Lens 3: Skeptic — "What went wrong?"

[Mistakes, with what should have been done]

---

## 🏗️ Lens 4: Architect — "What changed?"

[Before/after structural view]

---

## 📋 Lens 5: Auditor — "What's left?"

[Table of pending items with status and urgency]

---

**Cross-lens summary:** [2-3 sentences synthesizing what multiple lenses agree on]
```

## Rules

1. **No subagents** — all lenses run in the main agent, sequentially
2. **Each lens gets a section** with its emoji, name, and guiding question as header
3. **Evidence required** — cite files, commits, commands, timestamps. No vague claims
4. **Lenses disagree** — if the Architect says "clean" but the Auditor says "incomplete", show both. Don't harmonize
5. **Cross-lens summary at the end** — what do multiple lenses converge on?
6. **Tables over prose** — use tables for timelines, status lists, before/after comparisons
7. **Session context by default** — if no topic given, analyze the current session's work
8. **3-7 lenses** — minimum 3, maximum 7. Default 5. Use `--lenses N` to adjust

## When to Use

| Situation | Why prism helps |
|-----------|----------------|
| End of session | Catch what you missed before closing |
| After a migration/rename | Find inconsistencies across the change |
| Design decision | See tradeoffs from user/maintainer/breaker angles |
| Post-incident | Structured multi-angle without blame |
| "Did we miss anything?" | The Auditor lens exists for this |

## Relationship to Other Skills

| Skill | Pattern | Agents |
|-------|---------|--------|
| `/oracle-prism` | Multi-perspective, same agent | 0 (inline transform) |
| `/adversarial-analysis` | Try to disprove a claim | 5 parallel subagents |
| `/rrr` | Session retrospective | 0 (or 5 in --deep) |
| `/roundtable` | Discussion between personas | 0 (inline) |

Prism is the **lightest** multi-perspective tool — no agents, no spawning, no coordination overhead. Use it when you want angles, not adversaries.
