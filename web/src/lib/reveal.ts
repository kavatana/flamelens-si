/**
 * The pace of one analysis run, after the visitor presses Analyze: first each check against
 * NASA's tables, one at a time, while the answer of each data view fills in; then the SI's
 * answer, written out word by word. The counts and the words are the real ones; only their
 * timing is set here.
 */

/** A piece of text written out word by word, between `start` and `end` milliseconds. */
export type Span = { start: number; end: number; words: number };

export type RevealPlan = {
  /** When each check appears, in milliseconds, in the order the checks are listed. */
  stepAt: number[];
  /** When the answer of each data view appears, in the order of the views. */
  tabAt: number[];
  verdict: Span;
  next: Span;
  /** The explanation, when there is one prepared for this cabin. */
  meaning: Span | null;
  /** When the links and buttons under the answer appear. */
  tail: number;
  total: number;
};

export const PACE = {
  /** Before the first check, so a cabin that is still being dragged does not flicker. */
  lead: 400,
  /** Between one check and the next. */
  step: 320,
  /** Checks after the one that came up empty are shown together, quickly. */
  skipped: 110,
  pause: 240,
  /** Milliseconds per word, for the headline and for running text. */
  headline: 36,
  text: 17,
};

const count = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

function span(start: number, text: string, perWord: number): Span {
  const words = count(text);
  return { start, end: start + words * perWord, words };
}

/**
 * `checks` is how many checks there are; `stopAt` is the index of the first one that left
 * no test, or -1 when every check found some.
 */
export function planReveal(input: { checks: number; stopAt: number; tabs?: number; verdict: string; next: string; meaning: string | null }): RevealPlan {
  const stepAt: number[] = [];
  let t = PACE.lead;
  for (let i = 0; i < input.checks; i++) {
    stepAt.push(t);
    t += input.stopAt >= 0 && i >= input.stopAt ? PACE.skipped : PACE.step;
  }
  const verdict = span(t + PACE.pause, input.verdict, PACE.headline);
  const next = span(verdict.end + PACE.pause / 2, input.next, PACE.text);
  const meaning = input.meaning === null ? null : span(next.end + PACE.pause, input.meaning, PACE.text);
  const tail = (meaning ?? next).end + PACE.pause / 2;
  // The views answer one after another while the checks run, the last of them before the writing starts.
  const tabs = input.tabs ?? 0;
  const tabAt = Array.from({ length: tabs }, (_, i) => PACE.lead + ((i + 1) * (verdict.start - PACE.lead)) / (tabs + 1));
  return { stepAt, tabAt, verdict, next, meaning, tail, total: tail + 200 };
}

/** How many words of a span are written at time `t`. */
export function wordsAt(s: Span, t: number): number {
  if (t >= s.end) return s.words;
  if (t <= s.start || s.words === 0) return 0;
  return Math.min(s.words, Math.floor(((t - s.start) / (s.end - s.start)) * s.words) + 1);
}

/** The first `n` words of a text, joined by single spaces. */
export function firstWords(text: string, n: number): string {
  if (n <= 0) return "";
  return text.trim().split(/\s+/).slice(0, n).join(" ");
}

/** The words after the first `n`, with the space that joins them to what is written. */
export function restWords(text: string, n: number): string {
  const parts = text.trim().split(/\s+/);
  if (n >= parts.length) return "";
  return `${n > 0 ? " " : ""}${parts.slice(Math.max(0, n)).join(" ")}`;
}

/** Which stage the panel is in at time `t`. */
export function stageAt(plan: RevealPlan, t: number): "reading" | "writing" | "done" {
  if (t >= plan.tail) return "done";
  return t < plan.verdict.start ? "reading" : "writing";
}
