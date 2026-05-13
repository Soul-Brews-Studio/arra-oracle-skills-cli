import { describe, it, expect } from "bun:test";
import {
  compareBases,
  computeVersion,
  dateBase,
  effectiveBase,
  extractBaseFromVersion,
  hhmmStamp,
  isValidCalendarDate,
  maxAlphaFromTags,
  maxNFromPackageJson,
  maxNFromTags,
} from "../scripts/calver";

describe("calver dateBase", () => {
  it("yy.m.d with no zero-pad (semver safety)", () => {
    expect(dateBase(new Date(2026, 3, 18, 9, 37))).toBe("26.4.18");
    expect(dateBase(new Date(2026, 1, 5, 9, 5))).toBe("26.2.5");
    expect(dateBase(new Date(2027, 0, 1, 0, 5))).toBe("27.1.1");
  });
});

describe("calver maxAlphaFromTags", () => {
  it("returns -1 when no matching tags", () => {
    expect(maxAlphaFromTags("26.4.18", [])).toBe(-1);
    expect(maxAlphaFromTags("26.4.18", ["v26.4.17-alpha.5", "v26.4.19-alpha.0"])).toBe(-1);
  });

  it("returns max N across matching alpha tags", () => {
    expect(
      maxAlphaFromTags("26.4.27", ["v26.4.27-alpha.11", "v26.4.27-alpha.12", "v26.4.27-alpha.13"])
    ).toBe(13);
  });

  it("handles non-monotonic tag order", () => {
    expect(
      maxAlphaFromTags("26.4.27", ["v26.4.27-alpha.13", "v26.4.27-alpha.0", "v26.4.27-alpha.7"])
    ).toBe(13);
  });

  it("ignores tags with non-integer suffixes (e.g. two-tier alpha.12.0)", () => {
    expect(
      maxAlphaFromTags("26.4.27", ["v26.4.27-alpha.5", "v26.4.27-alpha.12.0"])
    ).toBe(5);
  });

  it("handles single-digit and multi-digit N", () => {
    expect(maxAlphaFromTags("26.4.18", ["v26.4.18-alpha.0"])).toBe(0);
    expect(maxAlphaFromTags("26.4.18", ["v26.4.18-alpha.99"])).toBe(99);
  });
});

describe("calver hhmmStamp (HMM integer scheme — no leading zeros)", () => {
  it("midnight hour drops the leading zero", () => {
    expect(hhmmStamp(new Date(2026, 3, 18, 0, 0))).toBe("0");
    expect(hhmmStamp(new Date(2026, 3, 18, 0, 5))).toBe("5");
    expect(hhmmStamp(new Date(2026, 3, 18, 0, 30))).toBe("30");
    expect(hhmmStamp(new Date(2026, 3, 18, 0, 59))).toBe("59");
  });

  it("single-digit hour: H*100 + MM", () => {
    expect(hhmmStamp(new Date(2026, 3, 18, 1, 0))).toBe("100");
    expect(hhmmStamp(new Date(2026, 3, 18, 9, 29))).toBe("929");
    expect(hhmmStamp(new Date(2026, 3, 18, 9, 0))).toBe("900");
  });

  it("double-digit hour: H*100 + MM", () => {
    expect(hhmmStamp(new Date(2026, 3, 18, 10, 1))).toBe("1001");
    expect(hhmmStamp(new Date(2026, 3, 18, 12, 34))).toBe("1234");
    expect(hhmmStamp(new Date(2026, 3, 18, 23, 1))).toBe("2301");
    expect(hhmmStamp(new Date(2026, 3, 18, 23, 59))).toBe("2359");
  });

  it("numeric chronological order is preserved (semver numeric IDs)", () => {
    // No leading zeros => semver-numeric => numeric compare. Spot-check
    // that successive minutes monotonically increase as integers.
    const t = (h: number, m: number) => parseInt(hhmmStamp(new Date(2026, 3, 18, h, m)), 10);
    expect(t(0, 0)).toBeLessThan(t(0, 1));
    expect(t(0, 59)).toBeLessThan(t(1, 0));   // 59 < 100
    expect(t(9, 59)).toBeLessThan(t(10, 0));  // 959 < 1000
    expect(t(23, 58)).toBeLessThan(t(23, 59)); // 2358 < 2359
  });
});

