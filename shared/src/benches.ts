/**
 * The Flame Lab's other benches: experiments whose tables record a result for each test,
 * replayed the same way as the droplet bench. For a setting, a bench finds the real tests
 * closest to it and reports what happened in them. It models nothing.
 *
 * A bench is described by data here, so adding one means adding a spec and a query.
 */

export type BenchRow = {
  id: string;
  label: string;
  /** Which sample or fuel this row is, matching a kind id in the spec. */
  kind: string;
  /** The conditions the visitor can set, by dimension id. Null when the table does not give it. */
  dims: Record<string, number | null>;
  /** How the test ended, as an outcome id in the spec, when the bench has outcomes. */
  cat: string | null;
  /** What was measured, by measure id. */
  measures: Record<string, number | null>;
  note: string | null;
};

/**
 * `fit` dimensions take their slider range from the chosen sample's own tests, because samples differ widely in size.
 * `tag` is the word that follows the value where a test is described in one line ("21% oxygen"); a `quiet` dimension is left out of that line at zero.
 */
export type Dim = { label: string; unit: string; step: number; log?: boolean; range: [number, number]; fit?: boolean; tick: number; format: (v: number) => string; stepWords: string; tag?: string; quiet?: boolean };
/** A kind may come from another experiment than the bench's main one. */
export type Kind = { id: string; label: string; note: string; dims: string[]; experiment?: string };
export type BenchId = "solid" | "droplet" | "gas";
export type Measure = { id: string; label: string; unit: string; format: (v: number) => string; help: string; log?: boolean };
export type BenchSpec = {
  id: BenchId;
  tab: string;
  accession: string;
  experiment: string;
  title: string;
  intro: string;
  kindLabel: string;
  kinds: Kind[];
  dims: Record<string, Dim>;
  outcomes: Record<string, { label: string; color: string }> | null;
  measures: Measure[];
  /** Which tests the measures are taken over, when not all of them (a flame that never lit has no burn time). */
  measured?: (row: BenchRow) => boolean;
  measuredNote?: string;
  presets: { label: string; note: string; values: Record<string, number> }[];
  caveat: string;
  /** What the visitor is looking at in NASA's video of a test. */
  footage: string;
  /** A question for the SI that fits this bench. */
  question: string;
  headline: (r: BenchResult) => string;
};

export type BenchResult = {
  status: "measured" | "close" | "untested";
  nearest: { row: BenchRow; dist: number } | null;
  near: { row: BenchRow; dist: number }[];
  counts: Record<string, number>;
  medians: Record<string, number | null>;
};

const pct = (v: number, digits = 1) => `${Number((v * 100).toFixed(digits))}%`;
const median = (xs: number[]) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
};

