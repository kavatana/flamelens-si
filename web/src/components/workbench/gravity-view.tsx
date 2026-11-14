import Link from "next/link";
import type { GravityPairResult, GravitySummary } from "@/lib/gravity";

/**
 * Gravity, as cards: where NASA's archive has tests along the scale from weightless to
 * Earth, then the same samples at the two ends, one card each, then what they add up to.
 * Everything shown comes from one summary object, the same one an export or the SI reads.
 */

const CARD = "rounded-sm border border-rule bg-surface shadow-[0_1px_2px_rgba(20,23,26,0.05),0_10px_24px_-18px_rgba(20,23,26,0.35)]";
const CHIP: Record<GravityPairResult["verdict"], string> = {
  "farther-on-earth": "bg-ink text-white",
  same: "bg-wash text-ink-2",
  "farther-weightless": "bg-accent text-white",
  "no-figure": "bg-caution-wash text-caution",
};

function Bar({ cm, scale, tone }: { cm: number; scale: number; tone: "orbit" | "earth" }) {
  return (
    <span className="grid grid-cols-[4.2rem_minmax(0,1fr)_5.2rem] items-center gap-x-2">
      <span className="text-[11.5px] text-ink-3">{tone === "orbit" ? "Weightless" : "On Earth"}</span>
      <span className="h-2 rounded-full bg-wash">
        <span className={`block h-full rounded-full ${tone === "orbit" ? "bg-accent" : "bg-ink"}`} style={{ width: `${cm === 0 ? 0 : Math.max(3, (cm / scale) * 100)}%` }} />
      </span>
      <span className="whitespace-nowrap text-right text-[12px] font-medium">{cm === 0 ? "did not burn" : <><span className="num">{cm}</span> cm</>}</span>
    </span>
  );
}

export function GravityView({ summary }: { summary: GravitySummary }) {
  return (
    <div>
      <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Gravity: the gap no cabin setting can close</h2>

      {/* 1. Where the tests are */}
      <ol data-tour="gravity" className="mt-4 grid grid-cols-2 gap-2.5 md:grid-cols-4" aria-label="Where NASA has tests, from weightless to Earth gravity">
        {summary.stops.map((stop) => (
          <li key={stop.id} className={`${CARD} relative px-3.5 pb-3.5 pt-3 ${stop.yours ? "border-ink ring-1 ring-ink" : ""} ${stop.tested ? "" : "border-dashed bg-paper shadow-none"}`}>
            {stop.yours && <span className="absolute -top-2.5 left-3 rounded-xs bg-ink px-1.5 py-px text-[10.5px] font-medium text-white">your cabin</span>}
            <p className="flex items-center justify-between gap-2">
              <span className="num text-[12px] text-ink-3">{stop.g}</span>
              <span className={`rounded-xs px-1.5 py-0.5 text-[11px] font-semibold ${stop.tested ? "bg-accent-wash text-accent-ink" : "bg-caution-wash text-caution"}`}>{stop.tested ? "Tested" : "No test"}</span>
            </p>
            <p className="mt-2 text-[17px] font-semibold leading-tight tracking-[-0.01em]">{stop.name}</p>
            <p className="mt-1 text-[12px] leading-snug text-ink-2">{stop.evidence}</p>
          </li>
        ))}
      </ol>

      {/* 2. What they add up to */}
      <div className={`${CARD} mt-4 border-l-[3px] border-l-accent px-4 py-3.5`}>
        <p className="label">What the two ends show</p>
        <p className="mt-1 text-[17px] font-semibold leading-snug tracking-[-0.01em]">{summary.finding}</p>
        <p className="mt-1.5 max-w-[76ch] text-[12.5px] leading-relaxed text-ink-2">
          NASA burned the same samples weightless and on the ground in <Link className="link" href="/investigations/PSI-99">Saffire-II</Link>. Nobody has measured what happens in between, on the Moon or Mars.
        </p>
      </div>

      {/* 3. Each sample, at both ends */}
      <h3 className="mt-5 flex flex-wrap items-baseline justify-between gap-x-4 text-[14.5px] font-semibold">
        The same sample, burned at both ends
        <span className="text-[12px] font-normal text-ink-3">how far the flame travelled, out of {summary.scaleCm} cm</span>
      </h3>
      <ul className="mt-2.5 grid gap-2.5 sm:grid-cols-2 2xl:grid-cols-3">
        {summary.pairs.map((p) => (
          <li key={p.id} className={`${CARD} px-3.5 py-3`}>
            <p className="flex items-start justify-between gap-2">
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold leading-tight">{p.sample}</span>
                <span className="block text-[11.5px] text-ink-3">{p.detail}</span>
              </span>
              <span className={`shrink-0 rounded-xs px-1.5 py-0.5 text-[11px] font-medium ${CHIP[p.verdict]}`}>{p.says}</span>
            </p>
            {p.orbitCm !== null && p.earthCm !== null ? (
              <div className="mt-2.5 space-y-1.5" role="img" aria-label={`Weightless: ${p.orbitCm} cm. On Earth: ${p.earthCm} cm.`}>
                <Bar cm={p.orbitCm} scale={summary.scaleCm} tone="orbit" />
                <Bar cm={p.earthCm} scale={summary.scaleCm} tone="earth" />
              </div>
            ) : (
              <p className="mt-2.5 text-[12px] leading-snug text-ink-2">NASA&apos;s cells read: weightless &ldquo;{p.orbitRaw}&rdquo;, on Earth &ldquo;{p.earthRaw}&rdquo;.</p>
            )}
          </li>
        ))}
      </ul>

      <details className="mt-4 text-[12.5px]">
        <summary className="link inline cursor-pointer text-ink-2">How to read these pairs</summary>
        <p className="mt-2 max-w-[86ch] leading-relaxed text-ink-3">
          The weightless tests ran at about 22% oxygen, with air moving at 20 cm/s. Where NASA&apos;s table says &ldquo;Complete&rdquo;, the whole sample length is shown. One more experiment, <Link className="link" href="/investigations/PSI-22">E-FIELD Flames</Link>, imitated weak gravity with an electric field. NASA expects fire data at Moon gravity to reach this archive from two experiments, LUCI and FM2.
        </p>
      </details>
    </div>
  );
}
