import { and, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "../db/client";
import { capsFor, readJson, unreadable } from "../guard";
import { release, reserve } from "../limits";
import { VOICE_LIMIT, readingOf, speak, voiceConfigured } from "../voice";

const { usage } = schema;
/** Readings: 20 an hour for one visitor, 80 for one address, and 40 a minute for everyone together, unless SPEAK_LIMITS says otherwise. */
const CAPS = capsFor("speak", [20, 80, 40], process.env.SPEAK_LIMITS);
/** The most characters read aloud in one day, across all visitors. */
const DAILY_CHARACTERS = Number(process.env.VOICE_DAILY_CHARACTERS ?? 30000);

/** Readings already made, kept so the same answer is not paid for twice: the suggested questions are read most. */
const KEEP_MOST = 40;
const kept = new Map<string, Uint8Array>();
const audio = (bytes: Uint8Array) => new Response(bytes.slice().buffer, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" } });

/** An answer read aloud. The words are the ones already on the visitor's screen. */
export async function POST(request: Request) {
  let text = "";
  try {
    const body = ((await readJson(request)) ?? {}) as { text?: unknown };
    text = typeof body.text === "string" ? body.text.trim() : "";
  } catch (error) {
    return unreadable(error, "Send a JSON body with the text to read.");
  }
  if (text.length < 3 || text.length > VOICE_LIMIT) {
    return Response.json({ error: `Send between 3 and ${VOICE_LIMIT} characters.` }, { status: 400 });
  }
  // The browser reads it with its own voice when this says there is none here.
  if (!voiceConfigured()) return Response.json({ error: "No voice service is set up on this deployment." }, { status: 503 });

  const again = kept.get(readingOf(text));
  if (again) return audio(again);

  // The reading takes its place, with its length, before ElevenLabs is asked; the day's total then includes it.
  const place = await reserve(request, CAPS, text.length);
  const dayStart = new Date(new Date().toISOString().slice(0, 10));
  const [today] = place.ok
    ? await db.select({ characters: sql<number>`coalesce(sum(${usage.inputTokens}), 0)::int` }).from(usage).where(and(eq(usage.route, "speak"), gte(usage.createdAt, dayStart)))
    : [{ characters: 0 }];
  if (!place.ok || today.characters > DAILY_CHARACTERS) {
    if (place.ok) await release(place.id);
    return Response.json({ error: "The voice service has reached its limit for now." }, { status: 503 });
  }

  let answer: Response;
  try {
    answer = await speak(text);
  } catch {
    await release(place.id);
    return Response.json({ error: "The voice service could not be reached." }, { status: 502 });
  }
  if (!answer.ok || !answer.body) {
    console.error(`[voice] ElevenLabs answered ${answer.status}`);
    await release(place.id);
    return Response.json({ error: "The voice service did not answer." }, { status: 502 });
  }
  const bytes = new Uint8Array(await answer.arrayBuffer());
  if (kept.size >= KEEP_MOST) kept.delete(kept.keys().next().value!);
  kept.set(readingOf(text), bytes);
  return audio(bytes);
}
