import type { Metadata } from "next";
import { Explorer } from "@/components/explorer";
import { getExplorerRows, getInvestigations, getVariables } from "@/lib/data";

export const metadata: Metadata = { title: "Data" };

export default async function Page() {
  const [rows, investigations, variables] = await Promise.all([getExplorerRows(), getInvestigations(), getVariables()]);
  return (
    <div>
      <h1 className="mb-5 text-[30px] font-semibold leading-[1.12] tracking-[-0.02em]">Every row, in one vocabulary</h1>
      <Explorer
        rows={rows}
        investigations={investigations.map((i) => ({ accession: i.accession, short: i.short, records: i.stats.records }))}
        variables={variables.map((v) => ({ id: v.id, label: v.label, unit: v.unit }))}
      />
    </div>
  );
}
