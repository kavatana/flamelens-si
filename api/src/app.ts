/**
 * The FlameLens API.
 *
 * Everything the site shows comes through here: the reads its pages are built from, one
 * record with its sources, the export, the SI's answers and the link to NASA's video of a
 * test. All of it is read-only except the usage log of the SI and the voice, and the
 * visitors' feedback.
 */
import { Hono } from "hono";
import * as queries from "./queries";
import * as ask from "./routes/ask";
import * as exportRecords from "./routes/export";
import * as feedback from "./routes/feedback";
import * as footage from "./routes/footage";
import * as record from "./routes/record";
import * as speak from "./routes/speak";

/** Reads that take no input. The key is the path under /v1; the web's client is typed from this list. */
export const READS = {
  investigations: queries.getInvestigations,
  facts: queries.getFacts,
  clusters: queries.getClusters,
  reference: queries.getReference,
  variables: queries.getVariables,
  "source-tables": queries.getSourceTables,
  "quality-findings": queries.getQualityFindings,
  "explorer-rows": queries.getExplorerRows,
  totals: queries.getTotals,
  coverage: queries.getCoverage,
  briefings: queries.getBriefings,
  droplets: queries.getDroplets,
  "gravity-pairs": queries.getGravityPairs,
  trace: queries.getTrace,
  "fuel-rows": queries.getFuelRows,
  "flow-rows": queries.getFlowRows,
  "solid-flow-tests": queries.getSolidFlowTests,
  "bench-rows": queries.getBenchRows,
  clips: queries.getFootage,
} as const;

const ACCESSION = /^PSI-\d+$/;
/** The data changes only when the database is re-seeded, so a reader may keep an answer for a while. */
const KEEP = "public, max-age=300";

export const app = new Hono();

app.get("/health", (c) => c.json({ ok: true }));

// One investigation, and how much each of its variables varied.
app.get("/v1/investigations/:accession", async (c) => {
  const accession = c.req.param("accession");
  const found = ACCESSION.test(accession) ? await queries.getInvestigation(accession) : null;
  if (!found) return c.json({ error: "Unknown investigation." }, 404);
  c.header("Cache-Control", KEEP);
  return c.json(found);
});
app.get("/v1/investigations/:accession/variation", async (c) => {
  const accession = c.req.param("accession");
  if (!ACCESSION.test(accession)) return c.json({ error: "Unknown investigation." }, 404);
  c.header("Cache-Control", KEEP);
  return c.json(await queries.getVariation(accession));
});

// What the browser asks for directly: one record, a download, an answer from the SI,
// the link to NASA's video of one test, a "not helpful" mark, and an answer read aloud.
app.get("/v1/record", (c) => record.GET(c.req.raw));
app.get("/v1/export", (c) => exportRecords.GET(c.req.raw));
app.get("/v1/ask", (c) => ask.GET(c.req.raw));
app.post("/v1/ask", (c) => ask.POST(c.req.raw));
app.get("/v1/footage", (c) => footage.GET(c.req.raw));
app.post("/v1/feedback", (c) => feedback.POST(c.req.raw));
app.post("/v1/speak", (c) => speak.POST(c.req.raw));

// Every read in the list above.
app.get("/v1/:read", async (c) => {
  const name = c.req.param("read");
  if (!Object.hasOwn(READS, name)) return c.json({ error: "Unknown read." }, 404);
  c.header("Cache-Control", KEEP);
  return c.json(await READS[name as keyof typeof READS]());
});

app.notFound((c) => c.json({ error: "Not found." }, 404));
app.onError((error, c) => {
  console.error(error);
  return c.json({ error: "The API could not answer." }, 500);
});
