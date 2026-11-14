/**
 * The Flame Lab's setting, as it travels in the address: /lab?fuel=heptane&o2=34&p=56.5&gas=co2&amt=30&size=2
 * Shared by the lab itself, the dashboard and the SI panel, so all three agree on the ranges.
 */

export type Gas = "none" | "co2" | "he";
export type LabSetting = { fuel: string; o2: number; p: number; gas: Gas; amount: number; size: number };

export const LAB_DEFAULT: LabSetting = { fuel: "methanol", o2: 0.21, p: 101.3, gas: "none", amount: 0, size: 2 };
export const LAB_RANGE = { o2: [0.1, 0.4], p: [50, 110], size: [1, 5], co2: 0.7, he: 0.5 } as const;

const clamp = (x: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, x));

/** Keep a setting inside what the controls can show. */
export function tidyLab(s: LabSetting): LabSetting {
  const gas = s.gas === "co2" || s.gas === "he" ? s.gas : "none";
  return {
    fuel: s.fuel === "n-heptane" ? "n-heptane" : "methanol",
    o2: clamp(s.o2, LAB_RANGE.o2),
    p: clamp(s.p, LAB_RANGE.p),
    gas,
    amount: gas === "none" ? 0 : clamp(s.amount, [0, LAB_RANGE[gas]]),
    size: clamp(s.size, LAB_RANGE.size),
  };
}

export function labFromQuery(search: string): LabSetting {
  const q = new URLSearchParams(search);
  const number = (key: string, fallback: number, scale = 1) => {
    const value = Number(q.get(key));
    return q.get(key) !== null && Number.isFinite(value) ? value / scale : fallback;
  };
  const gas = q.get("gas");
  return tidyLab({
    fuel: q.get("fuel") === "heptane" ? "n-heptane" : LAB_DEFAULT.fuel,
    o2: number("o2", LAB_DEFAULT.o2, 100),
    p: number("p", LAB_DEFAULT.p),
    gas: gas === "co2" || gas === "he" ? gas : "none",
    amount: number("amt", gas ? 0.2 : 0, 100),
    size: number("size", LAB_DEFAULT.size),
  });
}

export function labToQuery(s: LabSetting): string {
  const trim = (x: number, digits: number) => String(Number(x.toFixed(digits)));
  const q = new URLSearchParams({ fuel: s.fuel === "n-heptane" ? "heptane" : "methanol", o2: trim(s.o2 * 100, 1), p: trim(s.p, 1) });
  if (s.gas !== "none") {
    q.set("gas", s.gas);
    q.set("amt", trim(s.amount * 100, 0));
  }
  q.set("size", trim(s.size, 1));
  return q.toString();
}

/** A link into the lab for a cabin's air, or the plain lab when that air is outside what FLEX covered. */
export function labHref(o2: number, p: number): string {
  const inRange = o2 >= LAB_RANGE.o2[0] && o2 <= LAB_RANGE.o2[1] && p >= LAB_RANGE.p[0] && p <= LAB_RANGE.p[1];
  return inRange ? `/lab?${labToQuery({ ...LAB_DEFAULT, o2, p })}` : "/lab";
}
