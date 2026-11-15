import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "30-second demo",
  description: "FlameLens SI in 30 seconds: every fire test in NASA's open PSI archive, where the evidence stops, and NASA's own video of the nearest real test.",
};

/** The project's 30-second demo, played from this site so it needs no account anywhere. */
export default function Page() {
  return (
    <div className="max-w-[1000px]">
      <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-ink-3">NASA Space Apps Challenge 2026 · Flame in Freefall · Team FlameLens SI</p>
      <h1 className="mt-2 text-[30px] font-semibold tracking-[-0.02em]">FlameLens SI in 30 seconds</h1>
      <video
        controls
        playsInline
        preload="metadata"
        poster="/video/flamelens-si-demo-30s.jpg?v=5"
        src="/video/flamelens-si-demo-30s.mp4?v=5"
        aria-label="A 30-second demo of FlameLens SI: the gap in NASA's fire tests by oxygen, the dashboard, the Flame Lab playing NASA's own video, and the SI's checked answer."
        className="mt-5 block aspect-video w-full rounded-sm bg-ink"
      />
      <p className="mt-3 max-w-[72ch] text-[14.5px] leading-relaxed text-ink-2">
        It opens with NASA&apos;s own recording of a spherical flame on the space station (CFI-G, from the PSI archive), then shows this site: one feature each for the engineer, the professor and the
        student. The narration, the music and the sound effects are SI-generated (ElevenLabs). Its title cards and editing were made with an SI coding tool.
      </p>
      <div className="mt-5 flex flex-wrap gap-2.5">
        <Link href="/explore" className="btn btn-solid btn-lg">Open the dashboard</Link>
        <Link href="/lab" className="btn btn-lg">Watch real flames</Link>
        <Link href="/methods" className="btn btn-lg">Methods and limits</Link>
      </div>
    </div>
  );
}
