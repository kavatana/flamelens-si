"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { FLOW_BANDS, O2_BANDS, bandOf } from "@flamelens/shared/bands";
import type { FlowCoverage } from "@/lib/data";
import { speedsOf, type FlowTest } from "@flamelens/shared/flow-map";
import { PHASE_LABEL, PHASE_NOUN, PHASE_VAR, int, kpa, pct } from "@flamelens/shared/format";
import { PHASES, PRESSURE_BANDS, airByOxygen, inFocus, oxygenByPhase, pressureBandOf, pressureByOxygen } from "@/lib/grids";
import { MATERIALS, type Material } from "@flamelens/shared/materials";
import { fromPreset, type ScenarioState } from "@/lib/scenario";
import { distance, type Cluster, type Phase } from "@flamelens/shared/scoring";
import type { Environment, ScenarioPreset } from "@flamelens/shared/types";
import { AirflowGrid } from "./airflow-grid";
import { BandGrid, Drill, GRID_COLS, type DrillItem, type GridRow, type Picked } from "./band-grid";

/**
 * The three views that share one grid: NASA's tests by oxygen and fuel type, by oxygen and
 * air speed, and by oxygen and pressure. A click on a square lists its tests; a click on a
 * test opens the record with the source of every value.
 */

/** A test, or a group of tests at one condition, to open in the record drawer. */
export type Opened = { rid: string; acc: string; n: number; label: string };

const HEADING = "text-[17px] font-semibold tracking-[-0.01em]";
const NOTE = "mt-2 text-[12px] leading-relaxed text-ink-3";
const HATCH = "repeating-linear-gradient(135deg, transparent 0 7px, var(--color-rule-2) 7px 8px)";
const PHASE_EXAMPLE: Record<Phase, string> = { solid: "fabric, plastic", liquid: "fuel droplets", gas: "burner flames" };
const tests = (n: number) => `${int(n)} ${n === 1 ? "test" : "tests"}`;

type Common = {
  /** The cabin that was analysed. */
  cabin: ScenarioState;
  material: Material | null;
  names: Record<string, string>;
  onOpen: (opened: Opened) => void;
};

function clusterItems(items: Cluster[], names: Record<string, string>, onOpen: (opened: Opened) => void): DrillItem[] {
  return items.map((c) => ({
    key: [c.acc, c.o2, c.p, c.fuel, c.kind, c.assumed].join("|"),
    title: `${names[c.acc] ?? c.acc} · ${tests(c.n)}`,
    note: `${c.fuel ?? "fuel not named"} · ${pct(c.o2)} oxygen${c.p === null ? "" : ` · ${kpa(c.p)}${c.assumed ? ", assumed" : ""}`}`,
    onOpen: () => onOpen({ rid: c.rid, acc: c.acc, n: c.n, label: c.label }),
  }));
}

// ----------------------------------------------------------------------------------------
// Oxygen
// ----------------------------------------------------------------------------------------

