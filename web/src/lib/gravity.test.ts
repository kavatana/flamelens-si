import { describe, expect, it } from "vitest";
import { gravitySummary, type PairInput } from "./gravity";

const pair = (id: string, orbitCm: number | null, earthCm: number | null, patch: Partial<PairInput> = {}): PairInput => ({ id, fuel: "Silicone", thickness: "0.27 mm", direction: "concurrent", sampleCm: 29, orbitCm, earthCm, orbitRaw: String(orbitCm), earthRaw: String(earthCm), ...patch });
const pairs = [pair("a", 0, 29), pair("b", 0, 7.6), pair("c", 0, 0), pair("d", 29, 29, { fuel: "SIBAL fabric (cotton/fiberglass)" }), pair("e", null, 0, { fuel: "Nomex + PMMA", thickness: "see Fig. 3" })];

describe("gravitySummary", () => {
  const s = gravitySummary(pairs, "moon");

  it("marks the two ends as tested and the Moon and Mars as not", () => {
    expect(s.stops.map((x) => [x.id, x.tested])).toEqual([["orbit", true], ["moon", false], ["mars", false], ["earth", true]]);
    expect(s.stops.filter((x) => x.yours).map((x) => x.id)).toEqual(["moon"]);
    expect(gravitySummary(pairs, "orbit").stops[0].yours).toBe(true);
  });

  it("says for each pair which end burned farther", () => {
    expect(s.pairs.map((p) => p.verdict)).toEqual(["farther-on-earth", "farther-on-earth", "same", "same", "no-figure"]);
    expect(s.pairs[0].says).toBe("Burned farther on Earth");
  });

  it("counts only the pairs that have a figure at both ends", () => {
    expect(s.compared).toBe(4);
    expect(s.fartherOnEarth).toBe(2);
    expect(s.same).toBe(2);
    expect(s.finding).toBe("In 2 of 4 pairs the flame travelled farther on Earth and in 2 it made no difference.");
  });

  it("names the sample plainly and leaves out a thickness that only points at a figure", () => {
    expect(s.pairs[3].sample).toBe("SIBAL fabric");
    expect(s.pairs[0].detail).toBe("0.27 mm, concurrent air");
    expect(s.pairs[4].detail).toBe("concurrent air");
  });

  it("uses the longest sample as the scale, and survives an empty table", () => {
    expect(s.scaleCm).toBe(29);
    const none = gravitySummary([], "mars");
    expect(none.compared).toBe(0);
    expect(none.finding).toBe("NASA's table gives no pair of results to compare.");
    expect(none.scaleCm).toBe(1);
  });

  it("is plain data, so it can be exported or handed to the SI as it is", () => {
    expect(JSON.parse(JSON.stringify(s))).toEqual(s);
  });
});
