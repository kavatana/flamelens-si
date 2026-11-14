"use client";

import { Flask, ShieldCheck, Table, X, type Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { SiAskBox, SiTurns, useHanded, useSiChat, useSiWorld } from "./si-chat";

/** The three views of the Explorer. `under` lists the addresses that belong to each. */
export const EXPLORER: { href: string; label: string; note: string; icon: Icon; under: string[] }[] = [
  { href: "/investigations", label: "Experiments", note: "All 24, in plain words", icon: Flask, under: ["/investigations", "/compare"] },
  { href: "/safety", label: "Safety", note: "Stop, notice and put out a fire", icon: ShieldCheck, under: ["/safety", "/earth"] },
  { href: "/data", label: "Data", note: "Every test row, to filter and download", icon: Table, under: ["/data"] },
];

export const inExplorer = (pathname: string | null) => pathname !== null && EXPLORER.some((view) => view.under.some((path) => pathname.startsWith(path)));

type Topic = { about?: string; placeholder: string; suggestions: string[] };

/** What the SI offers on the page in view. It is one conversation across all three views. */
function topicFor(pathname: string | null, names: Record<string, string>): Topic {
  const experiment = pathname?.match(/^\/investigations\/([^/]+)/)?.[1];
  if (experiment && names[experiment]) {
    const short = names[experiment];
    return { about: short, placeholder: `Ask the SI about ${short}`, suggestions: [`What did ${short} find?`, `Why does ${short} matter for fire safety?`] };
  }
  if (pathname?.startsWith("/safety") || pathname?.startsWith("/earth")) return { placeholder: "Ask the SI about fire safety in space", suggestions: ["What does smoke look like to a detector in space?", "What happens to a flame when the airflow stops?"] };
  if (pathname?.startsWith("/data")) return { placeholder: "Ask the SI what is in the tables", suggestions: ["Has anything been tested at 34% oxygen?", "Which experiments burned fabric, and at what airflow?"] };
  return { placeholder: "Ask the SI about the experiments", suggestions: ["Which experiments burned fabric, and at what airflow?", "Compare BASS and BASS-II"] };
}

function Bar({ pathname }: { pathname: string | null }) {
  const router = useRouter();
  const { names, cabins } = useSiWorld();
  const topic = topicFor(pathname, names);
  const chat = useSiChat({ names, cabins, about: topic.about, onAction: (action) => router.push(action.href) });
  const bar = useRef<HTMLDivElement>(null);
  // A button further down a page hands the SI a question. The page travels up to this bar,
  // the question writes itself into the box, and the answer opens here: there is one SI.
  const handed = useHanded();
  useEffect(() => {
    if (handed) bar.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [handed]);
  // The answers belong to the view they were asked on. On another view they fold to one line,
  // so the new page is not pushed down by an answer about the last one, and nothing is lost.
  const [shownOn, setShownOn] = useState<string | null>(null);
  const asking = { ...chat, send: (text: string) => { setShownOn(pathname); chat.send(text); } };
  const open = chat.turns.length > 0;
  const folded = open && shownOn !== pathname;
  const last = chat.turns[chat.turns.length - 1];

  return (
    <div ref={bar} className="mb-7 scroll-mt-[72px]">
      <div className="flex flex-col gap-3 rounded-sm border border-rule bg-surface p-2 lg:flex-row lg:items-center lg:justify-between">
        <nav aria-label="Explorer" className="flex items-center gap-1 overflow-x-auto">
          <span className="hidden px-2 text-[12.5px] font-medium text-ink-3 sm:block">Explorer</span>
          {EXPLORER.map((view) => {
            const active = pathname !== null && view.under.some((path) => pathname.startsWith(path));
            return (
              <Link key={view.href} href={view.href} aria-current={active ? "page" : undefined} className={`flex items-center gap-1.5 whitespace-nowrap rounded-sm px-3 py-1.5 text-[14px] transition-colors ${active ? "bg-ink font-medium text-surface" : "text-ink-2 hover:bg-wash hover:text-ink"}`}>
                <view.icon size={16} weight={active ? "fill" : "regular"} aria-hidden />
                {view.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex min-w-0 items-center gap-2 lg:w-[460px]">
          <span className={`si-orb shrink-0 ${chat.busy ? "is-busy" : ""}`} aria-hidden />
          <div className="min-w-0 flex-1"><SiAskBox chat={asking} placeholder={topic.placeholder} handed={handed} /></div>
        </div>
      </div>

      {folded ? (
        <div className="mt-2 flex items-center gap-2.5 rounded-sm border border-rule bg-surface px-3 py-2 text-[13px]">
          <span className="si-orb shrink-0" aria-hidden />
          <p className="min-w-0 flex-1 truncate text-ink-2">Your last question: <span className="text-ink">&ldquo;{last.text}&rdquo;</span></p>
          <button type="button" className="btn shrink-0" onClick={() => setShownOn(pathname)}>Show the answer</button>
          <button type="button" className="btn shrink-0 px-2" onClick={chat.clear} aria-label="Clear the SI's answers"><X size={13} /></button>
        </div>
      ) : open ? (
        <section aria-label="The SI's answers" className="mt-2 rounded-sm border border-rule border-t-2 border-t-accent bg-surface px-4 py-4 sm:px-5">
          <p className="mb-3 flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-[13.5px] font-semibold"><span className={`si-orb ${chat.busy ? "is-busy" : ""}`} aria-hidden />The SI, for the whole Explorer</span>
            <button type="button" className="btn gap-1 px-2" onClick={chat.clear}><X size={13} /> Close</button>
          </p>
          <div className="max-h-[62vh] overflow-y-auto pr-2"><div className="max-w-[820px]"><SiTurns turns={chat.turns} names={names} /></div></div>
        </section>
      ) : (
        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 px-1 text-[12.5px] text-ink-3">
          <span>Ask the SI:</span>
          {topic.suggestions.map((question) => (
            <button key={question} type="button" className="rounded-full border border-rule bg-surface px-2.5 py-1 text-ink-2 transition-colors hover:border-ink-3 hover:text-ink" onClick={() => asking.send(question)} disabled={chat.busy}>
              {question}
            </button>
          ))}
        </p>
      )}
    </div>
  );
}

function Located() {
  return <Bar pathname={usePathname()} />;
}

export function ExplorerBar() {
  return (
    <Suspense fallback={<Bar pathname={null} />}>
      <Located />
    </Suspense>
  );
}