describe("calver computeVersion (HMM scheme)", () => {
  const apr18_0937 = new Date(2026, 3, 18, 9, 37);
  const apr27_1200 = new Date(2026, 3, 27, 12, 0);
  const jan1_0005  = new Date(2027, 0, 1, 0, 5);

  it("stable: yy.m.d (no suffix)", () => {
    expect(computeVersion({ stable: true, check: false, now: apr18_0937 })).toBe("26.4.18");
    expect(computeVersion({ stable: true, check: false, now: jan1_0005 })).toBe("27.1.1");
  });

  it("alpha: yy.m.d-alpha.HMM regardless of tag state", () => {
    expect(computeVersion({ stable: false, check: false, now: apr18_0937 }, [])).toBe("26.4.18-alpha.937");
    expect(computeVersion({ stable: false, check: false, now: jan1_0005 }, [])).toBe("27.1.1-alpha.5");
  });

  it("alpha: ignores tags entirely (HMM is unique-per-minute)", () => {
    const tags = ["v26.4.27-alpha.11", "v26.4.27-alpha.12"];
    expect(computeVersion({ stable: false, check: false, now: apr27_1200 }, tags)).toBe("26.4.27-alpha.1200");
  });

  it("alpha: ignores legacy monotonic package.json counter", () => {
    expect(
      computeVersion({ stable: false, check: false, now: apr27_1200 }, [], "26.4.27-alpha.48"),
    ).toBe("26.4.27-alpha.1200");
  });

  it("--stable ignores tags entirely", () => {
    const tags = ["v26.4.27-alpha.99"];
    expect(computeVersion({ stable: true, channel: "alpha", check: false, now: apr27_1200 }, tags)).toBe("26.4.27");
  });

  it("alpha and beta in same minute share HMM, differ by channel", () => {
    const alpha = computeVersion({ stable: false, channel: "alpha", check: false, now: apr27_1200 });
    const beta  = computeVersion({ stable: false, channel: "beta",  check: false, now: apr27_1200 });
    expect(alpha).toBe("26.4.27-alpha.1200");
    expect(beta).toBe("26.4.27-beta.1200");
  });
});

describe("calver maxNFromTags / maxAlphaFromTags (back-compat helpers)", () => {
  it("maxNFromTags isolates alpha and beta counters", () => {
    const tags = [
      "v26.4.28-alpha.0",
      "v26.4.28-alpha.1",
      "v26.4.28-beta.0",
    ];
    expect(maxNFromTags("26.4.28", "alpha", tags)).toBe(1);
    expect(maxNFromTags("26.4.28", "beta", tags)).toBe(0);
  });

  it("maxAlphaFromTags is a back-compat alias for alpha channel", () => {
    const tags = ["v26.4.28-alpha.5", "v26.4.28-beta.99"];
    expect(maxAlphaFromTags("26.4.28", tags)).toBe(5);
  });

  it("beta tag walk rejects two-tier suffixes (e.g. beta.12.0)", () => {
    const tags = ["v26.4.28-beta.5", "v26.4.28-beta.12.0"];
    expect(maxNFromTags("26.4.28", "beta", tags)).toBe(5);
  });
});

describe("calver maxNFromPackageJson (#784)", () => {
  it("returns N for matching alpha base+channel", () => {
    expect(maxNFromPackageJson("26.4.28", "alpha", "26.4.28-alpha.24")).toBe(24);
    expect(maxNFromPackageJson("26.4.28", "alpha", "v26.4.28-alpha.7")).toBe(7);
  });

  it("returns N for matching beta base+channel", () => {
    expect(maxNFromPackageJson("26.4.28", "beta", "26.4.28-beta.3")).toBe(3);
  });

  it("returns -1 when date base does not match", () => {
    expect(maxNFromPackageJson("26.4.28", "alpha", "26.4.27-alpha.99")).toBe(-1);
    expect(maxNFromPackageJson("26.4.28", "alpha", "26.5.1-alpha.0")).toBe(-1);
  });

  it("returns -1 when channel does not match", () => {
    expect(maxNFromPackageJson("26.4.28", "alpha", "26.4.28-beta.5")).toBe(-1);
    expect(maxNFromPackageJson("26.4.28", "beta", "26.4.28-alpha.5")).toBe(-1);
  });

  it("rejects non-integer suffix (e.g. two-tier alpha.12.0 or alpha.12-rc)", () => {
    expect(maxNFromPackageJson("26.4.28", "alpha", "26.4.28-alpha.12.0")).toBe(-1);
    expect(maxNFromPackageJson("26.4.28", "alpha", "26.4.28-alpha.12-rc")).toBe(-1);
    expect(maxNFromPackageJson("26.4.28", "alpha", "26.4.28-alpha.abc")).toBe(-1);
  });

  it("returns -1 for empty or stable-only version strings", () => {
    expect(maxNFromPackageJson("26.4.28", "alpha", "")).toBe(-1);
    expect(maxNFromPackageJson("26.4.28", "alpha", "26.4.28")).toBe(-1);
  });
});


