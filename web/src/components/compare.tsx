"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PHASE_LABEL, PHASE_VAR, bytes, int, kpa, num, pct, span } from "@flamelens/shared/format";
import { PILLARS, RELEVANCE } from "@/lib/labels";
import { useLocationSearch } from "@/lib/use-location-search";

export type CompareItem = {
  accession: string;
  short: string;
  oneLine: string;
  platform: string;
  familyName: string;
  relevanceLevel: number;
  fuelPhases: string[];
  varied: string[];
  pillars: Record<string, number>;
  measurements: string[];
  fuels: string[];
  geometries: string[];
  o2: { min: number; max: number } | null;
  o2StreamMax: number | null;
  pressure: { min: number; max: number } | null;
  pressureAssumed: boolean;
  flow: { min: number; max: number } | null;
  records: number;
  tests: number;
  publications: number;
  totalBytes: number;
};

const DEFAULT = ["PSI-25", "PSI-99", "PSI-20", "PSI-69"];
const MISSING = <span className="text-ink-3">not reported in PSI</span>;

function Dots({ on, label }: { on: boolean; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span aria-hidden className={`block size-3 shrink-0 rounded-xs border ${on ? "border-ink bg-ink" : "border-rule-2"}`} />
      <span className={on ? "" : "text-ink-3"}>{label}</span>
      <span className="sr-only">{on ? "yes" : "no"}</span>
    </span>
  );
}

function Row({ label, help, cols, chosen, render }: { label: string; help?: string; cols: string; chosen: CompareItem[]; render: (item: CompareItem) => React.ReactNode }) {
  return (
    <div className="grid border-b border-rule" style={{ gridTemplateColumns: cols }}>
      <div className="py-3 pr-4 text-[13px] font-medium text-ink-2" title={help}>{label}</div>
      {chosen.map((item) => (
        <div key={item.accession} className="border-l border-rule px-4 py-3 text-[13.5px]">{render(item)}</div>
      ))}
    </div>
  );
}

