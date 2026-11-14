"use client";

import { scaleLinear, scaleLog, scaleSqrt } from "d3-scale";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { PHASE_LABEL, PHASE_VAR, int, kpa, pct, psia } from "@flamelens/shared/format";
import { O2_RANGE, P_RANGE, type ScenarioState } from "@/lib/scenario";
import { O2_STEP, type Cluster } from "@flamelens/shared/scoring";
import type { Environment } from "@flamelens/shared/types";

/** Sea-level oxygen partial pressure, kPa: 0.21 x 101.325. */
const NORMOXIC_KPA = 21.28;
const NARROW_MAX = 0.46;
const Y_TICKS = [30, 50, 70, 100, 150, 200, 300, 500];
const LANE = 40;
const M = { l: 58, r: 16, t: 14, b: 40 };

type Mark = { c: Cluster; cx: number; cy: number; r: number; i: number };

type Props = {
  clusters: Cluster[];
  environments: Environment[];
  names: Record<string, string>;
  scenario: ScenarioState;
  /** `commit` is false while dragging and true when the value is final. */
  onScenario: (patch: Partial<ScenarioState>, commit: boolean) => void;
  highlight: string | null;
  onSelect: (cluster: Cluster) => void;
  full: boolean;
  onFull: (full: boolean) => void;
};

const ENV_LABEL: Record<string, { dx: number; dy: number; anchor: "start" | "end" }> = {
  cabin: { dx: 12, dy: -14, anchor: "start" },
  airlock: { dx: 9, dy: -11, anchor: "start" },
  exploration: { dx: 9, dy: -11, anchor: "start" },
  spacesuit: { dx: -10, dy: -9, anchor: "end" },
};

function color(c: Cluster): string {
  return c.phase ? PHASE_VAR[c.phase] : "var(--color-ink-3)";
}

const Marks = memo(function Marks({ marks, highlight, hover }: { marks: Mark[]; highlight: string | null; hover: number | null }) {
  return (
    <g pointerEvents="none">
      {marks.map(({ c, cx, cy, r, i }) => {
        const dim = highlight !== null && c.acc !== highlight;
        const active = hover === i;
        const opacity = dim ? 0.1 : 1;
        if (c.stream) {
          const s = Math.max(2.5, r * 0.6);
          return (
            <path
              key={i}
              d={`M${cx - s},${cy - s}L${cx + s},${cy + s}M${cx - s},${cy + s}L${cx + s},${cy - s}`}
              stroke={active ? "var(--color-ink)" : "var(--color-ink-3)"}
              strokeWidth={active ? 2 : 1.25}
              strokeLinecap="round"
              opacity={dim ? 0.1 : active ? 1 : 0.5}
            />
          );
        }
        const fill = c.assumed ? "var(--color-surface)" : color(c);
        const stroke = active ? "var(--color-ink)" : c.assumed ? color(c) : "var(--color-surface)";
        const strokeWidth = active ? 2 : c.assumed ? 1.5 : 1.25;
        const common = { fill, stroke, strokeWidth, opacity, fillOpacity: c.assumed ? 0.92 : 0.86 };
        if (c.kind === "test") return <circle key={i} cx={cx} cy={cy} r={r} {...common} />;
        const side = r * 1.7;
        return <rect key={i} x={cx - side / 2} y={cy - side / 2} width={side} height={side} rx={1} {...common} />;
      })}
    </g>
  );
});

