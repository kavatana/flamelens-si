/** Oxygen bands used wherever tests are counted by oxygen level. */
export const O2_BANDS = [
  { id: "low", label: "under 18%", short: "<18", sub: "", lo: 0, hi: 0.18, mid: 0.15 },
  { id: "lean", label: "18–20%", short: "18–20", sub: "", lo: 0.18, hi: 0.205, mid: 0.19 },
  { id: "air", label: "21–22%", short: "21–22", sub: "cabin air", lo: 0.205, hi: 0.225, mid: 0.21 },
  { id: "rich", label: "23–25%", short: "23–25", sub: "", lo: 0.225, hi: 0.25, mid: 0.24 },
  { id: "rover", label: "25–30%", short: "25–30", sub: "", lo: 0.25, hi: 0.3, mid: 0.265 },
  { id: "moon", label: "30–40%", short: "30–40", sub: "Moon Base", lo: 0.3, hi: 0.4001, mid: 0.34 },
  { id: "high", label: "over 40%", short: ">40", sub: "", lo: 0.4001, hi: 1.01, mid: 0.5 },
] as const;

export function bandOf(o2: number): number {
  return O2_BANDS.findIndex((b) => o2 >= b.lo && o2 < b.hi);
}

/** Airflow speed bands, in cm/s, used where tests are counted by how fast the air moved. */
export const FLOW_BANDS = [
  { id: "still", label: "still air", short: "0", hi: 0 },
  { id: "creep", label: "up to 2", short: "≤2", hi: 2 },
  { id: "slow", label: "2–5", short: "2–5", hi: 5 },
  { id: "gentle", label: "5–10", short: "5–10", hi: 10 },
  { id: "steady", label: "10–20", short: "10–20", hi: 20 },
  { id: "brisk", label: "20–40", short: "20–40", hi: 40 },
  { id: "fast", label: "over 40", short: ">40", hi: Infinity },
] as const;

export function flowBandOf(speed: number): number {
  return FLOW_BANDS.findIndex((b) => speed <= b.hi);
}