export function Compare({ items, measurementNames }: { items: CompareItem[]; measurementNames: Record<string, string> }) {
  // The selection starts from the link (?ids=PSI-25,PSI-99), then follows the user.
  const search = useLocationSearch();
  const linked = useMemo(() => {
    const wanted = (new URLSearchParams(search).get("ids") ?? "").split(",").filter((id) => items.some((i) => i.accession === id));
    if (wanted.length === 0) return DEFAULT;
    return [...new Set([...wanted, ...DEFAULT])].slice(0, Math.max(3, Math.min(4, wanted.length)));
  }, [search, items]);
  const [picked, setPicked] = useState<string[] | null>(null);
  const ids = picked ?? linked;

  function set(next: string[]) {
    setPicked(next);
    window.history.replaceState(null, "", `?ids=${next.join(",")}`);
  }

  const chosen = ids.map((id) => items.find((i) => i.accession === id)!).filter(Boolean);
  const allMeasurements = Object.keys(measurementNames).filter((m) => chosen.some((c) => c.measurements.includes(m)));
  const allVaried = [...new Set(chosen.flatMap((c) => c.varied))];
  const cols = `minmax(150px,190px) repeat(${chosen.length}, minmax(190px, 1fr))`;

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3">
        {ids.map((id, slot) => (
          <label key={slot} className="block">
            <span className="label mb-1.5 block">Investigation {slot + 1}</span>
            <select className="field" value={id} onChange={(e) => set(ids.map((x, i) => (i === slot ? e.target.value : x)))}>
              {items.map((i) => (
                <option key={i.accession} value={i.accession} disabled={ids.includes(i.accession) && i.accession !== id}>{i.short}</option>
              ))}
            </select>
          </label>
        ))}
        {ids.length < 4 && (
          <button type="button" className="btn" onClick={() => set([...ids, items.find((i) => !ids.includes(i.accession))!.accession])}>Add one</button>
        )}
        {ids.length > 2 && (
          <button type="button" className="btn" onClick={() => set(ids.slice(0, -1))}>Remove last</button>
        )}
      </div>

      <div className="panel relative mt-6 overflow-x-auto px-4">
        <div style={{ minWidth: 150 + chosen.length * 190 }}>
          <div className="grid border-b border-ink" style={{ gridTemplateColumns: cols }}>
            <div />
            {chosen.map((item) => (
              <div key={item.accession} className="border-l border-rule px-4 py-4">
                <Link href={`/investigations/${item.accession}`} className="link text-[16px] font-semibold">{item.short}</Link>
                <p className="mt-1.5 text-[13px] leading-snug text-ink-2">{item.oneLine}</p>
              </div>
            ))}
          </div>
          <Row cols={cols} chosen={chosen} label="NASA focus" render={(i) => <span title={RELEVANCE[i.relevanceLevel].help}>{RELEVANCE[i.relevanceLevel].label}</span>} />
          <Row cols={cols} chosen={chosen} label="Hardware" render={(i) => <>{i.familyName}<span className="block text-[12.5px] text-ink-3">{i.platform}</span></>} />
          <Row
            cols={cols}
            chosen={chosen}
            label="Fuel"
            render={(i) => (
              <>
                <span className="flex flex-wrap gap-x-3 gap-y-1">
                  {i.fuelPhases.length ? i.fuelPhases.map((p) => (
                    <span key={p} className="inline-flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-full" style={{ background: PHASE_VAR[p] }} />{PHASE_LABEL[p]}</span>
                  )) : <span className="text-ink-3">no flame</span>}
                </span>
                <span className="mt-1 block text-[12.5px] text-ink-2">{i.fuels.length ? i.fuels.slice(0, 5).join(", ") + (i.fuels.length > 5 ? `, +${i.fuels.length - 5}` : "") : MISSING}</span>
              </>
            )}
          />
          <Row cols={cols} chosen={chosen} label="Shape" render={(i) => (i.geometries.length ? i.geometries.slice(0, 4).join(", ") : MISSING)} />
          <Row
            cols={cols}
            chosen={chosen}
            label="Oxygen"
            help="Oxygen mole fraction of the atmosphere around the fuel"
            render={(i) => (
              <>
                <span className="num">{i.o2 ? span(i.o2.min, i.o2.max, (x) => pct(x)) : MISSING}</span>
                {i.o2StreamMax !== null && <span className="block text-[12.5px] text-ink-3">burner stream up to {pct(i.o2StreamMax)}</span>}
              </>
            )}
          />
          <Row cols={cols} chosen={chosen} label="Pressure" render={(i) => <><span className="num">{i.pressure ? span(i.pressure.min, i.pressure.max, kpa) : MISSING}</span>{i.pressureAssumed && <span className="tag tag-caution ml-2">assumed</span>}</>} />
          <Row cols={cols} chosen={chosen} label="Flow speed" render={(i) => <span className="num">{i.flow ? `${span(i.flow.min, i.flow.max, (x) => num(x))} cm/s` : MISSING}</span>} />
          <Row cols={cols} chosen={chosen} label="What was varied" render={(i) => <span className="space-y-1">{allVaried.map((v) => <Dots key={v} on={i.varied.includes(v)} label={v} />)}</span>} />
          <Row cols={cols} chosen={chosen} label="Measurements" help="Measurement types named in the PSI record" render={(i) => <span className="space-y-1">{allMeasurements.map((m) => <Dots key={m} on={i.measurements.includes(m)} label={measurementNames[m]} />)}</span>} />
          <Row
            cols={cols}
            chosen={chosen}
            label="Contributes to"
            render={(i) => (
              <span className="space-y-1.5">
                {PILLARS.map((p) => (
                  <span key={p.id} className="flex items-center justify-between gap-3">
                    <span className={i.pillars[p.id] ? "" : "text-ink-3"}>{p.label}</span>
                    <span className="flex gap-1" role="img" aria-label={`${i.pillars[p.id]} of 3`}>
                      {[1, 2, 3].map((n) => <span key={n} className={`block size-3 rounded-xs border ${n <= i.pillars[p.id] ? "border-ink bg-ink" : "border-rule-2"}`} />)}
                    </span>
                  </span>
                ))}
              </span>
            )}
          />
          <Row cols={cols} chosen={chosen} label="Itemized rows" render={(i) => <><span className="num">{int(i.records)}</span>{i.records === 0 && <span className="block text-[12.5px] text-ink-3">no table in PSI</span>}</>} />
          <Row cols={cols} chosen={chosen} label="Publications" render={(i) => <span className="num">{int(i.publications)}</span>} />
          <Row cols={cols} chosen={chosen} label="Raw data on PSI" render={(i) => <span className="num">{i.totalBytes ? bytes(i.totalBytes) : "none listed"}</span>} />
        </div>
      </div>
      <p className="mt-4 max-w-[75ch] text-[13px] leading-relaxed text-ink-3">
        The rows line up attributes, not results. Ranges show what each table reports, and a range is not evenly sampled. Two investigations with overlapping ranges are not thereby comparable: check hardware, fuel and what was varied first.
      </p>
    </div>
  );
}
