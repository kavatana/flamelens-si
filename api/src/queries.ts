/**
 * Read access to the serving database.
 *
 * The data set only changes when the pipeline is re-run and the database re-seeded, so the web
 * caches what it reads here and prerenders its pages from it.
 */
import { asc, eq, isNotNull, sql } from "drizzle-orm";
import { db, schema } from "./db/client";
import { flowBandOf } from "@flamelens/shared/bands";
import type { BenchRow } from "@flamelens/shared/benches";
import type { FlowTest } from "@flamelens/shared/flow-map";
import type { FuelRow } from "@flamelens/shared/funnel";
import type { Cluster, InvestigationFacts, Phase } from "@flamelens/shared/scoring";
import type { Environment, FamilyRef, EarthTheme, ScenarioPreset, StatedGap } from "@flamelens/shared/types";

const { investigations, publications, sourceTables, variables, records, recordValues, qualityFindings, reference, interpretations, footage } = schema;

export async function getInvestigations() {
  return db.select().from(investigations).orderBy(asc(investigations.sort));
}

export type Investigation = Awaited<ReturnType<typeof getInvestigations>>[number];

export async function getInvestigation(accession: string) {
  const [inv] = await db.select().from(investigations).where(eq(investigations.accession, accession));
  if (!inv) return null;
  const [pubs, tables, recs] = await Promise.all([
    db.select().from(publications).where(eq(publications.accession, accession)).orderBy(asc(publications.seq)),
    db.select().from(sourceTables).where(eq(sourceTables.accession, accession)).orderBy(asc(sourceTables.fileName)),
    db.select().from(records).where(eq(records.accession, accession)).orderBy(asc(records.tableFile), asc(records.row)),
  ]);
  return { inv, pubs, tables, recs };
}

export async function getFacts(): Promise<InvestigationFacts[]> {
  const rows = await getInvestigations();
  return rows.map((r) => ({
    accession: r.accession,
    short: r.short,
    relevanceLevel: r.relevanceLevel,
    fuelPhases: r.fuelPhases,
    emulates: r.emulates?.phases ?? [],
    pillars: {
      prevention: r.pillars.prevention.score,
      detection: r.pillars.detection.score,
      suppression: r.pillars.suppression.score,
    },
    tests: r.stats.tests,
    flamesInSessions: r.stats.flames_in_sessions,
    reportedVariables: r.stats.variables.length,
    publicationsWithDoi: r.stats.publications_with_doi,
  }));
}

/**
 * Records grouped by investigation and identical conditions, for the evidence map and scoring.
 * A session or envelope row that lists several oxygen or pressure levels contributes one
 * cluster per combination of levels.
 */
export async function getClusters(): Promise<Cluster[]> {
  const rows = await db
    .select({
      id: records.id,
      acc: records.accession,
      kind: records.kind,
      label: records.label,
      o2Min: records.o2Min,
      o2Max: records.o2Max,
      o2Levels: records.o2Levels,
      o2Basis: records.o2Basis,
      pMin: records.pressureMin,
      pMax: records.pressureMax,
      pLevels: records.pressureLevels,
      pQuality: records.pressureQuality,
      phase: records.fuelPhase,
      fuel: records.fuel,
    })
    .from(records)
    .where(isNotNull(records.o2Min))
    .orderBy(asc(records.accession), asc(records.row));

  const groups = new Map<string, Cluster>();
  for (const r of rows) {
    if (r.kind === "dataset") continue;
    const o2s = r.o2Levels?.length ? r.o2Levels : [(r.o2Min! + r.o2Max!) / 2];
    const ps: (number | null)[] =
      r.pMin === null ? [null] : r.pLevels?.length ? r.pLevels : [Math.sqrt(r.pMin * r.pMax!)];
    for (const rawO2 of o2s) {
      for (const rawP of ps) {
        const o2 = Math.round(rawO2 * 1000) / 1000;
        const p = rawP === null ? null : Math.round(rawP * 2) / 2;
        const stream = r.o2Basis === "oxidizer stream";
        const assumed = r.pQuality === "assumed";
        const key = [r.acc, o2, p, r.phase, r.fuel, stream, assumed, r.kind].join("|");
        const existing = groups.get(key);
        if (existing) existing.n += 1;
        else
          groups.set(key, {
            acc: r.acc,
            o2,
            p,
            phase: (r.phase as Phase | null) ?? null,
            fuel: r.fuel,
            stream,
            assumed,
            kind: r.kind as Cluster["kind"],
            n: 1,
            rid: r.id,
            label: r.label,
          });
      }
    }
  }
  return [...groups.values()];
}

