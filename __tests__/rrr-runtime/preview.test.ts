import { afterEach, describe, expect, it } from "bun:test";
import { chmod, link, lstat, mkdir, readFile, readdir, rm, stat, symlink, writeFile } from "fs/promises";
import { dirname, join } from "path";
import { tmpdir } from "os";
import { pythonCall, run, skillRoot, stderr, stdout } from "./helpers";

const finish = join(skillRoot, "scripts", "rrr-finish.py");
const cleanup = join(skillRoot, "scripts", "rrr-cleanup.py");
const manifestScript = join(skillRoot, "scripts", "rrr-manifest.py");
const scratch: string[] = [];

afterEach(async () => {
  await Promise.all(scratch.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

async function repository() {
  const repo = join(tmpdir(), `rrr-git-${crypto.randomUUID()}`);
  scratch.push(repo);
  await mkdir(repo, { recursive: true });
  expect(run(["git", "init", "-q"], { cwd: repo }).exitCode).toBe(0);
  run(["git", "config", "user.name", "RRR Test"], { cwd: repo });
  run(["git", "config", "user.email", "rrr@example.invalid"], { cwd: repo });
  await writeFile(join(repo, "owned.txt"), "base\n");
  await writeFile(join(repo, "user.txt"), "base\n");
  await writeFile(join(repo, "rename.txt"), "base\n");
  await writeFile(join(repo, "mode.sh"), "#!/bin/sh\n");
  run(["git", "add", "--", "owned.txt", "user.txt", "rename.txt", "mode.sh"], { cwd: repo });
  run(["git", "commit", "-qm", "base"], { cwd: repo });
  const baseline = stdout(run(["git", "rev-parse", "HEAD"], { cwd: repo })).trim();
  const branch = stdout(run(["git", "branch", "--show-current"], { cwd: repo })).trim();
  run(["git", "remote", "add", "origin", "https://user:token@example.com/fork/repo.git"], { cwd: repo });
  run(["git", "remote", "add", "upstream", "https://example.com/upstream/repo.git"], { cwd: repo });
  await writeFile(join(repo, "user.txt"), "staged user change\n");
  run(["git", "add", "--", "user.txt"], { cwd: repo });
  await writeFile(join(repo, "owned.txt"), "task change\n");
  run(["git", "mv", "rename.txt", "renamed.txt"], { cwd: repo });
  await chmod(join(repo, "mode.sh"), 0o755);
  return { repo, baseline, branch };
}

describe("RRR finish preview", () => {
  it("reports dirty/index/path/mode/rename/remotes without changing Git or files", async () => {
    const fixture = await repository();
    const indexPath = stdout(run(["git", "rev-parse", "--git-path", "index"], { cwd: fixture.repo })).trim();
    const absoluteIndex = indexPath.startsWith("/") ? indexPath : join(fixture.repo, indexPath);
    const before = {
      status: stdout(run(["git", "status", "--porcelain=v1"], { cwd: fixture.repo, env: { GIT_OPTIONAL_LOCKS: "0" } })),
      index: await readFile(absoluteIndex),
      indexMtime: (await stat(absoluteIndex)).mtimeMs,
      owned: await readFile(join(fixture.repo, "owned.txt"), "utf8"),
    };
    const result = pythonCall(finish, "preview", [fixture.repo, fixture.baseline, fixture.branch, ["owned.txt", "renamed.txt", "mode.sh"], ["user.txt"]]) as any;
    const after = {
      status: stdout(run(["git", "status", "--porcelain=v1"], { cwd: fixture.repo, env: { GIT_OPTIONAL_LOCKS: "0" } })),
      index: await readFile(absoluteIndex),
      indexMtime: (await stat(absoluteIndex)).mtimeMs,
      owned: await readFile(join(fixture.repo, "owned.txt"), "utf8"),
    };
    expect(after).toEqual(before);
    expect(result).toMatchObject({ read_only: true, baseline_head: fixture.baseline, current_head: fixture.baseline, branch: fixture.branch, detached: false, fork_distinction: true });
    expect(result.preexisting_index_overlap).toEqual(["user.txt"]);
    expect(result.change_summary.join(" ")).toContain("mode change");
    expect(result.change_summary.join(" ")).toContain("rename");
    expect(result.remotes.origin.push).not.toContain("token");
    expect(result.remotes.origin.push).toContain("[redacted]@");
    expect(result.refusals.join(" ")).toContain("transport identity");
  });

  it("detects detached HEAD and resolves a linked-worktree index path", async () => {
    const fixture = await repository();
    const linked = `${fixture.repo}-linked`;
    scratch.push(linked);
    expect(run(["git", "worktree", "add", "-q", "--detach", linked, fixture.baseline], { cwd: fixture.repo }).exitCode).toBe(0);
    const result = pythonCall(finish, "preview", [linked, fixture.baseline, null, [], []]) as any;
    expect(result.detached).toBe(true);
    expect(result.index_path).toContain("worktrees");
    expect(result.refusals).toContain("detached HEAD");
  });

  it("requires the literal --preview flag and remains fail-closed", () => {
    const without = run(["python3", finish, "--json"]);
    expect(without.exitCode).not.toBe(0);
    const withPreview = run(["python3", finish, "--preview", "--json", "--repo", "/definitely/not/a/repo"]);
    expect(withPreview.exitCode, stderr(withPreview)).toBe(0);
    expect(JSON.parse(stdout(withPreview)).refusals).toContain("not a git repository");
  });

  it("ignores repository-local Git variables inherited from a caller hook", async () => {
    const target = await repository();
    const contaminant = await repository();
    const contaminantGitDir = stdout(run(["git", "rev-parse", "--absolute-git-dir"], { cwd: contaminant.repo })).trim();
    const result = run(
      ["python3", finish, "--preview", "--json", "--repo", target.repo, "--baseline", target.baseline, "--task-branch", target.branch, "--path", "owned.txt"],
      { env: { GIT_DIR: contaminantGitDir, GIT_WORK_TREE: contaminant.repo, GIT_INDEX_FILE: join(contaminantGitDir, "index") } },
    );
    expect(result.exitCode, stderr(result)).toBe(0);
    const evidence = JSON.parse(stdout(result));
    expect(evidence.repo_root).toBe(target.repo);
    expect(evidence.current_head).toBe(target.baseline);
    expect(evidence.remotes.origin.push).toContain("[redacted]@");
  });
});

describe("RRR cleanup preview", () => {
  async function setup(quiescent = true) {
    const state = join(tmpdir(), `rrr-clean-${crypto.randomUUID()}`);
    const rescueDir = join(dirname(state), `rrr-rescue-${crypto.randomUUID()}`);
    scratch.push(state, rescueDir);
    await mkdir(rescueDir, { mode: 0o700 });
    const environment = { XDG_STATE_HOME: state };
    const initialized = run(["python3", manifestScript, "init", "session"], { env: environment });
    expect(initialized.exitCode, stderr(initialized)).toBe(0);
    const manifest = JSON.parse(stdout(initialized)).manifest as string;
    const candidate = join(dirname(manifest), "scratch.txt");
    await writeFile(candidate, "task scratch\n", { mode: 0o600 });
    const metadata = await stat(candidate);
    const hash = new Bun.CryptoHasher("sha256").update(await readFile(candidate)).digest("hex");
    const receipt = { path: candidate, creator_receipt: "task:file:1", device: metadata.dev, inode: metadata.ino, sha256: hash, quiescent };
    const changed = run(["python3", manifestScript, "mutate", manifest, "0", "cleanup-candidate", JSON.stringify(receipt)], { env: environment });
    expect(changed.exitCode, stderr(changed)).toBe(0);
    return { state, rescueDir, manifest, candidate, environment };
  }

  it("proves eligibility but still retains the file and rescue destination", async () => {
    const fixture = await setup(true);
    const rescue = join(fixture.rescueDir, "scratch.txt");
    const before = { candidate: await readFile(fixture.candidate), entries: await readdir(fixture.rescueDir) };
    const result = run(["python3", cleanup, fixture.candidate, "--manifest", fixture.manifest, "--rescue", rescue], { env: fixture.environment });
    expect(result.exitCode, stderr(result)).toBe(0);
    expect(JSON.parse(stdout(result))).toMatchObject({ eligible: true, action: "retain", reason: "cleanup execution deferred in this release" });
    expect(await readFile(fixture.candidate)).toEqual(before.candidate);
    expect(await readdir(fixture.rescueDir)).toEqual(before.entries);
  });

  it("refuses hardlinks, symlink ancestry, changed content, and unknown quiescence", async () => {
    const hardlinkFixture = await setup(true);
    const linked = join(dirname(hardlinkFixture.candidate), "second-link.txt");
    await link(hardlinkFixture.candidate, linked);
    const hardlinkResult = run(["python3", cleanup, hardlinkFixture.candidate, "--manifest", hardlinkFixture.manifest, "--rescue", join(hardlinkFixture.rescueDir, "x")], { env: hardlinkFixture.environment });
    expect(JSON.parse(stdout(hardlinkResult)).reason).toContain("single-link");

    const changedFixture = await setup(true);
    await writeFile(changedFixture.candidate, "changed after receipt\n");
    const changedResult = run(["python3", cleanup, changedFixture.candidate, "--manifest", changedFixture.manifest, "--rescue", join(changedFixture.rescueDir, "x")], { env: changedFixture.environment });
    expect(JSON.parse(stdout(changedResult)).reason).toContain("changed");

    const quietFixture = await setup(false);
    const quietResult = run(["python3", cleanup, quietFixture.candidate, "--manifest", quietFixture.manifest, "--rescue", join(quietFixture.rescueDir, "x")], { env: quietFixture.environment });
    expect(JSON.parse(stdout(quietResult)).reason).toContain("quiescence");

    const symlinkFixture = await setup(true);
    const symlinkDir = join(symlinkFixture.state, "rrr", "linked-dir");
    await symlink(dirname(symlinkFixture.candidate), symlinkDir);
    const symlinkCandidate = join(symlinkDir, "scratch.txt");
    const symlinkResult = run(["python3", cleanup, symlinkCandidate, "--manifest", symlinkFixture.manifest], { env: symlinkFixture.environment });
    expect(JSON.parse(stdout(symlinkResult)).reason).toContain("symlink");
  });

  it("rejects an outside file before eligibility inspection", async () => {
    const fixture = await setup(true);
    const outside = join(tmpdir(), `rrr-outside-${crypto.randomUUID()}`);
    scratch.push(outside);
    await writeFile(outside, "do not inspect", { mode: 0o000 });
    const result = run(["python3", cleanup, outside, "--manifest", fixture.manifest], { env: fixture.environment });
    expect(JSON.parse(stdout(result))).toMatchObject({ eligible: false, reason: "outside owner-private scratch root" });
    expect((await lstat(outside)).mode & 0o777).toBe(0);
  });
});
