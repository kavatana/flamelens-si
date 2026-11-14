import { describe, expect, it } from "vitest";
import { BENCHES, lookupBench, type BenchRow } from "./benches";

const gas = BENCHES.gas;
const butane = gas.kinds[0];
const row = (id: string, o2: number, p: number, cat: string, time: number | null): BenchRow => ({ id, label: id, kind: "n-butane", dims: { o2, p }, cat, measures: { time, temp: null }, note: null });
const rows: BenchRow[] = [row("a", 0.21, 101, "none", 0), row("b", 0.21, 101, "none", 0), row("c", 0.22, 101, "self", 40), row("d", 0.35, 51, "self", 60), row("e", 0.36, 51, "flow", 100), { ...row("f", 0.21, 101, "self", 5), kind: "propane" }];

describe("a Flame Lab bench", () => {
  it("reports the nearest tests of the chosen sample only", () => {
    const r = lookupBench(gas, butane, rows, { o2: 0.21, p: 101.3 });
    expect(r.status).toBe("measured");
    expect(r.near.map((x) => x.row.id).sort()).toEqual(["a", "b", "c"]);
    expect(r.counts).toEqual({ none: 2, self: 1 });
  });

  it("takes burn time over the tests that lit, not the ones that never did", () => {
    const r = lookupBench(gas, butane, rows, { o2: 0.21, p: 101.3 });
    expect(r.medians.time).toBe(40);
    expect(gas.headline(r)).toBe("1 of 3 nearby tests lit, and it went out by itself.");
  });

  it("falls back to the single nearest test when nothing is within two steps, and says so", () => {
    const r = lookupBench(gas, butane, rows, { o2: 0.28, p: 200 });
    expect(r.status).toBe("untested");
    expect(r.near).toHaveLength(1);
    expect(gas.headline(r)).toMatch(/^NASA's nearest test/);
  });

  it("counts both endings near the lunar habitat's air", () => {
    const r = lookupBench(gas, butane, rows, { o2: 0.34, p: 56.5 });
    expect(r.counts).toEqual({ self: 1, flow: 1 });
    expect(gas.headline(r)).toBe("2 of 2 nearby tests lit, and 1 went out by itself.");
  });
});
