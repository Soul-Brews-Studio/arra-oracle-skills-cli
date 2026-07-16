import { describe, it, expect } from "bun:test";
import { $ } from "bun";

// Public shelf (curated skills); zombies stay in the vault archive below.
const S = "skills";
const ARCHIVE = "src/skills/.archive";

// Helper: run script and get stdout+stderr
const run = async (cmd: string) => {
  const p = Bun.spawn(["bun", ...cmd.split(" ")], { stdout: "pipe", stderr: "pipe" });
  const [out, err] = await Promise.all([
    new Response(p.stdout).text(),
    new Response(p.stderr).text(),
  ]);
  return out + err;
};

describe("project scripts", () => {
  it("create.ts", async () => expect(await run(`${S}/project/scripts/create.ts`)).toContain("Usage"));
  it("history.ts", async () => expect(await run(`${S}/project/scripts/history.ts`)).toContain("Usage"));
  it("incubate.ts", async () => expect(await run(`${S}/project/scripts/incubate.ts`)).toContain("Usage"));
  it("index.ts", async () => expect(await run(`${S}/project/scripts/index.ts --help`)).toContain("Usage"));
  it("learn.ts", async () => expect(await run(`${S}/project/scripts/learn.ts`)).toContain("Usage"));
  it("offload.ts", async () => expect(await run(`${S}/project/scripts/offload.ts`)).toContain("Usage"));
  it("resolve-slug.ts", async () => expect(await run(`${S}/project/scripts/resolve-slug.ts`)).toContain("Usage"));
  it("reunion.ts", async () => expect(await run(`${S}/project/scripts/reunion.ts`)).toContain("Usage"));
  it("search.ts", async () => expect(await run(`${S}/project/scripts/search.ts`)).toContain("Usage"));
  it("spinoff.ts", async () => expect(await run(`${S}/project/scripts/spinoff.ts`)).toContain("Usage"));
});

describe("recap scripts", () => {
  it("recap-rich.ts", async () => expect(await run(`${S}/recap/recap-rich.ts`)).toContain("RECAP"));
  it("recap.ts", async () => expect(await run(`${S}/recap/recap.ts`)).toContain("RECAP"));
});

describe("schedule scripts (zombie tier — still installable via -s schedule)", () => {
  // Skip calendar.ts on CI - `cal` command not available on Linux runners
  it.skipIf(!!process.env.CI || !!process.env.SKIP_CAL)("calendar.ts", async () => expect(await run(`${ARCHIVE}/schedule/scripts/calendar.ts`)).toMatch(/\d{4}|Su Mo Tu/));
  it("query.ts", async () => expect(await run(`${ARCHIVE}/schedule/scripts/query.ts`)).toMatch(/Schedule|No events|Cannot connect/));
});

// watch scripts moved to arra-symbiosis-skills
