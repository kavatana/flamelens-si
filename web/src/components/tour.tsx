"use client";

import { X } from "@phosphor-icons/react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocationSearch } from "@/lib/use-location-search";

export type TourStep = {
  /** CSS selector of the element to spotlight. */
  target: string;
  title: string;
  body: string;
  /** The view of the page that holds the target, when the page has several. */
  view?: string;
};

const SEEN_KEY = "flamelens-tour-seen";
const PAD = 8;
const CARD_W = 340;

type Rect = { top: number; left: number; width: number; height: number };

const noSubscription = () => () => {};
function readSeen(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true; // storage blocked: do not nag
  }
}

/**
 * A guided tour: dims the page, spotlights one part at a time and explains it.
 * Starts when the URL has ?tour=1 or the visitor clicks the invitation.
 * Offered once per browser; never forced.
 */
export function Tour({ steps, onStep }: { steps: TourStep[]; onStep?: (step: TourStep) => void }) {
  // `undefined` means the visitor has not started or closed the tour yet, so the link decides.
  const [picked, setPicked] = useState<number | null | undefined>(undefined);
  const [dismissed, setDismissed] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  // The card's real height, so it can be kept fully on screen whatever the step says.
  const card = useRef<HTMLDivElement>(null);
  const [cardH, setCardH] = useState(230);
  const wanted = new URLSearchParams(useLocationSearch()).get("tour") === "1";
  const seen = useSyncExternalStore(noSubscription, readSeen, () => true);
  const index = picked === undefined ? (wanted ? 0 : null) : picked;
  const invite = index === null && !seen && !dismissed;

  const finish = useCallback(() => {
    try {
      window.localStorage.setItem(SEEN_KEY, "1");
    } catch {
      // storage blocked: the tour simply will not be remembered
    }
    setPicked(null);
    setDismissed(true);
  }, []);

  const step = index === null ? null : steps[index];

  // Bring the target into view, then measure it. Re-measure on resize and scroll.
  // The page may first have to bring the target on screen, so it is looked for until it is there.
  const announce = useRef(onStep);
  useEffect(() => {
    announce.current = onStep;
  });
  useLayoutEffect(() => {
    if (!step) return;
    announce.current?.(step);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let el: Element | null = null;
    const measure = () => {
      if (!el || !el.isConnected) {
        el = document.querySelector(step.target);
        if (!el) return;
        el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
      }
      const r = el.getBoundingClientRect();
      setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
      if (card.current) setCardH(card.current.offsetHeight);
    };
    measure();
    const timer = window.setInterval(measure, 120);
    window.addEventListener("resize", measure);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("resize", measure);
    };
  }, [step]);

  useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      if (e.key === "ArrowRight") setPicked(Math.min(steps.length - 1, index + 1));
      if (e.key === "ArrowLeft") setPicked(Math.max(0, index - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, steps.length, finish]);

  if (index === null) {
    if (!invite) return null;
    return (
      <div role="status" className="panel fixed bottom-20 right-5 z-40 flex max-w-[340px] items-start gap-3 px-4 py-3.5 shadow-[0_10px_34px_-12px_rgba(20,23,26,0.4)] lg:bottom-5 lg:left-1/2 lg:right-auto lg:-translate-x-1/2">
        <div>
          <p className="text-[14.5px] font-semibold">First time here?</p>
          <p className="mt-0.5 text-[13.5px] leading-snug text-ink-2">A one-minute tour shows what each part of this page does.</p>
          <div className="mt-2.5 flex gap-2">
            <button type="button" className="btn btn-accent" onClick={() => setPicked(0)}>Take the tour</button>
            <button type="button" className="btn" onClick={finish}>No thanks</button>
          </div>
        </div>
        <button type="button" className="btn shrink-0 border-transparent px-1.5" aria-label="Dismiss" onClick={finish}><X size={14} /></button>
      </div>
    );
  }

  if (!step || !rect) return null;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Below the spotlight if it fits, else above it, else beside it, else at the bottom of the screen over it.
  const below = rect.top + rect.height + 12;
  const above = rect.top - 12 - cardH;
  const fitsBelow = below + cardH <= vh - 12;
  const fitsAbove = above >= 12;
  const right = rect.left + rect.width + 12;
  const beside = fitsBelow || fitsAbove ? null : right + CARD_W <= vw - 12 ? right : rect.left - 12 - CARD_W >= 12 ? rect.left - 12 - CARD_W : null;
  const top = beside !== null ? Math.min(Math.max(12, rect.top), vh - cardH - 12) : fitsBelow ? below : fitsAbove ? above : Math.max(12, vh - cardH - 12);
  const left = beside ?? Math.min(Math.max(12, rect.left), vw - CARD_W - 12);
  const last = index === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={`Tour, step ${index + 1} of ${steps.length}: ${step.title}`}>
      {/* The spotlight: a transparent window whose shadow dims everything else. */}
      <div
        className="pointer-events-none absolute rounded-sm transition-all duration-300 ease-out"
        style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, boxShadow: "0 0 0 9999px rgba(20, 23, 26, 0.58), 0 0 0 2px #ffffff" }}
      />
      <div className="absolute inset-0" onClick={finish} aria-hidden />
      <div ref={card} className="panel absolute px-4 py-4 shadow-[0_14px_40px_-10px_rgba(20,23,26,0.5)] transition-all duration-300 ease-out" style={{ top, left, width: Math.min(CARD_W, vw - 24) }}>
        <p className="num text-[12px] text-ink-3">{index + 1} of {steps.length}</p>
        <p className="mt-1 text-[16px] font-semibold leading-snug">{step.title}</p>
        <p className="mt-1.5 text-[14px] leading-relaxed text-ink-2">{step.body}</p>
        <div className="mt-3.5 flex items-center justify-between gap-2">
          <button type="button" className="link text-[13px] text-ink-3" onClick={finish}>Skip the tour</button>
          <span className="flex gap-2">
            {index > 0 && <button type="button" className="btn" onClick={() => setPicked(index - 1)}>Back</button>}
            <button type="button" className="btn btn-accent" autoFocus onClick={() => (last ? finish() : setPicked(index + 1))}>{last ? "Done" : "Next"}</button>
          </span>
        </div>
      </div>
    </div>
  );
}
