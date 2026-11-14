/**
 * Read access to the data, through the FlameLens API.
 *
 * The data set only changes when the pipeline is re-run and the database re-seeded, so every
 * read is cached ("use cache") and the pages built on them are prerendered. Each function
 * returns exactly what the API's query of the same name returns; the types are the API's own.
 */
import "server-only";
import { cacheLife } from "next/cache";
import type { READS } from "@flamelens/api/app";
import type { getInvestigation as GetInvestigation, getVariation as GetVariation } from "@flamelens/api/queries";

export type { Briefing, Clip, Coverage, Droplet, ExplorerRow, FlowCoverage, FlowRow, GravityPair, Investigation, RecordDetail, Reference, Trace, Variation } from "@flamelens/api/queries";

const API_URL = (process.env.API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

type Reads = typeof READS;
type Answer<F extends (...args: never[]) => unknown> = Awaited<ReturnType<F>>;

async function get(path: string): Promise<Response> {
  try {
    return await fetch(`${API_URL}/v1/${path}`, { headers: { Accept: "application/json" } });
  } catch (cause) {
    throw new Error(`The FlameLens API is not answering at ${API_URL}. Start it (pnpm dev), or set API_URL in web/.env.local.`, { cause });
  }
}

/** One of the API's reads, by its name in the address. */
async function read<N extends keyof Reads>(name: N): Promise<Answer<Reads[N]>> {
  const response = await get(name);
  if (!response.ok) throw new Error(`The FlameLens API answered ${response.status} for /v1/${name}.`);
  return (await response.json()) as Answer<Reads[N]>;
}

export async function getInvestigations() {
  "use cache";
  cacheLife("days");
  return read("investigations");
}

/** One investigation with its publications, source tables and records, or null when there is none by that id. */
export async function getInvestigation(accession: string): Promise<Answer<typeof GetInvestigation>> {
  "use cache";
  cacheLife("days");
  const response = await get(`investigations/${encodeURIComponent(accession)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`The FlameLens API answered ${response.status} for investigation ${accession}.`);
  return (await response.json()) as Answer<typeof GetInvestigation>;
}

/** How much each variable of one investigation varied across its tests. */
export async function getVariation(accession: string): Promise<Answer<typeof GetVariation>> {
  "use cache";
  cacheLife("days");
  const response = await get(`investigations/${encodeURIComponent(accession)}/variation`);
  if (response.status === 404) return [];
  if (!response.ok) throw new Error(`The FlameLens API answered ${response.status} for the variation of ${accession}.`);
  return (await response.json()) as Answer<typeof GetVariation>;
}

export async function getFacts() {
  "use cache";
  cacheLife("days");
  return read("facts");
}

export async function getClusters() {
  "use cache";
  cacheLife("days");
  return read("clusters");
}

export async function getReference() {
  "use cache";
  cacheLife("days");
  return read("reference");
}

export async function getVariables() {
  "use cache";
  cacheLife("days");
  return read("variables");
}

export async function getSourceTables() {
  "use cache";
  cacheLife("days");
  return read("source-tables");
}

export async function getQualityFindings() {
  "use cache";
  cacheLife("days");
  return read("quality-findings");
}

export async function getExplorerRows() {
  "use cache";
  cacheLife("days");
  return read("explorer-rows");
}

export async function getTotals() {
  "use cache";
  cacheLife("days");
  return read("totals");
}

export async function getCoverage() {
  "use cache";
  cacheLife("days");
  return read("coverage");
}

export async function getBriefings() {
  "use cache";
  cacheLife("days");
  return read("briefings");
}

export async function getDroplets() {
  "use cache";
  cacheLife("days");
  return read("droplets");
}

export async function getGravityPairs() {
  "use cache";
  cacheLife("days");
  return read("gravity-pairs");
}

export async function getTrace() {
  "use cache";
  cacheLife("days");
  return read("trace");
}

export async function getFuelRows() {
  "use cache";
  cacheLife("days");
  return read("fuel-rows");
}

export async function getFlowRows() {
  "use cache";
  cacheLife("days");
  return read("flow-rows");
}

export async function getSolidFlowTests() {
  "use cache";
  cacheLife("days");
  return read("solid-flow-tests");
}

export async function getBenchRows() {
  "use cache";
  cacheLife("days");
  return read("bench-rows");
}

/** Which tests have NASA's own video, and from which camera. */
export async function getFootage() {
  "use cache";
  cacheLife("days");
  return read("clips");
}
