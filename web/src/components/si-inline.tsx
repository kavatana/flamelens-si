"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { SiAskBox, SiSuggestions, SiTurns, useHanded, useSiChat, useSiWorld } from "./si-chat";

type Props = {
  title: string;
  intro?: string;
  suggestions: string[];
  placeholder: string;
  /** The subject a short question is about, added to it when the question does not name one. */
  about?: string;
  className?: string;
  /** Set when the SI is the lower part of another card: it then has no frame of its own. */
  embedded?: boolean;
};

/**
 * The SI as a part of a feature: a card that sits in the page where the question comes up,
 * and answers in place. Nothing slides in. A button elsewhere on the page can hand it a
 * question (see `askTheSi`); the card then comes into view with the answer.
 */
export function SiInline({ title, intro, suggestions, placeholder, about, className = "", embedded = false }: Props) {
  const router = useRouter();
  const { names, cabins } = useSiWorld();
  const chat = useSiChat({ names, cabins, about, onAction: (action) => router.push(action.href) });
  const card = useRef<HTMLElement>(null);
  // A button on the page hands over a question: the card comes into view and the question writes itself into its box.
  const handed = useHanded();
  useEffect(() => {
    if (handed) card.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [handed]);
  useEffect(() => {
    if (handed && chat.turns.length) card.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [handed, chat.turns.length, chat.busy]);

  return (
    <section ref={card} aria-label={title} className={`scroll-mt-[72px] border-t-2 border-t-accent ${embedded ? "" : "panel"} ${className}`}>
      <header className="px-4 pt-3">
        <p className="flex items-center gap-2 text-[14px] font-semibold">
          <span className={`si-orb ${chat.busy ? "is-busy" : ""}`} aria-hidden />
          {title}
        </p>
        {intro && <p className="mt-1 text-[12.5px] leading-snug text-ink-2">{intro}</p>}
      </header>
      <div className="px-4 py-3">
        {chat.turns.length === 0 ? (
          <SiSuggestions items={suggestions} onPick={chat.send} disabled={chat.busy} across={embedded} />
        ) : (
          <>
            <p className="mb-3 flex items-baseline justify-between gap-3">
              <span className="label">Your questions</span>
              <button type="button" className="link text-[12px] text-ink-3" onClick={chat.clear}>Clear</button>
            </p>
            <SiTurns turns={chat.turns} names={names} />
          </>
        )}
      </div>
      <footer className="border-t border-rule px-3 py-2.5">
        <SiAskBox chat={chat} placeholder={placeholder} handed={handed} />
      </footer>
    </section>
  );
}
