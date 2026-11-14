import { footageFile } from "../queries";

/**
 * A link to NASA's own video of one test.
 *
 * The video is not stored here. PSI hands out a link to the file that works for an hour; this
 * asks PSI for one and passes it to the browser, which then plays the video straight from
 * NASA's archive. Only tests the pipeline has tied to a video can be asked for.
 */
const PSI = "https://psi.nasa.gov/geode-py/ws/studies";
const ID = /^PSI-\d+\/[a-z0-9-]+\/\d+$/;
/** A link is handed out again while it still has this long to live, in milliseconds. */
const SPARE = 15 * 60_000;

const links = new Map<string, { url: string; expires: number }>();

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = params.get("id") ?? "";
  const view = params.get("view") === "second" ? "second" : "main";
  if (!ID.test(id)) return Response.json({ error: "Unknown record id." }, { status: 400 });

  const file = await footageFile(id, view);
  if (!file) return Response.json({ error: "NASA's archive lists no video for this test." }, { status: 404 });

  const key = `${id}#${view}`;
  const kept = links.get(key);
  if (kept && kept.expires - Date.now() > SPARE) return Response.json({ url: kept.url, expires: kept.expires, file: file.fileName, bytes: file.sizeBytes });

  try {
    const ask = `${PSI}/${file.accession}/download?file=${encodeURIComponent(file.fileName)}&redirect=false&version=${file.version}`;
    const answer = await fetch(ask, { headers: { "User-Agent": "FlameLens SI (NASA Space Apps Challenge 2026 entry)" }, signal: AbortSignal.timeout(20_000) });
    if (!answer.ok) throw new Error(`PSI answered ${answer.status}`);
    const text = (await answer.text()).trim();
    const link = new URL(text.startsWith("{") ? String((JSON.parse(text) as { url?: unknown }).url ?? "") : text.replace(/^"|"$/g, ""));
    // Only a link into NASA's own storage is ever passed on.
    if (link.protocol !== "https:" || !(link.hostname.endsWith(".amazonaws.com") || link.hostname.endsWith(".nasa.gov"))) throw new Error("PSI gave a link that is not NASA's storage");
    const seconds = Number(link.searchParams.get("Expires"));
    const expires = Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : Date.now() + 30 * 60_000;
    links.set(key, { url: link.toString(), expires });
    return Response.json({ url: link.toString(), expires, file: file.fileName, bytes: file.sizeBytes });
  } catch (error) {
    console.error("footage", id, error);
    return Response.json({ error: "NASA's archive did not answer. Try again in a moment." }, { status: 502 });
  }
}