export function OxygenView({ clusters, cabin, material, names, streamRows, onOpen }: Common & { clusters: Cluster[]; streamRows: number }) {
  const [picked, setPicked] = useState<Picked | null>(null);
  const grid = useMemo(() => oxygenByPhase(clusters, material), [clusters, material]);
  // Counts that come from a row covering a day of tests or a tested range: one per condition the row lists.
  const grouped = useMemo(() => clusters.reduce((sum, c) => (c.phase && !c.stream && c.kind !== "test" && bandOf(c.o2) >= 0 ? sum + c.n : sum), 0), [clusters]);
  const here = bandOf(cabin.o2);
  const rowLabel = (phase: Phase) => (phase === "solid" && material ? material.label : PHASE_LABEL[phase]);
  const rows: GridRow[] = PHASES.map((phase) => ({
    id: phase,
    label: rowLabel(phase),
    sub: phase === "solid" && material ? material.note : PHASE_EXAMPLE[phase],
    color: PHASE_VAR[phase],
    dot: true,
    strong: cabin.focus === phase,
    cells: grid[phase].map((square) => ({ n: square.n })),
  }));
  const at = picked ?? (cabin.focus === "any" ? null : { row: cabin.focus, band: here });
  const square = at ? grid[at.row as Phase][at.band] : null;
  const band = O2_BANDS[at ? at.band : here];

  return (
    <div>
      <h2 className={HEADING}>Oxygen: where NASA&apos;s evidence is, and where it stops</h2>
      <div data-tour="grid" className="mt-3">
        <BandGrid rows={rows} here={here} corner={<><span className="sm:hidden">Oxygen, %</span><span className="hidden sm:inline">Oxygen in the air →</span></>} picked={picked} onPick={setPicked} place={(row, i) => `${row.label} at ${O2_BANDS[i].label} oxygen`} />
        {[
          { label: "On the Moon", short: "Moon", sub: "0.17 g" },
          { label: "On Mars", short: "Mars", sub: "0.38 g" },
        ].map((row) => (
          <div key={row.label} className={`mt-1 grid ${GRID_COLS} items-stretch gap-1`}>
            <span className="flex flex-col justify-center pr-1 text-[12.5px] leading-tight">
              <span className="font-medium"><span className="sm:hidden">{row.short}</span><span className="hidden sm:inline">{row.label}</span></span>
              <span className="text-[11px] text-ink-3">{row.sub}<span className="hidden sm:inline">, any fuel</span></span>
            </span>
            <span className="col-span-7 flex h-[34px] items-center justify-center rounded-xs border border-rule text-[12.5px] text-ink-2" style={{ backgroundImage: HATCH }}>
              <span className="rounded-xs bg-surface px-2 py-0.5">No test at any oxygen level</span>
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[13.5px] leading-relaxed" aria-live="polite">
        {at && square ? (
          <>
            <span className="font-semibold">{rowLabel(at.row as Phase)} at {band.label} oxygen: {square.n === 0 ? "no tests" : tests(square.n)}.</span>{" "}
            {square.n > 0 && <Link className="link" href={`/data?phase=${at.row}&o2min=${(band.lo * 100).toFixed(1)}&o2max=${(Math.min(1, band.hi) * 100).toFixed(1)}`}>Open them in the data table</Link>}
          </>
        ) : (
          <span className="font-semibold">At {band.label} oxygen: {tests(PHASES.reduce((sum, phase) => sum + grid[phase][here].n, 0))} across all fuels.</span>
        )}
      </p>
      {picked && square && <Drill key={`${picked.row}-${picked.band}`} items={clusterItems(square.items, names, onOpen)} />}
      <details className="mt-3 text-[12px]">
        <summary className="link inline cursor-pointer text-ink-3">How these are counted</summary>
        <p className={NOTE}>
        All of these tests ran weightless, in orbit.{grouped > 0 ? ` Where one of NASA's rows covers a whole day of tests, each condition it lists counts once (${int(grouped)} in all).` : ""} Not counted: {int(streamRows)} rows where the oxygen figure is the gas fed through the burner (up to 85% in CFI-G) and not the air around the flame.
      </p>
      </details>
    </div>
  );
}

// ----------------------------------------------------------------------------------------
// Air speed
// ----------------------------------------------------------------------------------------

type AirProps = Common & {
  tests: FlowTest[];
  flows: FlowCoverage;
  /** The solid tests in view: how many there are, how many give an air speed, which experiments give none, and the most oxygen any was burned in. */
  counts: { all: number; listed: number; silent: { name: string; n: number }[]; top: number | null };
};

export function AirView({ tests: all, flows, cabin, material, names, counts, onOpen }: AirProps) {
  const [picked, setPicked] = useState<Picked | null>(null);
  const drawn = useMemo(() => (material ? all.filter((t) => material.match.includes(t.fuel ?? "")) : all), [all, material]);
  const grid = useMemo(() => airByOxygen(all, material), [all, material]);
  const here = bandOf(cabin.o2);
  const subject = material ? material.label.toLowerCase() : "solid-fuel";

  if (cabin.focus !== "solid" && cabin.focus !== "any") {
    return (
      <div data-tour="airflow">
        <h2 className={HEADING}>Air speed: how fast the air moved</h2>
        <AirflowGrid bare flows={flows} focus={cabin.focus} material={material} names={names} />
      </div>
    );
  }

  const rows: GridRow[] = FLOW_BANDS.map((b, r) => ({
    id: b.id,
    label: b.id === "still" ? "still air" : `${b.label} cm/s`,
    short: b.short,
    color: PHASE_VAR.solid,
    cells: grid[r].map((square) => ({ n: square.n })),
  }));
  const column = drawn.filter((t) => bandOf(t.o2) === here);
  const speeds = column.flatMap(speedsOf);
  const square = picked ? grid[FLOW_BANDS.findIndex((b) => b.id === picked.row)][picked.band] : null;
  const pickedRow = picked ? rows.find((row) => row.id === picked.row)! : null;
  const more = counts.listed - drawn.length;
  const none = counts.all - counts.listed;
  const materialOf = (t: FlowTest) => MATERIALS.find((m) => m.match.includes(t.fuel ?? ""))?.label ?? t.fuel ?? "Solid";

  return (
    <div data-tour="airflow">
      <h2 className={HEADING}>Air speed: how fast the air moved past {material ? material.label.toLowerCase() : "the sample"}</h2>
      <div className="mt-3">
        <BandGrid rows={rows} here={here} corner={<><span className="sm:hidden">cm/s ↓</span><span className="hidden sm:inline">Oxygen → · air speed ↓</span></>} picked={picked} onPick={setPicked} place={(row, i) => `${O2_BANDS[i].label} oxygen, ${row.label}`} />
      </div>

      <p className="mt-3 text-[13.5px] leading-relaxed" aria-live="polite">
        {picked && square && pickedRow ? (
          <span className="font-semibold">{O2_BANDS[picked.band].label} oxygen, {pickedRow.label}: {square.n === 0 ? "no tests" : `${tests(square.n)} of ${material ? material.label.toLowerCase() : "a solid"}`}.</span>
        ) : column.length === 0 ? (
          <span className="font-semibold">
            No {subject} test at {O2_BANDS[here].label} oxygen, this cabin&apos;s level, lists an air speed.{counts.top !== null && ` The most oxygen any ${subject} test ran in was ${pct(counts.top)}.`}
          </span>
        ) : (
          <span className="font-semibold">
            At {O2_BANDS[here].label} oxygen, this cabin&apos;s level, {tests(column.length)} of {material ? material.label.toLowerCase() : "a solid"} list an air speed, from {Math.min(...speeds)} to {Math.max(...speeds)} cm/s.
          </span>
        )}
      </p>
      {picked && square && (
        <Drill
          key={`${picked.row}-${picked.band}`}
          items={square.items.map((t) => ({
            key: t.id,
            title: `${names[t.acc] ?? t.acc} · test ${t.label}`,
            note: `${materialOf(t)} · ${pct(t.o2)} · NASA's cell: “${t.raw}”`,
            onOpen: () => onOpen({ rid: t.id, acc: t.acc, n: 1, label: t.label }),
          }))}
        />
      )}
      <details className="mt-3 text-[12px]">
        <summary className="link inline cursor-pointer text-ink-3">How these are counted</summary>
        <p className={NOTE}>
        A test in which the crew changed the air speed is counted once at each speed NASA lists for it.
        {more > 0 && ` ${int(more)} more ${subject} ${more === 1 ? "test gives" : "tests give"} an air speed but no oxygen, so ${more === 1 ? "it" : "they"} cannot be placed.`}
        {none > 0 && ` ${int(none)} give no air speed${counts.silent.length ? `, ${int(counts.silent[0].n)} of them in ${counts.silent[0].name}` : ""}.`}
        {" "}Most of NASA&apos;s tables do not say, test by test, whether the sample kept burning.
      </p>
      </details>
    </div>
  );
}

// ----------------------------------------------------------------------------------------
// Pressure
// ----------------------------------------------------------------------------------------

type PressureProps = Common & {
  clusters: Cluster[];
  presets: ScenarioPreset[];
  environments: Environment[];
  /** How many tests of the fuel in view are close to the cabin in oxygen and pressure together. */
  close: number;
  /** The detailed map, drawn only when asked for. */
  map: ReactNode;
};

export function PressureView({ clusters, cabin, material, names, presets, environments, close, map, onOpen }: PressureProps) {
  const [picked, setPicked] = useState<Picked | null>(null);
  const [open, setOpen] = useState(false);
  const grid = useMemo(() => pressureByOxygen(clusters, cabin.focus, material), [clusters, cabin.focus, material]);
  const here = bandOf(cabin.o2);
  const hereRow = pressureBandOf(cabin.p);
  const pins = useMemo(() => {
    const at = new Map<string, string>();
    for (const preset of presets) {
      const planned = fromPreset(preset, environments);
      at.set(`${pressureBandOf(planned.p)}|${bandOf(planned.o2)}`, preset.name);
    }
    return at;
  }, [presets, environments]);
  const color = material || cabin.focus === "solid" ? PHASE_VAR.solid : cabin.focus === "any" ? "var(--color-ink-2)" : PHASE_VAR[cabin.focus];
  const subject = material ? `${material.label.toLowerCase()} ` : cabin.focus === "any" ? "" : `${PHASE_NOUN[cabin.focus]} `;
  const bands = [...PRESSURE_BANDS.map((b) => ({ id: b.id, label: b.label, short: b.short, sub: b.sub })), { id: "none", label: "not listed", short: "none", sub: "no pressure in the table" }];
  const rows: GridRow[] = bands.map((b, r) => ({
    ...b,
    color,
    strong: r === hereRow,
    cells: grid[r].map((square, i) => ({ n: square.n, hollow: square.n > 0 && square.assumed === square.n, pin: pins.get(`${r}|${i}`), here: r === hereRow && i === here })),
  }));
  const square = picked ? grid[bands.findIndex((b) => b.id === picked.row)][picked.band] : null;
  const pickedRow = picked ? rows.find((row) => row.id === picked.row)! : null;
  // The nearest test of this fuel that lists both oxygen and pressure.
  const nearest = useMemo(() => {
    let best: (Cluster & { d: number }) | null = null;
    for (const c of clusters) {
      if (c.stream || c.p === null || !inFocus(c, cabin.focus, material)) continue;
      const d = distance(c, cabin);
      if (!best || d < best.d) best = { ...c, d };
    }
    return best;
  }, [clusters, cabin, material]);
  const anyAssumed = grid.some((row) => row.some((s) => s.assumed > 0));

  return (
    <div data-tour="pressure">
      <h2 className={HEADING}>Pressure: the same tests, by oxygen and pressure</h2>
      <div className="mt-3">
        <BandGrid rows={rows} here={here} corner={<><span className="sm:hidden">kPa ↓</span><span className="hidden sm:inline">Oxygen → · pressure ↓</span></>} picked={picked} onPick={setPicked} place={(row, i) => `${O2_BANDS[i].label} oxygen, ${row.id === "none" ? "pressure not listed" : row.label}`} />
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1 text-[12px] text-ink-2">
        <li className="flex items-center gap-1.5"><span className="inline-block size-[7px] rounded-full bg-ink" />this cabin</li>
        <li className="flex items-center gap-1.5"><span className="inline-block size-[7px] rotate-45 bg-ink" />a cabin NASA plans</li>
        {anyAssumed && <li className="flex items-center gap-1.5"><span className="inline-block h-3 w-4 rounded-xs" style={{ boxShadow: `inset 0 0 0 1.5px ${color}` }} />pressure assumed: NASA&apos;s table does not list it</li>}
      </ul>

      <p className="mt-3 text-[13.5px] leading-relaxed" aria-live="polite">
        {picked && square && pickedRow ? (
          <span className="font-semibold">{O2_BANDS[picked.band].label} oxygen, pressure {pickedRow.label}: {square.n === 0 ? "no tests" : tests(square.n)}.</span>
        ) : close > 0 ? (
          <span className="font-semibold">{int(close)} {subject}{close === 1 ? "test is" : "tests are"} close to this cabin in oxygen and pressure together.</span>
        ) : nearest ? (
          <>
            <span className="font-semibold">No {subject}test is close to this cabin in oxygen and pressure together.</span>{" "}
            The nearest ran at {pct(nearest.o2)} oxygen and {kpa(nearest.p!)}{nearest.assumed ? " (assumed)" : ""}, in {names[nearest.acc] ?? nearest.acc}.{" "}
            <button type="button" className="link" onClick={() => onOpen({ rid: nearest.rid, acc: nearest.acc, n: nearest.n, label: nearest.label })}>Open it</button>
          </>
        ) : (
          <span className="font-semibold">No {subject}test lists both its oxygen and its pressure.</span>
        )}
      </p>
      {picked && square && <Drill key={`${picked.row}-${picked.band}`} items={clusterItems(square.items, names, onOpen)} />}
      <details className="mt-3 text-[12px]">
        <summary className="link inline cursor-pointer text-ink-3">How these are counted</summary>
        <p className={NOTE}>Close means within 3 points of oxygen and a 25% change in pressure. All of these tests ran weightless, in orbit.</p>
      </details>

      <details className="mt-3 border-t border-rule pt-3 text-[13px]" onToggle={(e) => setOpen(e.currentTarget.open)}>
        <summary className="link inline cursor-pointer text-ink-2">Every test as a dot, at its exact oxygen and pressure</summary>
        {open && <div className="mt-3">{map}</div>}
      </details>
    </div>
  );
}
