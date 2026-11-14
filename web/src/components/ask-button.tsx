"use client";

import { ArrowUp } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { askTheSi } from "./si-chat";

/**
 * A button on a page that hands one question to the SI of the feature. It does not answer by
 * itself: the page travels to the SI's ask box, where the question is written in and sent.
 */
export function AskButton({ question, className = "btn", children }: { question: string; className?: string; children: ReactNode }) {
  return (
    <button type="button" className={className} onClick={() => askTheSi(question)} title={`Asks the SI above: "${question}"`}>
      <span className="si-orb" aria-hidden />
      {children}
      <ArrowUp size={14} weight="bold" aria-hidden />
    </button>
  );
}
