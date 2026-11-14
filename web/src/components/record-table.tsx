"use client";

import { useCallback, useState } from "react";
import type { ExplorerRow } from "@/lib/data";
import { kpa, num, pct, span } from "@flamelens/shared/format";
import { Inspector } from "./workbench/inspector";

const KIND_LABEL: Record<string, string> = { test: "Test", session: "Test day", envelope: "Envelope", dataset: "Dataset" };

/** A table of records. Clicking a row opens its source in the inspector. */
export function RecordTable({ rows, names, showInvestigation = false, maxHeight }: { rows: ExplorerRow[]; names: Record<string, string>; showInvestigation?: boolean; maxHeight?: number }) {
  const [selected, setSelected] = useState<ExplorerRow | null>(null);
  const close = useCallback(() => setSelected(null), []);
  if (rows.length === 0) {
    return <p className="panel px-4 py-8 text-center text-[14px] text-ink-2">No records match. Clear a filter to see more.</p>;
  }
  return (
    <>
      <div className="panel overflow-auto" style={maxHeight ? { maxHeight } : undefined}>
        <table className="table">
          <thead className="sticky top-0 z-[1]">
            <tr>
              {showInvestigation && <th>Investigation</th>}
              <th>Record</th>
              <th>Type</th>
              <th>Fuel or material</th>
              <th>Shape</th>
              <th className="text-right">Oxygen</th>
              <th className="text-right">Pressure</th>
              <th className="text-right">Flow, cm/s</th>
              <th>Outcome</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} tabIndex={0} className="cursor-pointer" onClick={() => setSelected(r)} onKeyDown={(e) => e.key === "Enter" && setSelected(r)} aria-label={`Open the source of ${r.label}`}>
                {showInvestigation && <td className="whitespace-nowrap font-medium">{names[r.acc]}</td>}
                <td className="num whitespace-nowrap">{r.label}</td>
                <td className="whitespace-nowrap text-ink-2">{KIND_LABEL[r.kind] ?? r.kind}</td>
                <td>{r.fuel ?? <span className="text-ink-3">not reported</span>}</td>
                <td className="text-ink-2">{r.geometry ?? ""}</td>
                <td className="num whitespace-nowrap text-right">
                  {r.o2Min === null ? <span className="text-ink-3">not reported</span> : span(r.o2Min, r.o2Max!, (x) => pct(x))}
                  {r.o2Basis === "oxidizer stream" && <span className="tag ml-1.5">stream</span>}
                </td>
                <td className="num whitespace-nowrap text-right">
                  {r.pMin === null ? <span className="text-ink-3">not reported</span> : span(r.pMin, r.pMax!, kpa)}
                  {r.pQuality === "assumed" && <span className="tag tag-caution ml-1.5">assumed</span>}
                </td>
                <td className="num whitespace-nowrap text-right">{r.flowMin === null ? "" : span(r.flowMin, r.flowMax!, (x) => num(x))}</td>
                <td className="text-ink-2">{r.endMode ?? (r.ignited === false ? "did not ignite" : "")}</td>
                <td className="num whitespace-nowrap text-ink-2">{r.date ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Inspector
        selection={selected ? { rid: selected.id, acc: selected.acc, n: 1, label: selected.label } : null}
        name={selected ? names[selected.acc] : ""}
        onClose={close}
      />
    </>
  );
}