export type Reference = {
  environments: Environment[];
  scenarios: ScenarioPreset[];
  stated_gaps: StatedGap[];
  families: FamilyRef[];
  earth_context: { quote: string; source: string };
  earth_themes: EarthTheme[];
  value_quality: Record<string, number>;
  built_at: string;
};

export async function getReference(): Promise<Reference> {
  const rows = await db.select().from(reference);
  return Object.fromEntries(rows.map((r) => [r.key, r.data])) as Reference;
}

export async function getVariables() {
  return db.select().from(variables).orderBy(asc(variables.sort));
}

export async function getSourceTables() {
  return db.select().from(sourceTables).orderBy(asc(sourceTables.accession), asc(sourceTables.fileName));
}

export async function getQualityFindings() {
  return db.select().from(qualityFindings).orderBy(asc(qualityFindings.id));
}

/**
 * Variables that record something observed during or after a burn, as opposed to a condition
 * that was set beforehand. A row "has a result" when it carries at least one of these.
 */
export const RESULT_VARIABLES = [
  "ignited", "burn_time_s", "end_mode", "burning_rate_mm2_s", "extinction_diameter_mm",
  "spread_rate_mm_s", "spread_rate_1g_mm_s", "burn_length_cm", "burn_length_1g_cm", "cool_flame", "flame_color",
  "o2_fraction_final", "co2_fraction_final", "co_ppm_final", "peak_burner_temp_c", "mass_loss_rate_mg_min",
];

/** Every record with its hot columns, for the data explorer. */
export async function getExplorerRows() {
  return db
    .select({
      id: records.id,
      acc: records.accession,
      kind: records.kind,
      label: records.label,
      date: records.testDate,
      o2Min: records.o2Min,
      o2Max: records.o2Max,
      o2Quality: records.o2Quality,
      o2Basis: records.o2Basis,
      pMin: records.pressureMin,
      pMax: records.pressureMax,
      pQuality: records.pressureQuality,
      flowMin: records.flowMin,
      flowMax: records.flowMax,
      fuel: records.fuel,
      phase: records.fuelPhase,
      geometry: records.geometry,
      endMode: records.endMode,
      ignited: records.ignited,
      results: sql<number>`(select count(*)::int from ${recordValues} where ${recordValues.recordId} = ${records.id} and ${recordValues.variableId} in (${sql.join(RESULT_VARIABLES.map((v) => sql`${v}`), sql`, `)}))`,
    })
    .from(records)
    .orderBy(asc(records.accession), asc(records.tableFile), asc(records.row));
}

export type ExplorerRow = Awaited<ReturnType<typeof getExplorerRows>>[number];

/** One record with every value and its provenance. */
export async function getRecord(id: string) {
  const [rec] = await db.select().from(records).where(eq(records.id, id));
  if (!rec) return null;
  const values = await db
    .select({
      variable: recordValues.variableId,
      label: variables.label,
      unit: variables.unit,
      kind: variables.kind,
      grp: variables.grp,
      numMin: recordValues.numMin,
      numMax: recordValues.numMax,
      levels: recordValues.levels,
      text: recordValues.textValue,
      bool: recordValues.boolValue,
      approx: recordValues.approx,
      suspect: recordValues.suspect,
      raw: recordValues.raw,
      column: recordValues.sourceColumn,
      quality: recordValues.quality,
      note: recordValues.note,
      evidence: recordValues.evidence,
      evidenceSource: recordValues.evidenceSource,
    })
    .from(recordValues)
    .innerJoin(variables, eq(variables.id, recordValues.variableId))
    .where(eq(recordValues.recordId, id))
    .orderBy(asc(variables.sort));
  return { rec, values };
}

