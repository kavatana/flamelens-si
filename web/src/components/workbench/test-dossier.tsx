"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type PointerEvent } from "react";
import { dossierPath, extentOf, isRelativeLight, linePoints, nearestPoint, readable, type Curve, type Dossier } from "@/lib/dossier";

/**
 * What NASA's other files hold about one test, beyond the values in its row: photographs of
 * the burn, curves measured while it burned, and sentences NASA wrote about it. Every picture,
 * number and sentence is NASA's; the site only lays them out.
 */

const W = 320;
const H = 72;
/** One hue for every curve: each chart is one measurement, named by its title. */
const LINE = "#2a78d6";

function CurveChart({ curve }: { curve: Curve }) {
  const extent = useMemo(() => extentOf(curve), [curve]);
  const points = useMemo(() => linePoints(curve, extent, W, H), [curve, extent]);
  const [at, setAt] = useState<number | null>(null);
  const move = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    setAt(nearestPoint(curve, extent, (event.clientX - box.left) / box.width));
  };
  const x = at === null ? 0 : ((curve.t[at] - extent.tMin) / (extent.tMax - extent.tMin)) * W;
  const y = at === null ? 0 : H - ((curve.v[at] - extent.vMin) / (extent.vMax - extent.vMin)) * H;
  const unit = curve.unit && curve.unit !== "ratio" ? ` ${curve.unit}` : "";

  return (
    <figure className="min-w-0 rounded-sm border border-rule bg-paper px-3 pb-2 pt-2.5">
      <figcaption className="flex items-baseline justify-between gap-2">
        <span className="truncate text-[12.5px] font-medium" title={curve.label}>{curve.label}</span>
        <span className="num shrink-0 text-[11.5px] text-ink-2" aria-live="off">
          {at === null ? `${readable(extent.vMin)} to ${readable(extent.vMax)}${unit}` : `${readable(curve.v[at])}${unit} at ${readable(curve.t[at])} s`}
        </span>
      </figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="mt-2 block h-[72px] w-full touch-none overflow-visible" role="img" aria-label={`${curve.label} over ${readable(extent.tMax - extent.tMin)} seconds, from ${readable(extent.vMin)} to ${readable(extent.vMax)}${unit}.`} onPointerMove={move} onPointerLeave={() => setAt(null)}>
        <line x1={0} x2={W} y1={H} y2={H} stroke="var(--color-rule-2)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
        <polyline points={points} fill="none" stroke={LINE} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
        {at !== null && (
          <>
            <line x1={x} x2={x} y1={0} y2={H} stroke="var(--color-ink-3)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
            <circle cx={x} cy={y} r={4} fill={LINE} stroke="var(--color-paper)" strokeWidth={2} vectorEffect="non-scaling-stroke" />
          </>
        )}
      </svg>
      <p className="num mt-1 flex justify-between gap-2 whitespace-nowrap text-[10.5px] text-ink-3"><span>{readable(extent.tMin)} s</span><span>{curve.t.length} points</span><span>{readable(extent.tMax)} s</span></p>
    </figure>
  );
}

export function TestDossier({ recordId }: { recordId: string }) {
  const [state, setState] = useState<{ id: string; dossier: Dossier | null } | null>(null);
  const [all, setAll] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch(dossierPath(recordId), { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<Dossier>) : null))
      .then((dossier) => setState({ id: recordId, dossier }))
      .catch(() => {});
    return () => controller.abort();
  }, [recordId]);

  const dossier = state?.id === recordId ? state.dossier : null;
  if (!dossier) return null;
  const stills = dossier.photos.filter((p) => p.kind !== "proof_sheet");
  const sheets = dossier.photos.filter((p) => p.kind === "proof_sheet");
  const curves = all ? dossier.curves : dossier.curves.slice(0, 4);
  const relative = dossier.curves.some((c) => isRelativeLight(c.variable));

  return (
    <div className="@container mb-5 space-y-5">
      {stills.length > 0 && (
        <section>
          <h3 className="label">NASA&apos;s photographs of this test <span className="font-normal text-ink-3">· {stills.length}</span></h3>
          <ul className="mt-1.5 flex gap-2 overflow-x-auto pb-1.5">
            {stills.map((photo) => (
              <li key={photo.src} className="w-[132px] shrink-0">
                <a href={photo.src} target="_blank" rel="noreferrer" title={photo.how} className="block">
                  <Image src={photo.src} alt={photo.caption} width={264} height={198} unoptimized className="aspect-[4/3] w-full rounded-xs bg-ink object-cover" />
                  <span className="mt-1 block text-[10.5px] leading-snug text-ink-3">{photo.caption}</span>
                </a>
              </li>
            ))}
          </ul>
          {sheets.map((sheet) => (
            <a key={sheet.src} href={sheet.src} target="_blank" rel="noreferrer" className="link text-[12.5px]" title={sheet.how}>Open NASA&apos;s proof sheet of this test</a>
          ))}
        </section>
      )}

      {dossier.curves.length > 0 && (
        <section>
          <h3 className="label">Measured while it burned <span className="font-normal text-ink-3">· {dossier.curves.length} {dossier.curves.length === 1 ? "curve" : "curves"}</span></h3>
          <div className="mt-1.5 grid gap-2 @md:grid-cols-2">
            {curves.map((curve) => <CurveChart key={curve.variable} curve={curve} />)}
          </div>
          {dossier.curves.length > 4 && (
            <button type="button" className="link mt-2 text-[12.5px]" onClick={() => setAll((on) => !on)}>{all ? "Show fewer" : `Show all ${dossier.curves.length} curves`}</button>
          )}
          <p className="mt-2 text-[11.5px] leading-relaxed text-ink-3">
            Time runs along the bottom, on NASA&apos;s own clock for the test. Move over a curve to read a point.
            {relative && " The light readings are relative: compare two tests only at the same gain, and treat values above 4 µA as probably saturated."}
          </p>
        </section>
      )}

      {dossier.findings.length > 0 && (
        <section>
          <h3 className="label">What NASA wrote about this test</h3>
          <ul className="mt-1.5 space-y-3">
            {dossier.findings.slice(0, 6).map((finding) => (
              <li key={`${finding.where}-${finding.about}`}>
                <p className="text-[13px] font-medium leading-snug">{finding.about}</p>
                <p className="quote mt-1 text-[12.5px]">&ldquo;{finding.quote}&rdquo;</p>
                <p className="mt-1 text-[11.5px] text-ink-3">{finding.file}{finding.where ? `, ${finding.where}` : ""}{finding.note ? `. ${finding.note}` : ""}</p>
              </li>
            ))}
          </ul>
          {dossier.findings.length > 6 && <p className="mt-2 text-[11.5px] text-ink-3">and {dossier.findings.length - 6} more in NASA&apos;s files.</p>}
        </section>
      )}
    </div>
  );
}
