/**
 * Tests for fix #274 — /dig --deep must scan subagent session files.
 *
 * Root cause: dig.py only scanned depth-1 *.jsonl files.
 * The --deep flag was parsed by SKILL.md but silently ignored by the script,
 * causing 17,798 subagent sessions (~95% of Jan-Feb 2026 history) to be missed.
 *
 * Fix: dig.py v3 scans <project>/<uuid>/subagents/*.jsonl when --deep is passed.
 */
import { describe, it, expect, beforeAll, afterAll } from "bun:test";
import { mkdir, rm, writeFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { tmpdir } from "os";
import { spawnSync } from "child_process";

const FIXTURE_DIR = join(tmpdir(), `dig-test-${Date.now()}`);
const DIG_PY = join(process.cwd(), "src/skills/dig/scripts/dig.py");

// Minimal valid JSONL session entry
function makeSession(id: string, ts: string, summary: string): string {
  const lines = [
    JSON.stringify({
      type: "user",
      timestamp: ts,
      message: { content: [{ type: "text", text: summary }] },
    }),
    JSON.stringify({
      type: "assistant",
      timestamp: ts,
      message: { content: [{ type: "text", text: "OK" }] },
    }),
  ];
  return lines.join("\n") + "\n";
}

beforeAll(async () => {
  // Create fixture directory structure:
  //
  //   FIXTURE_DIR/
  //     top-session-aaa.jsonl          ← top-level session (always visible)
  //     some-uuid-1234/
  //       subagents/
  //         subagent-bbb.jsonl         ← subagent session (only visible with --deep)
  //         empty-file.jsonl           ← should be skipped (size 0)

  await mkdir(FIXTURE_DIR, { recursive: true });

  // Top-level session
  await writeFile(
    join(FIXTURE_DIR, "top-session-aaaaaaaaaaaa.jsonl"),
    makeSession("aaaaaaaaaaaa", "2026-02-01T08:00:00Z", "Top-level session")
  );

  // Subagent session dir
  const subDir = join(FIXTURE_DIR, "some-uuid-1234", "subagents");
  await mkdir(subDir, { recursive: true });

  await writeFile(
    join(subDir, "subagent-bbbbbbbbbbbb.jsonl"),
    makeSession("bbbbbbbbbbbb", "2026-02-01T09:00:00Z", "Subagent session")
  );

  // Empty file — should be skipped
  await writeFile(join(subDir, "empty-cccccccccccc.jsonl"), "");
});

afterAll(async () => {
  if (existsSync(FIXTURE_DIR)) {
    await rm(FIXTURE_DIR, { recursive: true });
  }
});

function runDig(args: string[]): { stdout: string; stderr: string; exitCode: number } {
  const result = spawnSync("python3", [DIG_PY, ...args], {
    env: {
      ...process.env,
      PROJECT_DIRS: FIXTURE_DIR,
      // Force UTC so timestamps are deterministic
      MAW_DISPLAY_TZ: "0",
    },
    encoding: "utf-8",
    timeout: 15_000,
  });
  return {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    exitCode: result.status ?? -1,
  };
}

// ── Source file checks ─────────────────────────────────────────────────────────

describe("fix #274 — dig.py source", () => {
  it("dig.py exists at expected path", () => {
    expect(existsSync(DIG_PY)).toBe(true);
  });

  it("dig.py contains --deep handling", async () => {
    const content = await Bun.file(DIG_PY).text();
    expect(content).toContain("--deep");
    expect(content).toContain("subagents");
  });

  it("dig.py contains timezone detection", async () => {
    const content = await Bun.file(DIG_PY).text();
    expect(content).toContain("detect_tz");
    expect(content).toContain("MAW_DISPLAY_TZ");
  });
});

// ── Default mode (no --deep) — backward compatibility ─────────────────────────

describe("fix #274 — default mode (no --deep) backward compatible", () => {
  it("exits with code 0", () => {
    const { exitCode } = runDig(["10"]);
    expect(exitCode).toBe(0);
  });

  it("outputs valid JSON array", () => {
    const { stdout } = runDig(["10"]);
    const parsed = JSON.parse(stdout);
    expect(Array.isArray(parsed)).toBe(true);
  });

  it("finds the top-level session", () => {
    const { stdout } = runDig(["10"]);
    const parsed: any[] = JSON.parse(stdout);
    const sessions = parsed.filter((e) => !e.type);
    expect(sessions.length).toBeGreaterThanOrEqual(1);
    const found = sessions.find((s) => s.summary?.includes("Top-level"));
    expect(found).toBeDefined();
  });

  it("does NOT find subagent sessions (--deep not passed)", () => {
    const { stdout } = runDig(["10"]);
    const parsed: any[] = JSON.parse(stdout);
    const sessions = parsed.filter((e) => !e.type);
    const subagentSessions = sessions.filter((s) => s.summary?.includes("Subagent"));
    expect(subagentSessions.length).toBe(0);
  });

  it("output does NOT have isSubagent field in default mode", () => {
    const { stdout } = runDig(["10"]);
    const parsed: any[] = JSON.parse(stdout);
    const sessions = parsed.filter((e) => !e.type);
    sessions.forEach((s) => {
      expect(s.isSubagent).toBeUndefined();
    });
  });

  it("session entries have required fields", () => {
    const { stdout } = runDig(["10"]);
    const parsed: any[] = JSON.parse(stdout);
    const sessions = parsed.filter((e) => !e.type);
    expect(sessions.length).toBeGreaterThan(0);
    const s = sessions[0];
    expect(s).toHaveProperty("sessionId");
    expect(s).toHaveProperty("startGMT7");
    expect(s).toHaveProperty("endGMT7");
    expect(s).toHaveProperty("durationMin");
    expect(s).toHaveProperty("repoName");
    expect(s).toHaveProperty("realHumanMessages");
    expect(s).toHaveProperty("assistantMessages");
    expect(s).toHaveProperty("gitBranch");
    expect(s).toHaveProperty("summary");
    expect(s).toHaveProperty("isSidechain");
  });

  it("output starts with a gap entry (sleeping/offline)", () => {
    const { stdout } = runDig(["10"]);
    const parsed: any[] = JSON.parse(stdout);
    expect(parsed[0]).toMatchObject({ type: "gap" });
  });

  it("output ends with a gap entry (no session yet)", () => {
    const { stdout } = runDig(["10"]);
    const parsed: any[] = JSON.parse(stdout);
    const last = parsed[parsed.length - 1];
    expect(last).toMatchObject({ type: "gap" });
  });

  it("does NOT include coverage metadata entry", () => {
    const { stdout } = runDig(["10"]);
    const parsed: any[] = JSON.parse(stdout);
    const coverage = parsed.find((e) => e.type === "coverage");
    expect(coverage).toBeUndefined();
  });
});

// ── Deep mode (--deep) — subagent scanning ────────────────────────────────────

describe("fix #274 — deep mode (--deep) scans subagent sessions", () => {
  it("exits with code 0", () => {
    const { exitCode } = runDig(["--deep", "0"]);
    expect(exitCode).toBe(0);
  });

  it("outputs valid JSON array", () => {
    const { stdout } = runDig(["--deep", "0"]);
    const parsed = JSON.parse(stdout);
    expect(Array.isArray(parsed)).toBe(true);
  });

  it("finds both top-level AND subagent sessions", () => {
    const { stdout } = runDig(["--deep", "0"]);
    const parsed: any[] = JSON.parse(stdout);
    const sessions = parsed.filter((e) => !e.type);
    const top = sessions.find((s) => s.summary?.includes("Top-level"));
    const sub = sessions.find((s) => s.summary?.includes("Subagent"));
    expect(top).toBeDefined();
    expect(sub).toBeDefined();
  });

  it("skips empty subagent files", () => {
    const { stdout } = runDig(["--deep", "0"]);
    const parsed: any[] = JSON.parse(stdout);
    const sessions = parsed.filter((e) => !e.type);
    // Should have 2 sessions (top + 1 subagent) — not 3 (empty file skipped)
    expect(sessions.length).toBe(2);
  });

  it("subagent sessions have isSubagent: true", () => {
    const { stdout } = runDig(["--deep", "0"]);
    const parsed: any[] = JSON.parse(stdout);
    const sessions = parsed.filter((e) => !e.type);
    const sub = sessions.find((s) => s.summary?.includes("Subagent"));
    expect(sub?.isSubagent).toBe(true);
  });

  it("top-level sessions have isSubagent: false in deep mode", () => {
    const { stdout } = runDig(["--deep", "0"]);
    const parsed: any[] = JSON.parse(stdout);
    const sessions = parsed.filter((e) => !e.type);
    const top = sessions.find((s) => s.summary?.includes("Top-level"));
    expect(top?.isSubagent).toBe(false);
  });

  it("deep mode sessions have toolCalls field", () => {
    const { stdout } = runDig(["--deep", "0"]);
    const parsed: any[] = JSON.parse(stdout);
    const sessions = parsed.filter((e) => !e.type);
    sessions.forEach((s) => {
      expect(typeof s.toolCalls).toBe("number");
    });
  });

  it("deep mode sessions have fileSizeKB field", () => {
    const { stdout } = runDig(["--deep", "0"]);
    const parsed: any[] = JSON.parse(stdout);
    const sessions = parsed.filter((e) => !e.type);
    sessions.forEach((s) => {
      expect(typeof s.fileSizeKB).toBe("number");
    });
  });

  it("deep mode appends coverage metadata entry", () => {
    const { stdout } = runDig(["--deep", "0"]);
    const parsed: any[] = JSON.parse(stdout);
    const coverage = parsed.find((e) => e.type === "coverage");
    expect(coverage).toBeDefined();
    expect(coverage).toHaveProperty("totalFound");
    expect(coverage).toHaveProperty("returned");
    expect(coverage.deep).toBe(true);
    expect(coverage).toHaveProperty("timezone");
  });

  it("coverage metadata totalFound >= returned", () => {
    const { stdout } = runDig(["--deep", "0"]);
    const parsed: any[] = JSON.parse(stdout);
    const coverage = parsed.find((e) => e.type === "coverage");
    expect(coverage.totalFound).toBeGreaterThanOrEqual(coverage.returned);
  });
});

// ── --subagents flag ───────────────────────────────────────────────────────────

describe("fix #274 — --subagents flag", () => {
  it("--subagents also discovers subagent sessions", () => {
    const { stdout } = runDig(["--subagents", "0"]);
    const parsed: any[] = JSON.parse(stdout);
    const sessions = parsed.filter((e) => !e.type);
    const sub = sessions.find((s) => s.summary?.includes("Subagent"));
    expect(sub).toBeDefined();
  });
});

// ── Timezone detection ────────────────────────────────────────────────────────

describe("fix #274 — timezone detection", () => {
  it("respects MAW_DISPLAY_TZ env var", () => {
    // MAW_DISPLAY_TZ=0 → UTC; timestamps should show UTC times
    const result = spawnSync("python3", [DIG_PY, "10"], {
      env: { ...process.env, PROJECT_DIRS: FIXTURE_DIR, MAW_DISPLAY_TZ: "0" },
      encoding: "utf-8",
      timeout: 15_000,
    });
    const parsed: any[] = JSON.parse(result.stdout);
    const sessions = parsed.filter((e) => !e.type);
    // 2026-02-01T08:00:00Z with offset 0 → 2026-02-01 08:00
    const top = sessions.find((s) => s.summary?.includes("Top-level"));
    expect(top?.startGMT7).toBe("2026-02-01 08:00");
  });

  it("timezone offset shifts timestamps correctly", () => {
    // MAW_DISPLAY_TZ=7 → GMT+7; 08:00Z + 7h = 15:00
    const result = spawnSync("python3", [DIG_PY, "10"], {
      env: { ...process.env, PROJECT_DIRS: FIXTURE_DIR, MAW_DISPLAY_TZ: "7" },
      encoding: "utf-8",
      timeout: 15_000,
    });
    const parsed: any[] = JSON.parse(result.stdout);
    const sessions = parsed.filter((e) => !e.type);
    const top = sessions.find((s) => s.summary?.includes("Top-level"));
    expect(top?.startGMT7).toBe("2026-02-01 15:00");
  });
});