export type RecordDetail = NonNullable<Awaited<ReturnType<typeof getRecord>>>;

export async function getTotals() {
  const [row] = await db
    .select({
      records: sql<number>`count(*)::int`,
      tests: sql<number>`count(*) filter (where ${records.kind} = 'test')::int`,
      mappable: sql<number>`count(*) filter (where ${records.o2Min} is not null and ${records.pressureMin} is not null)::int`,
      withOxygen: sql<number>`count(*) filter (where ${records.o2Min} is not null)::int`,
    })
    .from(records);
  const [vals] = await db.select({ n: sql<number>`count(*)::int` }).from(recordValues);
  const [pubs] = await db.select({ n: sql<number>`count(*)::int` }).from(publications);
  const [bytes] = await db.select({ n: sql<number>`sum(${investigations.totalBytes})::float8` }).from(investigations);
  return { ...row, values: vals.n, publications: pubs.n, bytes: bytes.n };
}

export type Coverage = {
  investigations: number;
  tables: number;
  records: number;
  onMap: number;
  stream: number;
  oxygenOnly: number;
  noOxygen: number;
  /** Why records are missing from the map, per investigation. */
  absent: { accession: string; short: string; records: number; note: string }[];
  /** Investigations that have no itemized table in PSI at all. */
  noTable: { accession: string; short: string }[];
  gravity: { microgravity: number; normalGravityComparisons: number };
};

/** The coverage receipt: what is on the map, what is not, and why. */
export async function getCoverage(): Promise<Coverage> {
  const [invs, tables, rows] = await Promise.all([getInvestigations(), getSourceTables(), getExplorerRows()]);
  const short = new Map(invs.map((i) => [i.accession, i.short]));
  const note = new Map<string, string>();
  for (const t of tables) if (t.recordNote && !note.has(t.accession)) note.set(t.accession, t.recordNote);

  let onMap = 0;
  let stream = 0;
  let oxygenOnly = 0;
  let noOxygen = 0;
  const absent = new Map<string, number>();
  for (const r of rows) {
    if (r.o2Min === null) {
      noOxygen += 1;
      absent.set(r.acc, (absent.get(r.acc) ?? 0) + 1);
    } else if (r.o2Basis === "oxidizer stream") stream += 1;
    else if (r.pMin === null) oxygenOnly += 1;
    else onMap += 1;
  }
  const withRecords = new Set(rows.map((r) => r.acc));
  const [oneG] = await db
    .select({ n: sql<number>`count(distinct ${recordValues.recordId})::int` })
    .from(recordValues)
    .where(sql`${recordValues.variableId} in ('burn_length_1g_cm', 'spread_rate_1g_mm_s')`);

  return {
    investigations: invs.length,
    tables: tables.length,
    records: rows.length,
    onMap,
    stream,
    oxygenOnly,
    noOxygen,
    absent: [...absent.entries()]
      .map(([accession, records]) => ({ accession, short: short.get(accession) ?? accession, records, note: note.get(accession) ?? "" }))
      .sort((a, b) => b.records - a.records),
    noTable: invs.filter((i) => !withRecords.has(i.accession)).map((i) => ({ accession: i.accession, short: i.short })),
    gravity: { microgravity: rows.filter((r) => r.kind !== "dataset").length, normalGravityComparisons: oneG.n },
  };
}

export type Briefing = {
  summary: string;
  points: { text: string; accession: string; quote: string; source: string }[];
  caution: string;
};

/** SI briefings for the scenario presets, keyed by preset id. */
export async function getBriefings(): Promise<Record<string, { body: Briefing; model: string }>> {
  const rows = await db.select().from(interpretations);
  return Object.fromEntries(
    rows.filter((r) => r.key.startsWith("scenario:")).map((r) => [r.key.slice("scenario:".length), { body: r.body as Briefing, model: r.model }]),
  );
}

