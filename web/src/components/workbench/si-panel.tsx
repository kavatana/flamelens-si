"use client";

import { ArrowRight, CaretDown } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { blockCsv, blockFileName, blockText, type BlockRecord, type CabinContext } from "@/lib/block";
import type { Briefing } from "@/lib/data";
import { int } from "@flamelens/shared/format";
import type { Funnel } from "@flamelens/shared/funnel";
import { sourceLabel } from "@/lib/labels";
import { firstWords, restWords, stageAt, wordsAt, type RevealPlan, type Span } from "@/lib/reveal";
import { AT_REST, stopRun, useRunTime } from "@/lib/run-clock";
import { SiActions, SiAskBox, SiSuggestions, SiTurns, type SiChat } from "../si-chat";

/**
 * The SI's side of the dashboard, as a list of blocks. Each press of Analyze adds one block:
 * the cabin, the checks made for it, the answer, and under it the questions asked about
 * that cabin. One block is open at a time; the others fold to a line and reopen on a click.
 * During a run the open block shows its work, check by check, then writes the answer.
 * The counts are the real ones, made by code; the explanation is the SI's.
 */

export type BlockSummary = { id: number; number: number; line: string; finding: string };

type Props = {
  /** Every analysis so far, oldest first. */
  blocks: BlockSummary[];
  /** The open block, or null when nothing has been analyzed. */
  activeId: number | null;
  onOpen: (id: number) => void;
  /** The open block's cabin, as it is sent with questions and feedback. */
  cabin: CabinContext | null;
  /** The open block as plain data, for its copy and export buttons. */
  record: () => BlockRecord;
  /** The visitor has changed the cabin on the left since the open block was made. */
  stale: boolean;
  funnel: Funnel;
  words: { verdict: string; next: string };
  plan: RevealPlan;
  meaning: string;
  briefing?: { body: Briefing; model: string };
  /** The caution speaks of the Moon, so it is left out for a cabin on Mars. */
  showCaution: boolean;
  names: Record<string, string>;
  chat: SiChat;
  /** The question sent when the visitor asks without typing one. */
  question: string;
  suggestions: string[];
  labHref: string;
};

/** Text that is written out word by word. The unwritten part keeps its room, so nothing below it moves. */
function Written({ text, span, t, className }: { text: string; span: Span; t: number; className?: string }) {
  const n = wordsAt(span, t);
  const writing = n > 0 && n < span.words;
  return (
    <span aria-hidden className={className}>
      {firstWords(text, n)}
      {writing && <span className="si-caret" />}
      <span className="opacity-0">{restWords(text, n)}</span>
    </span>
  );
}

