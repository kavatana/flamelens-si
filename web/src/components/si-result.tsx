"use client";

import { ArrowRight, BookOpenText, Check, CheckCircle, CircleNotch, MagnifyingGlass, Rows, Target, WarningCircle } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { Fragment, useEffect, useState } from "react";
import { PHASE_LABEL, PHASE_VAR, int } from "@flamelens/shared/format";
import { EXPERIMENT_PHOTO } from "@/lib/media";
import type { AskResult, Card, Receipt } from "@flamelens/api/si";
import { RangeBar, SCALES } from "./range-bar";

const KIND_LABEL: Record<string, string> = {
  objective: "Objectives",
  approach: "Approach",
  hypothesis: "Hypothesis",
  impacts: "Stated impacts",
  publication: "Publication",
  "table-note": "Note in the PSI table",
  challenge: "NASA challenge statement",
};

const STEP_ICON: Record<string, typeof Rows> = {
  search_tests: Rows,
  get_experiment: BookOpenText,
  evidence_near_cabin: Target,
  search_nasa_text: MagnifyingGlass,
};

const CITATION = /(\[PSI-\d+(?:\/[a-z0-9-]+\/\d+)?\])/g;

/** Where the experiment's name last appears as a whole word in the text, or -1. */
function lastMention(text: string, name: string): number {
  const pattern = new RegExp(`(?<![\\w-])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\w-])`, "g");
  let at = -1;
  for (const m of text.matchAll(pattern)) at = m.index;
  return at;
}

/**
 * Turn [PSI-25] and [PSI-69/flex/12] in the answer into links, and keep paragraphs. When the
 * sentence already names the experiment, that name becomes the link and the tag is dropped.
 */
function Answer({ text, names, className = "space-y-3 text-[15.5px] leading-relaxed" }: { text: string; names: Record<string, string>; className?: string }) {
  return (
    <div className={className}>
      {text.split(/\n{2,}/).map((paragraph, i) => {
        const parts = paragraph.split(CITATION);
        const absorbed = new Set<number>();
        return (
          <p key={i}>
            {parts.map((part, j) => {
              const match = part.match(/^\[(PSI-\d+)(\/[a-z0-9-]+\/\d+)?\]$/);
              if (match) {
                if (absorbed.has(j)) return null;
                const [, acc, record] = match;
                return (
                  <Link key={j} href={record ? `/data?inv=${acc}&q=${encodeURIComponent(`${acc}${record}`)}` : `/investigations/${acc}`} className="link font-medium" title={record ? `Record ${acc}${record}` : `Open ${names[acc] ?? acc}`}>
                    {names[acc] ?? acc}{record ? `, row ${record.split("/")[2]}` : ""}
                  </Link>
                );
              }
              const next = parts[j + 1]?.match(/^\[(PSI-\d+)\]$/);
              const name = next ? names[next[1]] : undefined;
              const at = name ? lastMention(part, name) : -1;
              if (!name || at < 0) return <Fragment key={j}>{part}</Fragment>;
              absorbed.add(j + 1);
              return (
                <Fragment key={j}>
                  {part.slice(0, at)}
                  <Link href={`/investigations/${next![1]}`} className="link font-medium" title={`Open ${name}`}>{name}</Link>
                  {part.slice(at + name.length).replace(/\s+$/, "")}
                </Fragment>
              );
            })}
          </p>
        );
      })}
    </div>
  );
}

/**
 * Reveals the lookups one at a time, then the answer, so the reader sees what was
 * consulted before reading the conclusion. Returns how many lookups are done.
 */
function useReveal(total: number, ready: boolean): number {
  const [done, setDone] = useState(0);
  useEffect(() => {
    if (!ready || done > total) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const timer = window.setTimeout(() => setDone((n) => (reduce ? total + 1 : n + 1)), reduce ? 0 : 620);
    return () => window.clearTimeout(timer);
  }, [ready, done, total]);
  return done;
}

