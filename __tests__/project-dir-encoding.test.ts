import { test, expect } from "bun:test";
import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

// Claude Code encodes a project path into a directory name under
// ~/.claude/projects/ by replacing every character that is not safe in a
// directory name with "-". The skills and hooks here reconstruct that name so
// they can find the session transcript.
//
// The reconstruction used to fold only "/" and "." — a blacklist. Any path
// containing some OTHER unsafe character therefore produced a directory name
// that does not exist, the lookup silently returned nothing, and the caller
// carried on with an empty session id. Underscore is the case that bit us:
// a vault path like /Users/me/my_notes/work_stuff/app encoded to
// "-Users-me-my_notes-work_stuff-app" while the real directory on disk is
// "-Users-me-my-notes-work-stuff-app".
//
// The fix is a whitelist: replace everything that is NOT [A-Za-z0-9]. These
// tests lock that in, including the characters a blacklist would have missed
// next (space, +, @), so the same class cannot come back one character at a time.

const encode = (p: string) => p.replace(/[^A-Za-z0-9]/g, "-");

test("underscore is folded — the regression this fixes", () => {
  expect(encode("/Users/me/my_notes/work_stuff/app"))
    .toBe("-Users-me-my-notes-work-stuff-app");
});

test("space is folded — a blacklist of [/._] would still break here", () => {
  expect(encode("/Users/me/My Vault/app")).toBe("-Users-me-My-Vault-app");
});

test("slash and dot still fold, as before", () => {
  expect(encode("/Users/me/some.dir/app")).toBe("-Users-me-some-dir-app");
});

test("other unsafe characters fold too, so the class is closed", () => {
  expect(encode("/Users/me/c++/app")).toBe("-Users-me-c---app");
  expect(encode("/Users/me/mail@host/app")).toBe("-Users-me-mail-host-app");
});

test("alphanumerics are preserved", () => {
  expect(encode("/a/B9/c0")).toBe("-a-B9-c0");
});

// The same encoder is written in several places and in two languages. A fix
// applied to only some of them leaves the bug alive where it was missed, so
// assert that no old blacklist spelling survives anywhere in the tree. The
// spellings differed between sites, which is exactly why a search for one of
// them found only some of the sites.
test("no blacklist spelling of the encoder remains in the repo", () => {
  const root = join(import.meta.dir, "..");
  const skip = new Set(["node_modules", ".git", "dist", "__tests__"]);
  const bad: string[] = [];
  const patterns = [
    "s|[/.]|-|g",          // bash, anchored form
    "s|\\.|-|g",           // bash, unanchored form
    "replace(/[/.]/g",     // typescript
    "replace(/[\\/.]/g",   // typescript, escaped slash
  ];
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      if (skip.has(name)) continue;
      const full = join(dir, name);
      if (statSync(full).isDirectory()) { walk(full); continue; }
      if (!/\.(md|sh|ts)$/.test(name)) continue;
      const body = readFileSync(full, "utf8");
      for (const p of patterns) if (body.includes(p)) bad.push(`${full}: ${p}`);
    }
  };
  walk(root);
  expect(bad).toEqual([]);
});
