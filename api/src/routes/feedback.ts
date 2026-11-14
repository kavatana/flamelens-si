import { and, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "../db/client";
import { cabinSchema, readJson, unreadable, visitorId } from "../guard";

const { feedback } = schema;
const PER_VISITOR_PER_HOUR = 30;

const body = z.object({
  kind: z.enum(["analysis", "answer"]),
  rating: z.literal("down"),
  page: z.string().max(80).regex(/^\/[a-zA-Z0-9/_-]*$/),
  question: z.string().max(500).optional(),
  cabin: cabinSchema.optional(),
});

/** A visitor marks an analysis or an answer as not helpful. */
export async function POST(request: Request) {
  let parsed;
  try {
    parsed = body.safeParse(await readJson(request));
  } catch (error) {
    return unreadable(error, "Send a JSON body.");
  }
  if (!parsed.success) return Response.json({ error: "That feedback could not be read." }, { status: 400 });

  const visitor = visitorId(request);
  const hourAgo = new Date(Date.now() - 3600_000);
  const [mine] = await db.select({ n: sql<number>`count(*)::int` }).from(feedback).where(and(eq(feedback.visitor, visitor), gte(feedback.createdAt, hourAgo)));
  if (mine.n >= PER_VISITOR_PER_HOUR) return Response.json({ error: "That is enough feedback for this hour. Thank you." }, { status: 429 });

  const { kind, rating, page, question, cabin } = parsed.data;
  await db.insert(feedback).values({ visitor, kind, rating, page, question: question ?? null, cabin: cabin ?? null });
  return Response.json({ ok: true });
}
