import { describe, expect, it } from "vitest";
import { buildFunnel, describeFunnel, type FuelRow } from "./funnel";
import { materialById } from "./materials";
import type { Cluster } from "./scoring";

const cluster = (acc: string, o2: number, p: number | null, phase: Cluster["phase"], fuel: string, n: number, stream = false): Cluster => ({ acc, o2, p, phase, fuel, stream, assumed: false, kind: "test", n, rid: `${acc}/1`, label: "t" });

const clusters: Cluster[] = [
  cluster("PSI-25", 0.21, 101.3, "solid", "PMMA", 40),
  cluster("PSI-25", 0.16, 101.3, "solid", "PMMA", 20),
  cluster("PSI-25", 0.21, 101.3, "solid", "SIBAL fabric (cotton/fiberglass)", 10),
  cluster("PSI-69", 0.34, 71, "liquid", "methanol", 6),
  cluster("PSI-159", 0.34, 56.5, "gas", "propane", 10),
  cluster("PSI-159", 0.85, 101.3, "gas", "propane", 50, true),
];
const fuels: FuelRow[] = [
  { acc: "PSI-25", phase: "solid", fuel: "PMMA", n: 70 },
  { acc: "PSI-25", phase: "solid", fuel: "SIBAL fabric (cotton/fiberglass)", n: 12 },
  { acc: "PSI-101", phase: "solid", fuel: "Kapton", n: 29 },
  { acc: "PSI-69", phase: "liquid", fuel: "methanol", n: 6 },
  { acc: "PSI-159", phase: "gas", fuel: "propane", n: 60 },
];
const names = { "PSI-25": "BASS-II", "PSI-69": "FLEX", "PSI-159": "CFI-G", "PSI-101": "SAME-R" };
const run = (over: Partial<Parameters<typeof buildFunnel>[0]>) => {
  const input = { clusters, fuels, o2: 0.21, p: 101.3, focus: "solid" as const, material: null, gravity: "orbit" as const, ...over };
  const f = buildFunnel(input);
  return { f, text: describeFunnel(f, input, names), counts: f.steps.map((s) => s.n) };
};

describe("where the evidence runs out", () => {
  it("counts down step by step and never goes back up", () => {
    const { counts, f } = run({});
    expect(counts).toEqual([177, 111, 70, 50, 50, 50]);
    expect(f.stop).toBeNull();
  });

  it("stops at oxygen when no test of the material reached the cabin's oxygen", () => {
    const { f, text } = run({ o2: 0.34, p: 56.5, material: materialById("fabric") });
    expect(f.stop?.id).toBe("oxygen");
    expect(f.closest).toEqual({ acc: "PSI-25", o2: 0.21, p: 101.3 });
    expect(text.verdict).toBe("No test of cotton fabric was run near 34% oxygen. The closest ran at 21%, in BASS-II.");
  });

  it("stops at pressure when the oxygen matches but the pressure does not", () => {
    const { f, text } = run({ o2: 0.34, p: 56.5, focus: "liquid" });
    expect(f.stop?.id).toBe("air");
    expect(text.verdict).toContain("6 tests of a liquid match the oxygen");
    expect(text.verdict).toContain("FLEX, ran at 71 kPa");
  });

  it("stops at gravity on the Moon even when the air matches", () => {
    const { f, text } = run({ o2: 0.34, p: 56.5, focus: "gas", gravity: "moon" });
    expect(f.stop?.id).toBe("gravity");
    expect(f.last.n).toBe(10);
    expect(text.verdict).toContain("every one ran weightless");
    expect(text.next).toContain("LUCI and FM2");
  });

  it("says so when a material has tests but none reports oxygen", () => {
    const { f, text } = run({ material: materialById("wire") });
    expect(f.stop?.id).toBe("oxygen-known");
    expect(text.verdict).toContain("29 tests of wire insulation");
  });

  it("never counts oxygen fed through a burner as cabin air", () => {
    const { counts } = run({ o2: 0.85, p: 101.3, focus: "gas" });
    expect(counts.slice(3)).toEqual([0, 0, 0]);
  });
});
