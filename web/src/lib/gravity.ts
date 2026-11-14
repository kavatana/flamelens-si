/**
 * Gravity, as data: where NASA's archive has tests along the scale from weightless to
 * Earth, and what the same samples did at the two ends. One plain object, so the page, an
 * export and the SI all read the same thing. Pure counting; nothing here is a model.
 */
import type { Gravity } from "@flamelens/shared/materials";

/** The same sample burned weightless and at normal gravity, as NASA's table gives it. */
export type PairInput = {
  id: string;
  fuel: string;
  thickness: string | null;
  direction: string | null;
  sampleCm: number | null;
  orbitCm: number | null;
  earthCm: number | null;
  orbitRaw: string | null;
  earthRaw: string | null;
};

export type GravityStop = { id: Gravity | "earth"; name: string; g: string; tested: boolean; evidence: string; yours: boolean };
export type PairVerdict = "farther-on-earth" | "same" | "farther-weightless" | "no-figure";
export type GravityPairResult = {
  id: string;
  sample: string;
  detail: string;
  orbitCm: number | null;
  earthCm: number | null;
  orbitRaw: string | null;
  earthRaw: string | null;
  verdict: PairVerdict;
  /** The verdict in words. */
  says: string;
};
export type GravitySummary = {
  stops: GravityStop[];
  pairs: GravityPairResult[];
  /** The longest sample, in cm: the full length of every bar. */
  scaleCm: number;
  compared: number;
  fartherOnEarth: number;
  same: number;
  fartherWeightless: number;
  /** The finding in one sentence. */
  finding: string;
};

const SAYS: Record<PairVerdict, string> = {
  "farther-on-earth": "Burned farther on Earth",
  same: "No difference",
  "farther-weightless": "Burned farther weightless",
  "no-figure": "No single figure in NASA's table",
};

export function gravitySummary(pairs: PairInput[], gravity: Gravity): GravitySummary {
  const results = pairs.map((p): GravityPairResult => {
    const verdict: PairVerdict = p.orbitCm === null || p.earthCm === null ? "no-figure" : p.earthCm > p.orbitCm ? "farther-on-earth" : p.earthCm < p.orbitCm ? "farther-weightless" : "same";
    return {
      id: p.id,
      sample: p.fuel.replace(" (cotton/fiberglass)", ""),
      detail: [p.thickness && !/fig/i.test(p.thickness) ? p.thickness : null, p.direction ? `${p.direction} air` : null].filter(Boolean).join(", "),
      orbitCm: p.orbitCm,
      earthCm: p.earthCm,
      orbitRaw: p.orbitRaw,
      earthRaw: p.earthRaw,
      verdict,
      says: SAYS[verdict],
    };
  });
  const count = (v: PairVerdict) => results.filter((r) => r.verdict === v).length;
  const compared = results.length - count("no-figure");
  const fartherOnEarth = count("farther-on-earth");
  const same = count("same");
  const fartherWeightless = count("farther-weightless");
  const parts = [
    `In ${fartherOnEarth} of ${compared} pairs the flame travelled farther on Earth`,
    same > 0 ? `in ${same} it made no difference` : "",
    fartherWeightless > 0 ? `in ${fartherWeightless} it travelled farther weightless` : "",
  ].filter(Boolean);
  const finding = compared === 0 ? "NASA's table gives no pair of results to compare." : `${parts.length > 1 ? `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}` : parts[0]}.`;
  const stop = (id: GravityStop["id"], name: string, g: string, tested: boolean, evidence: string): GravityStop => ({ id, name, g, tested, evidence, yours: id === gravity });
  return {
    stops: [
      stop("orbit", "In orbit", "0 g, weightless", true, "Every flight test in the archive"),
      stop("moon", "The Moon", "0.17 g", false, "Nothing in the archive"),
      stop("mars", "Mars", "0.38 g", false, "Nothing in the archive"),
      stop("earth", "Earth", "1 g", true, `${pairs.length} samples, burned again on the ground`),
    ],
    pairs: results,
    scaleCm: Math.max(...pairs.map((p) => p.sampleCm ?? 0), 1),
    compared,
    fartherOnEarth,
    same,
    fartherWeightless,
    finding,
  };
}