export const BENCHES: Record<BenchId, BenchSpec> = {
  solid: {
    id: "solid",
    tab: "Plastic and fabric",
    accession: "PSI-25",
    experiment: "BASS-II",
    title: "A plastic or fabric sample",
    intro: "On the space station, BASS-II burned small samples of acrylic plastic and cotton fabric in a wind tunnel the size of a shoebox, then measured the air left in the sealed chamber.",
    kindLabel: "Sample",
    kinds: [
      { id: "rod", label: "Acrylic rod", note: "a solid plastic rod", dims: ["o2", "flow", "size"] },
      { id: "slab", label: "Acrylic slab", note: "a thick plastic sheet", dims: ["o2", "flow", "thick"] },
      { id: "film", label: "Acrylic film", note: "a thin plastic sheet", dims: ["o2", "flow", "thick"] },
      { id: "fabric", label: "Cotton fabric", note: "cotton and fiberglass", dims: ["o2", "flow"] },
    ],
    dims: {
      o2: { label: "Oxygen in the air at the start", unit: "", step: 0.01, range: [0.13, 0.23], tick: 0.001, format: (v) => pct(v), stepWords: "1 point of oxygen", tag: "oxygen" },
      flow: { label: "Speed of the air past the sample", unit: " cm/s", step: 5, range: [0, 30], tick: 0.5, format: (v) => v.toFixed(v < 10 && v % 1 ? 1 : 0), stepWords: "5 cm/s of air speed", tag: "air" },
      size: { label: "Rod diameter", unit: " mm", step: Math.log(1.25), log: true, range: [5, 42], fit: true, tick: 0.1, format: (v) => v.toFixed(1), stepWords: "a 25% change in size", tag: "wide" },
      thick: { label: "Sheet thickness", unit: " mm", step: Math.log(1.5), log: true, range: [0.05, 6], fit: true, tick: 0.01, format: (v) => v.toFixed(2), stepWords: "a 50% change in thickness", tag: "thick" },
    },
    outcomes: {
      out: { label: "The flame went out", color: "#2a78d6" },
      blown: { label: "Blown out by the air", color: "#7a52c7" },
      fan: { label: "Burned until the fan stopped", color: "#eb6834" },
      all: { label: "Burned the whole sample", color: "#c2410c" },
    },
    measures: [
      { id: "co", label: "Carbon monoxide left in the air", unit: " ppm", format: (v) => (v < 10 ? v.toFixed(1) : v.toFixed(0)), help: "A poisonous gas made when something burns without enough oxygen. Parts per million of the chamber air after the test.", log: true },
      { id: "used", label: "Oxygen used up", unit: " points", format: (v) => v.toFixed(1), help: "How far the oxygen in the chamber fell during the test, in percentage points." },
      { id: "co2", label: "Carbon dioxide left in the air", unit: "%", format: (v) => v.toFixed(2), help: "Share of the chamber air after the test." },
    ],
    presets: [
      { label: "Station air", note: "21% oxygen", values: { o2: 0.21 } },
      { label: "Thin on oxygen", note: "17% oxygen", values: { o2: 0.17 } },
      { label: "Richest tested", note: "22.2% oxygen", values: { o2: 0.222 } },
    ],
    caveat: "BASS-II lowered the oxygen and never raised it above 22.2%, so a Moon habitat's air cannot be set here: no solid was burned in it. How each test ended was read from NASA's own table and report by an SI tool; no person has checked those readings yet.",
    footage: "The numbers along the top of the picture are the rig's own display. NASA's ReadMe gives AIR as the speed of the air in the duct, in cm/s.",
    question: "What happens to a flame when the airflow stops?",
    headline: (r) => {
      const co = r.medians.co;
      const n = r.near.length;
      const which = r.status === "untested" ? "NASA's nearest test" : n === 1 ? "the one nearby test" : `the ${n} nearby tests`;
      // What happened to the flame comes first, where NASA's files say.
      const ended = Object.values(r.counts).reduce((a, b) => a + b, 0);
      const out = (r.counts.out ?? 0) + (r.counts.blown ?? 0);
      if (ended > 0 && r.status !== "untested") return out === 0 ? `In ${which}, the flame kept burning until the fan stopped or the sample was gone.` : `In ${out} of ${ended} nearby ${ended === 1 ? "test" : "tests"} with a known ending, the flame went out or was blown out.`;
      return co === null ? `The table gives no carbon monoxide reading for ${which}.` : `After ${which}, the chamber air held ${r.status === "untested" || n === 1 ? "" : "a middle value of "}${co < 10 ? co.toFixed(1) : co.toFixed(0)} parts per million of carbon monoxide.`;
    },
  },
  droplet: {
    id: "droplet",
    tab: "Fuel droplet",
    accession: "PSI-69",
    experiment: "FLEX",
    title: "One droplet of fuel",
    intro: "On the space station, FLEX and CFI hung one drop of fuel on a hair-thin fibre inside a sealed chamber, lit it, and followed it until the flame went out or the fuel was gone.",
    kindLabel: "Fuel",
    kinds: [
      { id: "methanol", label: "Methanol", note: "an alcohol", dims: ["o2", "p", "co2", "he"] },
      { id: "n-heptane", label: "Heptane", note: "close to petrol", dims: ["o2", "p", "co2", "he"] },
      { id: "dodecane", label: "Dodecane", note: "close to diesel", dims: ["o2", "p", "he"], experiment: "CFI" },
      { id: "farnesane", label: "Farnesane", note: "a jet biofuel", dims: ["o2", "p", "he"], experiment: "CFI" },
    ],
    dims: {
      o2: { label: "Oxygen in the chamber", unit: "", step: 0.03, range: [0.1, 0.4], tick: 0.005, format: (v) => pct(v), stepWords: "3 points of oxygen", tag: "oxygen" },
      p: { label: "Pressure", unit: " kPa", step: Math.log(1.25), log: true, range: [45, 520], fit: true, tick: 0.5, format: (v) => v.toFixed(0), stepWords: "a 25% change in pressure" },
      co2: { label: "Carbon dioxide added", unit: "", step: 0.1, range: [0, 0.7], tick: 0.01, format: (v) => pct(v, 0), stepWords: "10 points of carbon dioxide", tag: "CO₂", quiet: true },
      he: { label: "Helium added", unit: "", step: 0.1, range: [0, 0.6], tick: 0.01, format: (v) => pct(v, 0), stepWords: "10 points of helium", tag: "helium", quiet: true },
    },
    outcomes: {
      out: { label: "Went out with fuel left", color: "#2a78d6" },
      all: { label: "Burned all its fuel", color: "#eb6834" },
      broke: { label: "The droplet broke up", color: "#e8a13a" },
    },
    measures: [
      { id: "time", label: "How long it burned", unit: " s", format: (v) => (v < 10 ? v.toFixed(1) : v.toFixed(0)), help: "Seconds from ignition to the end of the flame." },
      { id: "k", label: "How fast the droplet shrank", unit: " mm²/s", format: (v) => v.toFixed(2), help: "The burning rate: how quickly the droplet's size falls while it burns." },
      { id: "ext", label: "Droplet left when the flame died", unit: " mm", format: (v) => v.toFixed(2), help: "The droplet's diameter at the moment the visible flame went out." },
    ],
    presets: [
      { label: "Space station", note: "21% oxygen, 101 kPa", values: { o2: 0.21, p: 101.3, co2: 0, he: 0 } },
      { label: "Pressurized rover", note: "26.5% oxygen, 70.3 kPa", values: { o2: 0.265, p: 70.3, co2: 0, he: 0 } },
      { label: "Lunar habitat", note: "34% oxygen, 56.5 kPa", values: { o2: 0.34, p: 56.5, co2: 0, he: 0 } },
    ],
    caveat: "Carbon dioxide and helium are the gases NASA added to see how much it takes to put a flame out. FLEX's table records how each droplet ended. For CFI's dodecane and farnesane, NASA's files give how fast the droplet shrank and its size when the flame died, but not how the test ended. A fuel droplet is not a burning material, and all of this ran weightless.",
    footage: "This is NASA's own recording of the test, sent down from the station. The droplet hangs at the centre; its flame is the faint ball around it.",
    question: "How did the FLEX droplet tests end?",
    headline: (r) => {
      const n = r.near.length;
      const ended = (r.counts.out ?? 0) + (r.counts.all ?? 0) + (r.counts.broke ?? 0);
      if (ended === 0) return "NASA's table gives the air these droplets burned in, not how they ended. Watch the recording.";
      const out = r.counts.out ?? 0;
      if (r.status === "untested") return out ? "In NASA's nearest test the flame went out with fuel still left." : r.counts.all ? "In NASA's nearest test the droplet burned all its fuel." : "In NASA's nearest test the droplet broke up.";
      if (out === 0) return n === 1 ? "The one nearby droplet did not go out by itself." : `None of the ${n} nearby droplets went out by itself.`;
      return `In ${out} of ${n} nearby ${n === 1 ? "test" : "tests"}, the flame went out with fuel still left.`;
    },
  },
  gas: {
    id: "gas",
    tab: "Gas flame",
    accession: "PSI-159",
    experiment: "CFI-G",
    title: "A gas flame",
    intro: "In CFI-G, a burner the size of a marble fed gas into a sealed chamber on the space station, making a ball-shaped flame. Each test records whether the flame lit and how it ended.",
    kindLabel: "Gas",
    kinds: [
      { id: "n-butane", label: "Butane", note: "lighter fuel", dims: ["o2", "p"] },
      { id: "propane", label: "Propane", note: "camping gas", dims: ["o2", "p"] },
      { id: "ethane", label: "Ethane", note: "in natural gas", dims: ["o2", "p"] },
    ],
    dims: {
      o2: { label: "Oxygen in the chamber", unit: "", step: 0.03, range: [0.18, 0.42], tick: 0.005, format: (v) => pct(v), stepWords: "3 points of oxygen", tag: "oxygen" },
      p: { label: "Pressure", unit: " kPa", step: Math.log(1.25), log: true, range: [45, 310], tick: 0.5, format: (v) => v.toFixed(0), stepWords: "a 25% change in pressure" },
    },
    outcomes: {
      self: { label: "Lit, then went out by itself", color: "#2a78d6" },
      flow: { label: "Burned until the gas was shut off", color: "#eb6834" },
      lit: { label: "Lit; ending not recorded", color: "#e8a13a" },
      none: { label: "Did not light", color: "#8b929b" },
    },
    measures: [
      { id: "time", label: "How long it burned", unit: " s", format: (v) => (v < 10 ? v.toFixed(1) : v.toFixed(0)), help: "Seconds from ignition to the end of the flame." },
      { id: "temp", label: "Hottest the burner got", unit: " °C", format: (v) => v.toFixed(0), help: "Peak temperature of the burner during the test." },
    ],
    measured: (row) => row.cat !== "none",
    measuredNote: "Taken over the nearby tests that lit.",
    presets: [
      { label: "Space station", note: "21% oxygen, 101 kPa", values: { o2: 0.21, p: 101.3 } },
      { label: "Pressurized rover", note: "26.5% oxygen, 70.3 kPa", values: { o2: 0.265, p: 70.3 } },
      { label: "Lunar habitat", note: "34% oxygen, 56.5 kPa", values: { o2: 0.34, p: 56.5 } },
    ],
    caveat: "These are the tests where the oxygen was in the chamber air. CFI-G also ran inside-out flames, with oxygen fed through the burner at up to 85%; those are not cabin air and are left out here. A gas flame on a burner is not a burning material, and all of this ran weightless.",
    footage: "This is NASA's full recording of the test as it was sent down from the station. The flame is the glowing ball at the tip of the burner.",
    question: "Has anything been tested at 34% oxygen?",
    headline: (r) => {
      const n = r.near.length;
      const lit = n - (r.counts.none ?? 0);
      const self = r.counts.self ?? 0;
      if (r.status === "untested") return lit ? `NASA's nearest test lit${self ? " and then went out by itself" : ""}.` : "NASA's nearest test did not light.";
      if (lit === 0) return n === 1 ? "The one nearby test did not light." : `None of the ${n} nearby tests lit.`;
      const ending = !self ? "" : self === 1 ? `, and ${lit === 1 ? "it" : "1"} went out by itself` : `, and ${self === lit ? "all" : self} went out by themselves`;
      return `${lit} of ${n} nearby ${n === 1 ? "test" : "tests"} lit${ending}.`;
    },
  },
};

