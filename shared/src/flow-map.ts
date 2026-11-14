import { int, pct } from "./format";
import { O2_STEP } from "./scoring";

/** One solid-fuel test that gives both its oxygen and its air speed. */
export type FlowTest = {
  id: string;
  acc: string;
  label: string;
  fuel: string | null;
  shape: string | null;
  /** Oxygen fraction of the air around the sample. */
  o2: number;
  /** Lowest and highest air speed NASA lists for the test, in cm/s. */
  lo: number;
  hi: number;
  /** Every speed listed, lowest first, when there is more than one. */
  levels: number[] | null;
  /** NASA's cell says more than the speeds listed: a remark, or a mark of doubt. */
  open: boolean;
  /** The air-speed cell as NASA wrote it. */
  raw: string;
};

/** The frame of the chart. NASA expects 30% oxygen or more in Moon cabins, so the frame reaches above that. */
export const FLOW_MAP = { o2Min: 0.12, o2Max: 0.4, moon: 0.3, speedMax: 60 };

/**
 * Where an air speed sits from left to right, in percent of the plot. A square-root scale,
 * because most tests ran below 10 cm/s and a straight scale would crowd them into a corner.
 */
export function xOf(speed: number): number {
  const s = Math.min(Math.max(speed, 0), FLOW_MAP.speedMax);
  return 2 + 96 * Math.sqrt(s / FLOW_MAP.speedMax);
}

/** How far down from the top an oxygen fraction sits, in percent of the plot. More oxygen is higher. */
export function yOf(o2: number): number {
  return ((FLOW_MAP.o2Max - o2) / (FLOW_MAP.o2Max - FLOW_MAP.o2Min)) * 100;
}

/** The speeds to mark for one test. */
export function speedsOf(t: FlowTest): number[] {
  if (t.levels?.length) return t.levels;
  return t.lo === t.hi ? [t.lo] : [t.lo, t.hi];
}

/** How the tests sit against a cabin's oxygen: how many are within one step, and the nearest when none is. */
export function nearCabin(tests: FlowTest[], o2: number): { close: number; nearest: FlowTest | null } {
  let close = 0;
  let nearest: FlowTest | null = null;
  for (const t of tests) {
    const gap = Math.abs(t.o2 - o2);
    if (gap <= O2_STEP + 1e-9) close += 1;
    if (!nearest || gap < Math.abs(nearest.o2 - o2)) nearest = t;
  }
  return { close, nearest: close === 0 ? nearest : null };
}

/** How many tests are drawn at exactly the same place as this one, itself included. */
export function sameSpot(tests: FlowTest[], t: FlowTest): number {
  return tests.filter((u) => u.o2 === t.o2 && u.lo === t.lo && u.hi === t.hi).length;
}

/** One sentence on how the tests drawn sit against this cabin's oxygen. Counted, not written by a model. */
export function flowSummary(tests: FlowTest[], o2: number, subject: string): string {
  const n = tests.length;
  if (n === 0) return `No ${subject} test in the archive gives both its oxygen and its air speed.`;
  const step = Math.round(O2_STEP * 100);
  const { close, nearest } = nearCabin(tests, o2);
  const one = n === 1 ? `The one ${subject} test drawn here` : "";
  if (close > 0) {
    return one
      ? `${one} ran within ${step} points of this cabin's oxygen.`
      : `${int(close)} of the ${int(n)} ${subject} tests drawn here ran within ${step} points of this cabin's oxygen.`;
  }
  const gap = `${Number((Math.abs(nearest!.o2 - o2) * 100).toFixed(1))} points ${nearest!.o2 < o2 ? "lower" : "higher"}`;
  return one
    ? `${one} ran at ${pct(nearest!.o2)} oxygen, ${gap} than this cabin.`
    : `None of the ${int(n)} ${subject} tests drawn here ran within ${step} points of this cabin's oxygen. The closest ran at ${pct(nearest!.o2)}, ${gap}.`;
}
