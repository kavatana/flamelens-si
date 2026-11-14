/**
 * Where the evidence runs out for a cabin.
 *
 * Starting from every test in the archive, each step keeps only the tests that also match
 * one more thing about the cabin: what burns, the oxygen, the pressure, the gravity. The
 * first step that leaves nothing is the gap. Pure counting; nothing here is a model.
 */
import { kpa, pct } from "./format";
import { GRAVITY, type Gravity, type Material } from "./materials";
import { COMPARABLE, O2_STEP, distance, type Cluster, type Focus } from "./scoring";

/** How many test rows each experiment has of each fuel, counted from the tables. */
export type FuelRow = { acc: string; phase: string | null; fuel: string | null; n: number };

export type StepId = "all" | "fuel" | "oxygen-known" | "oxygen" | "air" | "gravity";
export type FunnelStep = { id: StepId; label: string; n: number; from: { acc: string; n: number }[] };
export type Funnel = {
  steps: FunnelStep[];
  /** The first step that leaves no test, or null when tests survive every step. */
  stop: FunnelStep | null;
  /** The last step that still had tests. */
  last: FunnelStep;
  /** The test nearest to the cabin among those that fell out at the gap. */
  closest: { acc: string; o2: number; p: number | null } | null;
  what: string;
};

export type FunnelInput = { clusters: Cluster[]; fuels: FuelRow[]; o2: number; p: number; focus: Focus; material: Material | null; gravity: Gravity };

const PHASE_WORDS: Record<string, { label: string; what: string }> = {
  solid: { label: "Burned a solid", what: "a solid" },
  liquid: { label: "Burned a liquid", what: "a liquid" },
  gas: { label: "Burned a gas", what: "a gas" },
};

function tally(items: { acc: string; n: number }[]): { n: number; from: { acc: string; n: number }[] } {
  const by = new Map<string, number>();
  for (const item of items) by.set(item.acc, (by.get(item.acc) ?? 0) + item.n);
  const from = [...by.entries()].map(([acc, n]) => ({ acc, n })).sort((a, b) => b.n - a.n);
  return { n: from.reduce((sum, f) => sum + f.n, 0), from };
}

export function buildFunnel({ clusters, fuels, o2, p, focus, material, gravity }: FunnelInput): Funnel {
  const wanted = (row: { phase: string | null; fuel?: string | null }) => (material ? material.match.includes(row.fuel ?? "") : focus === "any" ? true : row.phase === focus);
  const steps: FunnelStep[] = [{ id: "all", label: "Tests in NASA's archive", ...tally(fuels) }];
  const what = material ? material.label.toLowerCase() : focus === "any" ? "" : PHASE_WORDS[focus].what;
  if (material || focus !== "any") steps.push({ id: "fuel", label: material ? `Burned ${material.label.toLowerCase()}` : PHASE_WORDS[focus].label, ...tally(fuels.filter(wanted)) });

  // From here on a test needs an oxygen value for the air around it, so the count comes from the placed tests.
  const placed = clusters.filter((c) => !c.stream && wanted(c));
  const cap = (n: number) => Math.min(n, steps[steps.length - 1].n);
  const add = (id: StepId, label: string, items: Cluster[]) => {
    const t = tally(items);
    steps.push({ id, label, n: cap(t.n), from: t.from });
  };
  add("oxygen-known", "Report the oxygen in the air around the flame", placed);
  const nearOxygen = placed.filter((c) => Math.abs(c.o2 - o2) <= O2_STEP + 1e-9);
  add("oxygen", `Within 3 points of ${pct(o2)} oxygen`, nearOxygen);
  const nearAir = nearOxygen.filter((c) => c.p !== null && distance(c, { o2, p }) <= COMPARABLE);
  add("air", `And close to ${kpa(p)} pressure`, nearAir);
  add("gravity", gravity === "orbit" ? "Run weightless, like this cabin" : `Run at ${GRAVITY[gravity].noun}`, gravity === "orbit" ? nearAir : []);

  const stopAt = steps.findIndex((s) => s.n === 0);
  const stop = stopAt < 0 ? null : steps[stopAt];
  const last = stopAt < 0 ? steps[steps.length - 1] : steps[Math.max(0, stopAt - 1)];
  let closest: Funnel["closest"] = null;
  if (stop?.id === "oxygen" && placed.length) {
    const c = placed.reduce((best, x) => (Math.abs(x.o2 - o2) < Math.abs(best.o2 - o2) ? x : best));
    closest = { acc: c.acc, o2: c.o2, p: c.p };
  } else if (stop?.id === "air" && nearOxygen.length) {
    const known = nearOxygen.filter((c) => c.p !== null);
    if (known.length) {
      const c = known.reduce((best, x) => (distance(x, { o2, p }) < distance(best, { o2, p }) ? x : best));
      closest = { acc: c.acc, o2: c.o2, p: c.p };
    }
  }
  return { steps, stop, last, closest, what };
}

const tests = (n: number) => `${n.toLocaleString("en-US")} ${n === 1 ? "test" : "tests"}`;

/** The finding in one or two plain sentences, and the test that would do most to close the gap. */
export function describeFunnel(f: Funnel, input: Pick<FunnelInput, "o2" | "p" | "gravity">, names: Record<string, string>): { verdict: string; next: string } {
  const of = f.what ? ` of ${f.what}` : "";
  const subject = f.what || "a material";
  const where = `${pct(input.o2)} oxygen`;
  if (!f.stop) {
    return {
      verdict: `${tests(f.last.n)}${of} match this cabin's air, and ${f.last.n === 1 ? "it" : "all"} ran weightless, as this cabin is.`,
      next: "What can still differ is airflow, shape and thickness. Open a test to check them against your case.",
    };
  }
  switch (f.stop.id) {
    case "fuel":
      return { verdict: `NASA's archive holds no test${of}.`, next: `Any test of ${subject} in orbit would be the first in this archive.` };
    case "oxygen-known":
      return {
        verdict: `The archive has ${tests(f.last.n)}${of}, but none reports the oxygen in its air, so none can be matched to a cabin.`,
        next: "What would help most: the oxygen and pressure of those tests, which their tables in the archive do not list.",
      };
    case "oxygen": {
      const c = f.closest;
      const far = c ? ` The closest ran at ${pct(c.o2)}, in ${names[c.acc] ?? c.acc}.` : "";
      return { verdict: `No test${of} was run near ${where}.${far}`, next: `The test that would help most: ${subject} burned at about ${where}. It would be the first.` };
    }
    case "air": {
      const c = f.closest;
      const far = c && c.p !== null ? ` The nearest, from ${names[c.acc] ?? c.acc}, ran at ${kpa(c.p)}.` : "";
      return {
        verdict: `${tests(f.last.n)}${of} match the oxygen, but none is also close to ${kpa(input.p)}.${far}`,
        next: `The test that would help most: ${subject} at ${where} and ${kpa(input.p)}.`,
      };
    }
    default:
      return {
        verdict: `${tests(f.last.n)}${of} match this cabin's air, but every one ran weightless. None was run at ${GRAVITY[input.gravity].noun}.`,
        next: `The tests that would help most: the same ones at ${GRAVITY[input.gravity].noun}. NASA expects such data to reach its archive from two experiments, LUCI and FM2.`,
      };
  }
}
