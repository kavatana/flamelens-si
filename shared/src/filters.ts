/** Record filters shared by the data explorer (browser) and the export endpoint (server). */

export type RowLike = {
  id: string;
  acc: string;
  kind: string;
  label: string;
  o2Min: number | null;
  o2Max: number | null;
  o2Basis: string | null;
  pMin: number | null;
  fuel: string | null;
  phase: string | null;
  geometry: string | null;
  endMode: string | null;
  flowMin?: number | null;
  /** How many result variables the row carries. */
  results?: number;
};

export type Filters = {
  inv: string;
  phase: string;
  kind: string;
  /** "map" = oxygen and pressure reported for the surrounding atmosphere. */
  placed: string;
  /** "flow" = airflow speed reported; "result" = at least one result recorded. */
  has: string;
  q: string;
  o2min: string;
  o2max: string;
};

export const EMPTY_FILTERS: Filters = { inv: "", phase: "", kind: "", placed: "", has: "", q: "", o2min: "", o2max: "" };

export function filtersFromParams(params: URLSearchParams): Filters {
  const out = { ...EMPTY_FILTERS };
  for (const key of Object.keys(out) as (keyof Filters)[]) out[key] = params.get(key) ?? "";
  return out;
}

export function filtersToParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value) params.set(key, value);
  return params;
}

export function filterRows<T extends RowLike>(rows: T[], f: Filters): T[] {
  const q = f.q.trim().toLowerCase();
  const lo = f.o2min === "" ? null : Number(f.o2min) / 100;
  const hi = f.o2max === "" ? null : Number(f.o2max) / 100;
  return rows.filter((r) => {
    if (f.inv && r.acc !== f.inv) return false;
    if (f.phase && r.phase !== f.phase) return false;
    if (f.kind && r.kind !== f.kind) return false;
    if (f.placed === "map" && (r.o2Min === null || r.pMin === null || r.o2Basis === "oxidizer stream")) return false;
    if (f.placed === "unplaced" && r.o2Min !== null && r.pMin !== null) return false;
    if (f.has === "flow" && (r.flowMin ?? null) === null) return false;
    if (f.has === "result" && !r.results) return false;
    if (lo !== null && Number.isFinite(lo) && (r.o2Max === null || r.o2Max < lo - 1e-9)) return false;
    if (hi !== null && Number.isFinite(hi) && (r.o2Min === null || r.o2Min > hi + 1e-9)) return false;
    if (q) {
      const hay = `${r.label} ${r.fuel ?? ""} ${r.geometry ?? ""} ${r.endMode ?? ""} ${r.id}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function describeFilters(f: Filters, names: Record<string, string>): string {
  const parts: string[] = [];
  if (f.inv) parts.push(names[f.inv] ?? f.inv);
  if (f.phase) parts.push(`${f.phase} fuel`);
  if (f.kind) parts.push(`${f.kind} rows`);
  if (f.placed === "map") parts.push("on the evidence map");
  if (f.placed === "unplaced") parts.push("not placeable on the map");
  if (f.has === "flow") parts.push("with airflow speed reported");
  if (f.has === "result") parts.push("with a result recorded");
  if (f.o2min || f.o2max) parts.push(`oxygen ${f.o2min || "any"} to ${f.o2max || "any"}%`);
  if (f.q) parts.push(`matching "${f.q}"`);
  return parts.length ? parts.join(", ") : "all records";
}
