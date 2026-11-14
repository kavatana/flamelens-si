"use client";

import { Fragment, useState, type ReactNode } from "react";
import { O2_BANDS } from "@flamelens/shared/bands";
import { int } from "@flamelens/shared/format";

/**
 * The grid every data view shares: oxygen across, something else down, and one count per
 * square. The column framed in black is the cabin's oxygen. Learn it once, read all three.
 * Pointing at a square, or reaching it with the keyboard, names it at once; a click lists its tests.
 */

export type GridCell = {
  n: number;
  /** Every test here has a pressure that was assumed, so the square is drawn as an outline. */
  hollow?: boolean;
  /** A cabin NASA plans sits in this square. */
  pin?: string;
  /** The cabin in view sits in this square. */
  here?: boolean;
};
export type GridRow = { id: string; label: string; short?: string; sub?: string; color: string; cells: GridCell[]; dot?: boolean; strong?: boolean };
export type Picked = { row: string; band: number };

export const GRID_COLS = "grid-cols-[4.3rem_repeat(7,minmax(0,1fr))] sm:grid-cols-[8.5rem_repeat(7,minmax(0,1fr))]";

type Props = {
  rows: GridRow[];
  /** The oxygen band of the cabin. */
  here: number;
  /** What the corner says: which way oxygen runs, and what the rows are. */
  corner: ReactNode;
  picked: Picked | null;
  onPick: (cell: Picked | null) => void;
  /** Where one square is, in words: "Solids at 18–20% oxygen". */
  place: (row: GridRow, band: number) => string;
};

const tests = (n: number) => (n === 0 ? "No tests" : `${int(n)} ${n === 1 ? "test" : "tests"}`);

