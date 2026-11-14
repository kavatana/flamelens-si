"use client";

import { useState } from "react";
import { PHASE_VAR } from "@flamelens/shared/format";

/**
 * Chips that pick out the experiments matching one property and fade the rest.
 * The tiles are rendered on the server and carry their properties in data-tags, so the
 * hardware layout stays in place and nothing has to be re-fetched.
 */
const CHIPS: { id: string; label: string; dot?: string }[] = [
  { id: "solid", label: "Burned solids", dot: PHASE_VAR.solid },
  { id: "liquid", label: "Burned liquids", dot: PHASE_VAR.liquid },
  { id: "gas", label: "Burned gas", dot: PHASE_VAR.gas },
  { id: "prevention", label: "Stopping a fire starting" },
  { id: "detection", label: "Noticing a fire" },
  { id: "suppression", label: "Putting a fire out" },
  { id: "rich", label: "Oxygen-rich air, 30% or more" },
];

export function Highlight({ total }: { total: number }) {
  const [active, setActive] = useState<string | null>(null);
  const [count, setCount] = useState(total);

  function pick(id: string | null) {
    let matches = 0;
    for (const tile of document.querySelectorAll<HTMLElement>("[data-tile]")) {
      const match = id === null || (tile.dataset.tags ?? "").split(" ").includes(id);
      tile.classList.toggle("is-dim", !match);
      if (match) matches += 1;
    }
    setActive(id);
    setCount(matches);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Highlight experiments">
      <span className="mr-1 text-[13px] text-ink-2">Show me</span>
      <button type="button" className="btn" aria-pressed={active === null} onClick={() => pick(null)}>All</button>
      {CHIPS.map((chip) => (
        <button key={chip.id} type="button" className="btn gap-1.5" aria-pressed={active === chip.id} onClick={() => pick(active === chip.id ? null : chip.id)}>
          {chip.dot && <span className="inline-block size-2.5 rounded-full" style={{ background: chip.dot }} />}
          {chip.label}
        </button>
      ))}
      <span className="num ml-2 text-[12.5px] text-ink-3" aria-live="polite">{active ? `${count} of ${total}` : `${total} experiments`}</span>
    </div>
  );
}
