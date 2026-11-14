/**
 * The solid materials in the archive, grouped under the names a cabin designer would use.
 * `match` lists the names exactly as the curated tables give them.
 */
export type Material = { id: string; label: string; note: string; match: string[] };

export const MATERIALS: Material[] = [
  { id: "acrylic", label: "Acrylic plastic", note: "PMMA", match: ["PMMA"] },
  { id: "fabric", label: "Cotton fabric", note: "cotton and fiberglass (SIBAL)", match: ["SIBAL fabric (cotton/fiberglass)"] },
  { id: "wire", label: "Wire insulation", note: "Kapton and Teflon", match: ["Kapton", "Teflon"] },
  { id: "silicone", label: "Silicone", note: "silicone rubber", match: ["Silicone"] },
  { id: "foam", label: "Foam", note: "Pyrell", match: ["Pyrell foam"] },
  { id: "nomex", label: "Flame-resistant fabric", note: "Nomex", match: ["Nomex", "Nomex + PMMA"] },
  { id: "wick", label: "Cotton wick", note: "lamp wick", match: ["Lamp wick"] },
  { id: "wax", label: "Wax", note: "candle and paraffin wax", match: ["Japan wax", "Paraffin wax", "Wax"] },
];

export const materialById = (id: string | null | undefined): Material | null => MATERIALS.find((m) => m.id === id) ?? null;

export type Gravity = "orbit" | "moon" | "mars";
export const GRAVITY: Record<Gravity, { label: string; place: string; g: string; noun: string }> = {
  orbit: { label: "In orbit", place: "in orbit", g: "weightless", noun: "weightlessness" },
  moon: { label: "On the Moon", place: "on the Moon", g: "0.17 g", noun: "Moon gravity" },
  mars: { label: "On Mars", place: "on Mars", g: "0.38 g", noun: "Mars gravity" },
};
