import { describe, expect, it } from "vitest";
import {
  COMPARABLE,
  DEFAULT_WEIGHTS,
  FUEL_EMULATED,
  FUEL_MISMATCH,
  conditionsScore,
  dataScore,
  distance,
  fuelScore,
  functionScore,
  gapByPhase,
  rankInvestigations,
  type Cluster,
  type InvestigationFacts,
  type Scenario,
} from "./scoring";

const cluster = (over: Partial<Cluster> = {}): Cluster => ({
  acc: "PSI-1",
  o2: 0.21,
  p: 101.325,
  phase: "solid",
  stream: false,
  assumed: false,
  kind: "test",
  n: 1,
  rid: "PSI-1/t/1",
  label: "1",
  ...over,
});

const facts = (over: Partial<InvestigationFacts> = {}): InvestigationFacts => ({
  accession: "PSI-1",
  short: "One",
  relevanceLevel: 3,
  fuelPhases: ["solid"],
  emulates: [],
  pillars: { prevention: 3, detection: 0, suppression: 0 },
  tests: 100,
  flamesInSessions: 0,
  reportedVariables: 6,
  publicationsWithDoi: 5,
  ...over,
});

const scenario = (over: Partial<Scenario> = {}): Scenario => ({
  o2: 0.34,
  p: 56.5,
  focus: "solid",
  pillars: { prevention: 1, detection: 1, suppression: 1 },
  weights: DEFAULT_WEIGHTS,
  ...over,
});

describe("distance", () => {
  it("is zero at the scenario itself", () => {
    expect(distance({ o2: 0.34, p: 56.5 }, { o2: 0.34, p: 56.5 })).toBe(0);
  });

  it("counts 3 points of oxygen as one step", () => {
    expect(distance({ o2: 0.37, p: 56.5 }, { o2: 0.34, p: 56.5 })).toBeCloseTo(1, 6);
  });

  it("counts a 25% pressure change as one step, in either direction", () => {
    expect(distance({ o2: 0.34, p: 56.5 * 1.25 }, { o2: 0.34, p: 56.5 })).toBeCloseTo(1, 6);
    expect(distance({ o2: 0.34, p: 56.5 / 1.25 }, { o2: 0.34, p: 56.5 })).toBeCloseTo(1, 6);
  });

  it("uses oxygen alone when pressure is not reported", () => {
    expect(distance({ o2: 0.4, p: null }, { o2: 0.34, p: 56.5 })).toBeCloseTo(2, 6);
  });
});

describe("conditionsScore", () => {
  it("is highest for a test at the scenario and falls with distance", () => {
    const at = conditionsScore([cluster({ o2: 0.34, p: 56.5 })], scenario());
    const near = conditionsScore([cluster({ o2: 0.31, p: 56.5 })], scenario());
    const far = conditionsScore([cluster({ o2: 0.21, p: 101.325 })], scenario());
    expect(at.score).toBeGreaterThan(near.score);
    expect(near.score).toBeGreaterThan(far.score);
    expect(far.score).toBeLessThan(0.01);
  });

  it("rewards more tests at the same place, with diminishing returns", () => {
    const one = conditionsScore([cluster({ o2: 0.34, p: 56.5, n: 1 })], scenario()).score;
    const ten = conditionsScore([cluster({ o2: 0.34, p: 56.5, n: 10 })], scenario()).score;
    const thousand = conditionsScore([cluster({ o2: 0.34, p: 56.5, n: 1000 })], scenario()).score;
    expect(ten).toBeGreaterThan(one);
    expect(thousand).toBeLessThanOrEqual(1);
    expect(thousand - ten).toBeLessThan(ten - one + 0.2);
  });

  it("ignores inverse-flame oxygen, which is not a cabin atmosphere", () => {
    const result = conditionsScore([cluster({ o2: 0.34, p: 56.5, stream: true })], scenario());
    expect(result).toMatchObject({ score: 0, noData: true });
  });

  it("gives half credit when oxygen matches but pressure is unknown", () => {
    const known = conditionsScore([cluster({ o2: 0.34, p: 56.5 })], scenario());
    const unknown = conditionsScore([cluster({ o2: 0.34, p: null })], scenario());
    expect(unknown.score).toBeGreaterThan(0);
    expect(unknown.score).toBeLessThan(known.score * 0.6);
    expect(unknown.comparable).toBe(0);
    expect(unknown.nearest?.o2).toBe(0.34);
  });

  it("counts records within one and two steps", () => {
    const result = conditionsScore(
      [cluster({ o2: 0.34, p: 56.5, n: 3 }), cluster({ o2: 0.39, p: 56.5, n: 2 }), cluster({ o2: 0.21, p: 101, n: 9 })],
      scenario(),
    );
    expect(result.comparable).toBe(3);
    expect(result.nearby).toBe(5);
    expect(result.nearest?.d).toBe(0);
  });

  it("reports no data for an investigation without clusters", () => {
    expect(conditionsScore([], scenario())).toMatchObject({ score: 0, noData: true, nearest: null });
  });
});