function Steps({ receipts, done }: { receipts: Receipt[]; done: number }) {
  return (
    <ol className="space-y-1.5">
      {receipts.slice(0, done + 1).map((r, i) => {
        const Icon = STEP_ICON[r.tool] ?? Rows;
        const finished = i < done;
        return (
          <li key={i} className="rise-in flex items-center gap-2.5 text-[13.5px]">
            <span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${finished ? "bg-accent-wash text-accent" : "bg-wash text-ink-3"}`}>
              {finished ? <Check size={13} weight="bold" /> : <CircleNotch size={13} className="animate-spin" />}
            </span>
            <Icon size={15} className="shrink-0 text-ink-3" />
            <span className={finished ? "text-ink-2" : "text-ink"}>{r.label}</span>
            {finished && <span className="num ml-auto shrink-0 text-ink">{r.count} {r.tool === "search_nasa_text" ? "passages" : "rows"}</span>}
          </li>
        );
      })}
    </ol>
  );
}

const OUTCOME_COLOR: Record<string, string> = { extinction: "#2a78d6", "burned to completion": "#eb6834", disruption: "#8b929b" };
const OUTCOME_LABEL: Record<string, string> = { extinction: "flame went out", "burned to completion": "burned all the fuel", disruption: "disrupted" };
const CARD_TITLE = "flex items-center gap-2 text-[12.5px] font-medium text-ink-2";

function CabinCard({ card, compact }: { card: Extract<Card, { kind: "cabin" }>; compact?: boolean }) {
  return (
    <div className="panel flex flex-col px-4 py-3.5 sm:col-span-2">
      <p className={CARD_TITLE}><Target size={15} /> Tests close to {card.oxygenPct}% oxygen at {card.pressureKpa} kPa</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {card.fuels.map((f) => (
          <div key={f.phase} className={`rounded-sm border border-rule ${compact ? "px-2 py-2" : "px-3 py-2.5"}`}>
            <p className="flex items-center gap-1.5 text-[12.5px] text-ink-2">
              <span className="inline-block size-2.5 rounded-full" style={{ background: PHASE_VAR[f.phase] }} />
              {PHASE_LABEL[f.phase]}
            </p>
            <p className="mt-1 text-[32px] font-semibold leading-none tracking-[-0.02em]" style={f.close > 0 ? undefined : { color: "var(--color-ink-3)" }}>{int(f.close)}</p>
            <p className="mt-1 text-[12px] leading-snug text-ink-3">
              {f.close > 0 ? "tests close" : f.nearest ? `nearest: ${f.nearest.name}, ${f.nearest.steps} steps away` : "no test with oxygen and pressure"}
            </p>
          </div>
        ))}
      </div>
      {card.top.length > 0 && (
        <div className="mt-4">
          <p className="text-[12.5px] text-ink-2">Most relevant experiments for this cabin{card.focus ? `, for ${PHASE_LABEL[card.focus].toLowerCase()}` : ""}</p>
          <ol className="mt-1.5 space-y-1.5">
            {card.top.map((r, i) => (
              <li key={r.acc} className={`grid grid-cols-[1.1rem_7rem_1fr_1.8rem] items-center gap-2 text-[12.5px] ${compact ? "" : "sm:grid-cols-[1.1rem_7rem_1fr_9rem_1.8rem]"}`}>
                <span className="num text-ink-3">{i + 1}</span>
                <Link href={`/investigations/${r.acc}`} className="link truncate font-medium">{r.name}</Link>
                <span className="h-2 rounded-full bg-wash"><span className="block h-full rounded-full bg-ink" style={{ width: `${r.score}%` }} /></span>
                {!compact && <span className="hidden truncate text-ink-3 sm:block">{r.close > 0 ? `${int(r.close)} tests close` : "no test close"}</span>}
                <span className="num text-right">{r.score}</span>
              </li>
            ))}
          </ol>
          <p className="mt-1.5 text-[11.5px] text-ink-3">The score ranks relevance, from 0 to 100. It is not a safety rating.</p>
        </div>
      )}
      <Link href={`/explore?o2=${card.oxygenPct}&p=${card.pressureKpa}${card.focus ? `&fuel=${card.focus}` : ""}`} className="link mt-3 self-start text-[13px]">Open this cabin on the dashboard</Link>
    </div>
  );
}

function TestsCard({ card }: { card: Extract<Card, { kind: "tests" }> }) {
  const top = Math.max(...card.experiments.map((e) => e.n), 1);
  const outcomeTotal = card.outcomes.reduce((sum, o) => sum + o.n, 0);
  return (
    <div className="panel flex flex-col px-4 py-3.5">
      <p className={CARD_TITLE}><Rows size={15} /> {card.title}</p>
      <p className="mt-2 text-[32px] font-semibold leading-none tracking-[-0.02em]">{int(card.total)} <span className="text-[13px] font-normal tracking-normal text-ink-2">test rows</span></p>
      {card.experiments.length > 1 && (
        <ul className="mt-3 space-y-1.5">
          {card.experiments.slice(0, 5).map((e) => (
            <li key={e.acc} className="grid grid-cols-[6rem_1fr_2rem] items-center gap-2 text-[12.5px]">
              <Link href={`/investigations/${e.acc}`} className="link truncate">{e.name}</Link>
              <span className="h-2 rounded-full bg-wash"><span className="block h-full rounded-full bg-ink" style={{ width: `${(100 * e.n) / top}%` }} /></span>
              <span className="num text-right">{e.n}</span>
            </li>
          ))}
        </ul>
      )}
      {outcomeTotal > 0 && (
        <div className="mt-3">
          <p className="text-[12px] text-ink-3">How they ended</p>
          <div className="mt-1 flex h-3 overflow-hidden rounded-full bg-wash">
            {card.outcomes.map((o) => <span key={o.label} title={`${OUTCOME_LABEL[o.label] ?? o.label}: ${o.n}`} style={{ width: `${(100 * o.n) / outcomeTotal}%`, background: OUTCOME_COLOR[o.label] ?? "var(--color-ink-3)" }} />)}
          </div>
          <ul className="mt-1.5 flex flex-wrap gap-x-3.5 gap-y-1 text-[12px] text-ink-2">
            {card.outcomes.map((o) => (
              <li key={o.label} className="flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-full" style={{ background: OUTCOME_COLOR[o.label] ?? "var(--color-ink-3)" }} />{OUTCOME_LABEL[o.label] ?? o.label} <span className="num">{o.n}</span></li>
            ))}
          </ul>
        </div>
      )}
      {card.oxygenPct && (
        <div className="mt-3">
          <p className="mb-1.5 flex justify-between text-[12px] text-ink-3"><span>Oxygen in the air</span><span className="num text-ink">{card.oxygenPct[0]}% to {card.oxygenPct[1]}%</span></p>
          <RangeBar scale={SCALES.o2} range={{ min: card.oxygenPct[0] / 100, max: card.oxygenPct[1] / 100 }} />
        </div>
      )}
      {card.flow && <p className="mt-2 text-[12.5px] text-ink-2">Airflow is listed in {card.flow.rows} rows: <span className="num text-ink">{card.flow.min === card.flow.max ? card.flow.min : `${card.flow.min} to ${card.flow.max}`} cm/s</span></p>}
      <Link href={card.href} className="link mt-auto self-start pt-3 text-[13px]">Open these rows in the data</Link>
    </div>
  );
}

function ExperimentCard({ card }: { card: Extract<Card, { kind: "experiment" }> }) {
  const photo = EXPERIMENT_PHOTO[card.acc];
  return (
    <Link href={`/investigations/${card.acc}`} className="panel group flex flex-col overflow-hidden transition-colors hover:border-ink-3">
      {photo && <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} className="aspect-[16/6] w-full bg-ink object-cover" />}
      <span className="flex min-w-0 flex-1 flex-col px-4 py-3.5">
        <span className={CARD_TITLE}><BookOpenText size={15} /> Experiment record</span>
        <span className="mt-1.5 flex items-baseline gap-2">
          <span className="text-[17px] font-semibold group-hover:underline group-hover:underline-offset-4">{card.name}</span>
          <span className="tag">{card.level}</span>
        </span>
        <span className="mt-1 text-[12.5px] leading-snug text-ink-2">{card.summary}</span>
        <span className="mt-2 text-[12px] text-ink-3">
          <span className="num text-ink">{int(card.rows)}</span> rows{card.fuels.length > 0 && <> · {card.fuels.join(", ")}</>}
        </span>
        {card.oxygenPct && (
          <span className="mt-auto block pt-2">
            <span className="mb-1.5 flex justify-between text-[12px] text-ink-3"><span>Oxygen tested</span><span className="num text-ink">{card.oxygenPct[0]}% to {card.oxygenPct[1]}%</span></span>
            <RangeBar scale={SCALES.o2} range={{ min: card.oxygenPct[0] / 100, max: card.oxygenPct[1] / 100 }} />
          </span>
        )}
      </span>
    </Link>
  );
}

function PassagesCard({ card, names }: { card: Extract<Card, { kind: "passages" }>; names: Record<string, string> }) {
  return (
    <div className="panel px-4 py-3.5">
      <p className={CARD_TITLE}><MagnifyingGlass size={15} /> NASA&apos;s own words</p>
      <ul className="mt-2 space-y-2.5">
        {card.hits.map((hit, i) => (
          <li key={i}>
            <p className="quote text-[13px] leading-relaxed">&ldquo;{hit.snippet}&rdquo;</p>
            {hit.acc && <p className="mt-1 text-[12px] text-ink-3">From the record of <Link className="link" href={`/investigations/${hit.acc}`}>{names[hit.acc] ?? hit.acc}</Link></p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Cards({ cards, names, compact }: { cards: Card[]; names: Record<string, string>; compact?: boolean }) {
  // The same experiment can be looked up twice; show it once.
  const seen = new Set<string>();
  const unique = cards.filter((c) => {
    const key = c.kind === "experiment" ? `e:${c.acc}` : c.kind === "tests" ? `t:${c.href}` : c.kind === "cabin" ? `c:${c.oxygenPct}:${c.pressureKpa}` : `p:${c.query}`;
    return seen.has(key) ? false : (seen.add(key), true);
  });
  return (
    <div className={`grid gap-2 ${compact ? "" : "sm:grid-cols-2"}`}>
      {unique.map((card, i) => (
        <div key={i} className="rise-in contents" style={{ animationDelay: `${i * 90}ms` }}>
          {card.kind === "cabin" ? <CabinCard card={card} compact={compact} /> : card.kind === "tests" ? <TestsCard card={card} /> : card.kind === "experiment" ? <ExperimentCard card={card} /> : <PassagesCard card={card} names={names} />}
        </div>
      ))}
    </div>
  );
}

function SiResult({ result, names, compact }: { result: Extract<AskResult, { mode: "si" }>; names: Record<string, string>; compact?: boolean }) {
  const { check, receipts, cards } = result;
  const done = useReveal(receipts.length, true);
  const finished = done > receipts.length || receipts.length === 0;
  const allFound = check.total === check.found;
  const cabin = cards.find((c) => c.kind === "cabin");
  const droplets = cards.some((c) => (c.kind === "experiment" && c.acc === "PSI-69") || (c.kind === "tests" && c.experiments.some((e) => e.acc === "PSI-69")));
  if (!finished) {
    return (
      <div className="rounded-sm border border-rule bg-surface px-4 py-3">
        <p className="label mb-2">Looking it up in the data</p>
        <Steps receipts={receipts} done={Math.min(done, receipts.length)} />
      </div>
    );
  }
  return (
    <div className="rise-in">
      {result.matched && <p className="mb-3 text-[12.5px] text-ink-3">Answering the closest prepared question: &ldquo;{result.matched}&rdquo;</p>}
      {result.short && (
        <div className="border-l-[3px] border-accent pl-4">
          <p className="flex items-center gap-2 text-[12.5px] font-medium text-accent"><span className="num rounded-xs border border-accent px-1 text-[10.5px] leading-[1.35]">SI</span>The short answer</p>
          <p className={`mt-1 max-w-[44ch] font-semibold leading-[1.25] tracking-[-0.015em] ${compact ? "text-[18px]" : "text-[24px]"}`}>{result.short}</p>
        </div>
      )}

      {cards.length > 0 && (
        <div className="mt-6">
          <p className="label mb-2">What the data shows</p>
          <Cards cards={cards} names={names} compact={compact} />
        </div>
      )}

      {result.answer && !compact && (
        <div className="mt-6 max-w-[70ch]">
          <p className="label mb-2">What it means</p>
          <Answer text={result.answer} names={names} />
        </div>
      )}
      {result.answer && compact && (
        <details className="mt-4">
          <summary className="link inline cursor-pointer text-[13.5px]">What it means</summary>
          <Answer text={result.answer} names={names} className="mt-2 space-y-2.5 text-[14px] leading-relaxed" />
        </details>
      )}

      {result.unknown && (
        <div className="mt-5 max-w-[70ch] rounded-sm border border-dashed border-rule-2 px-4 py-3" style={{ backgroundImage: "repeating-linear-gradient(135deg, transparent 0 9px, var(--color-wash) 9px 10px)" }}>
          <p className="text-[12.5px] font-medium text-ink-2">What this archive cannot tell you</p>
          <Answer text={result.unknown} names={names} className="mt-1 space-y-2 text-[15px] leading-relaxed" />
        </div>
      )}

      <p className={`mt-5 flex max-w-[70ch] items-start gap-2 rounded-xs px-3 py-2 text-[13.5px] ${allFound ? "bg-accent-wash text-ink-2" : "bg-caution-wash text-caution"}`}>
        {allFound ? <CheckCircle size={17} weight="fill" className="mt-px shrink-0 text-accent" /> : <WarningCircle size={17} weight="fill" className="mt-px shrink-0" />}
        <span>
          {check.total === 0
            ? "This answer states no figures."
            : allFound
              ? `Checked: all ${check.total} figures in this answer appear in the data that was looked up.`
              : `${check.found} of ${check.total} figures appear in the data that was looked up. Not found: ${check.missing.join(", ")}. Treat those with care.`}
        </span>
      </p>

      {(cabin || droplets) && (
        <p className="mt-4 flex flex-wrap gap-2">
          {cabin && cabin.kind === "cabin" && <Link className="btn" href={`/explore?o2=${cabin.oxygenPct}&p=${cabin.pressureKpa}`}>See this cabin on the dashboard <ArrowRight size={14} /></Link>}
          {droplets && <Link className="btn" href="/lab">Replay these tests in the Flame Lab <ArrowRight size={14} /></Link>}
        </p>
      )}

      <details className="mt-4 max-w-[70ch]">
        <summary className="link inline cursor-pointer text-[13px] text-ink-2">How the SI got here: {receipts.length} {receipts.length === 1 ? "lookup" : "lookups"} in the data</summary>
        <div className="mt-2 rounded-sm border border-rule bg-surface px-4 py-3">
          <Steps receipts={receipts} done={receipts.length} />
        </div>
        <p className="mt-2 text-[12px] text-ink-3">
          {result.prepared
            ? "Prepared answer. The lookups ran on the database just now; the wording was written ahead of time by the SI. An interpretation of the evidence, not a safety assessment."
            : `Generated by ${result.model}. An interpretation of the evidence, not a safety assessment.`}
        </p>
      </details>
    </div>
  );
}

export type Entry = { id: number; question: string; result?: AskResult; error?: string };

export function Result({ entry, names, compact }: { entry: Entry; names: Record<string, string>; compact?: boolean }) {
  const { result, error } = entry;
  if (error) return <p className="text-[14.5px] text-caution">{error}</p>;
  if (!result) {
    return (
      <div aria-busy="true" className="rounded-sm border border-rule bg-surface px-4 py-3">
        <p className="flex items-center gap-2.5 text-[13.5px] text-ink-2">
          <CircleNotch size={15} className="animate-spin text-accent" /> Reading your question
        </p>
      </div>
    );
  }
  if (result.mode === "si") return <SiResult result={result} names={names} compact={compact} />;
  return (
    <div>
      <p className="rounded-xs bg-wash px-3 py-2 text-[13.5px] text-ink-2">{result.reason}</p>
      {result.passages.length === 0 ? (
        <p className="mt-4 text-[15px] text-ink-2">Nothing in NASA&apos;s text matches those words. Try naming a fuel, a material or an experiment.</p>
      ) : (
        <ul className="mt-4 space-y-4">
          {result.passages.map((p, i) => (
            <li key={i}>
              <p className="text-[13px] text-ink-3">
                {KIND_LABEL[p.kind] ?? p.kind}
                {p.accession && <> · <Link className="link" href={`/investigations/${p.accession}`}>{names[p.accession] ?? p.accession}</Link></>}
              </p>
              <p className="quote mt-1 text-[14.5px]">&ldquo;{p.snippet}&rdquo;</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