describe("calver maxNFromPackageJson — robustness (#784 explorer findings)", () => {
  it("rejects non-CalVer legacy version (e.g. 2.0.0-alpha.134)", () => {
    // Pre-CalVer migration shape — the trailing 134 must NOT match.
    expect(maxNFromPackageJson("26.4.28", "alpha", "2.0.0-alpha.134")).toBe(-1);
  });

  it("substring trap: base 26.4.2 must not match 26.4.28-alpha.N", () => {
    // The dash boundary in `${base}-${channel}.` should anchor the match
    // so a shorter base doesn't fall through into a longer date.
    expect(maxNFromPackageJson("26.4.2", "alpha", "26.4.28-alpha.5")).toBe(-1);
    expect(maxNFromPackageJson("26.4.2", "alpha", "26.4.20-alpha.5")).toBe(-1);
    // Genuine match still works for the actual base 26.4.2:
    expect(maxNFromPackageJson("26.4.2", "alpha", "26.4.2-alpha.5")).toBe(5);
  });

  it("rejects malformed alpha suffix in package.json", () => {
    expect(maxNFromPackageJson("26.4.28", "alpha", "26.4.28-alpha.")).toBe(-1);
    expect(maxNFromPackageJson("26.4.28", "alpha", "26.4.28-alpha")).toBe(-1);
    expect(maxNFromPackageJson("26.4.28", "alpha", "26.4.28-alpha.bogus")).toBe(-1);
    expect(maxNFromPackageJson("26.4.28", "alpha", "26.4.28-alpha.12b")).toBe(-1);
  });

  it("zero-padded N parses as decimal (parity with parseInt)", () => {
    // Mirrors maxNFromTags's parseInt behavior — `05` → 5, not octal.
    expect(maxNFromPackageJson("26.4.28", "alpha", "26.4.28-alpha.05")).toBe(5);
  });

  it("rejects rc/other channels even if structurally similar", () => {
    expect(maxNFromPackageJson("26.4.28", "alpha", "26.4.28-rc.5")).toBe(-1);
  });
});

describe("calver extractBaseFromVersion (#819)", () => {
  it("strips alpha/beta suffix, returns YY.M.D", () => {
    expect(extractBaseFromVersion("26.4.29-alpha.5")).toBe("26.4.29");
    expect(extractBaseFromVersion("26.4.29-beta.0")).toBe("26.4.29");
  });

  it("accepts bare YY.M.D (post-stable-cut shape)", () => {
    expect(extractBaseFromVersion("26.4.29")).toBe("26.4.29");
    expect(extractBaseFromVersion("v26.4.29")).toBe("26.4.29");
  });

  it("accepts leading v prefix", () => {
    expect(extractBaseFromVersion("v26.4.29-alpha.5")).toBe("26.4.29");
  });

  it("returns null for empty/missing", () => {
    expect(extractBaseFromVersion("")).toBeNull();
  });

  it("returns null for non-CalVer legacy versions", () => {
    expect(extractBaseFromVersion("2.0.0-alpha.134")).toBe("2.0.0"); // shape-OK
    expect(extractBaseFromVersion("not-a-version")).toBeNull();
    expect(extractBaseFromVersion("26.4")).toBeNull();
    expect(extractBaseFromVersion("26.4.29.1")).toBeNull();
  });
});

describe("calver compareBases (#819)", () => {
  it("compares by integer segment, not lexicographic", () => {
    // Lexicographic would say "26.4.30" < "26.4.4" — must compare ints.
    expect(compareBases("26.4.30", "26.4.4")).toBeGreaterThan(0);
    expect(compareBases("26.4.4", "26.4.30")).toBeLessThan(0);
  });

  it("equal bases return 0", () => {
    expect(compareBases("26.4.28", "26.4.28")).toBe(0);
  });

  it("year and month dominate", () => {
    expect(compareBases("27.1.1", "26.12.31")).toBeGreaterThan(0);
    expect(compareBases("26.5.1", "26.4.99")).toBeGreaterThan(0);
  });

  it("throws on malformed input", () => {
    expect(() => compareBases("26.4", "26.4.28")).toThrow();
    expect(() => compareBases("26.4.28.1", "26.4.28")).toThrow();
  });
});

