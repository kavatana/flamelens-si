import type { Metadata } from "next";
import { LabTabs } from "@/components/lab/lab-tabs";
import { getBenchRows, getFootage } from "@/lib/data";
import { Turntable } from "@/components/turntable";
import { getExtras } from "@/lib/motion";

export const metadata: Metadata = { title: "Flame Lab" };

export default async function Page() {
  const [extras, benches, footage] = await Promise.all([getExtras(), getBenchRows(), getFootage()]);
  // Which tests have NASA's own video, and how large each view is.
  const clips: Record<string, { main?: number; second?: number }> = {};
  for (const clip of footage) (clips[clip.recordId] ??= {})[clip.view === "second" ? "second" : "main"] = clip.bytes;
  return (
    <div>
      <h1 className="text-[30px] font-semibold leading-[1.12] tracking-[-0.02em]">Flame Lab</h1>
      <div className="mt-4">
        <LabTabs
          benches={benches}
          clips={clips}
          after={
            extras.turns.chamber ? (
        <section aria-labelledby="chamber" className="mt-12 grid items-center gap-x-10 gap-y-5 border-t border-rule-2 pt-8 md:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
                  <Turntable src={extras.turns.chamber} label="A concept model of a droplet combustion chamber, cut open" />
                  <div className="max-w-[56ch]">
                    <h2 id="chamber" className="text-[19px] font-semibold tracking-[-0.01em]">What a droplet test looks like</h2>
                    <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
                      One drop of fuel is held on a hair-thin fibre inside a sealed chamber filled with the air being tested. It is lit, and cameras follow it until the flame goes out or the fuel is gone. The bench above shows the results of those tests.
                    </p>
                    <p className="mt-3 text-[12.5px] text-ink-3">This is a concept model to show the idea. It is not a picture of NASA&apos;s hardware.</p>
                  </div>
                </section>
            ) : null
          }
        />
      </div>
    </div>
  );
}
