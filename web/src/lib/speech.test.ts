import { describe, expect, it } from "vitest";
import { SPEECH_LIMIT, forSpeech } from "./speech";

describe("an answer made ready to be read aloud", () => {
  it("leaves out the source tags and tidies the spaces around them", () => {
    expect(forSpeech("BRE [PSI-20] ranks first.\n\nFLEX [PSI-69] and CFI-G [PSI-159] rank next.")).toBe("BRE ranks first. FLEX and CFI-G rank next.");
    expect(forSpeech("in CFI-G [PSI-159].")).toBe("in CFI-G.");
  });
  it("keeps a short answer whole", () => {
    expect(forSpeech("Yes, but not with solid materials.")).toBe("Yes, but not with solid materials.");
  });
  it("cuts a long answer at the end of a sentence", () => {
    const long = Array.from({ length: 60 }, (_, i) => `Sentence number ${i + 1} is here.`).join(" ");
    const cut = forSpeech(long);
    expect(cut.length).toBeLessThanOrEqual(SPEECH_LIMIT);
    expect(cut.endsWith("is here.")).toBe(true);
  });
  it("cuts between words when there is no sentence to end on", () => {
    const cut = forSpeech("word ".repeat(400));
    expect(cut.length).toBeLessThanOrEqual(SPEECH_LIMIT);
    expect(cut.endsWith("word")).toBe(true);
  });
});
