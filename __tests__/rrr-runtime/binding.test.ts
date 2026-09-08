import { afterEach, describe, expect, it } from "bun:test";
import { chmod, mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { pythonCall, skillRoot } from "./helpers";

const binder = join(skillRoot, "scripts", "rrr-bind.py");
const scratch: string[] = [];
const uuidA = "123e4567-e89b-42d3-a456-426614174000";
const uuidB = "123e4567-e89b-42d3-a456-426614174001";
const line = (value: unknown) => JSON.stringify(value);

afterEach(async () => {
  await Promise.all(scratch.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("RRR structural runtime binding", () => {
  it("binds Claude by exact top-level ID and ignores copied prompt fields", () => {
    const text = [
      line({ sessionId: uuidA, timestamp: "2026-01-01T00:00:00+07:00", message: { sessionId: uuidB, timestamp: "1999-01-01T00:00:00Z" } }),
      line({ sessionId: uuidA, timestamp: "2026-01-01T00:01:00Z", isResumed: true }),
      line({ sessionId: uuidA, timestamp: "2026-01-01T00:02:00.123Z", isCompactSummary: true, truncated: true }),
      "{truncated",
    ].join("\n");
    const result = pythonCall(binder, "claude_binding", [uuidA, text, `/sessions/${uuidA}.jsonl`]) as any;
    expect(result).toMatchObject({ status: "bound", child: false, resumed: true, compacted: true, truncated: true, malformed: 1 });
    expect(result.timestamps).toEqual([
      "2026-01-01T00:00:00+07:00",
      "2026-01-01T00:01:00+00:00",
      "2026-01-01T00:02:00.123000+00:00",
    ]);
    expect((pythonCall(binder, "claude_binding", [uuidB, text]) as any).status).toBe("unbound");
  });

  it("keeps a Claude sidechain bound but labels it as a child", () => {
    const text = line({ sessionId: uuidA, timestamp: "2026-01-01T00:00:00Z", isSidechain: true });
    expect(pythonCall(binder, "claude_binding", [uuidA, text, `/subagents/agent-${uuidA}.jsonl`])).toMatchObject({
      status: "bound",
      child: true,
    });
  });

  it("accepts the matching Codex metadata after a parent record and rejects ambiguity/mismatch", () => {
    const records = [
      { type: "session_meta", payload: { id: uuidB, source: "cli" }, timestamp: "2026-01-01T00:00:00Z" },
      { type: "session_meta", payload: { id: uuidA, source: { subagent: { thread_spawn: { parent_thread_id: uuidB } } } }, timestamp: "2026-01-01T00:00:01Z" },
      { type: "compaction", timestamp: "2026-01-01T00:00:02Z" },
      { type: "turn_context", payload: { resumed: true }, timestamp: "2026-01-01T00:00:03Z", truncated: true },
    ].map(line).join("\n");
    const path = `rollout-2026-01-01T00-00-00-${uuidA}.jsonl`;
    expect(pythonCall(binder, "codex_binding", [uuidA, records, path])).toMatchObject({
      status: "bound",
      child: true,
      compacted: true,
      resumed: true,
      truncated: true,
    });
    expect((pythonCall(binder, "codex_binding", [uuidB, records, path]) as any).status).toBe("unbound");
    const duplicate = `${records}\n${line({ type: "session_meta", payload: { id: uuidA } })}`;
    expect((pythonCall(binder, "codex_binding", [uuidA, duplicate, path]) as any).reason).toContain("ambiguous");
    expect((pythonCall(binder, "codex_binding", ["not-a-uuid", records, "rollout-not-a-uuid.jsonl"]) as any).status).toBe("unbound");
  });

  it("selects the exact active file and refuses duplicate same-ID records", async () => {
    const home = join(tmpdir(), `rrr-bind-${crypto.randomUUID()}`);
    scratch.push(home);
    const first = join(home, ".claude", "projects", "one");
    const second = join(home, ".claude", "projects", "two");
    await mkdir(first, { recursive: true });
    await mkdir(second, { recursive: true });
    await writeFile(join(first, `${uuidA}.jsonl`), line({ sessionId: uuidA, timestamp: "2026-01-01T00:00:00Z" }));
    await writeFile(join(first, `${uuidB}.jsonl`), line({ sessionId: uuidB, timestamp: "2026-01-01T00:00:00Z" }));
    const selected = pythonCall(binder, "bind_environment", [{ CLAUDE_CODE_SESSION_ID: uuidA }, home]) as any;
    expect(selected).toMatchObject({ status: "bound", session_id: uuidA });
    await writeFile(join(second, `${uuidA}.jsonl`), line({ sessionId: uuidA, timestamp: "2026-01-01T00:00:00Z" }));
    expect(pythonCall(binder, "bind_environment", [{ CLAUDE_CODE_SESSION_ID: uuidA }, home])).toMatchObject({ status: "unbound" });
  });

  it("returns honest unbound/unavailable results for missing or conflicting runtime identity", async () => {
    const home = join(tmpdir(), `rrr-bind-${crypto.randomUUID()}`);
    scratch.push(home);
    await mkdir(home, { recursive: true });
    expect(pythonCall(binder, "bind_environment", [{}, home])).toMatchObject({ status: "unbound" });
    expect(pythonCall(binder, "bind_environment", [{ CODEX_THREAD_ID: uuidA, CODEX_SESSION_ID: uuidB }, home])).toMatchObject({
      status: "unbound",
      reason: "conflicting Codex runtime identities",
    });
    expect(pythonCall(binder, "bind_environment", [{ CLAUDE_CODE_SESSION_ID: uuidA }, home])).toMatchObject({ status: "unavailable" });
    await chmod(home, 0o700);
  });

  it("uses current Claude runtime markers instead of inherited parent Codex IDs", async () => {
    const home = join(tmpdir(), `rrr-bind-${crypto.randomUUID()}`);
    scratch.push(home);
    const project = join(home, ".claude", "projects", "nested");
    await mkdir(project, { recursive: true });
    await writeFile(join(project, `${uuidA}.jsonl`), line({ sessionId: uuidA, timestamp: "2026-01-01T00:00:00Z" }));
    const ambiguous = { CLAUDE_CODE_SESSION_ID: uuidA, CODEX_THREAD_ID: uuidB, CODEX_SESSION_ID: "123e4567-e89b-42d3-a456-426614174002" };
    expect(pythonCall(binder, "bind_environment", [ambiguous, home])).toMatchObject({ status: "unbound" });
    expect(pythonCall(binder, "bind_environment", [{ ...ambiguous, CLAUDECODE: "1" }, home])).toMatchObject({
      status: "bound",
      runtime: "claude",
      session_id: uuidA,
    });
  });
});
