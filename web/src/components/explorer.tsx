"use client";

import { DownloadSimple } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import type { ExplorerRow } from "@/lib/data";
import { EMPTY_FILTERS, describeFilters, filterRows, filtersFromParams, filtersToParams, type Filters } from "@flamelens/shared/filters";
import { int } from "@flamelens/shared/format";
import { useLocationSearch } from "@/lib/use-location-search";
import { RecordTable } from "./record-table";

const PAGE = 100;

type Props = {
  rows: ExplorerRow[];
  investigations: { accession: string; short: string; records: number }[];
  variables: { id: string; label: string; unit: string }[];
};

export function Explorer({ rows, investigations, variables }: Props) {
  const names = useMemo(() => Object.fromEntries(investigations.map((i) => [i.accession, i.short])), [investigations]);
  // Filters start from the link, then follow the user.
  const search = useLocationSearch();
  const linked = useMemo(() => filtersFromParams(new URLSearchParams(search)), [search]);
  const [chosen, setChosen] = useState<Filters | null>(null);
  const filters = chosen ?? linked;
  const [page, setPage] = useState(0);

  function update(patch: Partial<Filters>) {
    const next = { ...filters, ...patch };
    setChosen(next);
    setPage(0);
    const query = filtersToParams(next).toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }

  const filtered = useMemo(() => filterRows(rows, filters), [rows, filters]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const visible = filtered.slice(page * PAGE, (page + 1) * PAGE);
  const query = filtersToParams(filters).toString();
  const exportUrl = (format: string) => `/api/export?format=${format}${query ? `&${query}` : ""}`;
  const active = Object.values(filters).some(Boolean);
  const placed = filtered.filter((r) => r.o2Min !== null && r.pMin !== null).length;
  // What a model could take from these rows: how many carry each thing it would need.
  const ready = useMemo(() => {
    const count = (test: (r: ExplorerRow) => boolean) => filtered.filter(test).length;
    const stream = count((r) => r.o2Min !== null && r.o2Basis === "oxidizer stream");
    const assumed = count((r) => r.pMin !== null && r.pQuality === "assumed");
    return [
      { id: "o2", label: "Oxygen", n: count((r) => r.o2Min !== null), note: stream ? `${int(stream)} of them are the gas fed to a burner, not the air` : "" },
      { id: "p", label: "Stated pressure", n: count((r) => r.pMin !== null && r.pQuality !== "assumed"), note: assumed ? `${int(assumed)} more assumed at station pressure` : "" },
      { id: "flow", label: "Airflow speed", n: count((r) => r.flowMin !== null), note: "" },
      { id: "result", label: "A result", n: count((r) => r.results > 0), note: "burn time, how it ended, a gas reading" },
    ];
  }, [filtered]);

  return (
    <div>
      <section aria-label="Filters" className="panel flex flex-wrap items-end gap-x-4 gap-y-3 px-4 py-4">
        <label className="block">
          <span className="label mb-1.5 block">Investigation</span>
          <select className="field max-w-[15rem]" value={filters.inv} onChange={(e) => update({ inv: e.target.value })}>
            <option value="">All with a table</option>
            {investigations.filter((i) => i.records > 0).map((i) => (
              <option key={i.accession} value={i.accession}>{i.short} ({i.records})</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="label mb-1.5 block">Fuel</span>
          <select className="field" value={filters.phase} onChange={(e) => update({ phase: e.target.value })}>
            <option value="">Any</option>
            <option value="solid">Solids</option>
            <option value="liquid">Liquids</option>
            <option value="gas">Gases</option>
          </select>
        </label>
        <label className="block">
          <span className="label mb-1.5 block">Row type</span>
          <select className="field" value={filters.kind} onChange={(e) => update({ kind: e.target.value })}>
            <option value="">Any</option>
            <option value="test">Single tests</option>
            <option value="session">Test days</option>
            <option value="envelope">Envelopes</option>
            <option value="dataset">Datasets</option>
          </select>
        </label>
        <label className="block">
          <span className="label mb-1.5 block">Placement</span>
          <select className="field" value={filters.placed} onChange={(e) => update({ placed: e.target.value })}>
            <option value="">Any</option>
            <option value="map">On the evidence map</option>
            <option value="unplaced">Oxygen or pressure missing</option>
          </select>
        </label>
        <label className="block">
          <span className="label mb-1.5 block">Must include</span>
          <select className="field" value={filters.has} onChange={(e) => update({ has: e.target.value })}>
            <option value="">Anything</option>
            <option value="flow">Airflow speed</option>
            <option value="result">A result</option>
          </select>
        </label>
        <div>
          <span className="label mb-1.5 block">Oxygen, %</span>
          <span className="flex items-center gap-1.5 text-[13px] text-ink-3">
            <input aria-label="Minimum oxygen percent" className="field num w-[4.5rem]" type="number" min={0} max={100} placeholder="min" value={filters.o2min} onChange={(e) => update({ o2min: e.target.value })} />
            to
            <input aria-label="Maximum oxygen percent" className="field num w-[4.5rem]" type="number" min={0} max={100} placeholder="max" value={filters.o2max} onChange={(e) => update({ o2max: e.target.value })} />
          </span>
        </div>
        <label className="block min-w-[12rem] flex-1">
          <span className="label mb-1.5 block">Search fuel, shape, outcome or ID</span>
          <input className="field w-full" type="search" value={filters.q} onChange={(e) => update({ q: e.target.value })} />
        </label>
        {active && (
          <button type="button" className="btn" onClick={() => update(EMPTY_FILTERS)}>Clear filters</button>
        )}
      </section>

      {filtered.length > 0 && (
        <section aria-labelledby="ready-title" className="mt-5">
          <h2 id="ready-title" className="text-[13px] text-ink-2">
            What these <span className="num text-ink">{int(filtered.length)}</span> rows give a model
          </h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
            {ready.map((m) => (
              <li key={m.id}>
                <p className="flex items-baseline justify-between gap-2 text-[13px]">
                  <span className="font-medium">{m.label}</span>
                  <span className="num text-ink-2">{Math.round((m.n / filtered.length) * 100)}%</span>
                </p>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-wash" role="img" aria-label={`${m.label}: ${int(m.n)} of ${int(filtered.length)} rows`}>
                  <div className="h-full rounded-full bg-ink" style={{ width: `${(m.n / filtered.length) * 100}%` }} />
                </div>
                <p className="mt-1.5 text-[12px] leading-snug text-ink-3"><span className="num">{int(m.n)}</span> rows{m.note ? `. ${m.note[0].toUpperCase()}${m.note.slice(1)}.` : ""}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6 grid gap-x-8 gap-y-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 text-[13px] text-ink-2">
            <p aria-live="polite">
              <span className="num text-ink">{int(filtered.length)}</span> of {int(rows.length)} rows. Click a row for the source of every value.
            </p>
            {pages > 1 && (
              <p className="flex items-center gap-2">
                <button type="button" className="btn" disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
                <span className="num">{page + 1} / {pages}</span>
                <button type="button" className="btn" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>Next</button>
              </p>
            )}
          </div>
          <RecordTable rows={visible} names={names} showInvestigation />
        </div>

        <aside aria-labelledby="export-title" className="panel self-start px-4 py-4 text-[13.5px]">
          <h2 id="export-title" className="text-[15px] font-semibold">Export</h2>
          <dl className="mt-3 space-y-2 text-ink-2">
            <div>
              <dt className="label">Scope</dt>
              <dd>{describeFilters(filters, names)}</dd>
            </div>
            <div>
              <dt className="label">Rows</dt>
              <dd><span className="num text-ink">{int(filtered.length)}</span>, of which <span className="num text-ink">{int(placed)}</span> have both oxygen and pressure</dd>
            </div>
            <div>
              <dt className="label">Units</dt>
              <dd>Fractions for gas composition, kPa, cm/s, mm, seconds. Missing cells are empty, never zero.</dd>
            </div>
          </dl>
          <div className="mt-4 space-y-2">
            <a className={`btn btn-solid w-full justify-between ${filtered.length ? "" : "pointer-events-none opacity-40"}`} href={exportUrl("wide")}>
              CSV, one row per record <DownloadSimple size={15} />
            </a>
            <a className={`btn w-full justify-between ${filtered.length ? "" : "pointer-events-none opacity-40"}`} href={exportUrl("long")}>
              CSV, one row per value, with provenance <DownloadSimple size={15} />
            </a>
            <a className={`btn w-full justify-between ${filtered.length ? "" : "pointer-events-none opacity-40"}`} href={exportUrl("json")}>
              JSON, with provenance <DownloadSimple size={15} />
            </a>
          </div>
          <details className="mt-3 text-[12.5px]">
            <summary className="link inline cursor-pointer">The {variables.length} variables and their units</summary>
            <ul className="mt-2 space-y-1 text-ink-2">
              {variables.map((v) => (
                <li key={v.id}><span className="num text-ink">{v.id}</span> {v.label}{v.unit ? `, ${v.unit}` : ""}</li>
              ))}
            </ul>
          </details>
        </aside>
      </div>
    </div>
  );
}
