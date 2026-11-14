/**
 * A range drawn on a fixed scale, with reference marks, so a reader can see at a glance
 * where an experiment's conditions sit. Shared by the experiment and compare pages.
 */
export type Scale = { min: number; max: number; log?: boolean; marks: { at: number; label: string }[]; format: (x: number) => string };

export const SCALES: Record<"o2" | "pressure" | "flow", Scale> = {
  o2: { min: 0.1, max: 0.45, marks: [{ at: 0.21, label: "air" }, { at: 0.34, label: "Moon" }], format: (x) => `${Math.round(x * 1000) / 10}%` },
  pressure: { min: 25, max: 560, log: true, marks: [{ at: 56.5, label: "Moon" }, { at: 101.3, label: "sea level" }], format: (x) => `${Math.round(x)} kPa` },
  flow: { min: 0, max: 90, marks: [], format: (x) => `${Math.round(x * 10) / 10} cm/s` },
};

export function RangeBar({ scale, range, color = "var(--color-ink)", showMarks = true }: { scale: Scale; range: { min: number; max: number } | null; color?: string; showMarks?: boolean }) {
  const pos = (v: number) => {
    const clamped = Math.min(scale.max, Math.max(scale.min, v));
    const t = scale.log ? Math.log(clamped / scale.min) / Math.log(scale.max / scale.min) : (clamped - scale.min) / (scale.max - scale.min);
    return Math.round(t * 1000) / 10;
  };
  const left = range ? pos(range.min) : 0;
  const width = range ? Math.max(1.6, pos(range.max) - left) : 0;
  return (
    <div className={showMarks && scale.marks.length ? "pb-4" : undefined}>
      <div className="relative h-2 rounded-full bg-wash" role="img" aria-label={range ? `${scale.format(range.min)} to ${scale.format(range.max)}` : "not reported"}>
        {range && <span className="absolute top-0 h-2 rounded-full" style={{ left: `${left}%`, width: `${width}%`, background: color }} />}
        {scale.marks.map((m) => (
          <span key={m.label} className="absolute -top-1 h-4 w-px bg-ink-3" style={{ left: `${pos(m.at)}%` }}>
            {showMarks && <span className="absolute left-1/2 top-4 -translate-x-1/2 whitespace-nowrap text-[10.5px] leading-none text-ink-3">{m.label}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
