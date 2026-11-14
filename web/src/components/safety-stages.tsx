"use client";

import { ArrowRight } from "@phosphor-icons/react";
import Image from "next/image";
import { useState, type ReactNode } from "react";
import { AskButton } from "./ask-button";

export type Stage = {
  id: string;
  /** NASA's photograph of the work behind this job. */
  photo: { src: string; alt: string; caption: string };
  /** When in a fire this job matters, and its name. */
  when: string;
  label: string;
  plain: string;
  /** The one number to remember, and what it counts. */
  figure: string;
  figureNote: string;
  chart: ReactNode;
  becomes: string;
  nasa: string;
  earth: ReactNode;
  experiments: ReactNode;
  question: string;
};

/**
 * Fire safety as one line through time: before a fire, its first seconds, while it burns.
 * One moment is open at a time, so the whole of it fits a screen. On the left is NASA's
 * photograph of the work, with the number to remember; on the right are the measurements,
 * what they become on a spacecraft, and what they mean on Earth.
 */
export function SafetyStages({ stages }: { stages: Stage[] }) {
  const [open, setOpen] = useState(0);
  const stage = stages[open];
  const move = (by: number) => setOpen((at) => (at + by + stages.length) % stages.length);

  return (
    <div>
      <div role="tablist" aria-label="The three jobs of fire safety" className="relative grid grid-cols-3 gap-2" onKeyDown={(e) => (e.key === "ArrowRight" ? move(1) : e.key === "ArrowLeft" ? move(-1) : null)}>
        {/* The line through time. It is lit as far as the moment in view. */}
        <span className="pointer-events-none absolute left-[16.67%] right-[16.67%] top-[21px] hidden h-px bg-rule-2 sm:block" aria-hidden>
          <span className="block h-[2px] -translate-y-px rounded-full bg-accent transition-[width] duration-500 ease-out" style={{ width: `${(open / (stages.length - 1)) * 100}%` }} />
        </span>
        {stages.map((s, i) => {
          const on = i === open;
          return (
            <button key={s.id} type="button" role="tab" id={`stage-tab-${s.id}`} aria-selected={on} aria-controls="stage-panel" tabIndex={on ? 0 : -1} onClick={() => setOpen(i)} className="group relative flex flex-col items-center gap-1.5 rounded-sm px-2 pb-2.5 pt-1 text-center transition-colors hover:bg-wash">
              <span className={`num relative flex size-[34px] items-center justify-center rounded-full border text-[14px] font-semibold transition-colors duration-300 ${on ? "border-accent bg-accent text-white" : i < open ? "border-accent bg-surface text-accent" : "border-rule-2 bg-surface text-ink-2 group-hover:border-ink-3"}`}>{i + 1}</span>
              <span className="text-[12px] text-ink-3">{s.when}</span>
              <span className={`text-[15px] leading-tight sm:text-[18px] ${on ? "font-semibold text-ink" : "font-medium text-ink-2"}`}>{s.label}</span>
            </button>
          );
        })}
      </div>

      <section id="stage-panel" role="tabpanel" aria-labelledby={`stage-tab-${stage.id}`} className="mt-3 grid overflow-hidden rounded-sm border border-rule bg-surface shadow-[0_1px_2px_rgba(20,23,26,0.05),0_18px_40px_-28px_rgba(20,23,26,0.45)] lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex flex-col border-b border-rule lg:border-b-0 lg:border-r">
          <figure key={`${stage.id}-photo`} className="rise-in relative h-[236px] border-b border-rule bg-ink sm:h-[268px]">
            <Image src={stage.photo.src} alt={stage.photo.alt} fill priority sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-4 pb-2.5 pt-8 text-[12px] leading-snug text-white/90">{stage.photo.caption}</figcaption>
          </figure>
          <div key={stage.id} className="rise-in flex flex-1 flex-col px-6 pb-6 pt-5">
            <div className="flex items-end gap-4">
              <p className="num text-[50px] font-semibold leading-[0.9] tracking-[-0.03em] text-accent-ink">{stage.figure}</p>
              <p className="max-w-[28ch] pb-0.5 text-[13.5px] leading-snug text-ink-2">{stage.figureNote}</p>
            </div>
            <p className="mt-4 border-t border-rule pt-4 text-[15.5px] leading-relaxed">{stage.plain}</p>
            <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
              <AskButton question={stage.question} className="btn btn-accent">Ask the SI</AskButton>
              <button type="button" className="btn" onClick={() => move(1)}>
                Next: {stages[(open + 1) % stages.length].label} <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>

        <div key={stage.id} className="rise-in grid content-start gap-x-8 gap-y-6 px-6 py-6 xl:grid-cols-2">
          <div>
            <p className="label mb-3">What the experiments measured</p>
            {stage.chart}
          </div>
          <div className="flex flex-col gap-5">
            <div className="rounded-sm border-l-[3px] border-accent bg-accent-wash px-4 py-3.5">
              <p className="text-[12.5px] font-medium text-accent-ink">What it becomes on a spacecraft</p>
              <p className="mt-1 text-[16px] font-medium leading-snug">{stage.becomes}</p>
            </div>
            {stage.earth}
            <div>
              <p className="label mb-2">Experiments that inform it</p>
              {stage.experiments}
            </div>
            <details className="text-[12.5px]">
              <summary className="cursor-pointer text-ink-3 hover:text-ink">NASA&apos;s words</summary>
              <p className="quote mt-2 text-[12.5px]">&ldquo;{stage.nasa}&rdquo; <span className="text-ink-3">NASA challenge statement</span></p>
            </details>
          </div>
        </div>
      </section>
    </div>
  );
}
