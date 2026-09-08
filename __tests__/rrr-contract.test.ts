import { describe, expect, it } from "bun:test";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

const root = join(process.cwd(), "skills", "rrr");
const read = (path: string) => readFileSync(join(root, path), "utf8");
const scripts = () => readdirSync(join(root, "scripts")).filter((path) => path.endsWith(".py")).sort();

describe("RRR reduced safe contract", () => {
  it("has one cross-runtime front door, literal flag grammar, and helper-root portability", () => {
    const skill = read("SKILL.md");
    expect(skill).toContain("Claude `/rrr`; Codex `$rrr`");
    expect(skill).toContain("`/prompts:rrr`");
    expect(skill).toContain("<RRR_SKILL_DIR>");
    expect(skill).toContain("[--light | --preview | --finish | --vault | --resume <manifest>]");
    expect(skill).toContain("--finish --light");
    expect(skill).toContain("--finish --vault");
  });

  it("keeps bare/preview/finish and authority boundaries equal across contract files", () => {
    const skill = read("SKILL.md");
    const preview = read("references/finish-cleanup-preview.md");
    const hosts = read("HOSTS.md");
    expect(skill).toContain("wholly non-mutating");
    expect(skill.replace(/\s+/g, " ")).toContain("finish blocked: no validated push gate");
    expect(preview).toContain("preview is read-only");
    expect(preview).toContain("action: retain");
    expect(hosts.replace(/\s+/g, " ")).toContain("never authority and never current authority");
    expect(skill).toContain("transcript, manifest, memory, plan, and this prose grant none");
  });

  it("captures verified gotchas locally without claiming always-on completeness", () => {
    const skill = read("SKILL.md");
    expect(skill).toContain("Immediate gotcha capture");
    expect(skill).toContain("local capture needs no per-item question");
    expect(skill).toContain("Always-on startup capture is deferred");
    expect(skill).toContain("never omniscient");
    for (const outcome of ["hypothesis", "session-only", "withheld", "published", "superseded"]) {
      expect(skill).toContain(outcome);
    }
  });

  it("keeps binding structural and removes the obsolete mtime session selector", () => {
    const hosts = read("HOSTS.md");
    expect(hosts).toContain("never reads Claude storage");
    expect(hosts).toContain("rather than guessing by cwd, basename, mtime, or newest file");
    expect(existsSync(join(root, "scripts", "session-clock.py"))).toBe(false);
    const binder = read("scripts/rrr-bind.py");
    expect(binder).not.toMatch(/getmtime|st_mtime|ls\s+-t|newest/i);
  });

  it("removes fabrication quotas and labels timing as a proxy", () => {
    const template = read("TEMPLATE.md");
    expect(template).toContain("excluding gaps greater than 30 minutes (proxy)");
    expect(template).not.toMatch(/\b(150|100) words|exactly three|mandatory mistake/i);
    expect(template).toContain("evidence unavailable");
    expect(template).toContain("none observed");
  });

  it("ships all references and executable helpers", () => {
    for (const file of ["references/manifest.md", "references/oracle-receipts.md", "references/finish-cleanup-preview.md"]) {
      expect(read(file).length).toBeGreaterThan(300);
    }
    expect(scripts()).toEqual([
      "rrr-bind.py", "rrr-cleanup.py", "rrr-finish.py", "rrr-manifest.py", "rrr-receipt.py", "rrr-redact.py",
    ]);
    for (const file of scripts()) expect(statSync(join(root, "scripts", file)).mode & 0o111, file).not.toBe(0);
  });

  it("contains no state-changing Git/cleanup executor in executable Python", () => {
    const executable = scripts().map((file) => read(`scripts/${file}`)).join("\n");
    const privilegedPreviews = ["rrr-finish.py", "rrr-cleanup.py"].map((file) => read(`scripts/${file}`)).join("\n");
    expect(executable).not.toMatch(/\bgit\b[^\n]*(?:commit|push|merge|add|reset|checkout|clean)\b/);
    expect(privilegedPreviews).not.toMatch(/\bos\.(?:remove|unlink)\(|shutil\.rmtree|subprocess[^\n]*(?:kill|rm|mv)\b/);
    expect(executable).toContain("GIT_OPTIONAL_LOCKS");
  });

  it("has an RRR-specific executable-mode check that becomes a tracked 100755 assertion after commit", () => {
    for (const file of scripts()) {
      const relativePath = relative(process.cwd(), join(root, "scripts", file));
      const tracked = Bun.spawnSync(["git", "ls-files", "-s", "--", relativePath], { stdout: "pipe" });
      const record = new TextDecoder().decode(tracked.stdout).trim();
      if (record) expect(record.startsWith("100755 "), file).toBe(true);
      else expect(statSync(join(root, "scripts", file)).mode & 0o111, file).not.toBe(0);
    }
  });
});
