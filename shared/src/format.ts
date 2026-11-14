/** Display formatting. All inputs are in canonical units (fractions, kPa, bytes). */

export const KPA_PER_PSI = 6.894757;

const trim = (s: string) => (s.includes(".") ? s.replace(/\.?0+$/, "") : s);

export function pct(fraction: number, digits = 1): string {
  return `${trim((fraction * 100).toFixed(digits))}%`;
}

export function kpa(value: number): string {
  return `${trim(value.toFixed(value >= 100 ? 0 : 1))} kPa`;
}

export function psia(valueKpa: number): string {
  return `${trim((valueKpa / KPA_PER_PSI).toFixed(1))} psia`;
}

export function int(n: number): string {
  return n.toLocaleString("en-US");
}

export function num(value: number, digits = 3): string {
  if (value === 0) return "0";
  const abs = Math.abs(value);
  if (abs >= 1000) return int(Math.round(value));
  return trim(value.toPrecision(Math.max(digits, Math.ceil(Math.log10(abs)) + 1)).replace(/e.*/, (m) => m));
}

/** "12" or "12 to 34", using a formatter for each end. */
export function span(min: number, max: number, fmt: (x: number) => string): string {
  return fmt(min) === fmt(max) ? fmt(min) : `${fmt(min)} to ${fmt(max)}`;
}

export function bytes(n: number): string {
  if (!n) return "0";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log10(n) / 3));
  const v = n / 10 ** (i * 3);
  return `${trim(v.toFixed(v >= 100 ? 0 : 1))} ${units[i]}`;
}

/** Distance in steps, rounded up so a test just outside a boundary never reads as inside it. */
export function steps(d: number): string {
  return d < 10 ? (Math.ceil(d * 10 - 1e-9) / 10).toFixed(1) : Math.ceil(d).toFixed(0);
}

export const PHASE_LABEL: Record<string, string> = { solid: "Solids", liquid: "Liquids", gas: "Gases" };
export const PHASE_NOUN: Record<string, string> = { solid: "solid-fuel", liquid: "liquid-fuel", gas: "gas-fuel" };
export const PHASE_VAR: Record<string, string> = {
  solid: "var(--color-solid)",
  liquid: "var(--color-liquid)",
  gas: "var(--color-gas)",
};

export const QUALITY_LABEL: Record<string, string> = {
  reported: "PSI table",
  corrected: "Repaired",
  context: "NASA text",
  assumed: "Assumed",
  derived: "Derived",
};

export const QUALITY_HELP: Record<string, string> = {
  reported: "Read directly from a cell of a PSI experimental table. Only the unit was converted.",
  corrected: "A PSI cell that was repaired. The note says what was changed and why.",
  context: "Not a table cell, but stated in NASA's own text. The supporting quote is shown.",
  assumed: "Stated nowhere in PSI. The note says what was assumed.",
  derived: "Computed from other values of the same record.",
};
