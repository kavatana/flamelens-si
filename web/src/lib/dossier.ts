/**
 * The dossier of one test: what NASA's other files hold about it beyond single values.
 * The pipeline writes one small file per test (pipeline/flamelens_pipeline/dossier.py);
 * the site fetches it when the test is opened.
 */
export type Curve = { variable: string; label: string; unit: string; t: number[]; v: number[] };
export type Photo = { src: string; kind: "still" | "proof_sheet" | string; caption: string; how: string };
export type Finding = { quote: string; about: string; note: string; file: string; where: string };
export type Dossier = { curves: Curve[]; photos: Photo[]; findings: Finding[] };

/** Where a test's dossier is served from. The same rule as the pipeline's `slug`. */
export const dossierPath = (recordId: string) => `/evidence/tests/${recordId.replace(/[^A-Za-z0-9-]+/g, "_")}.json`;

export type Extent = { tMin: number; tMax: number; vMin: number; vMax: number };

/** The range a curve covers. A flat curve is given a little room, so it is drawn as a line in the middle. */
export function extentOf(curve: Curve): Extent {
  let tMin = Infinity, tMax = -Infinity, vMin = Infinity, vMax = -Infinity;
  for (let i = 0; i < curve.t.length; i++) {
    tMin = Math.min(tMin, curve.t[i]);
    tMax = Math.max(tMax, curve.t[i]);
    vMin = Math.min(vMin, curve.v[i]);
    vMax = Math.max(vMax, curve.v[i]);
  }
  if (vMin === vMax) {
    const room = Math.abs(vMin) * 0.05 || 1;
    vMin -= room;
    vMax += room;
  }
  if (tMin === tMax) tMax = tMin + 1;
  return { tMin, tMax, vMin, vMax };
}

/** The curve as the points of an SVG line, in a box `width` by `height`. */
export function linePoints(curve: Curve, extent: Extent, width: number, height: number): string {
  const out: string[] = [];
  for (let i = 0; i < curve.t.length; i++) {
    const x = ((curve.t[i] - extent.tMin) / (extent.tMax - extent.tMin)) * width;
    const y = height - ((curve.v[i] - extent.vMin) / (extent.vMax - extent.vMin)) * height;
    out.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return out.join(" ");
}

/** The point of a curve nearest in time to a place across the chart, 0 at its left edge and 1 at its right. */
export function nearestPoint(curve: Curve, extent: Extent, across: number): number {
  const t = extent.tMin + Math.min(1, Math.max(0, across)) * (extent.tMax - extent.tMin);
  let best = 0;
  for (let i = 1; i < curve.t.length; i++) if (Math.abs(curve.t[i] - t) < Math.abs(curve.t[best] - t)) best = i;
  return best;
}

/** A measured number, short enough to read: no more digits than the size of the number calls for. */
export function readable(value: number): string {
  const size = Math.abs(value);
  if (size === 0) return "0";
  if (size >= 1000) return Math.round(value).toLocaleString("en-US");
  return String(Number(value.toPrecision(size >= 100 ? 4 : 3)));
}

/** NASA's photomultiplier curves are relative readings, and saturate above the stated range. */
export const isRelativeLight = (variable: string) => variable.startsWith("acme_pmt_");
