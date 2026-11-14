/**
 * Counting for the dashboard's three grids. Each has oxygen across and something else down:
 * the type of fuel, the speed of the air, or the pressure. Pure counting; nothing here is a model.
 */
import { FLOW_BANDS, O2_BANDS, bandOf, flowBandOf } from "@flamelens/shared/bands";
import { speedsOf, type FlowTest } from "@flamelens/shared/flow-map";
import type { Material } from "@flamelens/shared/materials";
import type { Cluster, Focus, Phase } from "@flamelens/shared/scoring";

/** Pressure bands, lowest first, edged so that each cabin NASA plans sits in a band of its own. */
export const PRESSURE_BANDS = [
  { id: "suit", label: "under 40 kPa", short: "<40", sub: "", lo: 0, hi: 40 },
  { id: "low", label: "40–63 kPa", short: "40–63", sub: "", lo: 40, hi: 63 },
  { id: "reduced", label: "63–85 kPa", short: "63–85", sub: "", lo: 63, hi: 85 },
  { id: "sea", label: "85–115 kPa", short: "85–115", sub: "sea level", lo: 85, hi: 115 },
  { id: "raised", label: "115–150 kPa", short: "115–150", sub: "", lo: 115, hi: 150 },
  { id: "high", label: "over 150 kPa", short: ">150", sub: "", lo: 150, hi: Infinity },
] as const;

/** The row, after the pressure bands, for tests whose table lists no pressure. */
export const NO_PRESSURE = PRESSURE_BANDS.length;

export function pressureBandOf(p: number): number {
  return PRESSURE_BANDS.findIndex((b) => p >= b.lo && p < b.hi);
}

export const PHASES: Phase[] = ["solid", "liquid", "gas"];

/** One square: how many tests it holds, how many of them have an assumed pressure, and the tests themselves. */
export type Square<T> = { n: number; assumed: number; items: T[] };

const blankRow = <T,>(): Square<T>[] => O2_BANDS.map(() => ({ n: 0, assumed: 0, items: [] }));

/** Whether a group of tests burned what the visitor is looking at. */
export function inFocus(c: { phase: string | null; fuel?: string | null }, focus: Focus, material: Material | null): boolean {
  if (material) return c.phase === "solid" && material.match.includes(c.fuel ?? "");
  return focus === "any" ? c.phase !== null : c.phase === focus;
}

function add(square: Square<Cluster>, c: Cluster) {
  square.n += c.n;
  if (c.assumed) square.assumed += c.n;
  square.items.push(c);
}

const bySize = (a: Cluster, b: Cluster) => b.n - a.n || a.acc.localeCompare(b.acc);

/** Tests by type of fuel and oxygen level. A material narrows the solids only. */
export function oxygenByPhase(clusters: Cluster[], material: Material | null): Record<Phase, Square<Cluster>[]> {
  const grid: Record<Phase, Square<Cluster>[]> = { solid: blankRow(), liquid: blankRow(), gas: blankRow() };
  for (const c of clusters) {
    if (!c.phase || c.stream) continue;
    if (material && c.phase === "solid" && !material.match.includes(c.fuel ?? "")) continue;
    const band = bandOf(c.o2);
    if (band >= 0) add(grid[c.phase][band], c);
  }
  for (const phase of PHASES) for (const square of grid[phase]) square.items.sort(bySize);
  return grid;
}

/**
 * Solid-fuel tests by air speed and oxygen level. A test in which the crew changed the
 * speed is counted once at each speed band NASA lists for it, as the archive totals are.
 */
export function airByOxygen(tests: FlowTest[], material: Material | null): Square<FlowTest>[][] {
  const grid = FLOW_BANDS.map(() => blankRow<FlowTest>());
  for (const t of tests) {
    if (material && !material.match.includes(t.fuel ?? "")) continue;
    const band = bandOf(t.o2);
    if (band < 0) continue;
    for (const row of new Set(speedsOf(t).map(flowBandOf))) {
      grid[row][band].n += 1;
      grid[row][band].items.push(t);
    }
  }
  return grid;
}

/** Tests of the fuel in view by pressure and oxygen level. The last row holds those with no pressure in their table. */
export function pressureByOxygen(clusters: Cluster[], focus: Focus, material: Material | null): Square<Cluster>[][] {
  const grid = [...PRESSURE_BANDS.map(() => blankRow<Cluster>()), blankRow<Cluster>()];
  for (const c of clusters) {
    if (c.stream || !inFocus(c, focus, material)) continue;
    const band = bandOf(c.o2);
    const row = c.p === null ? NO_PRESSURE : pressureBandOf(c.p);
    if (band >= 0 && row >= 0) add(grid[row][band], c);
  }
  for (const row of grid) for (const square of row) square.items.sort(bySize);
  return grid;
}
