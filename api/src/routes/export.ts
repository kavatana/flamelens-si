import { asc, inArray } from "drizzle-orm";
import { db, schema } from "../db/client";
import { getExplorerRows, getInvestigations, getVariables } from "../queries";
import { describeFilters, filterRows, filtersFromParams } from "@flamelens/shared/filters";

const { recordValues, records } = schema;

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function toCsv(header: string[], rows: unknown[][]): string {
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

type ValueRow = typeof recordValues.$inferSelect;

/** One cell of the wide file: an exact number, "min..max" for a range, "a|b|c" for listed levels. */
function wideCell(v: ValueRow): string | number | boolean {
  if (v.boolValue !== null) return v.boolValue;
  if (v.numMin === null || v.numMax === null) return v.textValue ?? "";
  if (v.levels?.length) return v.levels.join("|");
  return v.numMin === v.numMax ? v.numMin : `${v.numMin}..${v.numMax}`;
}

/**
 * Export the records that match the explorer's filters.
 *   format=wide  one row per record, one column per variable (CSV)
 *   format=long  one row per value, with its raw PSI cell and provenance (CSV)
 *   format=json  nested records with full provenance
 */
export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const format = params.get("format") ?? "wide";
  if (!["wide", "long", "json"].includes(format)) return Response.json({ error: "Unknown format." }, { status: 400 });

  const [allRows, investigations, variables] = await Promise.all([getExplorerRows(), getInvestigations(), getVariables()]);
  const filters = filtersFromParams(params);
  const rows = filterRows(allRows, filters);
  if (rows.length === 0) return Response.json({ error: "No records match these filters." }, { status: 404 });

  const ids = rows.map((r) => r.id);
  const inv = new Map(investigations.map((i) => [i.accession, i]));
  const names = Object.fromEntries(investigations.map((i) => [i.accession, i.short]));
  const [values, meta] = await Promise.all([
    db.select().from(recordValues).where(inArray(recordValues.recordId, ids)).orderBy(asc(recordValues.recordId)),
    db.select({ id: records.id, tableFile: records.tableFile, row: records.row }).from(records).where(inArray(records.id, ids)),
  ]);
  const byRecord = new Map<string, ValueRow[]>();
  for (const v of values) {
    const list = byRecord.get(v.recordId);
    if (list) list.push(v);
    else byRecord.set(v.recordId, [v]);
  }
  const source = new Map(meta.map((m) => [m.id, m]));
  const used = new Set(values.map((v) => v.variableId));
  const columns = variables.filter((v) => used.has(v.id));
  const scope = describeFilters(filters, names);
  const name = `flamelens-${filters.inv || "all"}-${format}`;

  if (format === "json") {
    const body = {
      meta: {
        title: "FlameLens SI export of NASA PSI combustion test records",
        scope,
        records: rows.length,
        source: "NASA Physical Sciences Informatics (PSI), https://psi.nasa.gov, experimental tables. PSI data is released under CC0-1.0.",
        si_use: "The cleaning code that produced this file was written with an SI coding tool (Claude, Anthropic). No value was produced or estimated by a model: each comes from a PSI table cell or NASA text, as its quality label says.",
        note: "Values are harmonized to one vocabulary and one set of units. Each value keeps the raw PSI cell and a quality label. Missing means not reported in PSI.",
        quality_labels: {
          reported: "read from a PSI table cell; unit conversion only",
          corrected: "a PSI cell that was repaired; see note",
          context: "stated in NASA text, not a table cell; see evidence",
          assumed: "stated nowhere in PSI; see note",
          derived: "computed from other values of the record",
        },
        variables: Object.fromEntries(columns.map((c) => [c.id, { label: c.label, unit: c.unit, description: c.description }])),
      },
      records: rows.map((r) => ({
        id: r.id,
        accession: r.acc,
        investigation: names[r.acc],
        type: r.kind,
        label: r.label,
        source_table: source.get(r.id)?.tableFile,
        source_row: source.get(r.id)?.row,
        psi_url: inv.get(r.acc)?.psiUrl,
        values: Object.fromEntries(
          (byRecord.get(r.id) ?? []).map((v) => [
            v.variableId,
            {
              ...(v.numMin !== null ? { min: v.numMin, max: v.numMax } : {}),
              ...(v.levels?.length ? { levels: v.levels } : {}),
              ...(v.textValue !== null ? { text: v.textValue } : {}),
              ...(v.boolValue !== null ? { bool: v.boolValue } : {}),
              ...(v.approx ? { approx: true } : {}),
              ...(v.suspect ? { outside_expected_range: true } : {}),
              quality: v.quality,
              ...(v.raw ? { raw: v.raw, column: v.sourceColumn } : {}),
              ...(v.note ? { note: v.note } : {}),
              ...(v.evidence ? { evidence: v.evidence, evidence_source: v.evidenceSource } : {}),
            },
          ]),
        ),
      })),
    };
    return new Response(JSON.stringify(body, null, 1), {
      headers: { "Content-Type": "application/json; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.json"` },
    });
  }

  let csv: string;
  if (format === "long") {
    const label = new Map(variables.map((v) => [v.id, v]));
    csv = toCsv(
      ["record_id", "accession", "investigation", "record_type", "variable", "label", "unit", "value_min", "value_max", "levels", "text", "bool", "approximate", "outside_expected_range", "quality", "raw_psi_cell", "psi_column", "note", "evidence", "evidence_source", "source_table", "source_row"],
      rows.flatMap((r) =>
        (byRecord.get(r.id) ?? []).map((v) => [
          r.id, r.acc, names[r.acc], r.kind, v.variableId, label.get(v.variableId)?.label, label.get(v.variableId)?.unit,
          v.numMin, v.numMax, v.levels?.join("|"), v.textValue, v.boolValue, v.approx || "", v.suspect || "", v.quality,
          v.raw, v.sourceColumn, v.note, v.evidence, v.evidenceSource, source.get(r.id)?.tableFile, source.get(r.id)?.row,
        ]),
      ),
    );
  } else {
    csv = toCsv(
      ["record_id", "accession", "investigation", "record_type", "label", ...columns.map((c) => c.id), "not_from_a_table_cell", "source_table", "source_row", "psi_url"],
      rows.map((r) => {
        const mine = new Map((byRecord.get(r.id) ?? []).map((v) => [v.variableId, v]));
        const flags = [...mine.values()].filter((v) => v.quality !== "reported").map((v) => `${v.variableId}=${v.quality}`).join("; ");
        return [
          r.id, r.acc, names[r.acc], r.kind, r.label,
          ...columns.map((c) => (mine.has(c.id) ? wideCell(mine.get(c.id)!) : "")),
          flags, source.get(r.id)?.tableFile, source.get(r.id)?.row, inv.get(r.acc)?.psiUrl,
        ];
      }),
    );
  }
  return new Response(csv, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.csv"` },
  });
}
