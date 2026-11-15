"use client";

import { ArrowRight, ArrowUp, BracketsCurly, Check, Copy, FileCsv, Microphone, SpeakerHigh, Stop, ThumbsDown } from "@phosphor-icons/react";
import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, createContext, useContext, useMemo, type ReactNode } from "react";
import type { CabinContext } from "@/lib/block";
import { QUESTION_LIMIT, joinSpeech } from "@/lib/dictation";
import { requestIn, type Action, type DockCabin } from "@/lib/requests";
import { forSpeech } from "@/lib/speech";
import type { AskResult } from "@flamelens/api/si";
import { Result } from "./si-result";
import { useDictation } from "./use-dictation";

/**
 * The SI's conversation, as it appears inside each feature: the visitor asks, by typing or
 * by speaking, and the answer is written underneath, in the same panel. Simple requests ("open FLEX", "show me the rover
 * for fabric") are recognised by plain rules, not by a model, and carried out by the page.
 */

/** One question and what came back. `block` is the analysis it was asked under, or null when it was asked outside one. */
const ASK_EVENT = "flamelens:ask";

/** Hands a question to the SI panel beside the page, from anywhere on the page. */
export function askTheSi(question: string) {
  window.dispatchEvent(new CustomEvent(ASK_EVENT, { detail: question }));
}

/** Calls `onAsk` whenever the page hands the SI a question. */
export function useAsked(onAsk: (question: string) => void) {
  const latest = useRef(onAsk);
  useEffect(() => {
    latest.current = onAsk;
  });
  useEffect(() => {
    const heard = (event: Event) => {
      const question = (event as CustomEvent<unknown>).detail;
      if (typeof question === "string") latest.current(question);
    };
    window.addEventListener(ASK_EVENT, heard);
    return () => window.removeEventListener(ASK_EVENT, heard);
  }, []);
}

/** What the SI needs to carry out a typed request: the experiments by name, and NASA's cabins as dashboard links. Set once, around the whole site. */
type SiWorld = { names: Record<string, string>; cabins: DockCabin[] };
const World = createContext<SiWorld>({ names: {}, cabins: [] });

export function SiProvider({ names, cabins, children }: SiWorld & { children: ReactNode }) {
  const value = useMemo(() => ({ names, cabins }), [names, cabins]);
  return <World.Provider value={value}>{children}</World.Provider>;
}

export const useSiWorld = () => useContext(World);

export type Turn = { id: number; text: string; block: number | null; cabin?: CabinContext; action?: Action; result?: AskResult; error?: string };

type Options = {
  names: Record<string, string>;
  cabins: DockCabin[];
  /** Carries out a request the visitor typed, such as opening a cabin or a page. */
  onAction: (action: Action) => void;
  /** What the page is about, added to a question that does not name it. */
  about?: string;
  /** The analysis questions belong to right now. Its cabin goes to the server with each question. */
  scope?: { block: number; cabin: CabinContext } | null;
};

export type SiChat = { turns: Turn[]; busy: boolean; send: (text: string) => void; clear: () => void };

export function useSiChat({ names, cabins, onAction, about, scope = null }: Options): SiChat {
  const [turns, setTurns] = useState<Turn[]>([]);
  const counter = useRef(0);
  const busy = turns.some((t) => !t.action && !t.result && !t.error);

  async function send(text: string) {
    const q = text.trim();
    if (q.length < 3 || busy) return;
    const id = (counter.current += 1);
    const action = requestIn(q, names, cabins);
    if (action) {
      setTurns((list) => [...list, { id, text: q, block: scope?.block ?? null, action }]);
      onAction(action);
      return;
    }
    setTurns((list) => [...list, { id, text: q, block: scope?.block ?? null, cabin: scope?.cabin }]);
    const question = about && !q.toLowerCase().includes(about.toLowerCase()) ? `${q} (about ${about})`.slice(0, QUESTION_LIMIT) : q;
    try {
      const post = () => fetch("/api/ask", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question, cabin: scope?.cabin }) });
      let response = await post();
      // The server was busy for a moment: one more try, quietly, before the visitor is told.
      if (response.status >= 500) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        response = await post();
      }
      const body = await response.json();
      setTurns((list) => list.map((t) => (t.id === id ? (response.ok ? { ...t, result: body as AskResult } : { ...t, error: body.error ?? "The request failed." }) : t)));
    } catch {
      setTurns((list) => list.map((t) => (t.id === id ? { ...t, error: "The request could not be sent. Check your connection and try again." } : t)));
    }
  }

  return { turns, busy, send, clear: () => setTurns([]) };
}

