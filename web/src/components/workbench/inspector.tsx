"use client";

import { ArrowSquareOut, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { RecordDetail } from "@/lib/data";
import { QUALITY_HELP, QUALITY_LABEL, int, kpa, num, pct } from "@flamelens/shared/format";
import { TestDossier } from "./test-dossier";

type Value = RecordDetail["values"][number];

const GROUPS: [string, string][] = [
  ["atmosphere", "Atmosphere"],
  ["fuel", "Fuel and sample"],
  ["outcome", "Ignition and outcome"],
  ["measurement", "Measurements"],
  ["context", "Context"],
];

export function formatValue(v: Value): string {
  if (v.bool !== null) return v.bool ? "Yes" : "No";
  if (v.numMin === null || v.numMax === null) return v.text ?? "";
  const fmt =
    v.unit === "fraction" ? (x: number) => pct(x, 2)
    : v.unit === "kPa" ? kpa
    : (x: number) => `${num(x, 4)}${v.unit && v.unit !== "ratio" && v.unit !== "count" ? ` ${v.unit}` : ""}`;
  const body = v.levels?.length ? v.levels.map(fmt).join(", ") : v.numMin === v.numMax ? fmt(v.numMin) : `${fmt(v.numMin)} to ${fmt(v.numMax)}`;
  return v.approx ? `about ${body}` : body;
}

function QualityTag({ quality }: { quality: string }) {
  const caution = quality === "assumed" || quality === "corrected";
  return (
    <span className={`tag ${caution ? "tag-caution" : ""}`} title={QUALITY_HELP[quality]}>
      {QUALITY_LABEL[quality] ?? quality}
    </span>
  );
}

export function ValueRow({ v }: { v: Value }) {
  return (
    <li className="py-2">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] text-ink-2">{v.label}</span>
        <span className="flex items-baseline gap-2 text-right">
          <span className={`text-[13.5px] ${v.numMin !== null ? "num" : ""} ${v.suspect ? "line-through decoration-caution" : ""}`}>{formatValue(v)}</span>
          <QualityTag quality={v.quality} />
        </span>
      </div>
      {v.raw && (
        <p className="mt-0.5 text-[12px] text-ink-3">
          PSI column <span className="text-ink-2">{v.column}</span>: <span className="num text-ink-2">{v.raw}</span>
        </p>
      )}
      {v.evidence && (
        <p className="quote mt-1 text-[12.5px]">
          &ldquo;{v.evidence}&rdquo;
          <span className="text-ink-3">
            {" "}
            {v.evidenceSource === "challenge" ? "NASA challenge statement" : v.evidenceSource === "table" ? "note in the PSI table" : "PSI record"}
          </span>
        </p>
      )}
      {v.note && <p className={`mt-1 text-[12.5px] ${v.quality === "assumed" || v.quality === "corrected" || v.suspect ? "text-caution" : "text-ink-3"}`}>{v.note}</p>}
    </li>
  );
}

export function RecordView({ detail }: { detail: RecordDetail }) {
  const { rec, values } = detail;
  return (
    <div>
      {GROUPS.map(([id, label]) => {
        const group = values.filter((v) => v.grp === id);
        if (!group.length) return null;
        return (
          <section key={id} className="mt-5 first:mt-0">
            <h3 className="label">{label}</h3>
            <ul className="mt-1 divide-y divide-rule border-y border-rule">
              {group.map((v) => (
                <ValueRow key={v.variable} v={v} />
              ))}
            </ul>
          </section>
        );
      })}
      <details className="mt-5">
        <summary className="label cursor-pointer">Original row in the PSI table (row {rec.row})</summary>
        <dl className="mt-2 grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-1 text-[12.5px]">
          {Object.entries(rec.original).map(([k, val]) => (
            <div key={k} className="contents">
              <dt className="truncate text-ink-3" title={k}>{k}</dt>
              <dd className="num break-words">{val}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 break-all text-[12px] text-ink-3">{rec.tableFile}</p>
      </details>
    </div>
  );
}

type Props = {
  selection: { rid: string; acc: string; n: number; label: string } | null;
  name: string;
  onClose: () => void;
  /**
   * Inside a feature the record opens in place, as a card under what was clicked, and the
   * card it sits in scrolls to it. Without this it is a drawer at the side of the window.
   */
  inline?: boolean;
  className?: string;
};

export function Inspector({ selection, name, onClose, inline = false, className = "" }: Props) {
  const [state, setState] = useState<{ id: string; detail?: RecordDetail; error?: string } | null>(null);
  const rid = selection?.rid ?? null;
  const card = useRef<HTMLElement>(null);

  // A record opened in place is brought into view inside the card that holds it.
  useEffect(() => {
    if (inline && rid) card.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [inline, rid, state]);

  useEffect(() => {
    if (!rid) return;
    const controller = new AbortController();
    fetch(`/api/record?id=${encodeURIComponent(rid)}`, { signal: controller.signal })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(`Request failed (${res.status})`))))
      .then((detail: RecordDetail) => setState({ id: rid, detail }))
      .catch((error: Error) => {
        if (error.name !== "AbortError") setState({ id: rid, error: error.message });
      });
    return () => controller.abort();
  }, [rid]);

  useEffect(() => {
    if (!rid) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [rid, onClose]);

  if (!selection) return null;
  const current = state?.id === selection.rid ? state : null;

  return (
    <aside
      ref={card}
      aria-label="Source record"
      className={inline ? `rise-in flex scroll-mb-3 scroll-mt-3 flex-col rounded-sm border border-ink bg-surface ${className}` : "fixed inset-y-0 right-0 z-40 flex w-full max-w-[440px] flex-col border-l border-rule-2 bg-surface shadow-[-12px_0_40px_-18px_rgba(20,23,26,0.35)]"}
    >
      <header className="flex items-start justify-between gap-3 border-b border-rule px-5 py-4">
        <div className="min-w-0">
          <p className="text-[12.5px] text-ink-3">Source record</p>
          <h2 className="truncate text-[17px] font-semibold leading-tight">
            {name} <span className="num font-normal text-ink-2">{selection.label}</span>
          </h2>
          {selection.n > 1 && (
            <p className="mt-1 text-[12.5px] text-ink-2">
              One of {int(selection.n)} rows at identical conditions.{" "}
              <Link className="link" href={`/data?inv=${selection.acc}`}>
                See them all
              </Link>
            </p>
          )}
        </div>
        <button type="button" className="btn shrink-0 px-2" onClick={onClose} aria-label="Close source record">
          <X size={15} />
        </button>
      </header>
      <div className={inline ? "px-5 py-4" : "flex-1 overflow-y-auto px-5 py-4"}>
        {!current && (
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-9 animate-pulse rounded-xs bg-wash" />
            ))}
          </div>
        )}
        {current?.error && <p className="text-[13.5px] text-caution">The record could not be loaded. {current.error}</p>}
        {current?.detail && (
          <>
            <TestDossier recordId={selection.rid} />
            <RecordView detail={current.detail} />
          </>
        )}
      </div>
      <footer className="flex gap-2 border-t border-rule px-5 py-3">
        <Link className="btn" href={`/investigations/${selection.acc}`}>
          Open {name}
        </Link>
        <a className="btn" href={`https://psi.nasa.gov/physci/repo/data/investigations/${selection.acc}`} target="_blank" rel="noreferrer">
          PSI page <ArrowSquareOut size={14} />
        </a>
      </footer>
    </aside>
  );
}