export type Variation = {
  id: string;
  label: string;
  unit: string;
  kind: string;
  rows: number;
  distinct: number;
  min: number | null;
  max: number | null;
  sample: string | null;
  /** True when the values were not in the PSI table and were assumed from the facility. */
  assumed: boolean;
};

/** For one investigation: which variables change from row to row, and which are the same in every row. */
export async function getVariation(accession: string): Promise<Variation[]> {
  const rows = await db.execute(sql`
    select v.id, v.label, v.unit, v.kind,
           count(*)::int as rows,
           count(distinct coalesce(rv.text_value, rv.bool_value::text, rv.num_min::text || '..' || rv.num_max::text))::int as "distinct",
           min(rv.num_min) as min, max(rv.num_max) as max,
           min(coalesce(rv.text_value, case when rv.bool_value then 'yes' when rv.bool_value = false then 'no' end)) as sample,
           bool_or(rv.quality = 'assumed') as assumed
    from record_value rv
    join record r on r.id = rv.record_id
    join variable v on v.id = rv.variable_id
    where r.accession = ${accession} and not rv.suspect and v.grp <> 'context'
    group by v.id, v.label, v.unit, v.kind, v.sort
    order by v.sort`);
  return rows as unknown as Variation[];
}

const numberOf = (variable: string) =>
  sql<number | null>`(select ${recordValues.numMin} from ${recordValues} where ${recordValues.recordId} = ${records.id} and ${recordValues.variableId} = ${variable})`;
const rawOf = (variable: string) =>
  sql<string | null>`(select ${recordValues.raw} from ${recordValues} where ${recordValues.recordId} = ${records.id} and ${recordValues.variableId} = ${variable})`;

export type Droplet = {
  id: string;
  label: string;
  date: string | null;
  fuel: string;
  /** Oxygen, carbon dioxide and helium as fractions of the atmosphere. */
  o2: number;
  co2: number;
  he: number;
  /** Total pressure, kPa. */
  p: number;
  /** Starting droplet diameter, mm. */
  size: number | null;
  /** Burning-rate constant, mm² per second. */
  k: number | null;
  /** Seconds from ignition to the end of the burn. */
  time: number | null;
  /** Droplet diameter when the flame went out, mm. */
  ext: number | null;
  end: string;
};

/** The FLEX droplet tests, one row per test, for the Flame Lab. Rows without oxygen, pressure or an outcome are left out. */
export async function getDroplets(): Promise<Droplet[]> {
  const rows = await db
    .select({
      id: records.id,
      label: records.label,
      date: records.testDate,
      fuel: records.fuel,
      o2: records.o2Min,
      p: records.pressureMin,
      end: records.endMode,
      co2: numberOf("co2_fraction"),
      he: numberOf("he_fraction"),
      size: numberOf("size_mm"),
      k: numberOf("burning_rate_mm2_s"),
      time: numberOf("burn_time_s"),
      ext: numberOf("extinction_diameter_mm"),
    })
    .from(records)
    .where(eq(records.accession, "PSI-69"))
    .orderBy(asc(records.row));
  return rows
    .filter((r) => r.fuel && r.end && r.o2 !== null && r.p !== null && r.p > 0)
    .map((r) => ({ ...r, fuel: r.fuel!, end: r.end!, o2: r.o2!, p: r.p!, co2: r.co2 ?? 0, he: r.he ?? 0 }));
}

export type GravityPair = {
  id: string;
  label: string;
  fuel: string;
  thickness: string | null;
  direction: string | null;
  sampleCm: number | null;
  /** How far the flame travelled, in cm, weightless and at normal gravity. Null when the table gives no number. */
  orbitCm: number | null;
  earthCm: number | null;
  /** NASA's own wording for each cell. */
  orbitRaw: string | null;
  earthRaw: string | null;
};

/**
 * Saffire-II samples that NASA also burned at normal gravity: the only rows in the archive
 * that give the same sample's result at 0 g and at 1 g. "Complete" is read as the full sample length.
 */
