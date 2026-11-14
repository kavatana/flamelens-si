import type { Metadata } from "next";
import { Compare, type CompareItem } from "@/components/compare";
import { getExplorerRows, getInvestigations, getReference } from "@/lib/data";

export const metadata: Metadata = { title: "Compare" };

export default async function Page() {
  const [investigations, reference, rows] = await Promise.all([getInvestigations(), getReference(), getExplorerRows()]);
  const family = new Map(reference.families.map((f) => [f.id, f.name]));
  const assumed = new Set(rows.filter((r) => r.pQuality === "assumed").map((r) => r.acc));
  const measurementNames: Record<string, string> = {};
  for (const inv of investigations) for (const m of inv.measurements) measurementNames[m.id] = m.name;

  const items: CompareItem[] = investigations.map((inv) => {
    const s = inv.stats;
    return {
      accession: inv.accession,
      short: inv.short,
      oneLine: inv.oneLine,
      platform: inv.platform,
      familyName: family.get(inv.family) ?? inv.family,
      relevanceLevel: inv.relevanceLevel,
      fuelPhases: inv.fuelPhases,
      varied: inv.varied,
      pillars: { prevention: inv.pillars.prevention.score, detection: inv.pillars.detection.score, suppression: inv.pillars.suppression.score },
      measurements: inv.measurements.map((m) => m.id),
      fuels: s.fuels.map((f) => f.name),
      geometries: s.geometries.map((g) => g.name),
      o2: s.o2_ambient ? { min: s.o2_ambient.min, max: s.o2_ambient.max } : null,
      o2StreamMax: s.o2 && (!s.o2_ambient || s.o2.max > s.o2_ambient.max + 1e-6) ? s.o2.max : null,
      pressure: s.pressure ? { min: s.pressure.min, max: s.pressure.max } : null,
      pressureAssumed: assumed.has(inv.accession),
      flow: s.flow ? { min: s.flow.min, max: s.flow.max } : null,
      records: s.records,
      tests: s.tests,
      publications: s.publications,
      totalBytes: inv.totalBytes,
    };
  });

  return (
    <div>
      <div className="mb-7 max-w-[64ch]">
        <h1 className="text-[30px] font-semibold leading-[1.12] tracking-[-0.02em]">Compare investigations side by side</h1>
        <p className="mt-3 text-[15.5px] leading-relaxed text-ink-2">
          The same attributes for each, in the same order, so that what they share and where they differ is visible at a glance.
        </p>
      </div>
      <Compare items={items} measurementNames={measurementNames} />
    </div>
  );
}
