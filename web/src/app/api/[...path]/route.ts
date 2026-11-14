/**
 * The browser talks to this site only. A request under /api is passed on to the FlameLens
 * API, so the API's address stays a server setting and no cross-origin rules are needed.
 *
 *   /api/record?id=...   ->  <API_URL>/v1/record?id=...
 *   /api/export?...      ->  <API_URL>/v1/export?...
 *   /api/ask             ->  <API_URL>/v1/ask
 *   /api/footage?id=...  ->  <API_URL>/v1/footage?id=...
 *   /api/feedback        ->  <API_URL>/v1/feedback
 *   /api/speak           ->  <API_URL>/v1/speak
 */
const API_URL = (process.env.API_URL ?? "http://localhost:4000").replace(/\/+$/, "");

/** What is passed on in each direction. Everything else belongs to one hop only. */
const TO_API = ["accept", "content-type", "content-length", "user-agent", "x-forwarded-for", "x-real-ip", "x-vercel-forwarded-for"];
const TO_BROWSER = ["content-type", "content-disposition", "cache-control"];

function pick(from: Headers, names: string[]): Headers {
  const out = new Headers();
  for (const name of names) {
    const value = from.get(name);
    if (value) out.set(name, value);
  }
  return out;
}

async function forward(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const target = `${API_URL}/v1${url.pathname.slice("/api".length)}${url.search}`;
  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  try {
    const answer = await fetch(target, {
      method: request.method,
      headers: pick(request.headers, TO_API),
      body: hasBody ? await request.arrayBuffer() : undefined,
      cache: "no-store",
    });
    return new Response(answer.body, { status: answer.status, headers: pick(answer.headers, TO_BROWSER) });
  } catch {
    return Response.json({ error: "The data service is not answering. Try again in a moment." }, { status: 502 });
  }
}

export const GET = forward;
export const POST = forward;
