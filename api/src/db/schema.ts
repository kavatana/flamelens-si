/**
 * Serving layer: the Postgres schema the app reads.
 *
 * It is seeded from the curated layer of the data pipeline (data/curated/*.json) by
 * scripts/seed.ts, so the database can always be rebuilt from the repository.
 *
 *   investigation ──< publication
 *        │
 *        ├──< source_table ──< record ──< record_value >── variable
 *        │
 *        └──< quality_finding
 *
 * `record` carries a few denormalised "hot" columns (oxygen, pressure, flow, fuel) so the
 * evidence map and filters need one indexed scan. The full detail, with the raw PSI cell and
 * provenance of every value, is in `record_value`.
 */
import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  customType,
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

const tsvector = customType<{ data: string }>({ dataType: () => "tsvector" });

export type Quote = { quote: string; source: string };
export type Pillar = { score: number; quote: string; source: string };
export type Span = { min: number; max: number; records: number } | null;

export type InvestigationStats = {
  records: number;
  tests: number;
  sessions: number;
  envelopes: number;
  datasets: number;
  flames_in_sessions: number;
  mappable: number;
  variables: string[];
  variable_counts: Record<string, number>;
  o2: Span;
  o2_ambient: Span;
  pressure: Span;
  flow: Span;
  fuels: { name: string; records: number }[];
  geometries: { name: string; records: number }[];
  publications: number;
  publications_with_doi: number;
};

export type FileSummary = {
  categories: Record<string, { count: number; bytes: number }>;
  extensions: Record<string, number>;
  documents: { category: string; name: string; bytes: number }[];
};

export const investigations = pgTable("investigation", {
  accession: text("accession").primaryKey(),
  sort: integer("sort").notNull(),
  short: text("short").notNull(),
  expansion: text("expansion").notNull(),
  title: text("title").notNull(),
  acronym: text("acronym").notNull(),
  oneLine: text("one_line").notNull(),
  projectType: text("project_type").notNull(),
  subResearchArea: text("sub_research_area").notNull(),
  flightPlatform: text("flight_platform").notNull(),
  platform: text("platform").notNull(),
  family: text("family").notNull(),
  buildsOn: text("builds_on").array().notNull(),
  related: text("related").array().notNull(),
  fuelPhases: text("fuel_phases").array().notNull(),
  emulates: jsonb("emulates").$type<({ phases: string[] } & Quote) | null>(),
  firePhases: text("fire_phases").array().notNull(),
  varied: text("varied").array().notNull(),
  keywords: text("keywords").array().notNull(),
  relevanceLevel: integer("relevance_level").notNull(),
  relevance: jsonb("relevance").$type<Quote>().notNull(),
  pillars: jsonb("pillars").$type<Record<"prevention" | "detection" | "suppression", Pillar>>().notNull(),
  insights: jsonb("insights").$type<({ text: string } & Quote)[]>().notNull(),
  earth: jsonb("earth").$type<({ theme: string; text: string } & Quote) | null>(),
  measurements: jsonb("measurements").$type<{ id: string; name: string; matched: string; snippet: string }[]>().notNull(),
  objective: text("objective").notNull(),
  approach: text("approach").notNull(),
  hypothesis: text("hypothesis").notNull(),
  researchImpacts: text("research_impacts").notNull(),
  hardware: jsonb("hardware").$type<{ name: string; link: string }[]>().notNull(),
  contacts: jsonb("contacts").$type<{ name: string; roles: string[]; affiliation: string }[]>().notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
  releaseDate: text("release_date").notNull(),
  doi: text("doi").notNull(),
  license: text("license").notNull(),
  totalBytes: bigint("total_bytes", { mode: "number" }).notNull(),
  fileCount: integer("file_count").notNull(),
  files: jsonb("files").$type<FileSummary>().notNull(),
  stats: jsonb("stats").$type<InvestigationStats>().notNull(),
  psiUrl: text("psi_url").notNull(),
  recordComplete: boolean("record_complete").notNull(),
});