/** An answer as plain words, for the clipboard and for exports. */
export function answerText(result: AskResult): string {
  if (result.mode === "si") return [result.short, result.answer, result.unknown].filter(Boolean).join("\n\n");
  return [result.reason, ...result.passages.map((p) => `"${p.snippet}" (${p.title})`)].join("\n\n");
}

function download(name: string, type: string, body: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([body], { type }));
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

type ActionsProps = {
  /** What Copy puts on the clipboard. */
  text: () => string;
  /** What Listen reads aloud, where that is not the same: an answer without its question. */
  spoken?: () => string;
  /** What the JSON and CSV buttons write, and the file name without its ending. Left out where there is nothing to export. */
  json?: () => unknown;
  csv?: () => string;
  name: string | (() => string);
  /** What "Not helpful" is about. */
  about: { kind: "analysis" | "answer"; question?: string; cabin?: CabinContext | null };
};

/** The row of buttons under something the SI wrote: copy it, mark it as not helpful, or take it away as a file. */
export function SiActions({ text, spoken, json, csv, name, about }: ActionsProps) {
  const page = usePathname();
  const file = () => (typeof name === "string" ? name : name());
  const [copied, setCopied] = useState(false);
  const [rated, setRated] = useState<"no" | "sending" | "yes" | "failed">("no");
  const [voice, setVoice] = useState<"quiet" | "loading" | "speaking">("quiet");
  const stopVoice = useRef<() => void>(() => {});
  useEffect(() => () => stopVoice.current(), []);
  const button = "inline-flex h-7 items-center gap-1 rounded-xs px-1.5 text-[11.5px] text-ink-2 transition-colors hover:bg-wash hover:text-ink disabled:hover:bg-transparent";

  async function copy() {
    try {
      await navigator.clipboard.writeText(text());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // The browser refused the clipboard; the text can still be selected by hand.
    }
  }

  /** Reads it aloud: with the site's voice service where there is one, otherwise with the browser's own voice. */
  async function listen() {
    if (voice !== "quiet") {
      stopVoice.current();
      return;
    }
    const words = forSpeech((spoken ?? text)());
    if (!words) return;
    const quiet = () => {
      stopVoice.current = () => {};
      setVoice("quiet");
    };
    setVoice("loading");
    try {
      const response = await fetch("/api/speak", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: words }) });
      if (response.ok && response.headers.get("content-type")?.startsWith("audio/")) {
        const url = URL.createObjectURL(await response.blob());
        const audio = new Audio(url);
        const end = () => {
          audio.pause();
          URL.revokeObjectURL(url);
          quiet();
        };
        audio.onended = end;
        audio.onerror = end;
        stopVoice.current = end;
        setVoice("speaking");
        await audio.play();
        return;
      }
    } catch {
      // No voice service, or it could not be reached: the browser's own voice reads it.
    }
    if (!("speechSynthesis" in window)) return quiet();
    const said = new SpeechSynthesisUtterance(words);
    said.lang = "en-US";
    said.onend = quiet;
    said.onerror = quiet;
    stopVoice.current = () => {
      window.speechSynthesis.cancel();
      quiet();
    };
    setVoice("speaking");
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(said);
  }

  async function dislike() {
    setRated("sending");
    try {
      const response = await fetch("/api/feedback", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: about.kind, rating: "down", page, question: about.question?.slice(0, QUESTION_LIMIT), cabin: about.cabin ?? undefined }) });
      setRated(response.ok ? "yes" : "failed");
    } catch {
      setRated("failed");
    }
  }

  return (
    <p className="-ml-1.5 mt-2 flex flex-wrap items-center gap-x-0.5 gap-y-1" role="group" aria-label="What to do with this">
      <button type="button" className={button} onClick={copy}>{copied ? <Check size={13} weight="bold" className="text-accent" /> : <Copy size={13} />}{copied ? "Copied" : "Copy"}</button>
      <button type="button" className={button} onClick={listen} aria-pressed={voice !== "quiet"} title="Read this aloud">
        {voice === "quiet" ? <SpeakerHigh size={13} /> : <Stop size={12} weight="fill" className="text-accent" />}
        {voice === "quiet" ? "Listen" : voice === "loading" ? "Getting the voice" : "Stop"}
      </button>
      <button type="button" className={button} onClick={dislike} disabled={rated === "sending" || rated === "yes"} aria-pressed={rated === "yes"} title="Tell the team this was not helpful">
        <ThumbsDown size={13} weight={rated === "yes" ? "fill" : "regular"} className={rated === "yes" ? "text-caution" : ""} />
        {rated === "yes" ? "Noted, thank you" : rated === "failed" ? "Not sent, try again" : "Not helpful"}
      </button>
      {csv && <button type="button" className={button} onClick={() => download(`${file()}.csv`, "text/csv;charset=utf-8", csv())} title="Download as a spreadsheet file"><FileCsv size={14} />CSV</button>}
      {json && <button type="button" className={button} onClick={() => download(`${file()}.json`, "application/json", `${JSON.stringify(json(), null, 1)}\n`)} title="Download as JSON"><BracketsCurly size={13} />JSON</button>}
    </p>
  );
}

