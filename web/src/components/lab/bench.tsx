"use client";

import { FilmStrip } from "@phosphor-icons/react";
import { useCallback, useMemo, useState } from "react";
import { BENCHES, benchRanges, lookupBench, type BenchId, type BenchRow, type BenchSpec, type Dim } from "@flamelens/shared/benches";
import { SiInline } from "../si-inline";
import { Inspector } from "../workbench/inspector";
import { Slider } from "./slider";
import { TestFootage, type TestClips } from "./test-footage";

/**
 * One bench of the Flame Lab. All three work the same way: choose what burns and the air
 * around it, watch NASA's own video of the nearest real test, read what was measured, and
 * ask the SI about it. The bench models nothing: every number is a row of NASA's table.
 */

const STATUS = {
  measured: { label: "Measured here", dot: "bg-accent" },
  close: { label: "Close to NASA tests", dot: "bg-caution" },
  untested: { label: "Never tested here", dot: "border border-ink-3" },
};

const CARD = "rounded-sm border border-rule bg-surface shadow-[0_1px_2px_rgba(20,23,26,0.05),0_10px_24px_-18px_rgba(20,23,26,0.35)]";

const middle = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

/** Position of a value along an axis, 0 to 100. Rounded, so the server and the browser draw it at the same place. */
function place(v: number, [lo, hi]: [number, number], log?: boolean): number {
  if (hi <= lo) return 50;
  const t = log && lo > 0 ? Math.log(v / lo) / Math.log(hi / lo) : (v - lo) / (hi - lo);
  return Math.round(Math.min(100, Math.max(0, t * 100)) * 100) / 100;
}

const has = (v: number | null | undefined): v is number => v !== null && v !== undefined;

type Props = {
  id: BenchId;
  rows: BenchRow[];
  clips: Record<string, TestClips>;
  /** A setting carried in the link the visitor arrived by. */
  start?: { kind?: string; values?: Record<string, number> };
};

