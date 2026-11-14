"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";

type Props = {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  /** A logarithmic scale, for a condition whose tests span a wide range. */
  log?: boolean;
  /** Every value NASA tested, one per test. Drawn as lines under the track. */
  marks: number[];
  unit?: string;
  onChange: (v: number) => void;
  format: (v: number) => string;
};

/**
 * One condition of a test. The lines under the track are NASA's real tests, so the visitor
 * sees where there is something to find; the arrows step from one tested value to the next.
 */
export function Slider({ id, label, value, min, max, step, log, marks, unit = "", onChange, format }: Props) {
  const scaled = log && min > 0;
  const to = (v: number) => (scaled ? Math.log(v / min) / Math.log(max / min) : (v - min) / (max - min));
  const from = (t: number) => (scaled ? min * Math.pow(max / min, t) : min + t * (max - min));
  const at = (v: number) => Math.round(Math.min(1, Math.max(0, to(v))) * 1000) / 10;
  const tested = [...new Set(marks.map((v) => Number(v.toPrecision(6))))].sort((a, b) => a - b);
  const lower = tested.filter((v) => v < value - step / 2).at(-1);
  const higher = tested.find((v) => v > value + step / 2);
  const lines = [...new Set(tested.map(at))];
  return (
    <div>
      <label htmlFor={id} className="flex items-baseline justify-between gap-2 text-[13.5px]">
        <span className="font-medium">{label}</span>
        <span className="num shrink-0 font-semibold">{format(value)}{unit}</span>
      </label>
      <div className="mt-1.5 flex items-center gap-1.5">
        <button type="button" className="btn size-7 shrink-0 justify-center p-0" disabled={lower === undefined} onClick={() => lower !== undefined && onChange(lower)} aria-label={`${label}: the next lower value NASA tested`} title="The next lower value NASA tested">
          <CaretLeft size={13} />
        </button>
        <div className="min-w-0 flex-1">
          <input id={id} type="range" min={0} max={1000} step={1} value={Math.round(at(value) * 10)} onChange={(e) => onChange(from(Number(e.target.value) / 1000))} aria-valuetext={`${format(value)}${unit}`} className="block w-full accent-accent" />
          <div className="relative mx-2 mt-0.5 h-2.5" aria-hidden>
            <span className="absolute inset-x-0 top-1/2 h-px bg-rule-2" />
            {lines.map((x) => <span key={x} className="absolute inset-y-0 w-px bg-ink/55" style={{ left: `${x}%` }} />)}
          </div>
        </div>
        <button type="button" className="btn size-7 shrink-0 justify-center p-0" disabled={higher === undefined} onClick={() => higher !== undefined && onChange(higher)} aria-label={`${label}: the next higher value NASA tested`} title="The next higher value NASA tested">
          <CaretRight size={13} />
        </button>
      </div>
      <p className="mt-1 text-[11.5px] text-ink-3">{tested.length ? `NASA tested ${format(tested[0])}${tested.length > 1 ? ` to ${format(tested[tested.length - 1])}` : ""}${unit}` : "No test lists this"}</p>
    </div>
  );
}
