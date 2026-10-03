#!/usr/bin/env bun
// Round Table arithmetic — the part that must not be left to judgment.
//   bun scripts/table.ts inspect STATE.json   early-stop check after round 2 or 3
//   bun scripts/table.ts vote    STATE.json   validate round 4 and aggregate
// STATE.json is the RoundTableState the skill keeps beside the minute.
// Exit: 0 decided / continue · 2 re-prompt needed · 3 escalate · 1 bad input.

type Round = { round: number; position: string; confidence: number; self_update?: string };
type Agent = {
  name: string; soul: string; rounds: Round[];
  final?: { vote: string; confidence: number; rationale: string };
  dissent_note?: string | null;
};
type State = {
  id: string; question: string; options: string[];
  aggregator: "majority" | "weighted" | "unanimity-or-escalate";
  values_keywords?: string[]; agents: Agent[];
};

const [mode, file] = process.argv.slice(2);
if (!["inspect", "vote"].includes(mode) || !file) {
  console.error("usage: bun scripts/table.ts inspect|vote STATE.json");
  process.exit(1);
}
const state: State = JSON.parse(await Bun.file(file).text());
if (state.agents.length < 3) {
  console.error(`quorum: ${state.agents.length} personas — a Round Table needs at least 3`);
  process.exit(1);
}

if (mode === "inspect") {
  const last = Math.max(...state.agents.map(a => a.rounds.length));
  const latest = state.agents.map(a => a.rounds.find(r => r.round === last));
  if (latest.some(r => !r)) { console.error(`round ${last}: not every persona has answered`); process.exit(1); }
  const rows = latest as Round[];
  const same = new Set(rows.map(r => r.position)).size === 1;
  if (same && rows.every(r => r.confidence >= 8)) {
    console.log(`EARLY-STOP: all hold "${rows[0].position}" at ≥8 after round ${last} — skip to round 4`);
  } else if (last === 2 && rows.every(r => (r.self_update ?? "").trim().toLowerCase() === "no change")) {
    console.log("SKIP-ROUND-3: nobody moved in round 2 — round 3 would be performative (confirm no new evidence)");
  } else {
    const ten = rows.filter(r => r.confidence === 10);
    if (ten.length === 1 && rows.filter(r => r !== ten[0]).every(r => r.confidence <= 3)) {
      const who = state.agents[rows.indexOf(ten[0])].name;
      console.log(`EXPERT-DEFERENCE: only ${who} is certain (10), the rest ≤3 — ask the human whether to short-circuit`);
    } else {
      console.log(`CONTINUE: round ${last} still divided — run round ${last + 1}`);
    }
  }
  process.exit(0);
}

// vote
const bad: string[] = [];
for (const a of state.agents) {
  const f = a.final;
  if (!f) { bad.push(`${a.name}: no final vote`); continue; }
  if (!state.options.includes(f.vote)) bad.push(`${a.name}: "${f.vote}" is not one of ${state.options.join(", ")}`);
  if (!Number.isInteger(f.confidence) || f.confidence < 1 || f.confidence > 10) bad.push(`${a.name}: confidence ${f.confidence} outside 1–10`);
  if (f.confidence === 5) bad.push(`${a.name}: 5 is forbidden in round 4 — re-prompt for 4 or 6`);
}
if (bad.length) { console.log("RE-PROMPT\n" + bad.map(b => "  " + b).join("\n")); process.exit(2); }

const votes = state.agents.map(a => ({ name: a.name, ...a.final!, dissent: a.dissent_note ?? null }));
const sum = (o: string) => votes.filter(v => v.vote === o).reduce((s, v) => s + v.confidence, 0);
const count = (o: string) => votes.filter(v => v.vote === o).length;
const score = state.aggregator === "majority" ? count : sum;
const ranked = [...state.options].sort((a, b) => score(b) - score(a));

const reasons: string[] = [];
let winner: string | null = ranked[0];
const tied = state.options.filter(o => score(o) === score(ranked[0]));
if (tied.length > 1) {
  const top = (o: string) => Math.max(0, ...votes.filter(v => v.vote === o).map(v => v.confidence));
  const best = Math.max(...tied.map(top));
  let left = tied.filter(o => top(o) === best);
  if (left.length > 1) {
    const dissents = (o: string) => votes.filter(v => v.vote === o && v.dissent).length;
    const fewest = Math.min(...left.map(dissents));
    left = left.filter(o => dissents(o) === fewest);
  }
  if (left.length > 1) { winner = null; reasons.push(`tie between ${left.join(" and ")} survives every tie-break`); }
  else winner = left[0];
}

const total = votes.reduce((s, v) => s + v.confidence, 0);
const share = winner ? sum(winner) / total : 0;
if (winner && share < 0.6) reasons.push(`split: ${winner} holds ${(share * 100).toFixed(0)}% of weighted confidence (< 60%)`);
const tens = new Set(votes.filter(v => v.confidence === 10).map(v => v.vote));
if (tens.size > 1) reasons.push(`opposing certainties: 10s on ${[...tens].join(" and ")}`);
const keys = (state.values_keywords ?? ["honesty", "safety", "consent"]).map(k => k.toLowerCase());
for (const v of votes) {
  const hit = keys.find(k => (v.dissent ?? "").toLowerCase().includes(k));
  if (hit) reasons.push(`${v.name}'s dissent cites a value: "${hit}"`);
}
if (state.aggregator === "unanimity-or-escalate" && !(new Set(votes.map(v => v.vote)).size === 1 && votes.every(v => v.confidence >= 7))) {
  reasons.push("unanimity-or-escalate: not every persona voted the same side at ≥7");
}

const max = votes.length * 10;
const tally = state.options.map(o => `${o}: ${sum(o)}`).join(" · ");
console.log(`DECISION: ${reasons.length ? "ESCALATE" : winner}`);
console.log(`Aggregator: ${state.aggregator} · ${tally}`);
if (winner) console.log(`Weighted confidence: ${sum(winner)}/${max} (${Math.round(sum(winner) / max * 100)}%) for ${winner}`);
const against = votes.filter(v => v.vote !== winner).sort((a, b) => b.confidence - a.confidence)[0];
console.log(`Top dissent: ${against ? `${against.name} (${against.vote}, ${against.confidence}) — ${against.rationale}` : "none (no opposing votes)"}`);
const hedger = votes.filter(v => v.vote === winner).sort((a, b) => a.confidence - b.confidence)[0];
if (hedger) console.log(`Top hedger: ${hedger.name} (${hedger.confidence}) — ${hedger.rationale}`);
if (reasons.length) console.log("Escalate because:\n" + reasons.map(r => "  " + r).join("\n") + "\nThe human decides.");
process.exit(reasons.length ? 3 : 0);