export async function getGravityPairs(): Promise<GravityPair[]> {
  const rows = await db
    .select({
      id: records.id,
      label: records.label,
      fuel: records.fuel,
      thickness: rawOf("sample_thickness_mm"),
      direction: sql<string | null>`(select ${recordValues.textValue} from ${recordValues} where ${recordValues.recordId} = ${records.id} and ${recordValues.variableId} = 'flow_direction')`,
      sampleCm: numberOf("sample_length_cm"),
      orbitCm: numberOf("burn_length_cm"),
      earthCm: numberOf("burn_length_1g_cm"),
      orbitRaw: rawOf("burn_length_cm"),
      earthRaw: rawOf("burn_length_1g_cm"),
    })
    .from(records)
    .where(eq(records.accession, "PSI-99"))
    .orderBy(asc(records.row));
  const whole = (raw: string | null, n: number | null, sample: number | null) => (n === null && raw && /^complete/i.test(raw.trim()) ? sample : n);
  return rows
    .filter((r) => r.earthRaw)
    .map((r) => ({ ...r, fuel: r.fuel ?? "", orbitCm: whole(r.orbitRaw, r.orbitCm, r.sampleCm), earthCm: whole(r.earthRaw, r.earthCm, r.sampleCm) }));
}

export type Trace = { label: string; short: string; value: number; raw: string; column: string; file: string; row: number; note: string };

/**
 * One repaired value with everything recorded about where it came from, shown on the
 * home page as an example of what every value carries. Null if the row is not found.
 */
export async function getTrace(): Promise<Trace | null> {
  const [row] = await db
    .select({ label: records.label, short: investigations.short, value: recordValues.numMin, raw: recordValues.raw, column: recordValues.sourceColumn, file: records.tableFile, row: records.row, note: recordValues.note })
    .from(recordValues)
    .innerJoin(records, eq(records.id, recordValues.recordId))
    .innerJoin(investigations, eq(investigations.accession, records.accession))
    .where(sql`${recordValues.recordId} = 'PSI-20/bre/5' and ${recordValues.variableId} = 'o2_fraction'`);
  return row && row.value !== null && row.note ? { ...row, value: row.value, note: row.note } : null;
}

/** How many itemized rows each experiment has of each fuel, for counting what the archive holds before any condition is applied. */
export async function getFuelRows(): Promise<FuelRow[]> {
  return db
    .select({ acc: records.accession, phase: records.fuelPhase, fuel: records.fuel, n: sql<number>`count(*)::int` })
    .from(records)
    .groupBy(records.accession, records.fuelPhase, records.fuel)
    .orderBy(asc(records.accession));
}

export type FlowRow = { acc: string; phase: string | null; fuel: string | null; band: number; n: number };
export type FlowCoverage = {
  /** Tests counted in each airflow band they ran at. A test that stepped through several speeds counts once in each. */
  cells: FlowRow[];
  /** Per experiment and fuel: how many tests there are, and how many list an air speed. */
  totals: { acc: string; phase: string | null; fuel: string | null; all: number; listed: number }[];
};

/** How fast the air moved in each test, counted by experiment, fuel and airflow band. */
export async function getFlowRows(): Promise<FlowCoverage> {
  const rows = await db
    .select({
      acc: records.accession,
      phase: records.fuelPhase,
      fuel: records.fuel,
      lo: records.flowMin,
      hi: records.flowMax,
      levels: sql<number[] | null>`(select ${recordValues.levels} from ${recordValues} where ${recordValues.recordId} = ${records.id} and ${recordValues.variableId} = 'flow_speed_cm_s')`,
    })
    .from(records)
    .where(sql`${records.kind} <> 'dataset'`);
  const cells = new Map<string, FlowRow>();
  const totals = new Map<string, FlowCoverage["totals"][number]>();
  for (const r of rows) {
    const key = [r.acc, r.phase, r.fuel].join("|");
    const total = totals.get(key) ?? { acc: r.acc, phase: r.phase, fuel: r.fuel, all: 0, listed: 0 };
    total.all += 1;
    totals.set(key, total);
    if (r.lo === null || r.hi === null) continue;
    total.listed += 1;
    const speeds = r.levels?.length ? r.levels : [r.lo, r.hi];
    for (const band of new Set(speeds.map(flowBandOf))) {
      const cell = cells.get(`${key}|${band}`);
      if (cell) cell.n += 1;
      else cells.set(`${key}|${band}`, { acc: r.acc, phase: r.phase, fuel: r.fuel, band, n: 1 });
    }
  }
  return { cells: [...cells.values()], totals: [...totals.values()] };
}