export function EvidenceMap({ clusters, environments, names, scenario, onScenario, highlight, onSelect, full, onFull }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [width, setWidth] = useState(920);
  const [hover, setHover] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(320, Math.round(entry.contentRect.width))));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const height = width < 640 ? 440 : width < 760 ? 480 : 560;
  const plotBottom = height - M.b - LANE;
  const laneY = plotBottom + LANE / 2 + 2;
  const xMax = full ? 1 : NARROW_MAX;

  // Positions are rounded to a tenth of a pixel: Node and browsers disagree on the last
  // digit of Math.log, which would otherwise break hydration.
  const { x, y, radius, xInvert, yInvert } = useMemo(() => {
    const xs = scaleLinear().domain([O2_RANGE[0], xMax]).range([M.l, width - M.r]);
    const ys = scaleLog().domain([P_RANGE[0], 560]).range([plotBottom, M.t]);
    const rs = scaleSqrt().domain([1, 470]).range([4, 18]).clamp(true);
    const tenth = (v: number) => Math.round(v * 10) / 10;
    return {
      x: (v: number) => tenth(xs(v)),
      y: (v: number) => tenth(ys(v)),
      radius: (n: number) => tenth(rs(n)),
      xInvert: (px: number) => xs.invert(px),
      yInvert: (py: number) => ys.invert(py),
    };
  }, [width, plotBottom, xMax]);

  const { marks, beyond } = useMemo(() => {
    const out: Mark[] = [];
    let beyond = 0;
    clusters.forEach((c, i) => {
      if (c.o2 > xMax + 1e-9 || c.o2 < O2_RANGE[0]) {
        beyond += c.n;
        return;
      }
      out.push({ c, cx: x(c.o2), cy: c.p === null ? laneY : y(c.p), r: radius(c.n), i });
    });
    out.sort((a, b) => b.r - a.r);
    return { marks: out, beyond };
  }, [clusters, x, y, radius, xMax, laneY]);

  const xTicks = full ? [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1] : [0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45];

  const normoxic = useMemo(() => {
    const pts: string[] = [];
    for (let o = O2_RANGE[0]; o <= xMax + 1e-9; o += 0.005) {
      const p = NORMOXIC_KPA / o;
      if (p >= P_RANGE[0] && p <= 560) pts.push(`${x(o)},${y(p)}`);
    }
    return pts.join(" ");
  }, [x, y, xMax]);

  const sx = x(Math.min(scenario.o2, xMax));
  const sy = y(scenario.p);
  const scenarioVisible = scenario.o2 <= xMax + 1e-9;
  const rx = Math.abs(x(scenario.o2 + O2_STEP) - x(scenario.o2));
  const ry = Math.abs(y(scenario.p * 1.25) - y(scenario.p));

  function locate(event: React.PointerEvent): { px: number; py: number } {
    const rect = svg.current!.getBoundingClientRect();
    return { px: event.clientX - rect.left, py: event.clientY - rect.top };
  }

  function nearest(px: number, py: number): number | null {
    let best: number | null = null;
    let bestScore = Infinity;
    for (const m of marks) {
      const d = Math.hypot(m.cx - px, m.cy - py);
      if (d > m.r + 14) continue;
      // Prefer the mark whose edge is closest, so small marks on top of large ones stay reachable.
      const score = d - m.r * 0.5;
      if (score < bestScore) {
        bestScore = score;
        best = m.i;
      }
    }
    return best;
  }

  function moveScenario(event: React.PointerEvent, commit: boolean) {
    const { px, py } = locate(event);
    const o2 = Math.round(Math.min(xMax, Math.max(O2_RANGE[0], xInvert(px))) * 1000) / 1000;
    const p = Math.round(Math.min(P_RANGE[1], Math.max(P_RANGE[0], yInvert(py))) * 10) / 10;
    onScenario({ o2, p }, commit);
  }

  function onKey(event: React.KeyboardEvent) {
    const big = event.shiftKey;
    const dO2 = big ? 0.02 : 0.005;
    const fP = big ? 1.1 : 1.02;
    const patch: Partial<ScenarioState> | null =
      event.key === "ArrowRight" ? { o2: scenario.o2 + dO2 }
      : event.key === "ArrowLeft" ? { o2: scenario.o2 - dO2 }
      : event.key === "ArrowUp" ? { p: scenario.p * fP }
      : event.key === "ArrowDown" ? { p: scenario.p / fP }
      : null;
    if (!patch) return;
    event.preventDefault();
    onScenario(patch, true);
  }

  const hovered = hover === null ? null : clusters[hover];
  const hoveredMark = hover === null ? null : marks.find((m) => m.i === hover) ?? null;
  const region = environments.find((e) => e.kind === "region");
  const points = environments.filter((e) => e.kind === "point" && (e.o2_fraction ?? 0) <= xMax + 1e-9);

  return (
    <div>
      <div ref={wrap} className="relative select-none">
        <svg
          ref={svg}
          width={width}
          height={height}
          role="img"
          aria-label="Scatter plot of NASA PSI combustion tests by oxygen fraction and total pressure, with crew atmospheres and the current scenario."
          className={dragging ? "cursor-grabbing" : undefined}
          onPointerMove={(e) => {
            if (dragging) moveScenario(e, false);
          }}
          onPointerUp={(e) => {
            if (!dragging) return;
            setDragging(false);
            moveScenario(e, true);
          }}
        >
          {/* Grid */}
          {xTicks.map((t) => (
            <line key={t} x1={x(t)} x2={x(t)} y1={M.t} y2={plotBottom} stroke="var(--color-rule)" />
          ))}
          {Y_TICKS.map((t) => (
            <line key={t} x1={M.l} x2={width - M.r} y1={y(t)} y2={y(t)} stroke="var(--color-rule)" />
          ))}
          <line x1={M.l} x2={width - M.r} y1={plotBottom} y2={plotBottom} stroke="var(--color-rule-2)" />
          <line x1={M.l} x2={M.l} y1={M.t} y2={plotBottom} stroke="var(--color-rule-2)" />

          {/* Moon Base range, from NASA's challenge statement */}
          {region && region.o2_fraction_min! < xMax && (
            <g>
              <rect
                x={x(region.o2_fraction_min!)}
                y={y(region.pressure_kpa_max!)}
                width={x(xMax) - x(region.o2_fraction_min!)}
                height={y(region.pressure_kpa_min!) - y(region.pressure_kpa_max!)}
                fill="var(--color-ink)"
                fillOpacity={0.045}
                stroke="var(--color-ink-3)"
                strokeWidth={1}
              />
              <text x={x(region.o2_fraction_min!) + 7} y={y(region.pressure_kpa_min!) - 8} fontSize={11.5} fontWeight={500} fill="var(--color-ink-2)">
                Moon Base range
              </text>
            </g>
          )}

          {/* Sea-level oxygen partial pressure */}
          <polyline points={normoxic} fill="none" stroke="var(--color-rule-2)" strokeWidth={1.25} />
          <text x={x(0.118) + 8} y={y(NORMOXIC_KPA / 0.118) - 7} fontSize={11} fill="var(--color-ink-3)">
            same oxygen as sea-level air
          </text>

          {/* Lane for tests whose pressure PSI does not report */}
          <rect x={M.l} y={plotBottom + 7} width={width - M.l - M.r} height={LANE - 10} fill="var(--color-wash)" />
          <text x={M.l + 7} y={laneY + 4} fontSize={11} fill="var(--color-ink-3)">
            pressure not reported
          </text>

          {/* Axes */}
          {xTicks.map((t) => (
            <text key={t} x={x(t)} y={plotBottom + LANE + 16} textAnchor="middle" fontSize={11.5} fill="var(--color-ink-3)" className="num">
              {Math.round(t * 100)}
            </text>
          ))}
          <text x={(M.l + width - M.r) / 2} y={height - 4} textAnchor="middle" fontSize={12} fill="var(--color-ink-2)">
            Oxygen in the atmosphere (% by volume)
          </text>
          {Y_TICKS.map((t) => (
            <text key={t} x={M.l - 8} y={y(t) + 4} textAnchor="end" fontSize={11.5} fill="var(--color-ink-3)" className="num">
              {t}
            </text>
          ))}
          <text transform={`translate(13 ${(M.t + plotBottom) / 2}) rotate(-90)`} textAnchor="middle" fontSize={12} fill="var(--color-ink-2)">
            Total pressure (kPa, log scale)
          </text>

          {/* Scenario reach: one step and two steps */}
          {scenarioVisible && (
            <g pointerEvents="none">
              <ellipse cx={sx} cy={sy} rx={rx * 2} ry={ry * 2} fill="none" stroke="var(--color-ink-3)" strokeWidth={1} opacity={0.55} />
              <ellipse cx={sx} cy={sy} rx={rx} ry={ry} fill="var(--color-ink)" fillOpacity={0.04} stroke="var(--color-ink)" strokeWidth={1.25} />
              <line x1={sx} x2={sx} y1={M.t} y2={plotBottom + LANE - 3} stroke="var(--color-ink)" strokeWidth={1} opacity={0.35} />
              <line x1={M.l} x2={width - M.r} y1={sy} y2={sy} stroke="var(--color-ink)" strokeWidth={1} opacity={0.35} />
            </g>
          )}

          <Marks marks={marks} highlight={highlight} hover={hover} />

          {/* Hover and click target for the marks */}
          <rect
            x={M.l}
            y={M.t}
            width={width - M.l - M.r}
            height={plotBottom + LANE - M.t}
            fill="transparent"
            className={hover === null ? undefined : "cursor-pointer"}
            onPointerMove={(e) => {
              if (dragging) return;
              const { px, py } = locate(e);
              setHover(nearest(px, py));
            }}
            onPointerLeave={() => setHover(null)}
            onClick={() => {
              if (hover !== null) onSelect(clusters[hover]);
            }}
          />

          {/* Crew atmospheres */}
          {points.map((env) => {
            const pos = ENV_LABEL[env.id] ?? { dx: 10, dy: 4, anchor: "start" as const };
            const cx = x(env.o2_fraction!);
            const cy = y(env.pressure_kpa!);
            return (
              <g
                key={env.id}
                className="cursor-pointer"
                onClick={() => onScenario({ o2: env.o2_fraction!, p: env.pressure_kpa! }, true)}
              >
                <title>{`${env.name}: ${env.detail}. Click to put the scenario here.`}</title>
                <rect x={cx - 5} y={cy - 5} width={10} height={10} transform={`rotate(45 ${cx} ${cy})`} fill="var(--color-surface)" stroke="var(--color-ink)" strokeWidth={1.5} />
                <text
                  x={cx + pos.dx}
                  y={cy + pos.dy}
                  textAnchor={pos.anchor}
                  fontSize={11.5}
                  fontWeight={500}
                  fill="var(--color-ink)"
                  stroke="var(--color-surface)"
                  strokeWidth={3.5}
                  paintOrder="stroke"
                >
                  {env.name}
                </text>
              </g>
            );
          })}

          {/* Scenario marker */}
          {scenarioVisible && (
            <g
              tabIndex={0}
              role="slider"
              aria-label="Scenario position. Arrow keys change oxygen and pressure; hold Shift for larger steps."
              aria-valuetext={`${pct(scenario.o2)} oxygen at ${kpa(scenario.p)}`}
              aria-valuenow={Math.round(scenario.o2 * 1000) / 10}
              aria-valuemin={O2_RANGE[0] * 100}
              aria-valuemax={100}
              className={dragging ? "cursor-grabbing" : "cursor-grab"}
              onKeyDown={onKey}
              onPointerDown={(e) => {
                e.preventDefault();
                svg.current?.setPointerCapture(e.pointerId);
                setHover(null);
                setDragging(true);
              }}
            >
              <circle cx={sx} cy={sy} r={18} fill="transparent" />
              <circle cx={sx} cy={sy} r={8.5} fill="var(--color-ink)" stroke="var(--color-surface)" strokeWidth={2.5} />
              <circle cx={sx} cy={sy} r={2.25} fill="var(--color-surface)" />
            </g>
          )}
        </svg>

        {hovered && hoveredMark && !dragging && (
          <div
            role="status"
            className="panel pointer-events-none absolute z-10 w-[236px] px-3 py-2.5 text-[12.5px] shadow-[0_6px_24px_-8px_rgba(20,23,26,0.28)]"
            style={{
              left: Math.min(Math.max(8, hoveredMark.cx + (hoveredMark.cx > width - 270 ? -250 : 16)), width - 244),
              top: Math.max(4, hoveredMark.cy - 12),
            }}
          >
            <div className="flex items-center gap-1.5 font-medium">
              <span className="inline-block size-2 rounded-full" style={{ background: hovered.stream ? "var(--color-ink-3)" : color(hovered) }} />
              {names[hovered.acc]}
            </div>
            <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-ink-2">
              <dt>Oxygen</dt>
              <dd className="num text-ink">{pct(hovered.o2)}</dd>
              <dt>Pressure</dt>
              <dd className="num text-ink">{hovered.p === null ? "not reported" : `${kpa(hovered.p)} (${psia(hovered.p)})`}</dd>
              <dt>{hovered.kind === "test" ? "Tests" : "Rows"}</dt>
              <dd className="num text-ink">{int(hovered.n)}</dd>
              {hovered.phase && (
                <>
                  <dt>Fuel</dt>
                  <dd className="text-ink">{PHASE_LABEL[hovered.phase]}</dd>
                </>
              )}
            </dl>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {hovered.stream && <span className="tag">Oxygen is the burner stream</span>}
              {hovered.assumed && <span className="tag tag-caution">Pressure assumed</span>}
              {hovered.kind !== "test" && <span className="tag">Listed levels, not single burns</span>}
            </div>
            <div className="mt-1.5 text-[11.5px] text-ink-3">Click to see the source</div>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[12.5px] text-ink-2">
        {(["solid", "liquid", "gas"] as const).map((phase) => (
          <span key={phase} className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full" style={{ background: PHASE_VAR[phase] }} />
            {PHASE_LABEL[phase]}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full border-[1.5px] border-ink-3 bg-surface" />
          Pressure assumed
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-[1px] bg-ink-3" />
          Listed levels
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="num text-[13px] leading-none text-ink-3">×</span>
          Burner oxygen stream
        </span>
        <span className="text-ink-3">Larger marks hold more tests.</span>
        <button type="button" className="btn ml-auto" aria-pressed={full} onClick={() => onFull(!full)}>
          {full ? "Showing 10 to 100% oxygen" : "Show up to 100% oxygen"}
        </button>
      </div>
      {!full && beyond > 0 && (
        <p className="mt-2 text-[12.5px] text-ink-3">
          {int(beyond)} rows above {Math.round(NARROW_MAX * 100)}% oxygen are off this view. They are burner oxygen streams from inverse flames, not cabin atmospheres.
        </p>
      )}
    </div>
  );
}
