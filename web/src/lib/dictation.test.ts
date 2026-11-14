import { describe, expect, it } from "vitest";
import { QUESTION_LIMIT, heardText, joinSpeech, speechProblem } from "./dictation";

describe("heardText", () => {
  it("joins the pieces into one line, whatever spacing the recogniser used", () => {
    expect(heardText([{ text: "has anything", final: true }, { text: " been tested ", final: true }, { text: "at 34%", final: false }])).toBe("has anything been tested at 34%");
    expect(heardText([])).toBe("");
  });
});

describe("joinSpeech", () => {
  it("starts a spoken question with a capital", () => {
    expect(joinSpeech("", "has anything been tested at 34% oxygen")).toBe("Has anything been tested at 34% oxygen");
  });

  it("adds speech after what was already typed", () => {
    expect(joinSpeech("Compare BASS ", "and BASS-II")).toBe("Compare BASS and BASS-II");
    expect(joinSpeech("What about", " wax")).toBe("What about wax");
  });

  it("leaves the box alone until something is heard", () => {
    expect(joinSpeech("Typed so far ", "")).toBe("Typed so far ");
    expect(joinSpeech("", "   ")).toBe("");
  });

  it("never grows past the longest question the SI accepts", () => {
    expect(joinSpeech("", "word ".repeat(300))).toHaveLength(QUESTION_LIMIT);
  });
});

describe("speechProblem", () => {
  it("says nothing when the visitor stopped it themselves", () => {
    expect(speechProblem("aborted")).toBeNull();
  });

  it("tells the visitor what to do about a blocked or missing microphone", () => {
    expect(speechProblem("not-allowed")).toMatch(/Allow it for this site/);
    expect(speechProblem("service-not-allowed")).toBe(speechProblem("not-allowed"));
    expect(speechProblem("audio-capture")).toMatch(/No microphone/);
    expect(speechProblem("no-speech")).toMatch(/Nothing was heard/);
  });

  it("always leaves typing as the way out", () => {
    expect(speechProblem("network")).toMatch(/type your question/);
    expect(speechProblem("something-new")).toMatch(/type your question/);
  });
});