export function SiPanel({ blocks, activeId, onOpen, cabin, record, stale, funnel, words, plan, meaning, briefing, showCaution, names, chat, question, suggestions, labHref }: Props) {
  const t = useRunTime();
  const running = t !== AT_REST;
  const stage = stageAt(plan, t);
  const done = stage === "done";
  const idle = blocks.length === 0;
  const stopAt = funnel.stop ? funnel.steps.indexOf(funnel.stop) : -1;
  const pending = plan.stepAt.findIndex((at) => t < at);
  const total = funnel.steps[0].n || 1;
  // The checks up to the first empty one are shown one by one; those after it were never reached.
  const live = stopAt < 0 ? funnel.steps : funnel.steps.slice(0, stopAt + 1);
  const unreached = stopAt < 0 ? [] : funnel.steps.slice(stopAt + 1);
  const number = blocks.find((b) => b.id === activeId)?.number ?? 1;
  const loose = chat.turns.filter((turn) => turn.block === null);
  // The open block is brought to the top when it opens and when a run starts in it.
  const open = useRef<HTMLElement>(null);
  useEffect(() => {
    const block = open.current;
    const pane = block?.parentElement;
    if (!block || !pane) return;
    const behavior = running ? "auto" : "smooth";
    // Where the panel scrolls by itself, only the panel moves, so the page stays where the visitor left it.
    if (getComputedStyle(pane).overflowY === "auto") pane.scrollTo({ top: block.getBoundingClientRect().top - pane.getBoundingClientRect().top + pane.scrollTop - 8, behavior });
    else block.scrollIntoView({ block: "start", behavior });
  }, [activeId, running]);

  return (
    <aside aria-label="SI analysis" className="panel flex min-h-0 flex-col overflow-hidden border-t-2 border-t-accent lg:h-full">
      <header className="border-b border-rule px-4 py-2.5">
        <p className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[14px] font-semibold">
            <span className={`si-orb ${running || chat.busy ? "is-busy" : ""}`} aria-hidden />
            SI analysis
          </span>
          <span className={`text-[12px] ${done && !chat.busy ? "text-ink-3" : "text-accent"}`} role="status">
            {!idle && stage === "reading" && <>Reading NASA&apos;s tables<span className="si-dots" aria-hidden /></>}
            {!idle && stage === "writing" && <>Writing the answer<span className="si-dots" aria-hidden /></>}
            {done && chat.busy && <>Looking it up<span className="si-dots" aria-hidden /></>}
            {done && !chat.busy && idle && "waiting for a cabin"}
            {done && !chat.busy && !idle && <span title="The counts are made by code from NASA's tables. The explanation is written by the SI, and each point quotes NASA.">{blocks.length === 1 ? "1 analysis" : `${blocks.length} analyses`} · counts by code</span>}
          </span>
        </p>
      </header>

      <div className="min-h-0 flex-1 space-y-2 bg-paper p-2 lg:overflow-y-auto">
        {idle && (
          <div className="rounded-sm border border-rule bg-surface px-3.5 py-3.5">
            <p className="text-[17px] font-semibold leading-snug tracking-[-0.01em]">Nothing is analyzed yet.</p>
          </div>
        )}

        {(idle || loose.length > 0) && (
          <div className="rounded-sm border border-rule bg-surface px-3.5 py-3">
            {loose.length === 0 ? (
              <>
                <p className="label mb-2">Or ask the SI</p>
                <SiSuggestions items={suggestions} onPick={chat.send} disabled={chat.busy} />
              </>
            ) : (
              <>
                <p className="label mb-3">Questions before any analysis</p>
                <SiTurns turns={loose} names={names} />
              </>
            )}
          </div>
        )}

        {blocks.map((block) => {
          const mine = chat.turns.filter((turn) => turn.block === block.id);
          if (block.id !== activeId) {
            return (
              <button key={block.id} type="button" onClick={() => onOpen(block.id)} title="Open this analysis again" className="group block w-full rounded-sm border border-rule bg-surface px-3.5 py-2.5 text-left transition-colors hover:border-ink-3">
                <span className="flex items-center justify-between gap-2">
                  <span className="num rounded-xs bg-wash px-1.5 py-px text-[11px] font-medium text-ink-2">Analysis {block.number}</span>
                  <span className="flex items-center gap-1 text-[11.5px] text-ink-3">{mine.length > 0 && `${mine.length} ${mine.length === 1 ? "question" : "questions"} · `}open <CaretDown size={12} /></span>
                </span>
                <span className="mt-1.5 block text-[12px] leading-snug text-ink-3">{block.line}</span>
                <span className="mt-1 block text-[13px] font-medium leading-snug text-ink-2 group-hover:text-ink">{block.finding}</span>
              </button>
            );
          }
          return (
            <section key={block.id} ref={open} aria-label={`Analysis ${block.number}`} className="scroll-mt-[68px] rounded-sm lg:scroll-mt-2 border border-ink bg-surface shadow-[0_1px_2px_rgba(20,23,26,0.05),0_12px_26px_-20px_rgba(20,23,26,0.45)]">
              <header className="border-b border-rule px-3.5 py-2.5">
                <p className="flex items-center justify-between gap-2">
                  <span className="num rounded-xs bg-ink px-1.5 py-px text-[11px] font-medium text-white">Analysis {block.number}</span>
                  {stale && <span className="text-[11.5px] font-medium text-caution">the cabin on the left has changed</span>}
                </p>
                <p className="mt-1.5 text-[12.5px] leading-snug text-ink-2">{block.line}</p>
              </header>

              {/* A click while it is still working shows the whole answer at once. */}
              <div onClick={running ? stopRun : undefined}>
                <div data-tour="briefing" className="px-3.5 py-3">
                  <ol className="space-y-1.5" aria-label="How many tests in NASA's tables are left after each check">
                    {live.map((step, i) => {
                      const shown = t >= plan.stepAt[i];
                      const isStop = i === stopAt;
                      const isLast = step === funnel.last && i > 0;
                      const width = step.n === 0 ? 0 : Math.max(1.5, Math.sqrt(step.n / total) * 100);
                      const who = step.from.slice(0, 3).map((f) => names[f.acc] ?? f.acc);
                      return (
                        <li key={step.id} className={`transition-opacity duration-200 ${shown ? "" : "opacity-35"}`}>
                          <span className="flex items-baseline justify-between gap-3 text-[13px] leading-snug">
                            <span className={isStop && shown ? "font-semibold" : ""}>{step.label}</span>
                            <span className={`num shrink-0 text-[13px] ${isStop && shown ? "font-semibold text-caution" : ""}`}>
                              {shown ? int(step.n) : i === pending ? <span className="si-dots text-accent" aria-label="checking" /> : ""}
                            </span>
                          </span>
                          {isStop ? (
                            <span className={`mt-1 inline-block rounded-xs bg-caution-wash px-2 py-0.5 text-[12px] font-medium text-caution transition-opacity duration-200 ${shown ? "" : "opacity-0"}`}>The evidence runs out here</span>
                          ) : (
                            <span className="mt-1 block h-[5px] rounded-full bg-wash" aria-hidden>
                              <span className={`block h-full rounded-full transition-[width] duration-300 ease-out ${i === 0 ? "bg-ink-3" : "bg-ink"}`} style={{ width: shown ? `${width}%` : 0 }} />
                            </span>
                          )}
                          {isLast && who.length > 0 && (
                            <span className={`mt-0.5 block text-[11.5px] text-ink-3 ${shown ? "" : "opacity-0"}`}>from {who.join(", ")}{step.from.length > 3 ? ` and ${step.from.length - 3} more` : ""}</span>
                          )}
                        </li>
                      );
                    })}
                    {unreached.length > 0 && (
                      <li className={`text-[12px] leading-snug text-ink-3 transition-opacity duration-200 ${t >= plan.stepAt[live.length] ? "" : "opacity-0"}`}>
                        Not reached: {unreached.map((step) => step.label.replace(/^And /, "").replace(/^./, (c) => c.toLowerCase())).join(", ")}
                      </li>
                    )}
                  </ol>

                  <p className="mt-3.5 text-[18px] font-semibold leading-[1.28] tracking-[-0.012em]">
                    <Written text={words.verdict} span={plan.verdict} t={t} />
                    <span className="sr-only" aria-live="polite">{words.verdict}</span>
                  </p>
                  <p className={`mt-3 border-l-[3px] pl-3 text-[13.5px] leading-relaxed transition-colors duration-300 ${t >= plan.next.start ? "border-accent" : "border-transparent"}`}>
                    <span className={`font-medium transition-opacity duration-200 ${t >= plan.next.start ? "" : "opacity-0"}`}>{funnel.stop ? "What would close the gap." : "What to check next."} </span>
                    <Written text={words.next} span={plan.next} t={t} className="text-ink-2" />
                    <span className="sr-only">{words.next}</span>
                  </p>
                </div>

                <div className="border-t border-rule px-3.5 py-3">
                  <p className={`label transition-opacity duration-200 ${plan.meaning && t >= plan.meaning.start ? "" : "opacity-0"}`}>What it means</p>
                  <p className="mt-1 text-[13.5px] leading-relaxed">
                    {plan.meaning && <Written text={meaning} span={plan.meaning} t={t} className={briefing ? "" : "text-ink-2"} />}
                    <span className="sr-only">{meaning}</span>
                  </p>
                </div>
              </div>

              <div className={`px-3.5 pb-3 transition-opacity duration-300 ${done ? "" : "opacity-0"}`} inert={!done}>
                {briefing && showCaution && <p className="rounded-xs bg-caution-wash px-3 py-2 text-[13px] leading-snug text-caution">{briefing.body.caution}</p>}
                {briefing && (
                  <details className="mt-3">
                    <summary className="link inline cursor-pointer text-[13px]">Why the SI says this: {briefing.body.points.length} points, each with NASA&apos;s words</summary>
                    <ul className="mt-3 space-y-3">
                      {briefing.body.points.map((point) => (
                        <li key={point.text} className="text-[13.5px] leading-relaxed">
                          <span>{point.text}</span>
                          <span className="quote mt-1.5 block text-[12.5px]">
                            &ldquo;{point.quote}&rdquo;{" "}
                            <span className="text-ink-3">
                              {sourceLabel(point.source)}, <Link className="link" href={`/investigations/${point.accession}`}>{names[point.accession]}</Link>
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
                <p className="mt-3 text-[12.5px]">
                  <Link className="link inline-flex items-center gap-1" href={labHref}>See NASA&apos;s tests near this air in the Flame Lab <ArrowRight size={13} /></Link>
                </p>
                <div className="mt-2 border-t border-rule">
                  <SiActions text={() => blockText(record())} json={record} csv={() => blockCsv(record())} name={() => blockFileName(record(), "json").replace(/\.json$/, "")} about={{ kind: "analysis", cabin }} />
                </div>

                <div className="mt-2 border-t border-rule pt-3">
                  {mine.length === 0 ? (
                    <>
                      <p className="label mb-2">Ask about this analysis</p>
                      <SiSuggestions items={suggestions} onPick={chat.send} disabled={chat.busy} />
                    </>
                  ) : (
                    <>
                      <p className="label mb-3">Your questions about analysis {block.number}</p>
                      <SiTurns turns={mine} names={names} />
                    </>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>

      <footer className="border-t border-rule px-3 py-2.5">
        <SiAskBox chat={chat} placeholder={idle ? "Ask the SI about NASA's fire tests" : `Ask about analysis ${number}`} fallback={question} />
      </footer>
    </aside>
  );
}
