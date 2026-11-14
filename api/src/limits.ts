/**
 * The limits on what costs money: questions to the model and answers read aloud.
 *
 * A request takes its place in the usage log before the work is done, and is counted with
 * the others only then. Requests that arrive together therefore all see each other, and the
 * ones over a limit are turned away, however many are sent at once.
 */
import { and, eq, gte, sql } from "drizzle-orm";
import { db, schema } from "./db/client";
import { addressOf, visitorId } from "./guard";

const { usage } = schema;

export type Caps = {
  route: "ask" | "speak";
  /** One visitor (an address and a browser), in an hour. */
  perVisitor: number;
  /** One address, whatever the browser, in an hour: a room of people behind one connection share it. */
  perAddress: number;
  /** Everyone together, in a minute. */
  perMinute: number;
};

export type Place = { ok: true; id: number } | { ok: false; why: "visitor" | "address" | "busy" };

/** Takes a place for this request, or says which limit it is over. `units` is what the route counts by the day. */
export async function reserve(request: Request, caps: Caps, units = 0): Promise<Place> {
  const visitor = visitorId(request);
  const address = `${addressOf(request)}:%`;
  const [row] = await db.insert(usage).values({ visitor, route: caps.route, inputTokens: units }).returning({ id: usage.id });
  const hourAgo = new Date(Date.now() - 3600_000);
  const minuteAgo = new Date(Date.now() - 60_000).toISOString();
  const [seen] = await db
    .select({
      visitor: sql<number>`count(*) filter (where ${usage.visitor} = ${visitor})::int`,
      address: sql<number>`count(*) filter (where ${usage.visitor} like ${address})::int`,
      minute: sql<number>`count(*) filter (where ${usage.createdAt} >= ${minuteAgo}::timestamptz)::int`,
    })
    .from(usage)
    .where(and(eq(usage.route, caps.route), gte(usage.createdAt, hourAgo)));
  const why = seen.visitor > caps.perVisitor ? "visitor" : seen.address > caps.perAddress ? "address" : seen.minute > caps.perMinute ? "busy" : null;
  if (why) {
    await release(row.id);
    return { ok: false, why };
  }
  return { ok: true, id: row.id };
}

/** Gives a place back: the work was not done, so it counts against nobody. */
export async function release(id: number): Promise<void> {
  await db.delete(usage).where(eq(usage.id, id));
}

/** Writes down what the work cost, in the place taken for it. */
export async function settle(id: number, spent: { inputTokens?: number; outputTokens?: number; costUsd?: number }): Promise<void> {
  await db.update(usage).set(spent).where(eq(usage.id, id));
}
