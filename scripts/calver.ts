#!/usr/bin/env bun
// CalVer bump for arra-oracle-skills-cli
//
// Scheme: v{yy}.{m}.{d}[-alpha.{hour}]
// Spec:   ψ/inbox/2026-04-18_proposal-calver-skills-cli.md (mawjs-oracle)
//
// Max 24 alphas per day (one per hour). Stable = no alpha suffix.
// Timezone comes from the shell — set TZ=Asia/Bangkok in CI if needed.
//
// Usage:
//   bun scripts/calver.ts                  → 26.4.18-alpha.10
//   bun scripts/calver.ts --stable         → 26.4.18
//   bun scripts/calver.ts --hour 14        → 26.4.18-alpha.14
//   bun scripts/calver.ts --check          → dry-run (no writes)

import { $ } from "bun";
import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

type Args = { stable: boolean; hour?: number; check: boolean; now?: Date };

function parseArgs(argv: string[]): Args {
  const args: Args = { stable: false, check: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--stable") args.stable = true;
    else if (a === "--check" || a === "--dry-run") args.check = true;
    else if (a === "--hour") args.hour = parseInt(argv[++i], 10);
    else if (a === "-h" || a === "--help") {
      console.log(HELP);
      process.exit(0);
    } else {
      console.error(`unknown arg: ${a}`);
      console.error(HELP);
      process.exit(2);
    }
  }
  return args;
}

const HELP = `Usage: bun scripts/calver.ts [options]

Compute next CalVer version and bump package.json.

Options:
  --stable         Cut stable (no alpha suffix)
  --hour N         Override hour 0-23 (default: current hour)
  --check          Dry-run: print target, don't modify files
  -h, --help       Show help

Examples:
  bun scripts/calver.ts                  alpha at current hour → 26.4.18-alpha.10
  bun scripts/calver.ts --stable         stable cut            → 26.4.18
  bun scripts/calver.ts --hour 14        alpha at 14:xx        → 26.4.18-alpha.14
  bun scripts/calver.ts --check          print only, no write`;

export function computeVersion(args: Args): string {
  const now = args.now ?? new Date();
  const yy = now.getFullYear() % 100;
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const base = `${yy}.${m}.${d}`;
  if (args.stable) return base;
  const hour = args.hour ?? now.getHours();
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    throw new Error(`invalid hour: ${hour} (must be 0-23)`);
  }
  return `${base}-alpha.${hour}`;
}

async function tagExists(version: string): Promise<boolean> {
  const res = await $`git rev-parse --verify --quiet v${version}`.nothrow().quiet();
  return res.exitCode === 0;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const version = computeVersion(args);
  const channel = args.stable ? "stable" : "alpha";

  console.log(`Target: v${version}  [${channel}]`);

  if (args.check) {
    console.log("(check mode — no changes written)");
    return;
  }

  if (await tagExists(version)) {
    console.error(`\n❌ tag v${version} already exists`);
    console.error(`   → wait for next hour, or use --hour N, or cut --stable`);
    process.exit(1);
  }

  const pkgPath = join(process.cwd(), "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  const old = pkg.version;
  pkg.version = version;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");
  console.log(`✓ package.json: ${old} → ${version}`);

  console.log(`
Next:
  git add package.json && git commit -m "bump: v${version}" && git push origin main
  → auto-tag.yml creates v${version}
  → release.yml publishes GitHub release
  → publish.yml → npm (${args.stable ? "latest" : "alpha"} dist-tag)`);
}

if (import.meta.main) main();