describe("component scores", () => {
  it("matches fuel focus, emulation and mismatch", () => {
    expect(fuelScore(facts(), "solid")).toBe(1);
    expect(fuelScore(facts({ fuelPhases: ["gas"] }), "any")).toBe(1);
    expect(fuelScore(facts({ fuelPhases: ["gas"], emulates: ["solid"] }), "solid")).toBe(FUEL_EMULATED);
    expect(fuelScore(facts({ fuelPhases: ["gas"] }), "solid")).toBe(FUEL_MISMATCH);
  });

  it("weights the fire-safety functions by the scenario", () => {
    const inv = facts({ pillars: { prevention: 3, detection: 0, suppression: 0 } });
    expect(functionScore(inv, { prevention: 1, detection: 0, suppression: 0 })).toBe(1);
    expect(functionScore(inv, { prevention: 0, detection: 1, suppression: 0 })).toBe(0);
    expect(functionScore(inv, { prevention: 1, detection: 1, suppression: 1 })).toBeCloseTo(1 / 3, 6);
    expect(functionScore(inv, { prevention: 0, detection: 0, suppression: 0 })).toBe(0);
  });

  it("scores data richness between 0 and 1 and grows with tests", () => {
    const empty = dataScore(facts({ tests: 0, reportedVariables: 0, publicationsWithDoi: 0 }));
    const small = dataScore(facts({ tests: 10 }));
    const large = dataScore(facts({ tests: 5000, reportedVariables: 40, publicationsWithDoi: 90 }));
    expect(empty).toBe(0);
    expect(small).toBeGreaterThan(empty);
    expect(large).toBe(1);
  });
});

describe("rankInvestigations", () => {
  const invs = [
    facts({ accession: "PSI-1", short: "Far solids" }),
    facts({ accession: "PSI-2", short: "Near gas", fuelPhases: ["gas"], relevanceLevel: 1 }),
  ];
  const clusters = [
    cluster({ acc: "PSI-1", o2: 0.21, p: 101.325, n: 100 }),
    cluster({ acc: "PSI-2", o2: 0.34, p: 56.5, n: 100, phase: "gas" }),
  ];

  it("returns totals between 0 and 100, sorted high to low", () => {
    const ranked = rankInvestigations(invs, clusters, scenario());
    expect(ranked).toHaveLength(2);
    for (const r of ranked) {
      expect(r.total).toBeGreaterThanOrEqual(0);
      expect(r.total).toBeLessThanOrEqual(100);
    }
    expect(ranked[0].total).toBeGreaterThanOrEqual(ranked[1].total);
  });

  it("changes order when the user moves weight onto test conditions", () => {
    const onRelevance = rankInvestigations(
      invs,
      clusters,
      scenario({ weights: { conditions: 0, relevance: 1, fuel: 0, function: 0, data: 0 } }),
    );
    const onConditions = rankInvestigations(
      invs,
      clusters,
      scenario({ weights: { conditions: 1, relevance: 0, fuel: 0, function: 0, data: 0 } }),
    );
    expect(onRelevance[0].accession).toBe("PSI-1");
    expect(onConditions[0].accession).toBe("PSI-2");
  });

  it("does not divide by zero when every weight is zero", () => {
    const ranked = rankInvestigations(
      invs,
      clusters,
      scenario({ weights: { conditions: 0, relevance: 0, fuel: 0, function: 0, data: 0 } }),
    );
    expect(ranked.every((r) => r.total === 0)).toBe(true);
  });

  it("keeps an investigation with no records in the list", () => {
    const ranked = rankInvestigations([...invs, facts({ accession: "PSI-3", short: "Model", tests: 0 })], clusters, scenario());
    expect(ranked.find((r) => r.accession === "PSI-3")?.conditions.noData).toBe(true);
  });
});

describe("gapByPhase", () => {
  it("counts comparable tests per fuel phase and names the nearest", () => {
    const gaps = gapByPhase(
      [
        cluster({ acc: "PSI-A", phase: "gas", o2: 0.34, p: 56.5, n: 4 }),
        cluster({ acc: "PSI-B", phase: "solid", o2: 0.22, p: 101.325, n: 129 }),
        cluster({ acc: "PSI-C", phase: "solid", o2: 0.34, p: null, n: 5 }),
        cluster({ acc: "PSI-D", phase: "gas", o2: 0.34, p: 56.5, n: 50, stream: true }),
      ],
      { o2: 0.34, p: 56.5 },
    );
    const solid = gaps.find((g) => g.phase === "solid")!;
    const gas = gaps.find((g) => g.phase === "gas")!;
    const liquid = gaps.find((g) => g.phase === "liquid")!;
    expect(gas).toMatchObject({ comparable: 4, investigations: ["PSI-A"] });
    expect(solid.comparable).toBe(0);
    expect(solid.nearest?.acc).toBe("PSI-B");
    expect(solid.nearest!.d).toBeGreaterThan(COMPARABLE);
    expect(liquid).toMatchObject({ comparable: 0, nearest: null });
  });
});
