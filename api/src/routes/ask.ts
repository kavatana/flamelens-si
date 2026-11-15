import { gte, sql } from "drizzle-orm";
import { db, schema } from "../db/client";
import { cabinSchema, capsFor, readJson, unreadable, type Cabin } from "../guard";
import { release, reserve, settle } from "../limits";
import { PREPARED } from "../prepared-answers";
import { SI_MODEL, SI_PROVIDER, ask, brief, failureOf, prepared, readyAnswer, searchText, siLive, siOnHold, type AskResult } from "../si";

const { usage } = schema;
/** Live questions: 12 an hour for one visitor, 60 for one address, and 30 a minute for everyone together, unless ASK_LIMITS says otherwise. */
const CAPS = capsFor("ask", [12, 60, 30], process.env.ASK_LIMITS);
const DAILY_BUDGET_USD = Number(process.env.SI_DAILY_BUDGET_USD ?? 2);
/** Seconds the host lets one question run: a little over the SI's own deadline. */
export const maxDuration = 120;

/** Whether live answers are available on this deployment. */
export async function GET(request: Request) {
  void request.url; // read at request time, so a key added after the build is picked up
  return Response.json({ live: siLive(), model: siLive() ? SI_MODEL : null, prepared: PREPARED.map((p) => p.question) });
}

/**
 * A question, answered. Anything that goes wrong beyond what the answer itself handles (the
 * database turning a request away under a sudden crowd) is told to the visitor's page as
 * "busy", which the page tries once more by itself, instead of as a bare server error.
 */
export async function POST(request: Request) {
  try {
    return await answer(request);
  } catch (error) {
    console.error(`[ask] could not answer: ${error instanceof Error ? error.message.split("\n")[0].slice(0, 160) : "unknown error"}`);
    return Response.json({ error: "The site is busy right now. Please ask again in a moment." }, { status: 503, headers: { "Retry-After": "2" } });
  }
}

async function answer(request: Request): Promise<Response> {
  let question = "";
  // The analysis the question was asked under. Anything that does not pass the check is left out.
  let cabin: Cabin | undefined;
  try {
    const body = ((await readJson(request)) ?? {}) as { question?: unknown; cabin?: unknown };
    question = typeof body.question === "string" ? body.question.trim() : "";
    cabin = cabinSchema.safeParse(body.cabin).data;
  } catch (error) {
    return unreadable(error, "Send a JSON body with a question.");
  }
  if (question.length < 3 || question.length > 500) {
    return Response.json({ error: "Ask a question between 3 and 500 characters." }, { status: 400 });
  }

  const offline = async (reason: string): Promise<Response> => {
    const result: AskResult = (await prepared(question)) ?? (await brief(question)) ?? { mode: "offline", reason, passages: await searchText(question) };
    return Response.json(result);
  };
  // A listed question, or one already answered for this cabin, costs nothing and counts against no limit.
  // Tried once more if the lookups fail: under a sudden crowd a first try can lose its place at the database.
  const ready = await readyAnswer(question, cabin).catch(() => readyAnswer(question, cabin));
  if (ready) return Response.json(ready);
  if (!siLive()) return Response.json(await ask(question, cabin));

  const dayStart = new Date(new Date().toISOString().slice(0, 10));
  const [today] = await db.select({ cost: sql<number>`coalesce(sum(${usage.costUsd}), 0)::float8` }).from(usage).where(gte(usage.createdAt, dayStart));
  if (today.cost >= DAILY_BUDGET_USD) return offline("Today's budget for live answers is used up, so here is what NASA's own text says.");
  const place = await reserve(request, CAPS);
  if (!place.ok) {
    return offline(place.why === "busy" ? "The live SI is answering many questions right now, so here is what NASA's own text says." : "You have reached this hour's limit for live answers, so here is what NASA's own text says.");
  }

  try {
    const result = await ask(question, cabin);
    // What the answer cost goes in the place taken for it. An answer that cost nothing gives its place back.
    if (result.mode === "si" && result.costUsd > 0) await settle(place.id, { inputTokens: result.inputTokens, outputTokens: result.outputTokens, costUsd: result.costUsd });
    else await release(place.id);
    return Response.json(result);
  } catch (error) {
    await release(place.id);
    const failure = failureOf(error);
    if (!failure) throw error;
    // The visitor gets NASA's own text; the server's log keeps why, without the question or any key.
    console.error(`[si] ${SI_PROVIDER} ${SI_MODEL} failed: ${failure.status ?? "no answer"} ${failure.message}`);
    const WHY = {
      timeout: "The live SI took too long to answer",
      unreachable: "The live SI could not be reached",
      auth: "The live SI is switched off right now",
      busy: "The live SI is busy right now",
      error: `The live SI (${SI_MODEL}) returned an error`,
    };
    return offline(`${siOnHold() ? WHY.auth : WHY[failure.kind]}, so here is what NASA's own text says.`);
  }
}
