"use client";

import { useState, type ReactNode } from "react";
import { BENCHES, type BenchId, type BenchRow } from "@flamelens/shared/benches";
import { PHASE_VAR } from "@flamelens/shared/format";
import { useArrivalSearch } from "@/lib/use-location-search";
import { Bench } from "./bench";
import type { TestClips } from "./test-footage";

const ORDER: { id: BenchId; phase: string }[] = [
  { id: "solid", phase: "solid" },
  { id: "droplet", phase: "liquid" },
  { id: "gas", phase: "gas" },
];

/** The Flame Lab's three benches, one for each kind of fuel NASA burned. All three work the same way. */
export function LabTabs({ benches, clips, after }: { benches: Record<BenchId, BenchRow[]>; clips: Record<string, TestClips>; after?: ReactNode }) {
  // A link from the dashboard carries a cabin's air for the droplet bench: /lab?fuel=heptane&o2=34&p=56.5
  const params = new URLSearchParams(useArrivalSearch());
  const linked = params.get("bench");
  const air = params.has("o2") && params.has("p") ? { o2: Number(params.get("o2")) / 100, p: Number(params.get("p")) } : null;
  const start = air && Number.isFinite(air.o2) && Number.isFinite(air.p) ? { kind: params.get("fuel") === "heptane" ? "n-heptane" : "methanol", values: { ...air, co2: 0, he: 0 } } : undefined;
  const [picked, setPicked] = useState<BenchId | null>(null);
  const tab: BenchId = picked ?? (linked === "solid" || linked === "gas" || linked === "droplet" ? linked : start ? "droplet" : "solid");

  function go(id: BenchId) {
    setPicked(id);
    window.history.replaceState(null, "", id === "solid" ? "/lab" : `/lab?bench=${id}`);
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-2" role="tablist" aria-label="What burns">
        {ORDER.map(({ id, phase }) => {
          const filmed = benches[id].filter((row) => clips[row.id]).length;
          return (
            <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => go(id)} className={`rounded-sm border bg-surface px-3 py-2.5 text-left transition-colors sm:px-4 ${tab === id ? "border-ink ring-1 ring-ink" : "border-rule hover:border-ink-3"}`}>
              <span className="flex items-center gap-2 text-[14.5px] font-semibold sm:text-[16px]">
                <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: PHASE_VAR[phase] }} />
                {BENCHES[id].tab}
              </span>
              <span className="num mt-0.5 block text-[11.5px] text-ink-3 sm:text-[12.5px]">{benches[id].length} tests · {filmed} with NASA video</span>
            </button>
          );
        })}
      </div>
      <div className="mt-5" role="tabpanel">
        <Bench key={tab} id={tab} rows={benches[tab]} clips={clips} start={tab === "droplet" ? start : undefined} />
        {tab === "droplet" && after}
      </div>
    </div>
  );
}
