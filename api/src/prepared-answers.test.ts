import { describe, expect, it } from "vitest";
import { findPrepared } from "./prepared-answers";

describe("matching a question to a prepared answer", () => {
  it("finds the same question in other words", () => {
    expect(findPrepared("is the moon base safe from fire")?.question).toBe("Is a lunar habitat safe from fire?");
    expect(findPrepared("how did the flex tests end")?.question).toBe("How did the FLEX droplet tests end?");
    expect(findPrepared("what was tested at 34% oxygen")?.question).toBe("Has anything been tested at 34% oxygen?");
    expect(findPrepared("what happens when the fans stop")?.question).toBe("What happens to a flame when the airflow stops?");
  });

  it("does not answer a different question", () => {
    expect(findPrepared("oxygen")).toBeNull();
    expect(findPrepared("tell me a joke about astronauts")).toBeNull();
    expect(findPrepared("how hot is a flame on Mars")).toBeNull();
  });
});
