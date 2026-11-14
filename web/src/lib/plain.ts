import { MATERIALS } from "@flamelens/shared/materials";

/**
 * One experiment in plain words. The experiments pages are read by people who are not
 * combustion scientists, so every label here is one a high-school reader knows. Nothing is
 * invented: each line is a rewording of a field the pipeline already checked.
 */

type Counted = { name: string; records: number };
type Stats = { records: number; tests: number; sessions: number; envelopes: number; datasets: number; fuels: Counted[] };
export type PlainSource = {
  short: string;
  expansion: string;
  platform: string;
  fuelPhases: string[];
  emulates?: { phases: string[] } | null;
  stats: Stats;
};

export type Fact = { label: string; value: string; note: string };

/** The name spelled out, without the programme in brackets. The short name stays where the full one is a sentence. */
export function plainName({ short, expansion }: { short: string; expansion: string }): string {
  const full = expansion.replace(/\s*\([^)]*\)\s*$/, "").trim();
  return full && full.length <= 48 ? full : short;
}

const PLACES: Record<string, { value: string; note: string }> = {
  ISS: { value: "On the space station", note: "In orbit, where everything is weightless" },
  Cygnus: { value: "In a cargo ship", note: "After it left the space station, with no crew aboard" },
  Computational: { value: "On a computer", note: "A computer study, not a new flight test" },
  "Ground laboratory": { value: "In a laboratory on Earth", note: "Not flown in space" },
};

export function place(platform: string): { value: string; note: string } {
  return PLACES[platform] ?? { value: platform, note: "" };
}

const PHASE: Record<string, { value: string; fallback: string }> = {
  solid: { value: "Solid materials", fallback: "The things a cabin is made of" },
  liquid: { value: "Liquid fuel", fallback: "One small droplet at a time" },
  gas: { value: "Gas", fallback: "Fed through a small burner" },
};

/** The name a cabin designer would use for a material; chemical names of gases and liquids stay as they are. */
function fuelName(name: string): string {
  return MATERIALS.find((m) => m.match.includes(name))?.label.toLowerCase() ?? name;
}

function listed(names: string[]): string {
  const unique = [...new Set(names)];
  const shown = unique.slice(0, 3);
  const head = shown.length > 1 ? `${shown.slice(0, -1).join(", ")} and ${shown.at(-1)}` : shown[0];
  return unique.length > 3 ? `${shown.join(", ")} and ${unique.length - 3} more` : head;
}

export function burned(source: PlainSource): { value: string; note: string } {
  const phases = source.fuelPhases;
  if (phases.length === 0) return { value: "Nothing was burned", note: "It tested an instrument, not a flame" };
  const value = phases.map((p) => PHASE[p]?.value ?? p).join(" and ");
  const fuels = [...source.stats.fuels].sort((a, b) => b.records - a.records).map((f) => fuelName(f.name));
  let note = fuels.length ? capital(listed(fuels)) : (PHASE[phases[0]]?.fallback ?? "");
  if (source.emulates?.phases.length) note += `. The gas stood in for ${source.emulates.phases.join(" and ")} fuels`;
  return { value, note };
}

/** How much there is to read, in the unit NASA's table uses for this experiment. */
export function amount(stats: Stats): { value: string; note: string } {
  const n = (count: number, one: string, many: string) => `${count.toLocaleString("en-US")} ${count === 1 ? one : many}`;
  if (stats.tests > 0 && stats.tests === stats.records) return { value: n(stats.tests, "test", "tests"), note: "Each one is a row in NASA's table" };
  if (stats.sessions > 0) return { value: n(stats.sessions, "test day", "test days"), note: "NASA's table lists days, each with several flames" };
  if (stats.records > 0) return { value: n(stats.records, "table row", "table rows"), note: "NASA's table groups the tests, so one row can hold several" };
  return { value: "No test table", note: "NASA's archive holds its report, not a table of tests" };
}

/** The four facts at the top of an experiment's page. */
export function facts(source: PlainSource): Fact[] {
  return [
    { label: "What burned", ...burned(source) },
    { label: "Where", ...place(source.platform) },
    { label: "How much data", ...amount(source.stats) },
  ];
}

/** NASA's three fire-safety jobs, said the way a visitor would say them. */
export const JOBS = [
  { id: "prevention", label: "Stopping a fire from starting", help: "Which materials burn, and in what air" },
  { id: "detection", label: "Noticing a fire early", help: "What smoke looks like to a detector" },
  { id: "suppression", label: "Putting a fire out", help: "What makes a flame go out" },
] as const;

export const STRENGTH = ["Not an aim", "Touches on it", "A clear part", "A main aim"] as const;

/** How close the experiment is to spacecraft fire safety, in NASA's own grading. */
export const LEVEL: Record<number, string> = {
  3: "A spacecraft fire-safety study",
  2: "Supports fire safety",
  1: "Basic flame science",
};

const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