/** The questions asked so far, each with its answer and its buttons under it. A new question is brought into view. */
export function SiTurns({ turns, names }: { turns: Turn[]; names: Record<string, string> }) {
  const last = useRef<HTMLElement>(null);
  useEffect(() => {
    if (turns.length > 0) last.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [turns.length]);
  if (turns.length === 0) return null;
  return (
    <div className="space-y-5">
      {turns.map((turn, i) => (
        <article key={turn.id} ref={i === turns.length - 1 ? last : undefined} className="scroll-mt-[72px]">
          <h3 className="text-[14.5px] font-semibold leading-snug">{turn.text}</h3>
          <div className="mt-2">
            {turn.action ? (
              <p className="flex items-start gap-2 rounded-xs bg-accent-wash px-3 py-2 text-[13.5px] leading-snug">
                <Check size={15} weight="bold" className="mt-0.5 shrink-0 text-accent" />
                <span>{turn.action.reply}</span>
              </p>
            ) : (
              <>
                <Result entry={{ id: turn.id, question: turn.text, result: turn.result, error: turn.error }} names={names} compact />
                {turn.result && (
                  <SiActions
                    text={() => `${turn.text}\n\n${answerText(turn.result!)}`}
                    spoken={() => answerText(turn.result!)}
                    json={() => ({ format: "flamelens.answer/1", question: turn.text, cabin: turn.cabin ?? null, answer: turn.result })}
                    name={`flamelens-answer-${turn.id}`}
                    about={{ kind: "answer", question: turn.text, cabin: turn.cabin }}
                  />
                )}
              </>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

/** Questions to start from, one click each. */
export function SiSuggestions({ items, onPick, disabled, across = false }: { items: string[]; onPick: (text: string) => void; disabled?: boolean; /** Side by side where there is room. */ across?: boolean }) {
  return (
    <ul className={across ? "grid gap-1.5 sm:grid-cols-3 [&_button]:h-full" : "space-y-1.5"}>
      {items.map((text) => (
        <li key={text}>
          <button type="button" disabled={disabled} onClick={() => onPick(text)} className="group flex w-full items-center justify-between gap-3 rounded-sm border border-rule bg-surface px-3 py-2 text-left text-[13px] font-medium leading-snug transition-colors hover:border-ink-3">
            {text}
            <ArrowRight size={14} className="shrink-0 text-accent transition-transform group-hover:translate-x-0.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}

/** A question handed to the ask box from a button elsewhere on the page. The number tells two askings of the same question apart. */
export type Handed = { text: string; n: number };

/** Collects the questions the page hands over, for the ask box to write out and send. */
export function useHanded(): Handed | null {
  const [handed, setHanded] = useState<Handed | null>(null);
  useAsked((text) => setHanded((before) => ({ text, n: (before?.n ?? 0) + 1 })));
  return handed;
}

/**
 * Where the visitor types or speaks. With nothing entered, it asks the question the page suggests.
 *
 * A question handed over from a button on the page is written into the box letter by letter
 * and then sent, so the visitor sees that the button and this box are one and the same SI.
 */
export function SiAskBox({ chat, placeholder, fallback, handed }: { chat: SiChat; placeholder: string; fallback?: string; handed?: Handed | null }) {
  const [draft, setDraft] = useState("");
  // The last handed question that was sent. Until then, the box is writing it in.
  const [sent, setSent] = useState(0);
  const writing = !!handed && sent !== handed.n;
  const send = useRef(chat.send);
  useEffect(() => {
    send.current = chat.send;
  });
  useEffect(() => {
    if (!handed) return;
    const { text, n } = handed;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let at = still ? text.length - 1 : 0;
    let timer = 0;
    // The whole question takes about a second, however long it is. The short wait lets the page scroll the box into view first.
    const pace = Math.max(12, Math.min(34, 900 / text.length));
    const step = () => {
      at += 1;
      setDraft(text.slice(0, at));
      if (at < text.length) timer = window.setTimeout(step, pace);
      else
        timer = window.setTimeout(() => {
          send.current(text);
          setDraft("");
          setSent(n);
        }, 260);
    };
    timer = window.setTimeout(step, 380);
    return () => window.clearTimeout(timer);
  }, [handed]);
  // What was in the box when the microphone was switched on; speech is added after it.
  const typed = useRef("");
  const dictation = useDictation((heard) => setDraft(joinSpeech(typed.current, heard)));
  const { listening } = dictation;
  // The box grows with the question, so the newest words stay in view while they are spoken.
  const box = useRef<HTMLTextAreaElement>(null);
  useLayoutEffect(() => {
    const el = box.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight + 2}px`;
    el.scrollTop = el.scrollHeight;
  }, [draft]);

  return (
    <div data-tour="ask">
      <form
        className="flex items-end gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          dictation.stop(true);
          const text = draft.trim() || fallback || "";
          if (text) chat.send(text);
          setDraft("");
        }}
      >
        <textarea
          ref={box}
          rows={1}
          className={`field h-auto max-h-[7.5rem] min-h-9 min-w-0 flex-1 resize-none py-[7px] text-[13.5px] leading-snug ${listening ? "border-accent" : ""} ${writing ? "si-called" : ""}`}
          readOnly={writing}
          value={draft}
          maxLength={QUESTION_LIMIT}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            // Enter sends, as in a one-line box; Shift+Enter starts a new line.
            if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return;
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }}
          placeholder={listening ? "Listening…" : placeholder}
          aria-label="Your question for the SI"
        />
        {dictation.supported && (
          <button
            type="button"
            className={`btn h-9 px-2.5 ${listening ? "si-listening" : ""}`}
            aria-pressed={listening}
            aria-label={listening ? "Stop listening" : "Speak your question"}
            title={listening ? "Stop listening" : "Speak your question instead of typing it"}
            onClick={() => {
              if (listening) return dictation.stop();
              typed.current = draft;
              dictation.start();
            }}
          >
            {listening ? <Stop size={14} weight="fill" /> : <Microphone size={16} />}
          </button>
        )}
        <button type="submit" className="btn btn-accent h-9 px-2.5" disabled={chat.busy} aria-label="Ask the SI"><ArrowUp size={15} weight="bold" /></button>
      </form>
      <p className={`text-[11.5px] leading-snug ${dictation.problem && !listening ? "text-caution" : "text-ink-3"}`} role="status">
        {listening ? (
          <span className="mt-1.5 block">Listening. Your words appear as you speak, written by your browser&apos;s speech service. Check them, then send.</span>
        ) : (
          dictation.problem && <span className="mt-1.5 block">{dictation.problem}</span>
        )}
      </p>
    </div>
  );
}
