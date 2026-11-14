/**
 * Scenario scoring and gap analysis.
 *
 * Pure functions with no I/O, used on the server and in the browser, so the ranking can
 * update while the user drags the scenario across the evidence map.
 *
 * Every number the interface shows about "relevance" comes from this file, and every
 * constant below is listed on the Methods page. Nothing here is produced by a language model.
 */

export type Phase = "gas" | "liquid" | "solid";
export type Focus = Phase | "any";
export type PillarName = "prevention" | "detection" | "suppression";

/** A group of records from one investigation at identical conditions. */
export type Cluster = {
  acc: string;
  /** Oxygen mole fraction of the atmosphere (0 to 1). */
  o2: number;
  /** Total pressure in kPa, or null when the PSI table does not report it. */
  p: number | null;
  phase: Phase | null;
  /** What was burned, as the curated table names it. */
  fuel?: string | null;
  /** True when oxygen is the stream injected through the burner (inverse flames), not the ambient. */
  stream: boolean;
  /** True when pressure is not in the PSI table and was taken from the facility. */
  assumed: boolean;
  kind: "test" | "session" | "envelope";
  /** Number of records at these conditions. */
  n: number;
  /** One example record, for linking. */
  rid: string;
  label: string;
};

export type InvestigationFacts = {
  accession: string;
  short: string;
  relevanceLevel: number;
  fuelPhases: string[];
  emulates: string[];
  pillars: Record<PillarName, number>;
  tests: number;
  flamesInSessions: number;
  reportedVariables: number;
  publicationsWithDoi: number;
};

export type Weights = { conditions: number; relevance: number; fuel: number; function: number; data: number };

export type Scenario = {
  o2: number;
  p: number;
  focus: Focus;
  pillars: Record<PillarName, number>;
  weights: Weights;
};

export const DEFAULT_WEIGHTS: Weights = { conditions: 0.3, relevance: 0.2, fuel: 0.15, function: 0.15, data: 0.2 };

/**
 * How far apart two atmospheres can be and still count as comparable.
 * One "step" is 3 percentage points of oxygen, or a 25% change in pressure.
 */
export const O2_STEP = 0.03;
export const PRESSURE_STEP = Math.log(1.25);
/** Within 1 step: comparable conditions. Within 2 steps: nearby. */
export const COMPARABLE = 1;
export const NEARBY = 2;

/** A test with matching oxygen but unreported pressure earns half credit. */
export const UNKNOWN_PRESSURE_CREDIT = 0.5;
/** An envelope row lists conditions, not individual burns, so it counts for less than a test. */
export const KIND_WEIGHT: Record<Cluster["kind"], number> = { test: 1, session: 1, envelope: 0.5 };
/** Fuel-match score when an investigation's fuel is not the one in focus. */
export const FUEL_MISMATCH = 0.25;
/** Fuel-match score for a gas burner built to emulate the fuel in focus. */
export const FUEL_EMULATED = 0.7;

/** Distance between a cluster and the scenario, in steps. Null when oxygen is the only shared axis. */
export function distance(c: { o2: number; p: number | null }, s: { o2: number; p: number }): number {
  const dO2 = (c.o2 - s.o2) / O2_STEP;
  if (c.p === null) return Math.abs(dO2);
  const dP = Math.log(c.p / s.p) / PRESSURE_STEP;
  return Math.hypot(dO2, dP);
}

function kernel(d: number): number {
  return Math.exp(-(d * d) / 2);
}

export type ConditionsResult = {
  score: number;
  nearest: (Cluster & { d: number }) | null;
  comparable: number;
  nearby: number;
  /** True when the investigation has no usable oxygen value at all. */
  noData: boolean;
};

/** How well an investigation's own test conditions surround the scenario. */
export function conditionsScore(clusters: Cluster[], scenario: Scenario): ConditionsResult {
  const ambient = clusters.filter((c) => !c.stream);
  if (ambient.length === 0) return { score: 0, nearest: null, comparable: 0, nearby: 0, noData: true };

  let best = 0;
  let nearest: (Cluster & { d: number }) | null = null;
  let mass = 0;
  let comparable = 0;
  let nearby = 0;
  for (const c of ambient) {
    const d = distance(c, scenario);
    const k = kernel(d) * (c.p === null ? UNKNOWN_PRESSURE_CREDIT : 1);
    if (k > best) best = k;
    if (c.p !== null && (nearest === null || d < nearest.d)) nearest = { ...c, d };
    mass += k * c.n * KIND_WEIGHT[c.kind];
    if (c.p !== null && d <= COMPARABLE) comparable += c.n;
    if (c.p !== null && d <= NEARBY) nearby += c.n;
  }
  if (nearest === null) {
    // Oxygen only (pressure never reported): fall back to the closest oxygen level.
    for (const c of ambient) {
      const d = distance(c, scenario);
      if (nearest === null || d < nearest.d) nearest = { ...c, d };
    }
  }
  const coverage = 1 - Math.exp(-mass / 8);
  return { score: 0.65 * best + 0.35 * coverage, nearest, comparable, nearby, noData: false };
}

