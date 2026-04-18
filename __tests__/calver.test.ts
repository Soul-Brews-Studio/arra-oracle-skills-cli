import { describe, it, expect } from "bun:test";
import { computeVersion } from "../scripts/calver";

describe("calver computeVersion", () => {
  const apr18_0937 = new Date(2026, 3, 18, 9, 37);      // local time
  const apr18_2255 = new Date(2026, 3, 18, 22, 55);
  const jan1_0005  = new Date(2027, 0, 1, 0, 5);

  it("stable: yy.m.d", () => {
    expect(computeVersion({ stable: true,  check: false, now: apr18_0937 })).toBe("26.4.18");
    expect(computeVersion({ stable: true,  check: false, now: jan1_0005  })).toBe("27.1.1");
  });

  it("alpha: yy.m.d-alpha.{hour}", () => {
    expect(computeVersion({ stable: false, check: false, now: apr18_0937 })).toBe("26.4.18-alpha.9");
    expect(computeVersion({ stable: false, check: false, now: apr18_2255 })).toBe("26.4.18-alpha.22");
    expect(computeVersion({ stable: false, check: false, now: jan1_0005  })).toBe("27.1.1-alpha.0");
  });

  it("explicit --hour overrides current hour", () => {
    expect(computeVersion({ stable: false, check: false, hour: 14, now: apr18_0937 })).toBe("26.4.18-alpha.14");
    expect(computeVersion({ stable: false, check: false, hour: 0,  now: apr18_0937 })).toBe("26.4.18-alpha.0");
  });

  it("--stable ignores --hour", () => {
    expect(computeVersion({ stable: true,  check: false, hour: 14, now: apr18_0937 })).toBe("26.4.18");
  });

  it("rejects invalid hour", () => {
    expect(() => computeVersion({ stable: false, check: false, hour: -1, now: apr18_0937 })).toThrow();
    expect(() => computeVersion({ stable: false, check: false, hour: 24, now: apr18_0937 })).toThrow();
    expect(() => computeVersion({ stable: false, check: false, hour: 1.5, now: apr18_0937 })).toThrow();
  });

  it("no zero-pad (semver safety)", () => {
    const feb5_0905 = new Date(2026, 1, 5, 9, 5);
    expect(computeVersion({ stable: true,  check: false, now: feb5_0905 })).toBe("26.2.5");
    expect(computeVersion({ stable: false, check: false, now: feb5_0905 })).toBe("26.2.5-alpha.9");
  });
});
