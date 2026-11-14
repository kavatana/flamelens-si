import type { Metadata } from "next";
import { Workbench } from "@/components/workbench/workbench";
import { getMotion } from "@/lib/motion";
import { getBriefings, getClusters, getCoverage, getFacts, getFlowRows, getFuelRows, getGravityPairs, getInvestigations, getReference, getSolidFlowTests } from "@/lib/data";

export const metadata: Metadata = { title: "Dashboard" };

export default async function Page() {
  const [clusters, facts, investigations, reference, coverage, briefings, pairs, motion, fuels, flows, flowTests] = await Promise.all([
    getClusters(),
    getFacts(),
    getInvestigations(),
    getReference(),
    getCoverage(),
    getBriefings(),
    getGravityPairs(),
    getMotion(),
    getFuelRows(),
    getFlowRows(),
    getSolidFlowTests(),
  ]);
  const cards = Object.fromEntries(investigations.map((i) => [i.accession, { title: i.title, oneLine: i.oneLine, platform: i.platform }]));
  return (
    <Workbench
      clusters={clusters}
      facts={facts}
      cards={cards}
      environments={reference.environments}
      presets={reference.scenarios}
      coverage={coverage}
      briefings={briefings}
      pairs={pairs}
      fuels={fuels}
      flows={flows}
      flowTests={flowTests}
      motion={motion}
    />
  );
}
