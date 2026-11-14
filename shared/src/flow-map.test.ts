import { describe, expect, it } from "vitest";
import { FLOW_MAP, flowSummary, nearCabin, sameSpot, speedsOf, xOf, yOf, type FlowTest } from "./flow-map";

const test = (id: string, o2: number, lo: number, hi = lo, patch: Partial<FlowTest> = {}): FlowTest => ({
  id,
  acc: "PSI-25",
  label: id,
  fuel: "PMMA",
  shape: "rod",
  o2,
  lo,
  hi,
  levels: null,
  open: false,
  raw: String(lo),
  ...patch,
});

describe("the scales", () => {
  it("keeps every air speed inside the plot, with faster air further right", () => {
    expect(xOf(0)).toBe(2);
    expect(xOf(5)).toBeLessThan(xOf(10));
    expect(xOf(FLOW_MAP.speedMax)).toBe(98);
    expect(xOf(500)).toBe(98);
    expect(xOf(-3)).toBe(2);
  });

  it("gives the low speeds, where most tests ran, more room than a straight scale would", () => {
    const straight = 2 + 96 * (10 / FLOW_MAP.speedMax);
    expect(xOf(10) - straight).toBeGreaterThan(15);
  });

  it("puts more oxygen higher up", () => {
    expect(yOf(FLOW_MAP.o2Max)).toBe(0);
    expect(yOf(FLOW_MAP.o2Min)).toBeCloseTo(100);
    expect(yOf(0.3)).toBeLessThan(yOf(0.21));
  });
});

describe("speedsOf", () => {
  it("marks one speed, both ends of a range, or every level NASA lists", () => {
    expect(speedsOf(test("a", 0.21, 5))).toEqual([5]);
    expect(speedsOf(test("b", 0.21, 2, 10))).toEqual([2, 10]);
    expect(speedsOf(test("c", 0.21, 1, 20, { levels: [1, 2, 5, 10, 20] }))).toEqual([1, 2, 5, 10, 20]);
  });
});

describe("against a cabin's oxygen", () => {
  const tests = [test("a", 0.136, 5), test("b", 0.21, 10), test("c", 0.222, 5), test("d", 0.222, 5)];

  it("counts the tests within three points of oxygen", () => {
    expect(nearCabin(tests, 0.21)).toEqual({ close: 3, nearest: null });
    expect(nearCabin(tests, 0.24).close).toBe(3);
  });

  it("names the nearest test when none is close", () => {
    const near = nearCabin(tests, 0.34);
    expect(near.close).toBe(0);
    expect(near.nearest?.o2).toBe(0.222);
  });

  it("says so in one counted sentence", () => {
    expect(flowSummary(tests, 0.21, "solid-fuel")).toBe("3 of the 4 solid-fuel tests drawn here ran within 3 points of this cabin's oxygen.");
    expect(flowSummary(tests, 0.34, "solid-fuel")).toBe(
      "None of the 4 solid-fuel tests drawn here ran within 3 points of this cabin's oxygen. The closest ran at 22.2%, 11.8 points lower.",
    );
  });

  it("reads naturally for one test and for none", () => {
    expect(flowSummary([test("a", 0.174, 3)], 0.34, "wax")).toBe("The one wax test drawn here ran at 17.4% oxygen, 16.6 points lower than this cabin.");
    expect(flowSummary([test("a", 0.174, 3)], 0.18, "wax")).toBe("The one wax test drawn here ran within 3 points of this cabin's oxygen.");
    expect(flowSummary([], 0.34, "foam")).toBe("No foam test in the archive gives both its oxygen and its air speed.");
  });

  it("counts tests drawn on top of each other", () => {
    expect(sameSpot(tests, tests[2])).toBe(2);
    expect(sameSpot(tests, tests[0])).toBe(1);
  });
});