export function Bench({ id, rows, clips, start }: Props) {
  const spec: BenchSpec = BENCHES[id];
  const defaults = useCallback(
    (kindId: string, base: Record<string, number> = {}) => {
      const out: Record<string, number> = {};
      for (const [dimId, dim] of Object.entries(spec.dims)) {
        const seen = rows.filter((r) => r.kind === kindId).flatMap((r) => (has(r.dims[dimId]) ? [r.dims[dimId]] : []));
        out[dimId] = base[dimId] ?? (seen.length ? middle(seen) : dim.range[0]);
      }
      return out;
    },
    [rows, spec],
  );
  const first = spec.kinds.find((k) => k.id === start?.kind)?.id ?? spec.kinds[0].id;
  const [kindId, setKindId] = useState(first);
  const [setting, setSetting] = useState(() => {
    const wanted = defaults(first, start?.values ?? spec.presets[0].values);
    if (start?.values) return wanted;
    // With no setting asked for, open on the filmed test nearest the first cabin, so there is something to watch at once.
    const kind0 = spec.kinds.find((k) => k.id === first)!;
    const filmedRows = rows.filter((r) => r.kind === first && clips[r.id]);
    // Where a bench has tests in which nothing lit, open on one that did.
    const lit = spec.measured ? filmedRows.filter(spec.measured) : filmedRows;
    // And on a small file where there is one, so the first video starts at once.
    const light = lit.filter((r) => (clips[r.id].main ?? clips[r.id].second ?? Infinity) < 30e6);
    const row = lookupBench(spec, kind0, light.length ? light : lit.length ? lit : filmedRows, wanted).nearest?.row;
    return row ? { ...wanted, ...Object.fromEntries(kind0.dims.flatMap((d) => (has(row.dims[d]) ? [[d, row.dims[d]]] : []))) } : wanted;
  });
  const [filmedOnly, setFilmedOnly] = useState(false);
  const [ending, setEnding] = useState<string | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const [selection, setSelection] = useState<BenchRow | null>(null);
  const close = useCallback(() => setSelection(null), []);
  const kind = spec.kinds.find((k) => k.id === kindId)!;
  const experiment = kind.experiment ?? spec.experiment;

  // Every test of this sample, and the ones left after the visitor's two filters.
  const all = useMemo(() => rows.filter((r) => r.kind === kindId), [rows, kindId]);
  const pool = useMemo(() => all.filter((r) => (!filmedOnly || clips[r.id]) && (!ending || r.cat === ending)), [all, filmedOnly, ending, clips]);
  const filmed = useMemo(() => all.filter((r) => clips[r.id]).length, [all, clips]);
  const tested = useMemo(() => benchRanges(all, kindId, (r) => r.dims), [all, kindId]);
  const spans = useMemo(() => benchRanges(spec.measured ? all.filter(spec.measured) : all, kindId, (r) => r.measures), [all, kindId, spec]);
  // The dimensions of this sample, with the slider range fitted to its own tests where the spec asks for it.
  const dims = useMemo(() => {
    const out: Record<string, Dim> = {};
    for (const d of kind.dims) {
      const dim = spec.dims[d];
      const seen = tested[d];
      out[d] = dim.fit && seen ? { ...dim, range: dim.log ? [seen[0] / 1.3, seen[1] * 1.3] : [seen[0] - (seen[1] - seen[0]) * 0.1, seen[1] + (seen[1] - seen[0]) * 0.1] } : dim;
    }
    return out;
  }, [spec, kind, tested]);
  const result = useMemo(() => lookupBench(spec, kind, pool, setting), [spec, kind, pool, setting]);
  const nearIds = useMemo(() => new Set(result.near.map((x) => x.row.id)), [result]);
  const status = STATUS[result.status];
  const n = result.near.length;
  // The test whose video is shown: the one the visitor picked, or else the nearest test that has one.
  const watched = result.near.find(({ row }) => row.id === picked)?.row ?? result.near.find(({ row }) => clips[row.id])?.row ?? result.nearest?.row ?? null;

  const show = (dimId: string, v: number | null | undefined) => {
    const dim = spec.dims[dimId];
    return has(v) ? `${dim.format(v)}${dim.unit}${dim.tag ? ` ${dim.tag}` : ""}` : `${dim.tag ?? dim.label.toLowerCase()} not listed`;
  };
  const describe = (row: BenchRow) => kind.dims.filter((d) => !(spec.dims[d].quiet && !row.dims[d])).map((d) => show(d, row.dims[d])).join(" · ");
  const pickKind = (next: string) => {
    setKindId(next);
    setEnding(null);
    setPicked(null);
    // Keep the air, and start the sample's own size from the middle of what NASA tested.
    setSetting((prev) => defaults(next, Object.fromEntries(Object.entries(prev).filter(([d]) => spec.kinds.every((k) => k.dims.includes(d))))));
  };
  const goTo = (row: BenchRow) => setSetting((prev) => ({ ...prev, ...Object.fromEntries(kind.dims.flatMap((d) => (has(row.dims[d]) ? [[d, row.dims[d]]] : []))) }));

  // The map: every test of this sample by its first two conditions.
  const [xd, yd] = kind.dims;
  const W = 720;
  const H = 280;
  const M = { l: 52, r: 16, t: 12, b: 38 };
  const axisX: Dim | undefined = xd ? dims[xd] : undefined;
  const axisY: Dim | undefined = yd ? dims[yd] : undefined;
  const px = (v: number) => Math.round((M.l + (place(v, axisX!.range, axisX!.log) / 100) * (W - M.l - M.r)) * 10) / 10;
  const py = (v: number) => Math.round((H - M.b - (place(v, axisY!.range, axisY!.log) / 100) * (H - M.t - M.b)) * 10) / 10;
  const ticks = (dim: Dim) => {
    const [lo, hi] = dim.range;
    if (dim.log) return [lo, Math.sqrt(lo * hi), hi].map((v) => Number(v.toPrecision(2)));
    return Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);
  };
  function pickFromMap(event: React.MouseEvent<SVGRectElement>) {
    if (!axisX || !axisY) return;
    const box = event.currentTarget.getBoundingClientRect();
    const at = (t: number, dim: Dim) => (dim.log ? dim.range[0] * Math.pow(dim.range[1] / dim.range[0], t) : dim.range[0] + t * (dim.range[1] - dim.range[0]));
    setSetting((prev) => ({ ...prev, [xd]: at((event.clientX - box.left) / box.width, axisX), [yd]: at(1 - (event.clientY - box.top) / box.height, axisY) }));
  }
  // Only the endings that this sample's tests actually had.
  const outcomes = spec.outcomes ? Object.entries(spec.outcomes).filter(([key]) => all.some((row) => row.cat === key)) : [];
  const colourOf = (row: BenchRow) => (spec.outcomes && row.cat ? spec.outcomes[row.cat].color : "var(--color-ink)");
  const measured = spec.measures.filter((m) => spans[m.id]);

  return (
    <div>
      <h2 className="sr-only">{spec.title}</h2>
      {/* On a wide screen the three columns are one height, the height of the window, and each scrolls inside itself. */}
      <div className="mt-4 grid scroll-mt-[68px] gap-4 lg:h-[calc(100dvh-84px)] lg:min-h-[600px] lg:grid-cols-[300px_minmax(0,1fr)_330px]">
        {/* 1. Choose a test */}
        <section aria-label="Choose a test" className={`${CARD} order-2 flex flex-col gap-5 px-4 py-4 lg:order-none lg:min-h-0 lg:overflow-y-auto [&>*]:shrink-0`}>
          <div>
            <p className="flex items-center gap-2 text-[13.5px] font-semibold"><span className="num flex size-5 items-center justify-center rounded-full bg-ink text-[11px] text-surface">1</span>{spec.kindLabel}</p>
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              {spec.kinds.map((k) => {
                const mine = rows.filter((r) => r.kind === k.id);
                const withVideo = mine.filter((r) => clips[r.id]).length;
                return (
                  <button key={k.id} type="button" className="btn h-auto min-w-0 flex-col items-start gap-0 whitespace-normal py-1.5 text-left" aria-pressed={kindId === k.id} onClick={() => pickKind(k.id)}>
                    <span>{k.label}</span>
                    <span className="text-[11px] font-normal leading-snug opacity-70">{k.note}</span>
                    <span className="mt-0.5 text-[11px] font-normal leading-snug opacity-70">{mine.length} tests{withVideo ? `, ${withVideo} filmed` : ""}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <p className="flex items-center gap-2 text-[13.5px] font-semibold"><span className="num flex size-5 items-center justify-center rounded-full bg-ink text-[11px] text-surface">2</span>The conditions</p>
            {kind.dims.map((d) => {
              const dim = dims[d];
              return <Slider key={`${kindId}-${d}`} id={`bench-${id}-${d}`} label={dim.label} value={setting[d]} min={dim.range[0]} max={dim.range[1]} step={dim.tick} log={dim.log} marks={all.flatMap((r) => (has(r.dims[d]) ? [r.dims[d]] : []))} unit={dim.unit} onChange={(v) => setSetting((prev) => ({ ...prev, [d]: v }))} format={dim.format} />;
            })}
          </div>

          <div>
            <p className="text-[13px] font-medium">Or start from a real cabin</p>
            <div className="mt-1.5 flex flex-col gap-1.5">
              {spec.presets.map((preset) => (
                <button key={preset.label} type="button" className="btn h-auto justify-between py-1.5" aria-pressed={Object.entries(preset.values).every(([d, v]) => Math.abs(setting[d] - v) < 1e-6)} onClick={() => setSetting((prev) => ({ ...prev, ...preset.values }))}>
                  <span>{preset.label}</span>
                  <span className="text-[11.5px] font-normal opacity-70">{preset.note}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="flex items-center gap-2 text-[13.5px] font-semibold"><span className="num flex size-5 items-center justify-center rounded-full bg-ink text-[11px] text-surface">3</span>Show only</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <button type="button" className="btn gap-1.5" aria-pressed={filmedOnly} disabled={filmed === 0} onClick={() => setFilmedOnly((on) => !on)}>
                <FilmStrip size={14} /> Tests with NASA&apos;s video
              </button>
              {outcomes.map(([key, o]) => (
                <button key={key} type="button" className="btn h-auto gap-1.5 whitespace-normal py-1 text-left" aria-pressed={ending === key} onClick={() => setEnding(ending === key ? null : key)}>
                  <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: o.color }} />
                  {o.label}
                </button>
              ))}
            </div>
            <p className="num mt-2 text-[11.5px] text-ink-3">{pool.length} of {all.length} tests</p>
          </div>
        </section>

        {/* 2. Watch it, and read what happened */}
        <div className="order-1 flex min-w-0 flex-col gap-4 lg:order-none lg:min-h-0 lg:overflow-y-auto lg:pr-1 [&>*]:shrink-0">
          <TestFootage test={watched ? { id: watched.id, label: watched.label, conditions: describe(watched) } : null} clips={watched ? clips[watched.id] : undefined} experiment={experiment} have={filmed} of={all.length} note={spec.footage}>
            <SiInline
              key={id}
              embedded
              title="Ask the SI about this test"
              suggestions={[...(watched ? [`What did ${experiment} test ${watched.label} show?`] : []), `What did ${experiment} find?`, spec.question]}
              placeholder={`Ask about ${experiment}`}
              about={experiment}
            />
          </TestFootage>

          <section aria-label="What the tests show" aria-live="polite" className={`${CARD} px-5 py-5`}>
            <p className="flex flex-wrap items-center gap-2 text-[12.5px] font-medium">
              <span className={`inline-block size-2.5 rounded-full ${status.dot}`} />
              {status.label}
              <span className="font-normal text-ink-3">
                {result.status === "measured" ? `${n} ${n === 1 ? "test" : "tests"} close to your setting` : result.nearest ? `the nearest test is ${result.nearest.dist.toFixed(1)} steps away` : "no test matches your choices"}
              </span>
            </p>
            <p className="mt-2 max-w-[40ch] text-[23px] font-semibold leading-[1.24] tracking-[-0.015em]">{result.nearest ? spec.headline(result) : "No test matches these choices. Clear a filter on the left."}</p>
            {result.status === "untested" && result.nearest && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 rounded-sm bg-caution-wash px-3 py-2">
                <p className="min-w-0 flex-1 text-[13px] leading-snug text-caution">
                  <span className="font-semibold">Not tested at your setting.</span> This is NASA&apos;s nearest test, {result.nearest.row.label}: {describe(result.nearest.row)}. It is too far away to say what would happen at yours.
                </p>
                <button type="button" className="btn shrink-0" onClick={() => goTo(result.nearest!.row)}>Move my setting there</button>
              </div>
            )}

            {outcomes.length > 0 && n > 0 && result.near.some(({ row }) => row.cat) && (
              <div className="mt-5">
                <p className="text-[12.5px] font-medium text-ink-2">How the {n === 1 ? "test" : `${n} tests`} ended</p>
                <div className="mt-1.5 flex h-7 gap-[2px] overflow-hidden rounded-sm" role="img" aria-label={outcomes.map(([key, o]) => `${o.label}: ${result.counts[key] ?? 0}`).join(", ")}>
                  {outcomes.map(([key, o]) => (result.counts[key] ? <span key={key} className="num flex items-center justify-center text-[12.5px] font-semibold text-white" style={{ width: `${(100 * result.counts[key]) / n}%`, background: o.color }}>{result.counts[key]}</span> : null))}
                </div>
                <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[12.5px] text-ink-2">
                  {outcomes.map(([key, o]) => (
                    <li key={key} className={`flex items-center gap-1.5 ${result.counts[key] ? "" : "opacity-50"}`}>
                      <span className="inline-block size-2.5 rounded-full" style={{ background: o.color }} />
                      {o.label}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {measured.length > 0 ? (
              <>
                <div className={`mt-5 grid gap-3 ${measured.length > 2 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
                  {measured.map((m) => {
                    const span = spans[m.id];
                    const value = result.medians[m.id];
                    const at = has(value) ? place(value, span, m.log) : null;
                    return (
                      <div key={m.id} className="rounded-sm border border-rule bg-paper px-3.5 py-3" title={m.help}>
                        <p className="text-[12.5px] leading-snug text-ink-2">{m.label}</p>
                        <p className="num mt-1.5 text-[24px] font-semibold leading-none">
                          {has(value) ? m.format(value) : "–"}
                          {has(value) && <span className="ml-0.5 text-[13px] font-medium text-ink-2">{m.unit}</span>}
                        </p>
                        <div className="relative mt-3 h-2 rounded-full bg-rule" role="img" aria-label={at === null ? "Not listed" : `${Math.round(at)}% of the way from the lowest to the highest NASA measured`}>
                          {at !== null && <span className="absolute inset-y-0 left-0 rounded-full bg-accent" style={{ width: `${Math.max(3, at)}%` }} />}
                        </div>
                        <p className="num mt-1 flex justify-between text-[10.5px] text-ink-3"><span>{m.format(span[0])}</span><span>{m.format(span[1])}</span></p>
                        <p className="mt-1 text-[11.5px] text-ink-3">{at === null ? (spec.measured && !result.near.some(({ row }) => spec.measured!(row)) ? "None of them lit" : "Not listed for these tests") : at < 34 ? "Low for this sample" : at < 67 ? "In the middle for this sample" : "High for this sample"}</p>
                      </div>
                    );
                  })}
                </div>
                <details className="mt-3 text-[12px]">
                  <summary className="link inline cursor-pointer text-ink-3">How these are counted</summary>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink-3">
                  {n > 1 ? `Each number is the middle value of the ${n} nearby tests.` : "Each number is the value from that one test."} The bar shows where it sits between the lowest and the highest NASA measured for this sample. {spec.measuredNote}
                </p>
                </details>
              </>
            ) : (
              <p className="mt-4 rounded-sm bg-wash px-3 py-2.5 text-[13px] leading-snug text-ink-2">NASA&apos;s table lists the air each of these tests burned in, not what was measured. The recording above is the result.</p>
            )}
          </section>
        </div>

        {/* 3. The tests near the setting */}
        <div className={`${CARD} order-3 flex min-w-0 flex-col lg:order-none lg:min-h-0 lg:overflow-y-auto [&>*]:shrink-0`}>
          <section aria-label="The tests near your setting" className="px-4 py-4">
            <p className="text-[13.5px] font-semibold">Tests near your setting</p>
            <p className="mt-0.5 text-[11.5px] text-ink-3">{filmed > 0 ? `${filmed} of this sample's ${all.length} tests have NASA's video.` : `${all.length} tests of this sample.`}</p>
            <ul className="mt-2 divide-y divide-rule">
              {result.near.slice(0, 6).map(({ row }) => (
                <li key={row.id} className={`flex items-center gap-1 ${watched?.id === row.id ? "bg-accent-wash" : ""}`}>
                  <button type="button" onClick={() => setSelection(row)} title="See every value of this test and its source" className="min-w-0 flex-1 px-1.5 py-2 text-left transition-colors hover:bg-wash">
                    <span className="flex items-center gap-2 text-[13px]">
                      <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: colourOf(row) }} />
                      <span className="link whitespace-nowrap font-medium">Test {row.label}</span>
                    </span>
                    <span className="mt-0.5 block pl-[18px] text-[12px] leading-snug text-ink-2">{describe(row)}</span>
                    {spec.outcomes && row.cat && <span className="block pl-[18px] text-[11.5px] leading-snug text-ink-3">{spec.outcomes[row.cat].label}</span>}
                  </button>
                  {clips[row.id] && (
                    <button type="button" onClick={() => setPicked(row.id)} aria-pressed={watched?.id === row.id} className="btn h-7 shrink-0 gap-1 px-1.5 text-[11.5px]" title={`Watch NASA's video of test ${row.label}`}>
                      <FilmStrip size={13} /> Watch
                    </button>
                  )}
                </li>
              ))}
            </ul>
            {n > 6 && <p className="mt-1 text-[11.5px] text-ink-3">and {n - 6} more close by</p>}
          </section>
          <Inspector inline className="mx-3 mb-3" selection={selection ? { rid: selection.id, acc: selection.id.split("/")[0], n: 1, label: selection.label } : null} name={experiment} onClose={close} />

        </div>
      </div>

      {axisX && axisY && (
        <section aria-labelledby={`bench-map-${id}`} className={`${CARD} mt-4 px-4 pb-3 pt-4`}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h3 id={`bench-map-${id}`} className="text-[15px] font-semibold">Where NASA tested: every {kind.label.toLowerCase()} test</h3>
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 block w-full max-w-[860px]" role="img" aria-label={`${pool.length} tests plotted by ${axisX.label} and ${axisY.label}.`}>
            {ticks(axisX).map((v) => (
              <g key={v}>
                <line x1={px(v)} x2={px(v)} y1={M.t} y2={H - M.b} stroke="var(--color-rule)" />
                <text x={px(v)} y={H - M.b + 15} textAnchor="middle" className="fill-ink-3 text-[11px]">{axisX.format(v)}{axisX.unit}</text>
              </g>
            ))}
            {ticks(axisY).map((v) => (
              <g key={v}>
                <line x1={M.l} x2={W - M.r} y1={py(v)} y2={py(v)} stroke="var(--color-rule)" />
                <text x={M.l - 7} y={py(v) + 4} textAnchor="end" className="fill-ink-3 text-[11px]">{axisY.format(v)}</text>
              </g>
            ))}
            <text x={(M.l + W - M.r) / 2} y={H - 4} textAnchor="middle" className="fill-ink-2 text-[11.5px]">{axisX.label}</text>
            <text transform={`translate(12 ${(M.t + H - M.b) / 2}) rotate(-90)`} textAnchor="middle" className="fill-ink-2 text-[11.5px]">{axisY.label}{axisY.unit ? `,${axisY.unit}` : ""}</text>
            <rect x={M.l} y={M.t} width={W - M.l - M.r} height={H - M.t - M.b} fill="transparent" className="cursor-crosshair" onClick={pickFromMap} />
            {pool.map((row) => {
              const a = row.dims[xd];
              const b = row.dims[yd];
              if (!has(a) || !has(b)) return null;
              const on = nearIds.has(row.id);
              return (
                <circle key={row.id} cx={px(a)} cy={py(b)} r={on ? 5.5 : 4} fill={colourOf(row)} fillOpacity={on ? 0.95 : 0.4} stroke="var(--color-surface)" strokeWidth={1} className="cursor-pointer" onClick={() => setSelection(row)}>
                  <title>{`${row.label}: ${describe(row)}${spec.outcomes && row.cat ? `. ${spec.outcomes[row.cat].label}` : ""}`}</title>
                </circle>
              );
            })}
            <g transform={`translate(${px(setting[xd])} ${py(setting[yd])})`} pointerEvents="none">
              <circle r={11} fill="none" stroke="var(--color-ink)" strokeWidth={2} />
              <circle r={2.5} fill="var(--color-ink)" />
            </g>
          </svg>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px] text-ink-2">
            {outcomes.map(([key, o]) => (
              <span key={key} className="flex items-center gap-1.5"><span className="inline-block size-2.5 rounded-full" style={{ background: o.color }} />{o.label}</span>
            ))}
            <span className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-full border-2 border-ink" />Your setting</span>
          </p>
        </section>
      )}

      <details className="mt-4 max-w-[90ch] text-[12.5px]">
        <summary className="link inline cursor-pointer text-ink-3">Before you rely on this</summary>
        <p className="mt-1.5 leading-relaxed text-ink-3">
          {spec.caveat} One step is {kind.dims.map((d) => spec.dims[d].stepWords).join(", or ")}: tests within one step count as measured here, within two as close.
        </p>
      </details>

    </div>
  );
}