export const CLOSE = 1;
export const NEAR = 2;

export function benchDistance(spec: BenchSpec, kind: Kind, row: BenchRow, setting: Record<string, number>): number {
  return Math.hypot(
    ...kind.dims.map((id) => {
      const dim = spec.dims[id];
      const value = row.dims[id];
      if (value === null || value === undefined) return 1;
      return dim.log ? Math.log(value / setting[id]) / dim.step : (value - setting[id]) / dim.step;
    }),
  );
}

/** The real tests nearest to a setting, and the middle of what was measured in them. */
export function lookupBench(spec: BenchSpec, kind: Kind, rows: BenchRow[], setting: Record<string, number>): BenchResult {
  const ranked = rows
    .filter((row) => row.kind === kind.id)
    .map((row) => ({ row, dist: benchDistance(spec, kind, row, setting) }))
    .sort((a, b) => a.dist - b.dist);
  const nearest = ranked[0] ?? null;
  const status = !nearest || nearest.dist > NEAR ? "untested" : nearest.dist <= CLOSE ? "measured" : "close";
  // With nothing within two steps, the bench shows the one nearest real test and says it is a different setting.
  const near = status === "untested" ? ranked.slice(0, 1) : ranked.filter((x) => x.dist <= NEAR).slice(0, 12);
  const counts: Record<string, number> = {};
  for (const { row } of near) if (row.cat) counts[row.cat] = (counts[row.cat] ?? 0) + 1;
  const counted = spec.measured ? near.filter(({ row }) => spec.measured!(row)) : near;
  const medians = Object.fromEntries(spec.measures.map((m) => [m.id, median(counted.flatMap(({ row }) => (row.measures[m.id] === null || row.measures[m.id] === undefined ? [] : [row.measures[m.id]!])))]));
  return { status, nearest, near, counts, medians };
}

/** The lowest and highest value the tests of a kind cover, for each of its dimensions and measures. */
export function benchRanges(rows: BenchRow[], kindId: string, pick: (row: BenchRow) => Record<string, number | null>): Record<string, [number, number]> {
  const out: Record<string, [number, number]> = {};
  for (const row of rows) {
    if (row.kind !== kindId) continue;
    for (const [key, value] of Object.entries(pick(row))) {
      if (value === null || value === undefined) continue;
      out[key] = out[key] ? [Math.min(out[key][0], value), Math.max(out[key][1], value)] : [value, value];
    }
  }
  return out;
}