export const publications = pgTable(
  "publication",
  {
    id: serial("id").primaryKey(),
    accession: text("accession").notNull().references(() => investigations.accession, { onDelete: "cascade" }),
    seq: integer("seq").notNull(),
    title: text("title").notNull(),
    authors: text("authors").notNull(),
    doi: text("doi").notNull(),
    status: text("status").notNull(),
  },
  (t) => [index("publication_accession_idx").on(t.accession)],
);

export type ValueJson = {
  var: string;
  min?: number;
  max?: number;
  levels?: number[];
  text?: string;
  bool?: boolean;
  approx?: boolean;
  raw: string;
  column: string;
  quality: string;
  note?: string;
  evidence?: string;
  evidence_source?: string;
};

export const sourceTables = pgTable("source_table", {
  fileName: text("file_name").primaryKey(),
  accession: text("accession").notNull().references(() => investigations.accession, { onDelete: "cascade" }),
  code: text("code").notNull(),
  title: text("title").notNull(),
  recordKind: text("record_kind").notNull(),
  rowsInFile: integer("rows_in_file").notNull(),
  records: integer("records").notNull(),
  columns: jsonb("columns").$type<{ name: string; variables: string[]; unit: string }[]>().notNull(),
  constants: jsonb("constants").$type<ValueJson[]>().notNull(),
  footnotes: jsonb("footnotes").$type<string[]>().notNull(),
  headerNotes: jsonb("header_notes").$type<string[]>().notNull(),
  recordNote: text("record_note").notNull(),
  excluded: jsonb("excluded").$type<{ row: number; reason: string; cells: Record<string, string> }[]>().notNull(),
  sourceUrl: text("source_url").notNull(),
  sha256: text("sha256").notNull(),
  fetchedAt: text("fetched_at").notNull(),
});

export const variables = pgTable("variable", {
  id: text("id").primaryKey(),
  sort: integer("sort").notNull(),
  label: text("label").notNull(),
  unit: text("unit").notNull(),
  kind: text("kind").notNull(),
  grp: text("grp").notNull(),
  description: text("description").notNull(),
});

export const records = pgTable(
  "record",
  {
    id: text("id").primaryKey(),
    accession: text("accession").notNull().references(() => investigations.accession, { onDelete: "cascade" }),
    tableFile: text("table_file").notNull().references(() => sourceTables.fileName, { onDelete: "cascade" }),
    row: integer("row").notNull(),
    kind: text("kind").notNull(),
    label: text("label").notNull(),
    testDate: text("test_date"),
    // Hot columns. Null when the PSI table does not give the value, or the value was flagged.
    o2Min: doublePrecision("o2_min"),
    o2Max: doublePrecision("o2_max"),
    o2Levels: doublePrecision("o2_levels").array(),
    o2Quality: text("o2_quality"),
    o2Basis: text("o2_basis"),
    pressureMin: doublePrecision("pressure_min"),
    pressureMax: doublePrecision("pressure_max"),
    pressureLevels: doublePrecision("pressure_levels").array(),
    pressureQuality: text("pressure_quality"),
    flowMin: doublePrecision("flow_min"),
    flowMax: doublePrecision("flow_max"),
    fuel: text("fuel"),
    fuelPhase: text("fuel_phase"),
    geometry: text("geometry"),
    endMode: text("end_mode"),
    ignited: boolean("ignited"),
    original: jsonb("original").$type<Record<string, string>>().notNull(),
  },
  (t) => [
    index("record_accession_idx").on(t.accession),
    index("record_o2_pressure_idx").on(t.o2Min, t.pressureMin),
    index("record_fuel_phase_idx").on(t.fuelPhase),
  ],
);

