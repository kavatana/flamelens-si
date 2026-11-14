"use client";

import { useSyncExternalStore } from "react";

/**
 * The clock of one analysis run. It starts when the visitor asks for an analysis and stops
 * when everything has been shown. Only the few parts of the page that show the run in
 * progress listen to it, so the charts are not redrawn on every tick.
 */

/** The time when no run is in progress: everything is shown. */
export const AT_REST = Number.POSITIVE_INFINITY;

let now = AT_REST;
let timer: number | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/** Ends the run at once and shows everything. */
export function stopRun() {
  if (timer !== null) window.clearInterval(timer);
  timer = null;
  if (now === AT_REST) return;
  now = AT_REST;
  emit();
}

/** Starts a run that lasts `total` milliseconds. Visitors who ask for reduced motion get the result at once. */
export function startRun(total: number) {
  stopRun();
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const start = performance.now();
  now = 0;
  emit();
  timer = window.setInterval(() => {
    const elapsed = performance.now() - start;
    if (elapsed >= total) stopRun();
    else {
      now = elapsed;
      emit();
    }
  }, 40);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Milliseconds since the run began, or `AT_REST` when none is in progress. */
export function useRunTime(): number {
  return useSyncExternalStore(subscribe, () => now, () => AT_REST);
}
