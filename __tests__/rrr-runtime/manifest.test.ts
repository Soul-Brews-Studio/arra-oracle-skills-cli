import { afterEach, describe, expect, it } from "bun:test";
import { chmod, mkdir, readFile, rm, stat, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { tmpdir } from "os";
import { run, skillRoot, stderr, stdout } from "./helpers";

const manifestScript = join(skillRoot, "scripts", "rrr-manifest.py");
const scratch: string[] = [];
const session = "123e4567-e89b-42d3-a456-426614174000";

const environment = (root: string) => ({ XDG_STATE_HOME: root });
const invoke = (root: string, args: string[]) => run(["python3", manifestScript, ...args], { env: environment(root) });
const create = (root: string, child = false) => {
  const result = invoke(root, ["init", session, ...(child ? ["--child"] : [])]);
  expect(result.exitCode, stderr(result)).toBe(0);
  return JSON.parse(stdout(result)).manifest as string;
};
const mutate = (root: string, manifest: string, revision: number, operation: string, payload: unknown) =>
  invoke(root, ["mutate", manifest, String(revision), operation, JSON.stringify(payload)]);

afterEach(async () => {
  await Promise.all(scratch.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

describe("RRR task manifest", () => {
  it("uses unique task nonces and owner-private directories/files", async () => {
    const root = join(tmpdir(), `rrr-state-${crypto.randomUUID()}`);
    scratch.push(root);
    const first = create(root);
    const second = create(root);
    const a = JSON.parse(await readFile(first, "utf8"));
    const b = JSON.parse(await readFile(second, "utf8"));
    expect(a.task_nonce).not.toBe(b.task_nonce);
    expect(a.session_id).toBe(session);
    expect((await stat(join(root, "rrr"))).mode & 0o777).toBe(0o700);
    expect((await stat(dirname(first))).mode & 0o777).toBe(0o700);
    expect((await stat(first)).mode & 0o777).toBe(0o600);
    expect(a.oracle).toEqual({
      canonical_project: null,
      storage_root: null,
      frozen_request: null,
      idempotency_key: null,
      request_fingerprint: null,
      receipt: null,
    });
  });

  it("serializes concurrent expected-revision writers so only one wins", async () => {
    const root = join(tmpdir(), `rrr-state-${crypto.randomUUID()}`);
    scratch.push(root);
    const manifest = create(root);
    const writers = Array.from({ length: 8 }, (_, index) =>
      Bun.spawn(
        ["python3", manifestScript, "mutate", manifest, "0", "candidate-add", JSON.stringify({ id: `c${index}`, state: "candidate", title: `candidate ${index}` })],
        { env: { ...process.env, ...environment(root) }, stdout: "pipe", stderr: "pipe" },
      )
    );
    const exitCodes = await Promise.all(writers.map((writer) => writer.exited));
    expect(exitCodes.filter((code) => code === 0).length).toBe(1);
    expect(exitCodes.filter((code) => code === 2).length).toBe(7);
    const value = JSON.parse(await readFile(manifest, "utf8"));
    expect(value.revision).toBe(1);
    expect(value.captures).toHaveLength(1);
    expect(value.journal).toHaveLength(1);
    expect((await stat(join(dirname(manifest), "manifest.lock"))).mode & 0o777).toBe(0o600);
  });

  it("rejects wrong revisions and illegal lifecycle transitions without changing state", async () => {
    const root = join(tmpdir(), `rrr-state-${crypto.randomUUID()}`);
    scratch.push(root);
    const manifest = create(root);
    const before = await readFile(manifest, "utf8");
    const stale = mutate(root, manifest, 9, "candidate-add", { id: "c1", state: "candidate" });
    expect(stale.exitCode).toBe(2);
    expect(stderr(stale)).toContain("expected revision mismatch");
    expect(await readFile(manifest, "utf8")).toBe(before);
    expect(mutate(root, manifest, 0, "candidate-add", { id: "c1", state: "published" }).exitCode).toBe(2);
    expect(await readFile(manifest, "utf8")).toBe(before);
    expect(mutate(root, manifest, 0, "candidate-add", { id: "c1", state: "candidate" }).exitCode).toBe(0);
    expect(mutate(root, manifest, 1, "candidate-transition", { id: "c1", state: "published" }).exitCode).toBe(2);
    expect(mutate(root, manifest, 1, "candidate-transition", { id: "c1", state: "verified" }).exitCode).toBe(0);
  });

  it("ignores stale temporary files and preserves committed state", async () => {
    const root = join(tmpdir(), `rrr-state-${crypto.randomUUID()}`);
    scratch.push(root);
    const manifest = create(root);
    const stale = join(dirname(manifest), ".manifest.write.crashed");
    await writeFile(stale, "{not committed");
    await chmod(stale, 0o600);
    const result = mutate(root, manifest, 0, "candidate-add", { id: "real", state: "candidate" });
    expect(result.exitCode, stderr(result)).toBe(0);
    const value = JSON.parse(await readFile(manifest, "utf8"));
    expect(value.revision).toBe(1);
    expect(value.captures.map((item: any) => item.id)).toEqual(["real"]);
    expect(await readFile(stale, "utf8")).toBe("{not committed");
  });

  it("freezes complete Oracle request state before accepting a local receipt", async () => {
    const root = join(tmpdir(), `rrr-state-${crypto.randomUUID()}`);
    scratch.push(root);
    const manifest = create(root);
    expect(mutate(root, manifest, 0, "oracle-receipt", { outcome: "created" }).exitCode).toBe(2);
    const frozen = {
      canonical_project: "owner/repo",
      storage_root: "/vault/learnings",
      frozen_request: { pattern: "p", concepts: ["rrr"], source: "rrr", project: "owner/repo" },
      idempotency_key: "task:c1",
      request_fingerprint: "fingerprint",
    };
    expect(mutate(root, manifest, 0, "oracle-freeze", frozen).exitCode).toBe(0);
    expect(mutate(root, manifest, 1, "oracle-receipt", { outcome: "created", success: true }).exitCode).toBe(0);
    const value = JSON.parse(await readFile(manifest, "utf8"));
    expect(value.oracle.frozen_request).toEqual(frozen.frozen_request);
    expect(value.oracle.receipt.outcome).toBe("created");
  });

  it("keeps child captures isolated until an explicit reviewed parent import", async () => {
    const root = join(tmpdir(), `rrr-state-${crypto.randomUUID()}`);
    scratch.push(root);
    const parent = create(root);
    const child = create(root, true);
    expect(mutate(root, child, 0, "candidate-add", { id: "child-candidate", state: "candidate" }).exitCode).toBe(0);
    expect(mutate(root, parent, 0, "import-child-reviewed", { manifest: child, reviewed: false }).exitCode).toBe(2);
    expect(JSON.parse(await readFile(parent, "utf8")).captures).toHaveLength(0);
    expect(mutate(root, parent, 0, "import-child-reviewed", { manifest: child, reviewed: true }).exitCode).toBe(0);
    const imported = JSON.parse(await readFile(parent, "utf8")).captures;
    expect(imported).toHaveLength(1);
    expect(imported[0].imported_from_child).toBeTruthy();
  });

  it("refuses manifests outside the configured state root", async () => {
    const root = join(tmpdir(), `rrr-state-${crypto.randomUUID()}`);
    const outside = join(tmpdir(), `rrr-outside-${crypto.randomUUID()}.json`);
    scratch.push(root, outside);
    await mkdir(join(root, "rrr"), { recursive: true, mode: 0o700 });
    await chmod(join(root, "rrr"), 0o700);
    await writeFile(outside, "{}", { mode: 0o600 });
    const result = invoke(root, ["show", outside]);
    expect(result.exitCode).toBe(2);
    expect(stderr(result)).toContain("outside the RRR state root");
  });
});