export const recordValues = pgTable(
  "record_value",
  {
    recordId: text("record_id").notNull().references(() => records.id, { onDelete: "cascade" }),
    variableId: text("variable_id").notNull().references(() => variables.id),
    numMin: doublePrecision("num_min"),
    numMax: doublePrecision("num_max"),
    levels: doublePrecision("levels").array(),
    textValue: text("text_value"),
    boolValue: boolean("bool_value"),
    approx: boolean("approx").notNull().default(false),
    suspect: boolean("suspect").notNull().default(false),
    raw: text("raw").notNull(),
    sourceColumn: text("source_column").notNull(),
    quality: text("quality").notNull(),
    note: text("note"),
    evidence: text("evidence"),
    evidenceSource: text("evidence_source"),
  },
  (t) => [
    primaryKey({ columns: [t.recordId, t.variableId] }),
    index("record_value_variable_idx").on(t.variableId, t.numMin),
  ],
);

export const qualityFindings = pgTable("quality_finding", {
  id: serial("id").primaryKey(),
  accession: text("accession").notNull(),
  tableFile: text("table_file").notNull(),
  kind: text("kind").notNull(),
  message: text("message").notNull(),
});

/** Crew atmospheres, scenarios, hardware families, Earth themes, stated gaps. */
export const reference = pgTable("reference", {
  key: text("key").primaryKey(),
  data: jsonb("data").notNull(),
});

/** Searchable passages of NASA text, for the Ask feature. */
export const documents = pgTable(
  "document",
  {
    id: serial("id").primaryKey(),
    accession: text("accession"),
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    url: text("url").notNull(),
    search: tsvector("search").generatedAlwaysAs(
      sql`setweight(to_tsvector('english', coalesce(title, '')), 'A') || setweight(to_tsvector('english', coalesce(body, '')), 'B')`,
    ),
  },
  (t) => [index("document_search_idx").using("gin", t.search)],
);

/** Precomputed SI interpretations, keyed by scenario. */
export const interpretations = pgTable("interpretation", {
  key: text("key").primaryKey(),
  body: jsonb("body").notNull(),
  model: text("model").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One row per live SI call: enforces the per-visitor rate limit and the daily spend cap. */
export const usage = pgTable(
  "usage",
  {
    id: serial("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    visitor: text("visitor").notNull(),
    route: text("route").notNull(),
    inputTokens: integer("input_tokens").notNull().default(0),
    outputTokens: integer("output_tokens").notNull().default(0),
    costUsd: doublePrecision("cost_usd").notNull().default(0),
  },
  (t) => [index("usage_created_idx").on(t.createdAt), index("usage_visitor_idx").on(t.visitor, t.createdAt)],
);

/**
 * NASA's own video of a single test, as PSI lists it. Only the file's name, version and size
 * are kept: the video stays in NASA's archive and is asked for when a visitor presses play.
 */
export const footage = pgTable(
  "footage",
  {
    /** The record id and the view, as "PSI-25/bass2/1#main". */
    id: text("id").primaryKey(),
    recordId: text("record_id").notNull().references(() => records.id, { onDelete: "cascade" }),
    accession: text("accession").notNull(),
    /** "main" for the first camera, "second" for the other. */
    view: text("view").notNull(),
    fileName: text("file_name").notNull(),
    version: integer("version").notNull(),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  },
  (t) => [index("footage_record_idx").on(t.recordId)],
);

/** One row each time a visitor marks an analysis or an answer as not helpful. Nothing identifies the visitor. */
export const feedback = pgTable(
  "feedback",
  {
    id: serial("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** A one-way label for the visitor and day, so one person cannot flood the table. */
    visitor: text("visitor").notNull(),
    /** "analysis" or "answer". */
    kind: text("kind").notNull(),
    rating: text("rating").notNull(),
    /** The page it was given on. */
    page: text("page").notNull(),
    /** The question the answer was for, when it is about an answer. */
    question: text("question"),
    /** The cabin of the analysis, as numbers and fixed words. */
    cabin: jsonb("cabin").$type<{ o2: number; p: number; gravity: string; focus: string; material: string | null }>(),
  },
  (t) => [index("feedback_visitor_idx").on(t.visitor, t.createdAt)],
);
