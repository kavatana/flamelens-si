import { getRecord } from "../queries";

/** One record with every value, its raw PSI cell and its provenance. */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!/^PSI-\d+\/[a-z0-9-]+\/\d+$/.test(id)) {
    return Response.json({ error: "Unknown record id." }, { status: 400 });
  }
  const record = await getRecord(id);
  if (!record) return Response.json({ error: "Record not found." }, { status: 404 });
  return Response.json(record, { headers: { "Cache-Control": "public, max-age=3600" } });
}