/** Solid-fuel tests that give both their oxygen and their air speed: the two conditions NASA names for flammability. */
export async function getSolidFlowTests(): Promise<FlowTest[]> {
  const flow = <T>(column: unknown) =>
    sql<T>`(select ${column} from ${recordValues} where ${recordValues.recordId} = ${records.id} and ${recordValues.variableId} = 'flow_speed_cm_s')`;
  const rows = await db
    .select({
      id: records.id,
      acc: records.accession,
      label: records.label,
      fuel: records.fuel,
      shape: records.geometry,
      o2Min: records.o2Min,
      o2Max: records.o2Max,
      lo: records.flowMin,
      hi: records.flowMax,
      levels: flow<number[] | null>(recordValues.levels),
      open: flow<boolean | null>(recordValues.approx),
      raw: flow<string | null>(recordValues.raw),
    })
    .from(records)
    .where(sql`${records.fuelPhase} = 'solid' and ${records.kind} = 'test' and ${records.o2Min} is not null and ${records.flowMin} is not null and coalesce(${records.o2Basis}, '') <> 'oxidizer stream'`)
    .orderBy(asc(records.accession), asc(records.row));
  return rows.map((r) => ({
    id: r.id,
    acc: r.acc,
    label: r.label,
    fuel: r.fuel,
    shape: r.shape,
    o2: (r.o2Min! + r.o2Max!) / 2,
    lo: r.lo!,
    hi: r.hi!,
    levels: r.levels && r.levels.length > 1 ? r.levels : null,
    open: Boolean(r.open),
    raw: (r.raw ?? "").replace(/\s+/g, " ").trim(),
  }));
}

const textOf = (variable: string) =>
  sql<string | null>`(select ${recordValues.textValue} from ${recordValues} where ${recordValues.recordId} = ${records.id} and ${recordValues.variableId} = ${variable})`;

/**
 * Rows for the Flame Lab's solid and gas benches: BASS-II samples with the gas left after
 * each burn, and CFI-G flames in chamber air with whether they lit and how they ended.
 */
/** How a plastic or fabric test ended, in the words of NASA's tables and reports, as the bench's outcome ids. */
const SOLID_ENDS: Record<string, string> = { extinction: "out", "self-extinguished": "out", blowoff: "blown", "flow terminated": "fan", "burned to completion": "all" };

