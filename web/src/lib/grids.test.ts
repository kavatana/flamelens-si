import { describe, expect, it } from "vitest";
import { FLOW_BANDS, bandOf } from "@flamelens/shared/bands";
import type { FlowTest } from "@flamelens/shared/flow-map";
import { NO_PRESSURE, PRESSURE_BANDS, airByOxygen, inFocus, oxygenByPhase, pressureBandOf, pressureByOxygen } from "./grids";
import type { Cluster } from "@flamelens/shared/scoring";

const cluster = (patch: Partial<Cluster>): Cluster => ({ acc: "PSI-1", o2: 0.21, p: 101.5, phase: "solid", fuel: "PMMA", stream: false, assumed: false, kind: "test", n: 1, rid: "r1", label: "1", ...patch });
const flow = (id: string, o2: number, lo: number, hi = lo, levels: number[] | null = null, fuel = "PMMA"): FlowTest => ({ id, acc: "PSI-25", label: id, fuel, shape: "rod", o2, lo, hi, levels, open: false, raw: String(lo) });
const acrylic = { id: "acrylic", label: "Acrylic plastic", note: "PMMA", match: ["PMMA"] };
const row = (id: string) => PRESSURE_BANDS.findIndex((b) => b.id === id);
const speed = (id: string) => FLOW_BANDS.findIndex((b) => b.id === id);

describe("pressure bands", () => {
  it("give each cabin NASA plans a band of its own", () => {
    expect(pressureBandOf(101.4)).toBe(row("sea"));
    expect(pressureBandOf(70.3)).toBe(row("reduced"));
    expect(pressureBandOf(56.5)).toBe(row("low"));
    expect(pressureBandOf(29.6)).toBe(row("suit"));
    expect(pressureBandOf(507)).toBe(row("high"));
  });

  it("leave no pressure without a band", () => {
    for (const p of [1, 39.9, 40, 63, 85, 115, 150, 999]) expect(pressureBandOf(p)).toBeGreaterThanOrEqual(0);
  });
});

describe("inFocus", () => {
  it("follows the fuel type, or the material when one is chosen", () => {
    expect(inFocus({ phase: "gas" }, "any", null)).toBe(true);
    expect(inFocus({ phase: null }, "any", null)).toBe(false);
    expect(inFocus({ phase: "gas" }, "solid", null)).toBe(false);
    expect(inFocus({ phase: "solid", fuel: "PMMA" }, "solid", acrylic)).toBe(true);
    expect(inFocus({ phase: "solid", fuel: "Nomex" }, "solid", acrylic)).toBe(false);
    expect(inFocus({ phase: "liquid", fuel: "PMMA" }, "any", acrylic)).toBe(false);
  });
});

describe("oxygenByPhase", () => {
  const clusters = [cluster({ n: 4 }), cluster({ fuel: "Nomex", n: 2 }), cluster({ phase: "liquid", fuel: "heptane", o2: 0.34, n: 7 }), cluster({ stream: true, n: 50 }), cluster({ phase: null, n: 9 })];

  it("counts tests by fuel type and oxygen level, leaving out burner streams", () => {
    const grid = oxygenByPhase(clusters, null);
    expect(grid.solid[bandOf(0.21)].n).toBe(6);
    expect(grid.liquid[bandOf(0.34)].n).toBe(7);
    expect(grid.gas.every((s) => s.n === 0)).toBe(true);
  });

  it("narrows the solids to a material and leaves the other fuel types alone", () => {
    const grid = oxygenByPhase(clusters, acrylic);
    expect(grid.solid[bandOf(0.21)].n).toBe(4);
    expect(grid.liquid[bandOf(0.34)].n).toBe(7);
  });

  it("lists the largest groups first", () => {
    expect(oxygenByPhase(clusters, null).solid[bandOf(0.21)].items.map((c) => c.n)).toEqual([4, 2]);
  });
});

describe("airByOxygen", () => {
  it("counts a test once in each speed band it lists", () => {
    const grid = airByOxygen([flow("a", 0.21, 1, 10, [1, 2, 5, 10])], null);
    const column = bandOf(0.21);
    expect(grid[speed("creep")][column].n).toBe(1);
    expect(grid[speed("slow")][column].n).toBe(1);
    expect(grid[speed("gentle")][column].n).toBe(1);
    expect(grid[speed("steady")][column].n).toBe(0);
  });

  it("places still air, a single speed and both ends of a range", () => {
    const grid = airByOxygen([flow("a", 0.17, 0), flow("b", 0.17, 3), flow("c", 0.17, 3, 30)], null);
    const column = bandOf(0.17);
    expect(grid[speed("still")][column].n).toBe(1);
    expect(grid[speed("slow")][column].n).toBe(2);
    expect(grid[speed("brisk")][column].n).toBe(1);
  });

  it("keeps only the chosen material", () => {
    const grid = airByOxygen([flow("a", 0.21, 5), flow("b", 0.21, 5, 5, null, "Nomex")], acrylic);
    expect(grid[speed("slow")][bandOf(0.21)].items.map((t) => t.id)).toEqual(["a"]);
  });
});

describe("pressureByOxygen", () => {
  const clusters = [cluster({ n: 5, assumed: true }), cluster({ n: 3, p: 56.5, o2: 0.34, phase: "gas", fuel: "methane" }), cluster({ n: 2, p: null, phase: "gas", fuel: "methane" }), cluster({ n: 8, stream: true, phase: "gas" })];

  it("places tests by pressure and oxygen, and remembers which pressures were assumed", () => {
    const grid = pressureByOxygen(clusters, "any", null);
    expect(grid[row("sea")][bandOf(0.21)]).toMatchObject({ n: 5, assumed: 5 });
    expect(grid[row("low")][bandOf(0.34)]).toMatchObject({ n: 3, assumed: 0 });
  });

  it("keeps tests with no pressure in a row of their own", () => {
    expect(pressureByOxygen(clusters, "any", null)[NO_PRESSURE][bandOf(0.21)].n).toBe(2);
  });

  it("counts only the fuel in view", () => {
    const grid = pressureByOxygen(clusters, "gas", null);
    expect(grid[row("sea")][bandOf(0.21)].n).toBe(0);
    expect(grid[row("low")][bandOf(0.34)].n).toBe(3);
  });
});
