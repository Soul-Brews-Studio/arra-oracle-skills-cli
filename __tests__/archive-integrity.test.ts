import { describe, it, expect } from "bun:test";
import { readdirSync, existsSync } from "fs";
import { join } from "path";
import { discoverSkills } from "../src/cli/installer";
import {
  resolveProfile,
  ZOMBIE_SKILLS,
  LAB_SKILLS,
  STANDARD_SKILLS,
  MINIMAL_SKILLS,
} from "../src/profiles";

// Integration guard for the 2026-07 zombie-leak regression.
//
// profiles.test.ts is a UNIT test: it feeds resolveProfile the ZOMBIE_SKILLS
// *constant* and checks the filtering logic. That constant was CORRECT the whole
// time — but the actual install path excludes zombies via the frontmatter-derived
// `.zombie` flag from discoverSkills(), NOT the constant. Zombie round 2 moved 11
// skills into src/skills/.archive/ + added them to the constant but forgot the
// `zombie: true` frontmatter — so discoverSkills() didn't flag them and they kept
// installing under `full`/`lab`. The unit test stayed green while install leaked.
//
// These tests exercise the REAL mechanism end-to-end (disk → discoverSkills →
// resolveProfile) so the same class of drift can't slip through again.

const SKILLS_DIR = join(process.cwd(), "src", "skills");
const ARCHIVE_DIR = join(SKILLS_DIR, ".archive");

function archivedSkillNames(): string[] {
  if (!existsSync(ARCHIVE_DIR)) return [];
  return readdirSync(ARCHIVE_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .filter((d) => existsSync(join(ARCHIVE_DIR, d.name, "SKILL.md")))
    .map((d) => d.name);
}

function activeSkillNames(): string[] {
  return readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(
      (d) => d.isDirectory() && !d.name.startsWith(".") && d.name !== "_template",
    )
    .filter((d) => existsSync(join(SKILLS_DIR, d.name, "SKILL.md")))
    .map((d) => d.name);
}

describe("archive integrity (real discoverSkills)", () => {
  it("every skill under .archive/ is flagged zombie by discoverSkills", async () => {
    const archived = archivedSkillNames();
    expect(archived.length).toBeGreaterThan(0); // sanity: archive isn't empty

    const skills = await discoverSkills();
    const zombieFlagged = new Set(
      skills.filter((s) => s.zombie).map((s) => s.name),
    );

    const unflagged = archived.filter((name) => !zombieFlagged.has(name));
    // Any archived skill missing the frontmatter flag would leak into full/lab
    // install because the compiled VFS carries no .archive/ path signal.
    expect(unflagged).toEqual([]);
  });

  it("no archived skill leaks into the full or lab install set", async () => {
    const archived = new Set(archivedSkillNames());
    const skills = await discoverSkills();
    const allNames = skills.map((s) => s.name);
    const secretNames = skills.filter((s) => s.secret).map((s) => s.name);
    const zombieNames = skills.filter((s) => s.zombie).map((s) => s.name);

    for (const profile of ["full", "lab"]) {
      const resolved =
        resolveProfile(profile, allNames, secretNames, zombieNames) ??
        allNames.filter(
          (s) => !secretNames.includes(s) && !zombieNames.includes(s),
        );
      const leaked = resolved.filter((name) => archived.has(name));
      expect({ profile, leaked }).toEqual({ profile, leaked: [] });
    }
  });
});

// The curation system has three views of "which skills are zombies": the
// ZOMBIE_SKILLS constant (drives the [zombie] install label), the .archive/
// directory (physical storage + the -s opt-in path), and the per-file
// `zombie: true` frontmatter (drives install exclusion, checked above). They
// currently agree — these tests keep them agreeing. The archive→frontmatter
// axis already drifted once (PR #453); this locks the other two axes before
// they can.
describe("curation consistency (constant ↔ directory ↔ profiles)", () => {
  it("ZOMBIE_SKILLS constant exactly matches the .archive/ directory set", () => {
    const constant: string[] = [...ZOMBIE_SKILLS].sort();
    const dirs: string[] = archivedSkillNames().sort();
    // Both directions: a name in the constant with no dir would mislabel a
    // non-existent skill; a dir with no constant entry loses its [zombie] tag.
    expect(constant).toEqual(dirs);
  });

  it("no skill name exists in both active and .archive/ (shadowing)", () => {
    // resolveSkillDir() checks the active path first, so a duplicate name would
    // silently shadow the archived copy and change what `-s <name>` installs.
    const active = new Set(activeSkillNames());
    const collisions = archivedSkillNames().filter((n) => active.has(n));
    expect(collisions).toEqual([]);
  });

  it("every minimal/standard/lab-only skill resolves to a real active dir", () => {
    const active = new Set(activeSkillNames());
    for (const [label, list] of [
      ["MINIMAL", MINIMAL_SKILLS],
      ["STANDARD", STANDARD_SKILLS],
      ["LAB", LAB_SKILLS],
    ] as const) {
      const dangling = [...list].filter((n) => !active.has(n));
      // A profile pointing at a moved/deleted skill installs nothing for that
      // slot — silently shrinking the profile.
      expect({ label, dangling }).toEqual({ label, dangling: [] });
    }
  });
});
