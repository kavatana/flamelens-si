import { describe, expect, it } from "vitest";
import { PACE, firstWords, planReveal, restWords, stageAt, wordsAt } from "./reveal";

const plan = planReveal({
  checks: 6,
  stopAt: 3,
  tabs: 5,
  verdict: "No test of a solid was run near 34% oxygen.",
  next: "A solid burned at about 34% oxygen would be the first.",
  meaning: "The archive cannot yet say how a fabric burns in this cabin.",
});

describe("planReveal", () => {
  it("shows the checks one at a time, in order", () => {
    expect(plan.stepAt).toHaveLength(6);
    expect(plan.stepAt[0]).toBe(PACE.lead);
    for (let i = 1; i < plan.stepAt.length; i++) expect(plan.stepAt[i]).toBeGreaterThan(plan.stepAt[i - 1]);
  });

  it("hurries past the checks that follow an empty one", () => {
    expect(plan.stepAt[2] - plan.stepAt[1]).toBe(PACE.step);
    expect(plan.stepAt[5] - plan.stepAt[4]).toBe(PACE.skipped);
  });

  it("writes the answer after the checks, and the explanation after the answer", () => {
    expect(plan.verdict.start).toBeGreaterThan(plan.stepAt[5]);
    expect(plan.next.start).toBeGreaterThan(plan.verdict.end);
    expect(plan.meaning!.start).toBeGreaterThan(plan.next.end);
    expect(plan.tail).toBeGreaterThan(plan.meaning!.end);
    expect(plan.total).toBeGreaterThan(plan.tail);
  });

  it("answers the data views one by one, all before the writing starts", () => {
    expect(plan.tabAt).toHaveLength(5);
    expect(plan.tabAt[0]).toBeGreaterThan(PACE.lead);
    for (let i = 1; i < plan.tabAt.length; i++) expect(plan.tabAt[i]).toBeGreaterThan(plan.tabAt[i - 1]);
    expect(plan.tabAt[4]).toBeLessThan(plan.verdict.start);
    expect(planReveal({ checks: 2, stopAt: -1, verdict: "a", next: "b", meaning: null }).tabAt).toEqual([]);
  });

  it("stays short enough to wait for", () => {
    expect(plan.total).toBeLessThan(4500);
    const all = planReveal({ checks: 6, stopAt: -1, verdict: "x ".repeat(24), next: "x ".repeat(24), meaning: "x ".repeat(60) });
    expect(all.total).toBeLessThan(6000);
  });

  it("ends after the next step when no explanation is prepared", () => {
    const bare = planReveal({ checks: 5, stopAt: -1, verdict: "Ten tests match.", next: "Open one.", meaning: null });
    expect(bare.meaning).toBeNull();
    expect(bare.tail).toBeGreaterThan(bare.next.end);
  });
});

describe("wordsAt", () => {
  it("writes nothing before the start and everything after the end", () => {
    expect(wordsAt(plan.verdict, 0)).toBe(0);
    expect(wordsAt(plan.verdict, plan.verdict.start)).toBe(0);
    expect(wordsAt(plan.verdict, plan.verdict.end)).toBe(plan.verdict.words);
    expect(wordsAt(plan.verdict, Number.POSITIVE_INFINITY)).toBe(plan.verdict.words);
  });

  it("never goes backwards", () => {
    let before = 0;
    for (let t = plan.verdict.start; t <= plan.verdict.end; t += 7) {
      const now = wordsAt(plan.verdict, t);
      expect(now).toBeGreaterThanOrEqual(before);
      before = now;
    }
  });

  it("copes with an empty text", () => {
    const empty = planReveal({ checks: 1, stopAt: -1, verdict: "", next: "", meaning: null });
    expect(wordsAt(empty.verdict, 5000)).toBe(0);
  });
});

describe("firstWords", () => {
  it("cuts on whole words and returns the whole text at the end", () => {
    expect(firstWords("No test of a solid", 0)).toBe("");
    expect(firstWords("No test of a solid", 2)).toBe("No test");
    expect(firstWords("No test of a solid", 5)).toBe("No test of a solid");
    expect(firstWords("No test of a solid", 99)).toBe("No test of a solid");
  });
});

describe("restWords", () => {
  it("is what firstWords leaves, so the two always make the whole text", () => {
    const text = "No test of a solid  was run";
    for (let n = 0; n <= 8; n++) expect(firstWords(text, n) + restWords(text, n)).toBe("No test of a solid was run");
    expect(restWords(text, 7)).toBe("");
  });
});

describe("stageAt", () => {
  it("reads, then writes, then is done", () => {
    expect(stageAt(plan, 0)).toBe("reading");
    expect(stageAt(plan, plan.verdict.start + 1)).toBe("writing");
    expect(stageAt(plan, plan.tail)).toBe("done");
    expect(stageAt(plan, Number.POSITIVE_INFINITY)).toBe("done");
  });
});