export function BandGrid({ rows, here, corner, picked, onPick, place }: Props) {
  const [hover, setHover] = useState<Picked | null>(null);
  const top = Math.max(1, ...rows.flatMap((row) => row.cells.map((cell) => cell.n)));
  const hoverRow = hover ? rows.findIndex((row) => row.id === hover.row) : -1;
  const hovered = hoverRow >= 0 ? rows[hoverRow].cells[hover!.band] : null;
  // The label of a square near an edge leans inward, so it never leaves the panel.
  const lean = !hover ? "" : hover.band <= 1 ? "left-0" : hover.band >= O2_BANDS.length - 2 ? "right-0" : "left-1/2 -translate-x-1/2";

  return (
    <div className={`grid ${GRID_COLS} gap-1`} style={{ gridTemplateRows: `auto repeat(${rows.length}, auto)` }} onPointerLeave={() => setHover(null)}>
      <span className="self-end pb-1 text-[11.5px] leading-tight text-ink-3" style={{ gridColumn: 1, gridRow: 1 }}>{corner}</span>
      {O2_BANDS.map((b, i) => (
        <span key={b.id} style={{ gridColumn: i + 2, gridRow: 1 }} className={`flex flex-col justify-end rounded-t-xs pb-1 pt-1.5 text-center text-[11.5px] leading-tight transition-colors sm:px-0.5 ${i === here ? "bg-ink font-medium text-white" : hover?.band === i ? "bg-wash text-ink" : "text-ink-2"}`}>
          {i === here && <span className="block text-[10px] font-normal opacity-80 sm:text-[10.5px]"><span className="sm:hidden">you</span><span className="hidden sm:inline">your cabin</span></span>}
          <span className="num block text-[10px] sm:hidden">{b.short}</span>
          <span className="num hidden sm:block">{b.label}</span>
          {b.sub && i !== here && <span className="hidden text-[10.5px] text-ink-3 sm:block">{b.sub}</span>}
        </span>
      ))}
      {rows.map((row, r) => (
        <Fragment key={row.id}>
          <span style={{ gridColumn: 1, gridRow: r + 2 }} className={`-ml-1.5 flex flex-col justify-center rounded-xs pl-1.5 pr-1 text-[12.5px] leading-tight transition-colors ${hover?.row === row.id ? "bg-wash" : ""}`}>
            <span className={`flex items-center gap-1.5 ${row.strong ? "font-semibold" : "font-medium"}`}>
              {row.dot && <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: row.color }} />}
              <span className="sm:hidden">{row.short ?? row.label}</span>
              <span className="hidden sm:inline">{row.label}</span>
            </span>
            {row.sub && <span className={`hidden text-[11px] text-ink-3 sm:block ${row.dot ? "pl-4" : ""}`}>{row.sub}</span>}
          </span>
          {row.cells.map((cell, i) => {
            const strength = cell.n === 0 ? 0 : 14 + 72 * (Math.log(cell.n + 1) / Math.log(top + 1));
            const isPicked = picked?.row === row.id && picked.band === i;
            const paint =
              cell.n === 0
                ? undefined
                : cell.hollow
                  ? { background: "var(--color-surface)", boxShadow: `inset 0 0 0 1.5px ${row.color}`, color: "var(--color-ink)" }
                  : { background: `color-mix(in oklab, ${row.color} ${strength.toFixed(0)}%, var(--color-surface))`, color: strength > 52 ? "#fff" : "var(--color-ink)" };
            return (
              <button
                key={`${row.id}-${O2_BANDS[i].id}`}
                type="button"
                aria-pressed={isPicked}
                aria-label={`${place(row, i)}: ${tests(cell.n).toLowerCase()}${cell.pin ? `. ${cell.pin} sits here` : ""}${cell.here ? ". This cabin sits here" : ""}`}
                onClick={() => onPick(isPicked ? null : { row: row.id, band: i })}
                // A mouse shows the label while it points; a finger gets it from the line under the grid instead.
                onPointerEnter={(e) => e.pointerType === "mouse" && setHover({ row: row.id, band: i })}
                onFocus={(e) => e.currentTarget.matches(":focus-visible") && setHover({ row: row.id, band: i })}
                onBlur={() => setHover(null)}
                style={{ gridColumn: i + 2, gridRow: r + 2, ...paint }}
                className={`num relative flex h-[38px] items-center justify-center rounded-xs text-[12px] sm:h-[44px] sm:text-[14.5px] ${cell.n === 0 ? "border border-rule bg-surface text-ink-3" : "font-semibold"} ${isPicked ? "z-[1] outline-[2.5px] outline-offset-1 outline-accent" : "hover:outline-2 hover:-outline-offset-2 hover:outline-ink-3"}`}
              >
                {int(cell.n)}
                {cell.pin && <span className="absolute right-[5px] top-[5px] size-[7px] rotate-45 bg-ink ring-1 ring-surface" />}
                {cell.here && <span className="absolute bottom-[5px] left-[5px] size-[7px] rounded-full bg-ink ring-1 ring-surface" />}
              </button>
            );
          })}
        </Fragment>
      ))}
      {here >= 0 && <span aria-hidden className="pointer-events-none z-[2] -m-[3px] rounded-sm border-2 border-ink" style={{ gridColumn: here + 2, gridRow: "1 / -1" }} />}
      {hover && hovered && (
        <span aria-hidden className="pointer-events-none relative z-10" style={{ gridColumn: hover.band + 2, gridRow: hoverRow + 2 }}>
          <span className={`absolute bottom-[calc(100%+7px)] whitespace-nowrap rounded-xs bg-ink px-2 py-1.5 text-[12px] leading-tight text-white shadow-[0_6px_18px_-8px_rgba(20,23,26,0.6)] ${lean}`}>
            <span className="font-semibold">{tests(hovered.n)}</span>
            <span className="opacity-75"> · {place(rows[hoverRow], hover.band)}</span>
            {(hovered.pin || hovered.here) && <span className="block pt-0.5 opacity-75">{[hovered.here ? "This cabin" : null, hovered.pin].filter(Boolean).join(" and the ")} {hovered.here && hovered.pin ? "sit" : "sits"} here</span>}
            {hovered.hollow && <span className="block pt-0.5 opacity-75">Pressure assumed, not listed by NASA</span>}
          </span>
        </span>
      )}
    </div>
  );
}

export type DrillItem = { key: string; title: string; note: string; onOpen: () => void };

/** The tests behind one square. Each opens the record with the source of every value. */
export function Drill({ items }: { items: DrillItem[] }) {
  const [all, setAll] = useState(false);
  const shown = all ? items : items.slice(0, 6);
  if (items.length === 0) return null;
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {shown.map((item) => (
        <li key={item.key}>
          <button type="button" className="btn h-auto flex-col items-start gap-0 py-1 text-left" onClick={item.onOpen}>
            <span>{item.title}</span>
            <span className="max-w-[30ch] truncate text-[11px] font-normal text-ink-3">{item.note}</span>
          </button>
        </li>
      ))}
      {items.length > shown.length && (
        <li><button type="button" className="btn h-full" onClick={() => setAll(true)}>Show all {int(items.length)}</button></li>
      )}
    </ul>
  );
}
