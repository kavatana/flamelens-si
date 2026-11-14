/**
 * What the server accepts from a browser, and how it tells visitors apart.
 *
 * A request can carry a question and the cabin of an analysis. The cabin is taken as numbers
 * and fixed words only, never free text, so nothing a visitor types can reach the SI except
 * the question itself.
 */
import { createHash } from "node:crypto";
import { z } from "zod";

/** The cabin of an analysis block. Ranges match what the dashboard's controls allow. */
export const cabinSchema = z.object({
  o2: z.number().min(0.1).max(1),
  p: z.number().min(25).max(550),
  gravity: z.enum(["orbit", "moon", "mars"]),
  focus: z.enum(["solid", "liquid", "gas", "any"]),
  material: z.enum(["acrylic", "fabric", "wire", "silicone", "foam", "nomex", "wick", "wax"]).nullable(),
});
export type Cabin = z.infer<typeof cabinSchema>;

const PLACE: Record<Cabin["gravity"], string> = { orbit: "in orbit (weightless)", moon: "on the Moon (0.17 g)", mars: "on Mars (0.38 g)" };
const MATERIAL: Record<NonNullable<Cabin["material"]>, string> = { acrylic: "acrylic plastic (PMMA)", fabric: "cotton fabric (SIBAL)", wire: "wire insulation (Kapton, Teflon)", silicone: "silicone", foam: "foam (Pyrell)", nomex: "flame-resistant fabric (Nomex)", wick: "cotton wick", wax: "wax" };

/** The cabin in one sentence, written by the server from checked values, for the SI to read. */
export function cabinSentence(c: Cabin): string {
  const burns = c.material ? MATERIAL[c.material] : c.focus === "any" ? "any fuel" : `${c.focus} fuels`;
  return `The visitor is looking at an analysis of a cabin with ${Number((c.o2 * 100).toFixed(1))}% oxygen at ${Number(c.p.toFixed(1))} kPa, ${PLACE[c.gravity]}, and what might burn in it is ${burns}.`;
}

const label = (text: string, length: number) => createHash("sha256").update(text).digest("hex").slice(0, length);

/**
 * A one-way label for the address a request came from, for one day, so limits work without
 * storing the address. The address is taken as the host reports it: the headers a host such
 * as Vercel writes itself come first, and of a forwarded list the last entry, which the
 * nearest proxy added, not the first, which the sender can write.
 */
export function addressOf(request: Request): string {
  const h = request.headers;
  const forwarded = (h.get("x-forwarded-for") ?? "").split(",").map((part) => part.trim()).filter(Boolean);
  const ip = h.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip")?.trim() || forwarded.at(-1) || "local";
  return label(`${ip}|${new Date().toISOString().slice(0, 10)}`, 12);
}

/** A one-way label for a visitor: the address, then the browser. Everyone at one address shares its first part. */
export function visitorId(request: Request): string {
  return `${addressOf(request)}:${label(request.headers.get("user-agent") ?? "", 8)}`;
}

/** The most a request to the site's own routes may send, in bytes: several times the longest question. */
export const BODY_LIMIT = 16_000;

export class TooLarge extends Error {}

/** A request's JSON, read no further than the limit, so one huge request cannot tie the server up. */
export async function readJson(request: Request, limit = BODY_LIMIT): Promise<unknown> {
  if (Number(request.headers.get("content-length") ?? 0) > limit) throw new TooLarge();
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError("no body");
  const parts: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > limit) {
      await reader.cancel();
      throw new TooLarge();
    }
    parts.push(value);
  }
  const whole = new Uint8Array(size);
  let at = 0;
  for (const part of parts) {
    whole.set(part, at);
    at += part.byteLength;
  }
  return JSON.parse(new TextDecoder().decode(whole));
}

/** What a route answers when a body is too large or is not JSON. */
export const unreadable = (error: unknown, hint: string): Response =>
  error instanceof TooLarge ? Response.json({ error: "That request is too large." }, { status: 413 }) : Response.json({ error: hint }, { status: 400 });
