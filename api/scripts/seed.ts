/**
 * Seed the database from the curated layer of the data pipeline.
 *
 *   pnpm db:seed                      # local database from .env
 *   DATABASE_URL=... pnpm db:seed     # any other database
 *
 * The script replaces all dataset tables inside one transaction, so the database is never
 * left half-loaded. Usage logs are kept.
 */
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql as rawSql } from "drizzle-orm";
import postgres from "postgres";
import * as s from "../src/db/schema";

config({ path: ".env" });

const REPO = path.resolve(__dirname, "..", "..");
const CURATED = path.join(REPO, "data", "curated");
const CHALLENGE = path.join(REPO, "pipeline", "flamelens_pipeline", "dictionary", "challenge_statement.txt");
const CHALLENGE_URL = "https://www.spaceappschallenge.org/2026/challenges/";

function load<T>(name: string): T {
  return JSON.parse(readFileSync(path.join(CURATED, `${name}.json`), "utf8")) as T;
}

type CuratedValue = s.ValueJson & { suspect?: boolean };
type CuratedRecord = {
  id: string;
  accession: string;
  table: string;
  row: number;
  kind: string;
  label: string;
  values: CuratedValue[];
  original: Record<string, string>;
};

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
async function main() {
  const investigations = load<any[]>("investigations");
  const publications = load<any[]>("publications");
  const tables = load<any[]>("tables");
  const variables = load<Record<string, any>>("variables");
  const records = load<CuratedRecord[]>("records");
  const quality = load<{ findings: any[]; value_quality: Record<string, number> }>("quality");
  const reference = load<Record<string, unknown>>("reference");
  const nasaFiles = existsSync(path.join(CURATED, "documents.json"))
    ? load<{ id: string; accession: string; title: string; file_name: string; paragraphs: string[] }[]>("documents")
    : [];
  const interpretations = existsSync(path.join(CURATED, "interpretations.json"))
    ? load<Record<string, { body: unknown; model: string }>>("interpretations")
    : {};

  const clips = existsSync(path.join(CURATED, "footage.json"))
    ? load<{ id: string; record_id: string; accession: string; view: string; file_name: string; version: number; size_bytes: number }[]>("footage")
    : [];

  const client = postgres(process.env.DATABASE_URL!, { max: 1, prepare: false, onnotice: () => {} });
  const db = drizzle(client);

  await db.transaction(async (tx) => {
    await tx.execute(
      rawSql`truncate table footage, record_value, record, source_table, publication, quality_finding, variable, reference, document, interpretation, investigation restart identity cascade`,
    );

    await tx.insert(s.investigations).values(
      investigations.map((inv, i) => ({
        accession: inv.accession,
        sort: i,
        short: inv.short,
        expansion: inv.expansion,
        title: inv.title,
        acronym: inv.acronym,
        oneLine: inv.one_line,
        projectType: inv.project_type,
        subResearchArea: inv.sub_research_area,
        flightPlatform: inv.flight_platform,
        platform: inv.platform,
        family: inv.family,
        buildsOn: inv.builds_on,
        related: inv.related_investigations,
        fuelPhases: inv.fuel_phases,
        emulates: inv.emulates ?? null,
        firePhases: inv.fire_phases,
        varied: inv.varied,
        keywords: inv.keywords,
        relevanceLevel: inv.relevance.level,
        relevance: { quote: inv.relevance.quote, source: inv.relevance.source },
        pillars: inv.pillars,
        insights: inv.insights,
        earth: inv.earth ?? null,
        measurements: inv.measurements,
        objective: inv.objective,
        approach: inv.approach,
        hypothesis: inv.hypothesis,
        researchImpacts: inv.research_impacts,
        hardware: inv.hardware,
        contacts: inv.contacts,
        startDate: inv.start_date,
        endDate: inv.end_date,
        releaseDate: inv.release_date,
        doi: inv.doi,
        license: inv.license,
        totalBytes: inv.total_bytes,
        fileCount: inv.file_count,
        files: { categories: inv.files.categories, extensions: inv.files.extensions, documents: inv.files.documents },
        stats: inv.stats,
        psiUrl: inv.psi_url,
        recordComplete: inv.record_complete,
      })),
    );

    for (const batch of chunk(publications, 500)) {
      await tx.insert(s.publications).values(
        batch.map((p) => ({ accession: p.accession, seq: p.seq, title: p.title, authors: p.authors, doi: p.doi, status: p.status })),
      );
    }

    await tx.insert(s.sourceTables).values(
      tables.map((t) => ({
        fileName: t.file_name,
        accession: t.accession,
        code: t.code,
        title: t.title,
        recordKind: t.record_kind,
        rowsInFile: t.rows_in_file,
        records: t.records,
        columns: t.columns,
        constants: t.constants,
        footnotes: t.footnotes,
        headerNotes: t.header_notes,
        recordNote: t.record_note,
        excluded: t.excluded,
        sourceUrl: t.source_url,
        sha256: t.sha256,
        fetchedAt: t.fetched_at,
      })),
    );

    await tx.insert(s.variables).values(
      Object.entries(variables).map(([id, v], i) => ({
        id,
        sort: i,
        label: v.label,
        unit: v.unit ?? "",
        kind: v.kind,
        grp: v.group,
        description: String(v.description).trim(),
      })),
    );

    const value = (r: CuratedRecord, name: string) => r.values.find((v) => v.var === name);
    const numeric = (r: CuratedRecord, name: string) => {
      const v = value(r, name);
      return v && v.min !== undefined && !v.suspect ? v : undefined;
    };

    for (const batch of chunk(records, 400)) {
      await tx.insert(s.records).values(
        batch.map((r) => {
          const o2 = numeric(r, "o2_fraction");
          const p = numeric(r, "pressure_kpa");
          const flow = numeric(r, "flow_speed_cm_s");
          return {
            id: r.id,
            accession: r.accession,
            tableFile: r.table,
            row: r.row,
            kind: r.kind,
            label: r.label,
            testDate: value(r, "test_date")?.text ?? null,
            o2Min: o2?.min ?? null,
            o2Max: o2?.max ?? null,
            o2Levels: o2?.levels ?? null,
            o2Quality: o2?.quality ?? null,
            o2Basis: value(r, "o2_basis")?.text ?? null,
            pressureMin: p?.min ?? null,
            pressureMax: p?.max ?? null,
            pressureLevels: p?.levels ?? null,
            pressureQuality: p?.quality ?? null,
            flowMin: flow?.min ?? null,
            flowMax: flow?.max ?? null,
            fuel: value(r, "fuel")?.text ?? null,
            fuelPhase: value(r, "fuel_phase")?.text ?? null,
            geometry: value(r, "geometry")?.text ?? null,
            endMode: value(r, "end_mode")?.text ?? null,
            ignited: value(r, "ignited")?.bool ?? null,
            original: r.original,
          };
        }),
      );
    }

    const allValues = records.flatMap((r) =>
      r.values.map((v) => ({
        recordId: r.id,
        variableId: v.var,
        numMin: v.min ?? null,
        numMax: v.max ?? null,
        levels: v.levels ?? null,
        textValue: v.text ?? null,
        boolValue: v.bool ?? null,
        approx: v.approx ?? false,
        suspect: v.suspect ?? false,
        raw: v.raw,
        sourceColumn: v.column,
        quality: v.quality,
        note: v.note ?? null,
        evidence: v.evidence ?? null,
        evidenceSource: v.evidence_source ?? null,
      })),
    );
    for (const batch of chunk(allValues, 1000)) await tx.insert(s.recordValues).values(batch);

    await tx.insert(s.qualityFindings).values(
      quality.findings.map((f) => ({ accession: f.accession, tableFile: f.table ?? "", kind: f.kind, message: f.message })),
    );

    await tx.insert(s.reference).values([
      ...Object.entries(reference).map(([key, data]) => ({ key, data })),
      { key: "value_quality", data: quality.value_quality },
      { key: "built_at", data: new Date().toISOString() },
    ]);

    // Searchable passages of NASA text.
    const docs: (typeof s.documents.$inferInsert)[] = [];
    for (const inv of investigations) {
      const parts: [string, string, string][] = [
        ["objective", "Objectives", inv.objective],
        ["approach", "Approach", inv.approach],
        ["hypothesis", "Hypothesis", inv.hypothesis],
        ["impacts", "Research impacts and Earth benefits", inv.research_impacts],
      ];
      for (const [kind, label, body] of parts) {
        if (body) docs.push({ accession: inv.accession, kind, title: `${inv.short} (${inv.accession}) - ${label}`, body, url: inv.psi_url });
      }
    }
    for (const p of publications) {
      const inv = investigations.find((i) => i.accession === p.accession);
      docs.push({
        accession: p.accession,
        kind: "publication",
        title: p.title,
        body: `${p.authors}. Publication listed under ${inv.short} (${p.accession}).`,
        url: p.doi ? `https://doi.org/${p.doi}` : inv.psi_url,
      });
    }
    for (const t of tables) {
      const notes = [...t.header_notes, t.record_note, ...t.footnotes].filter(Boolean).join("\n");
      const inv = investigations.find((i) => i.accession === t.accession);
      if (notes) docs.push({ accession: t.accession, kind: "table-note", title: `${t.title} - notes on the PSI table`, body: notes, url: inv.psi_url });
    }
    // Other NASA files the pipeline reads (dictionary/documents.yaml), one passage per paragraph.
    for (const file of nasaFiles) {
      const inv = investigations.find((i) => i.accession === file.accession);
      for (const body of file.paragraphs) {
        if (body.length >= 40) docs.push({ accession: file.accession, kind: "nasa-file", title: `${file.title} - a NASA file in PSI`, body, url: inv.psi_url });
      }
    }
    const challenge = readFileSync(CHALLENGE, "utf8").split(/\n\s*\n/).map((p) => p.trim()).filter((p) => p.length > 80);
    for (const body of challenge) {
      docs.push({ accession: null, kind: "challenge", title: "NASA challenge statement - Flame in Freefall", body, url: CHALLENGE_URL });
    }
    for (const batch of chunk(docs, 300)) await tx.insert(s.documents).values(batch);

    // NASA's own videos of single tests (dictionary/footage.yaml). The files stay in NASA's archive.
    for (const batch of chunk(clips, 300)) {
      await tx.insert(s.footage).values(batch.map((c) => ({ id: c.id, recordId: c.record_id, accession: c.accession, view: c.view, fileName: c.file_name, version: c.version, sizeBytes: c.size_bytes })));
    }

    const interp = Object.entries(interpretations).map(([key, v]) => ({ key, body: v.body, model: v.model }));
    if (interp.length) await tx.insert(s.interpretations).values(interp);

    console.log(
      `seeded: ${investigations.length} investigations, ${publications.length} publications, ${tables.length} tables, ` +
        `${records.length} records, ${allValues.length} values, ${docs.length} documents, ${clips.length} videos, ${interp.length} interpretations`,
    );
  });

  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
