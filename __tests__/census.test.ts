import { test, expect, beforeAll, afterAll } from "bun:test";
import { mkdtempSync, writeFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

// scripts/skill-usage-census.py mines ~/.claude/projects/*/*.jsonl for skill
// invocations. It exposes --glob so we can point it at a fixture session
// instead of the real (huge, machine-specific) transcript store — this test
// stays fast and deterministic. It locks in the four behaviours that make the
// census trustworthy: user-typed detection, agent-invoked detection, cross-file
// dedup, and structural exclusion of tool_result echoes.

const SCRIPT = join(process.cwd(), "scripts/skill-usage-census.py");

let dir: string;
let fixtureGlob: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "census-"));
  const lines = [
    // real user-typed /recap (pure command envelope string content)
    { uuid: "u1", type: "user", timestamp: "2026-07-01T10:00:00.000Z", message: { role: "user", content: "<command-name>/recap</command-name>\n<command-args></command-args>" } },
    // real agent-invoked dig via the Skill tool
    { uuid: "a1", type: "assistant", timestamp: "2026-07-01T10:01:00.000Z", message: { role: "assistant", content: [{ type: "tool_use", name: "Skill", input: { skill: "dig" } }] } },
    // false positive: a tool_result echoing <command-name> inside list content — must NOT count
    { uuid: "tr1", type: "user", timestamp: "2026-07-01T10:02:00.000Z", message: { role: "user", content: [{ type: "tool_result", content: "docs mention <command-name>/recap</command-name> here" }] } },
    // duplicate of u1 (a repo-rename copy of the same session in another project dir) — must be deduped
    { uuid: "u1", type: "user", timestamp: "2026-07-01T10:00:00.000Z", message: { role: "user", content: "<command-name>/recap</command-name>\n<command-args></command-args>" } },
    // a second, distinct real /recap — proves non-duplicates still accumulate
    { uuid: "u2", type: "user", timestamp: "2026-07-02T09:00:00.000Z", message: { role: "user", content: "<command-name>/recap</command-name>" } },
  ];
  writeFileSync(join(dir, "session.jsonl"), lines.map((l) => JSON.stringify(l)).join("\n") + "\n");
  fixtureGlob = join(dir, "*.jsonl");
});

afterAll(() => rmSync(dir, { recursive: true, force: true }));

test("census counts user-typed + agent-invoked, dedups copies, excludes tool_result echoes", () => {
  const proc = Bun.spawnSync(["python3", SCRIPT, "--json", "--glob", fixtureGlob]);
  expect(proc.exitCode).toBe(0);
  const out = JSON.parse(proc.stdout.toString());

  // /recap: u1 counted once (dup skipped) + u2 = 2 user, tool_result echo excluded, no agent hits
  expect(out.skills.recap.user_count).toBe(2);
  expect(out.skills.recap.agent_count).toBe(0);
  expect(out.skills.recap.total).toBe(2);

  // dig: one agent invocation, zero user
  expect(out.skills.dig.agent_count).toBe(1);
  expect(out.skills.dig.user_count).toBe(0);

  // the duplicate u1 line was recognised and skipped
  expect(out.meta.lines_deduped_cross_file).toBeGreaterThanOrEqual(1);
});
