import { afterEach, describe, expect, it } from "bun:test";
import { chmod, mkdir, readdir, readFile, rm, stat } from "fs/promises";
import { join, relative } from "path";
import { tmpdir } from "os";
import { writeVfsTree } from "../../src/cli/skill-source";
import { run, skillRoot, stderr, stdout } from "./helpers";

const scratch: string[] = [];
afterEach(async () => {
  await Promise.all(scratch.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

async function sourceTree(directory: string, base = directory, output = new Map<string, string>()) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await sourceTree(path, base, output);
    else output.set(relative(base, path), await readFile(path, "utf8"));
  }
  return output;
}

describe("RRR installer parity", () => {
  it("installs identical RRR content through literal Claude and Codex keys in an isolated home", () => {
    const home = join(tmpdir(), `rrr-install-${crypto.randomUUID()}`);
    scratch.push(home);
    const child = `
      import { join } from "path";
      import { readFile, readdir, stat } from "fs/promises";
      import { agents } from "./src/cli/agents.ts";
      import { installSkills } from "./src/cli/installer.ts";
      const home=process.env.HOME;
      agents["claude-code"]={...agents["claude-code"],globalSkillsDir:join(home,".claude/skills"),globalCommandsDir:join(home,".claude/commands"),detectInstalled:()=>true};
      agents.codex={...agents.codex,globalSkillsDir:join(home,".codex/skills"),globalCommandsDir:join(home,".codex/prompts"),detectInstalled:()=>true};
      await installSkills(["claude-code","codex"],{global:true,yes:true,skills:["rrr"],commands:true,forceGlobal:true,shellMode:"no-shell"});
      const cs=join(home,".claude/skills/rrr"), xs=join(home,".codex/skills/rrr");
      const scripts=(await readdir(join(cs,"scripts"))).filter(x=>x.endsWith(".py")).sort();
      const refs=(await readdir(join(cs,"references"))).filter(x=>x.endsWith(".md")).sort();
      const result={
        equal:(await readFile(join(cs,"SKILL.md"),"utf8"))===(await readFile(join(xs,"SKILL.md"),"utf8")),
        scripts,refs,
        scriptModes:await Promise.all(scripts.map(async x=>(await stat(join(cs,"scripts",x))).mode&511)),
        codexModes:await Promise.all(scripts.map(async x=>(await stat(join(xs,"scripts",x))).mode&511)),
        claudeStub:await readFile(join(home,".claude/commands/rrr.md"),"utf8"),
        codexStub:await readFile(join(home,".codex/prompts/rrr.md"),"utf8"),
      };
      console.log("RRR_INSTALL_RESULT="+JSON.stringify(result));
    `;
    const result = run(["bun", "-e", child], { cwd: process.cwd(), env: { HOME: home, XDG_CONFIG_HOME: join(home, ".config") } });
    expect(result.exitCode, stderr(result)).toBe(0);
    const marker = stdout(result).match(/RRR_INSTALL_RESULT=(\{.*\})/);
    expect(marker, stdout(result)).toBeTruthy();
    const evidence = JSON.parse(marker![1]);
    expect(evidence.equal).toBe(true);
    expect(evidence.scripts).toEqual([
      "rrr-bind.py", "rrr-cleanup.py", "rrr-finish.py", "rrr-manifest.py", "rrr-receipt.py", "rrr-redact.py",
    ]);
    expect(evidence.refs).toEqual(["finish-cleanup-preview.md", "manifest.md", "oracle-receipts.md"]);
    expect(evidence.scriptModes.every((mode: number) => mode & 0o100)).toBe(true);
    expect(evidence.codexModes.every((mode: number) => mode & 0o100)).toBe(true);
    expect(evidence.claudeStub).toContain("$ARGUMENTS");
    expect(evidence.codexStub).toContain("$ARGUMENTS");
    expect(evidence.codexStub).toContain("/rrr/SKILL.md");
  });

  it("materializes the complete compiled/VFS tree and restores shebang modes", async () => {
    const destination = join(tmpdir(), `rrr-vfs-${crypto.randomUUID()}`);
    scratch.push(destination);
    const files = await sourceTree(skillRoot);
    await mkdir(destination, { recursive: true });
    await Bun.write(join(destination, "SKILL.md"), "stale executable document\n");
    await chmod(join(destination, "SKILL.md"), 0o755);
    writeVfsTree(files, destination);
    for (const [relativePath, content] of files) {
      expect(await readFile(join(destination, relativePath), "utf8")).toBe(content);
    }
    for (const script of [...files.keys()].filter((path) => path.startsWith("scripts/") && path.endsWith(".py"))) {
      expect((await stat(join(destination, script))).mode & 0o111).not.toBe(0);
    }
    for (const document of ["SKILL.md", "HOSTS.md", "TEMPLATE.md", "references/manifest.md"]) {
      expect((await stat(join(destination, document))).mode & 0o111).toBe(0);
    }
  });

  it("keeps each source Python helper executable for Git mode tracking", async () => {
    const scripts = (await readdir(join(skillRoot, "scripts"))).filter((name) => name.endsWith(".py"));
    for (const script of scripts) {
      const path = join(skillRoot, "scripts", script);
      expect((await stat(path)).mode & 0o111, script).not.toBe(0);
      // Once committed this is the authoritative Git-mode assertion; before the
      // local commit, the worktree mode is the candidate Git would record.
      const tracked = run(["git", "ls-files", "-s", "--", relative(process.cwd(), path)]);
      const record = stdout(tracked).trim();
      if (record) expect(record.startsWith("100755 "), script).toBe(true);
    }
  });
});