export function fuelScore(inv: InvestigationFacts, focus: Focus): number {
  if (focus === "any" || inv.fuelPhases.includes(focus)) return 1;
  if (inv.emulates.includes(focus)) return FUEL_EMULATED;
  return FUEL_MISMATCH;
}

export function functionScore(inv: InvestigationFacts, pillars: Record<PillarName, number>): number {
  const names: PillarName[] = ["prevention", "detection", "suppression"];
  const total = names.reduce((sum, n) => sum + pillars[n], 0);
  if (total === 0) return 0;
  return names.reduce((sum, n) => sum + pillars[n] * (inv.pillars[n] / 3), 0) / total;
}

/** How much there is to work with: itemized tests, reported variables, citable publications. */
export function dataScore(inv: InvestigationFacts): number {
  const burns = inv.tests + inv.flamesInSessions;
  const volume = Math.min(1, Math.log10(1 + burns) / Math.log10(1 + 500));
  const breadth = Math.min(1, inv.reportedVariables / 12);
  const papers = Math.min(1, inv.publicationsWithDoi / 20);
  return 0.5 * volume + 0.3 * breadth + 0.2 * papers;
}

export type Ranked = {
  accession: string;
  short: string;
  total: number;
  parts: Record<keyof Weights, number>;
  conditions: ConditionsResult;
};

export function rankInvestigations(
  investigations: InvestigationFacts[],
  clusters: Cluster[],
  scenario: Scenario,
): Ranked[] {
  const byAcc = new Map<string, Cluster[]>();
  for (const c of clusters) {
    const list = byAcc.get(c.acc);
    if (list) list.push(c);
    else byAcc.set(c.acc, [c]);
  }
  const w = scenario.weights;
  const weightSum = w.conditions + w.relevance + w.fuel + w.function + w.data || 1;

  return investigations
    .map((inv) => {
      const conditions = conditionsScore(byAcc.get(inv.accession) ?? [], scenario);
      const parts = {
        conditions: conditions.score,
        relevance: inv.relevanceLevel / 3,
        fuel: fuelScore(inv, scenario.focus),
        function: functionScore(inv, scenario.pillars),
        data: dataScore(inv),
      };
      const total =
        (100 *
          (w.conditions * parts.conditions +
            w.relevance * parts.relevance +
            w.fuel * parts.fuel +
            w.function * parts.function +
            w.data * parts.data)) /
        weightSum;
      return { accession: inv.accession, short: inv.short, total, parts, conditions };
    })
    .sort((a, b) => b.total - a.total || a.accession.localeCompare(b.accession));
}

export type PhaseGap = {
  phase: Phase;
  comparable: number;
  nearby: number;
  investigations: string[];
  nearest: (Cluster & { d: number }) | null;
};

/** For each fuel phase: how many tests sit near the scenario, and which one is closest. */
export function gapByPhase(clusters: Cluster[], scenario: { o2: number; p: number }): PhaseGap[] {
  const phases: Phase[] = ["solid", "liquid", "gas"];
  return phases.map((phase) => {
    let comparable = 0;
    let nearby = 0;
    let nearest: (Cluster & { d: number }) | null = null;
    const investigations = new Set<string>();
    for (const c of clusters) {
      if (c.phase !== phase || c.stream || c.p === null) continue;
      const d = distance(c, scenario);
      if (d <= COMPARABLE) {
        comparable += c.n;
        investigations.add(c.acc);
      }
      if (d <= NEARBY) nearby += c.n;
      if (nearest === null || d < nearest.d) nearest = { ...c, d };
    }
    return { phase, comparable, nearby, investigations: [...investigations].sort(), nearest };
  });
}

/** Oxygen partial pressure in kPa. */
export function partialPressure(o2: number, p: number): number {
  return o2 * p;
}