describe("calver isValidCalendarDate (#1015)", () => {
  it("valid dates pass", () => {
    expect(isValidCalendarDate("26.1.1")).toBe(true);
    expect(isValidCalendarDate("26.4.30")).toBe(true);
    expect(isValidCalendarDate("26.2.29")).toBe(true); // Feb 29 (leap)
    expect(isValidCalendarDate("26.12.31")).toBe(true);
  });

  it("ghost dates fail (day exceeds month)", () => {
    expect(isValidCalendarDate("26.4.53")).toBe(false); // the v26.4.53 ghost
    expect(isValidCalendarDate("26.4.31")).toBe(false); // April has 30 days
    expect(isValidCalendarDate("26.2.30")).toBe(false); // Feb max 29
  });

  it("invalid month fails", () => {
    expect(isValidCalendarDate("26.0.1")).toBe(false);
    expect(isValidCalendarDate("26.13.1")).toBe(false);
  });

  it("day 0 fails", () => {
    expect(isValidCalendarDate("26.1.0")).toBe(false);
  });

  it("malformed input fails", () => {
    expect(isValidCalendarDate("26.4")).toBe(false);
    expect(isValidCalendarDate("26.4.5.1")).toBe(false);
  });
});

describe("calver effectiveBase (#819)", () => {
  it("picks package.json base when ahead of today", () => {
    expect(effectiveBase("26.4.28", "26.4.29-alpha.5")).toBe("26.4.29");
  });

  it("picks today when package.json is behind", () => {
    expect(effectiveBase("26.4.28", "26.4.27-alpha.99")).toBe("26.4.28");
  });

  it("picks today when bases are equal", () => {
    expect(effectiveBase("26.4.28", "26.4.28-alpha.18")).toBe("26.4.28");
  });

  it("picks today when package.json is empty/unparseable", () => {
    expect(effectiveBase("26.4.28", "")).toBe("26.4.28");
    expect(effectiveBase("26.4.28", "not-a-version")).toBe("26.4.28");
  });

  it("handles bare future stable (post-cut shape, no suffix)", () => {
    // Just-cut tomorrow's stable: package.json holds bare 26.4.30 with no suffix.
    expect(effectiveBase("26.4.28", "26.4.30")).toBe("26.4.30");
  });

  it("#1015: ghost date (day > month max) falls back to today", () => {
    expect(effectiveBase("26.4.30", "26.4.53")).toBe("26.4.30");
    expect(effectiveBase("26.5.2", "26.4.53")).toBe("26.5.2");
  });
});

describe("calver computeVersion future-dated package.json (#819, HMM-adapted)", () => {
  const apr28_1200 = new Date(2026, 3, 28, 12, 0);
  const apr29_0500 = new Date(2026, 3, 29, 5, 0);

  it("future-dated alpha: bumps to package.json's date with current HMM (no downgrade)", () => {
    // The #819 anti-downgrade guard still fires under HMM: package.json at
    // 26.4.29-alpha.5, clock at 2026-04-28 12:00 → bump to 26.4.29-alpha.1200,
    // NOT 26.4.28-alpha.1200 (which would be a base downgrade).
    expect(
      computeVersion({ stable: false, check: false, now: apr28_1200 }, [], "26.4.29-alpha.5"),
    ).toBe("26.4.29-alpha.1200");
  });

  it("date roll: clock advances past package.json → fresh date with current HMM", () => {
    expect(
      computeVersion({ stable: false, check: false, now: apr29_0500 }, [], "26.4.28-alpha.18"),
    ).toBe("26.4.29-alpha.500");
  });

  it("just-cut stable in package.json: bare YY.M.D base preserved", () => {
    expect(
      computeVersion({ stable: false, check: false, now: apr28_1200 }, [], "26.4.30"),
    ).toBe("26.4.30-alpha.1200");
  });

  it("--stable always uses today's clock, never package.json's future date", () => {
    expect(
      computeVersion({ stable: true, check: false, now: apr28_1200 }, [], "26.4.29-alpha.5"),
    ).toBe("26.4.28");
  });
});