export async function getBenchRows(): Promise<{ solid: BenchRow[]; droplet: BenchRow[]; gas: BenchRow[] }> {
  const [solids, gases, flex, cfi] = await Promise.all([
    db
      .select({
        id: records.id,
        label: records.label,
        fuel: records.fuel,
        geometry: records.geometry,
        o2: records.o2Min,
        o2End: numberOf("o2_fraction_final"),
        co: numberOf("co_ppm_final"),
        co2: numberOf("co2_fraction_final"),
        size: numberOf("size_mm"),
        thick: numberOf("sample_thickness_mm"),
        flow: numberOf("flow_speed_cm_s"),
        end: records.endMode,
      })
      .from(records)
      .where(eq(records.accession, "PSI-25"))
      .orderBy(asc(records.row)),
    db
      .select({
        id: records.id,
        label: records.label,
        fuel: records.fuel,
        basis: records.o2Basis,
        o2: records.o2Min,
        p: records.pressureMin,
        ignited: records.ignited,
        end: records.endMode,
        time: numberOf("burn_time_s"),
        temp: numberOf("peak_burner_temp_c"),
        colour: textOf("flame_color"),
      })
      .from(records)
      .where(eq(records.accession, "PSI-159"))
      .orderBy(asc(records.row)),
    getDroplets(),
    db
      .select({ id: records.id, label: records.label, fuel: records.fuel, o2: records.o2Min, p: records.pressureMin, he: numberOf("he_fraction"), k: numberOf("burning_rate_mm2_s"), ext: numberOf("extinction_diameter_mm") })
      .from(records)
      .where(eq(records.accession, "PSI-39"))
      .orderBy(asc(records.row)),
  ]);

  const shape: Record<string, string> = { "PMMA|rod": "rod", "PMMA|slab": "slab", "PMMA|thin film": "film", "SIBAL fabric (cotton/fiberglass)|fabric sheet": "fabric" };
  const solid = solids.flatMap((r): BenchRow[] => {
    const kind = shape[`${r.fuel}|${r.geometry}`];
    if (!kind || r.o2 === null) return [];
    // Oxygen that appears to rise, or to fall by more than five points, is a reading error in the table; leave it out.
    const used = r.o2End === null ? null : (r.o2 - r.o2End) * 100;
    return [{ id: r.id, label: r.label, kind, dims: { o2: r.o2, flow: r.flow, size: r.size, thick: r.thick }, cat: (r.end && SOLID_ENDS[r.end]) || null, measures: { co: r.co, used: used !== null && used >= -0.05 && used <= 5 ? Math.max(0, used) : null, co2: r.co2 === null ? null : r.co2 * 100 }, note: null }];
  });
  const gas = gases.flatMap((r): BenchRow[] => {
    if (!r.fuel || r.basis !== "ambient" || r.o2 === null || r.p === null) return [];
    const cat = r.ignited === false ? "none" : r.end === "self-extinguished" ? "self" : r.end === "flow terminated" ? "flow" : r.ignited ? "lit" : null;
    return cat ? [{ id: r.id, label: r.label, kind: r.fuel, dims: { o2: r.o2, p: r.p }, cat, measures: { time: r.time, temp: r.temp }, note: r.colour }] : [];
  });
  // One drop of fuel: FLEX records how each test ended; CFI records the air it burned in.
  const ending: Record<string, string> = { extinction: "out", disruption: "broke", "burned to completion": "all" };
  const droplet: BenchRow[] = [
    ...flex.map((d): BenchRow => ({ id: d.id, label: d.label, kind: d.fuel, dims: { o2: d.o2, p: d.p, co2: d.co2, he: d.he }, cat: ending[d.end] ?? null, measures: { time: d.time, k: d.k, ext: d.ext }, note: null })),
    // NASA's spreadsheets spell CFI's fuels two ways (n-dodecane, C12H26); farnesane is the one other fuel.
    ...cfi.flatMap((r): BenchRow[] => (r.o2 === null || r.p === null ? [] : [{ id: r.id, label: r.label.toUpperCase(), kind: /farnesane/i.test(r.fuel ?? "") ? "farnesane" : "dodecane", dims: { o2: r.o2, p: r.p, he: r.he ?? 0 }, cat: null, measures: { time: null, k: r.k, ext: r.ext }, note: null }])),
  ];
  return { solid, droplet, gas };
}

/** Which tests have NASA's own video, and how large each file is. The view is "main" or "second". */
export type Clip = { recordId: string; view: string; bytes: number };

export async function getFootage(): Promise<Clip[]> {
  const rows = await db.select({ recordId: footage.recordId, view: footage.view, bytes: footage.sizeBytes }).from(footage).orderBy(asc(footage.id));
  return rows;
}

/** Where PSI keeps the video of one test: what the server needs to ask NASA's archive for it. */
export async function footageFile(recordId: string, view: string) {
  const [row] = await db
    .select({ accession: footage.accession, fileName: footage.fileName, version: footage.version, sizeBytes: footage.sizeBytes })
    .from(footage)
    .where(eq(footage.id, `${recordId}#${view}`));
  return row ?? null;
}

