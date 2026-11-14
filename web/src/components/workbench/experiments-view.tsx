"use client";

import { ArrowUpRight } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { int, steps } from "@flamelens/shared/format";
import { EXPERIMENT_PHOTO } from "@/lib/media";
import { DEFAULT_WEIGHTS, type Ranked, type Weights } from "@flamelens/shared/scoring";

/**
 * All of the experiments, ranked for the cabin. Picking one shows it here, with NASA's
 * photograph and the reasons for its rank, so the visitor never has to leave the dashboard.
 */

export type ExperimentCard = { title: string; oneLine: string; platform: string };

const FACTORS: { key: keyof Weights; label: string; help: string }[] = [
  { key: "conditions", label: "Conditions", help: "How closely this experiment's own tests surround the cabin's oxygen and pressure." },
  { key: "relevance", label: "NASA focus", help: "How directly NASA names the experiment as a spacecraft fire-safety study." },
  { key: "fuel", label: "Fuel", help: "Whether it burned the kind of fuel you are concerned with." },
  { key: "function", label: "Function", help: "How much it contributes to prevention, detection or suppression, weighted by your priority." },
  { key: "data", label: "Data", help: "How much there is to work with: itemized tests, reported variables, publications with a DOI." },
];

/** Why an experiment ranks where it does for the cabin, in a few words. */
export function reason(r: Ranked, level: number): string {
  const c = r.conditions;
  if (c.comparable > 0) return `${int(c.comparable)} ${c.comparable === 1 ? "test" : "tests"} close to this cabin`;
  if (c.nearest && c.nearest.p === null && c.nearest.d < 0.5) return "Tested at this oxygen level; pressure not reported";
  if (level === 3) return "Named by NASA as a fire-safety study";
  if (c.nearest) return `Nearest test is ${steps(c.nearest.d)} steps away`;
  return "No oxygen value in its table";
}

function note(r: Ranked): string {
  const c = r.conditions;
  if (c.noData) return "no oxygen value in PSI";
  if (c.comparable > 0) return `${int(c.comparable)} tests close to this cabin`;
  if (!c.nearest) return "";
  if (c.nearest.p !== null) return `nearest test ${steps(c.nearest.d)} steps away`;
  return c.nearest.d < 0.5 ? "oxygen matches, pressure unreported" : `oxygen ${steps(c.nearest.d)} steps off, pressure unreported`;
}

type Props = {
  ranked: Ranked[];
  cards: Record<string, ExperimentCard>;
  levels: Record<string, number>;
  /** The cabin, as a query string, so the full page of an experiment keeps it. */
  query: string;
  onAsk: (question: string) => void;
};

export function ExperimentsView({ ranked, cards, levels, query, onAsk }: Props) {
  const [picked, setPicked] = useState<string | null>(null);
  const index = Math.max(0, ranked.findIndex((r) => r.accession === picked));
  const r = ranked[index];
  if (!r) return null;
  const card = cards[r.accession];
  const photo = EXPERIMENT_PHOTO[r.accession];

  return (
    <div data-tour="top">
      <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Experiments: all {ranked.length}, ranked for this cabin</h2>
      <p className="mt-1 text-[12.5px] text-ink-3">The score ranks relevance to this cabin. It is not a safety rating.</p>

      <div className="mt-3 grid gap-x-5 gap-y-5 md:grid-cols-[minmax(0,17rem)_minmax(0,1fr)]">
        <ol className="max-h-[300px] overflow-y-auto border-y border-rule-2 md:max-h-[560px]">
          {ranked.map((item, i) => {
            const thumb = EXPERIMENT_PHOTO[item.accession];
            const active = i === index;
            return (
              <li key={item.accession}>
                <button type="button" aria-pressed={active} onClick={() => setPicked(item.accession)} className={`grid w-full grid-cols-[1.2rem_44px_minmax(0,1fr)_auto] items-center gap-x-2.5 border-b border-rule py-1.5 pl-1 pr-2 text-left transition-colors ${active ? "bg-wash shadow-[inset_3px_0_0_var(--color-ink)]" : "hover:bg-wash"}`}>
                  <span className="num text-right text-[11.5px] text-ink-3">{i + 1}</span>
                  {thumb ? <Image src={thumb.src} alt="" width={88} height={88} sizes="44px" className="size-11 rounded-xs object-cover" /> : <span className="size-11 rounded-xs bg-wash" />}
                  <span className="min-w-0">
                    <span className="block truncate text-[13.5px] font-medium">{item.short}</span>
                    <span className="block truncate text-[11.5px] text-ink-3">{note(item)}</span>
                  </span>
                  <span className="num text-[13.5px]">{item.total.toFixed(0)}</span>
                </button>
              </li>
            );
          })}
        </ol>

        <article className="min-w-0" aria-live="polite">
          {photo && (
            <figure>
              <Image key={photo.src} src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} sizes="(min-width: 1280px) 440px, 92vw" className="aspect-[16/9] w-full rounded-sm bg-wash object-cover" />
              <figcaption className="mt-1 text-[11.5px] leading-snug text-ink-3">
                {photo.caption}
                {photo.source && <> <a className="link" href={photo.source} target="_blank" rel="noreferrer">NASA&apos;s page for it</a></>}
              </figcaption>
            </figure>
          )}
          <p className="mt-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <span className="num rounded-xs bg-ink px-1.5 py-px text-[11.5px] font-medium text-white">#{index + 1} of {ranked.length}</span>
            <span className="text-[19px] font-semibold leading-tight tracking-[-0.01em]">{r.short}</span>
            {card && <span className="text-[12px] text-ink-3">{card.platform}</span>}
          </p>
          {card && <p className="mt-1.5 text-[14px] leading-relaxed">{card.oneLine}</p>}
          <p className="mt-1.5 text-[13px] font-medium text-accent">{reason(r, levels[r.accession])}</p>

          <dl className="mt-3 space-y-1.5">
            {FACTORS.map((f) => {
              const missing = f.key === "conditions" && r.conditions.noData;
              return (
                <div key={f.key} className="grid grid-cols-[7.6rem_minmax(0,1fr)_3rem] items-center gap-x-2.5" title={f.help}>
                  <dt className="whitespace-nowrap text-[12.5px] text-ink-2">{f.label} <span className="num text-[11px] text-ink-3">{Math.round(DEFAULT_WEIGHTS[f.key] * 100)}%</span></dt>
                  <dd className="h-[7px] rounded-full bg-wash">
                    {!missing && <span className="block h-full rounded-full bg-ink" style={{ width: `${Math.round(r.parts[f.key] * 100)}%` }} />}
                  </dd>
                  <dd className="num whitespace-nowrap text-right text-[12px] text-ink-2">{missing ? "none" : Math.round(r.parts[f.key] * 100)}</dd>
                </div>
              );
            })}
          </dl>
          <p className="mt-1.5 text-[11.5px] leading-snug text-ink-3">Each factor is scored out of 100. The percentage is its weight in the total score of {r.total.toFixed(0)}. <Link href="/methods#scoring" className="link">How the score works</Link></p>

          <p className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={() => onAsk(`What did ${r.short} find?`)}>Ask the SI about {r.short}</button>
            <Link className="btn" href={`/investigations/${r.accession}?${query}`}>Its full page <ArrowUpRight size={14} /></Link>
          </p>
        </article>
      </div>
    </div>
  );
}
