import { describe, expect, it } from "vitest";
import { blockCsv, blockFileName, blockRecord, blockText, type BlockInput } from "./block";
import { gravitySummary } from "./gravity";

const input: BlockInput = {
  number: 2,
  cabin: { name: "Lunar surface habitat", oxygen_percent: 34, pressure_kpa: 56.5, place: "on the Moon", gravity: "0.17 g", what_might_burn: "cotton fabric" },
  steps: [
    { label: "Tests in NASA's archive", n: 1989, from: [{ acc: "PSI-10" }] },
    { label: "Burned cotton fabric", n: 45, from: [{ acc: "PSI-25" }, { acc: "PSI-99" }] },
    { label: "Within 3 points of 34% oxygen", n: 0, from: [] },
    { label: "And close to 56.5 kPa pressure", n: 0, from: [] },
  ],
  stopAt: 2,
  finding: "No test of cotton fabric was run near 34% oxygen.",
  next: "Cotton fabric burned at about 34% oxygen would be the first.",
  meaning: "PSI cannot yet say how a fabric burns in this cabin.",
  views: [{ label: "Oxygen", answer: "0 tests within 3 points of 34%", gap: true }, { label: "Experiments", answer: "BRE ranks first", gap: false }],
  ranked: [{ accession: "PSI-20", short: "BRE", total: 71.6, why: "Tested at this oxygen level" }],
  gravity: gravitySummary([], "moon"),
  questions: [{ question: "Why, exactly?", answer: "Because \"solids\" stayed below 22.2%." }],
  names: { "PSI-25": "BASS-II", "PSI-99": "Saffire-II", "PSI-10": "Flame Design" },
};

describe("blockRecord", () => {
  const b = blockRecord(input);

  it("keeps the counts up to the gap and marks the checks after it as not reached", () => {
    expect(b.checks.map((c) => c.tests)).toEqual([1989, 45, 0, null]);
    expect(b.evidence_runs_out_at).toBe("Within 3 points of 34% oxygen");
    expect(b.checks[1].experiments).toEqual(["BASS-II", "Saffire-II"]);
  });

  it("says so when tests match the whole cabin", () => {
    expect(blockRecord({ ...input, stopAt: -1 }).evidence_runs_out_at).toBeNull();
    expect(blockRecord({ ...input, stopAt: -1 }).checks[3].tests).toBe(0);
  });

  it("carries its source and how SI was used, and is plain data", () => {
    expect(b.format).toBe("flamelens.analysis/1");
    expect(b.source).toMatch(/psi\.nasa\.gov/);
    expect(b.si_use).toMatch(/No value was produced or estimated by a model/);
    expect(JSON.parse(JSON.stringify(b))).toEqual(b);
  });
});

describe("blockCsv", () => {
  const csv = blockCsv(blockRecord(input));

  it("is one fact per row under one header", () => {
    const lines = csv.trimEnd().split("\r\n");
    expect(lines[0]).toBe("section,item,value,note");
    expect(lines).toContain("check,Burned cotton fabric,45,BASS-II; Saffire-II");
    expect(lines).toContain("check,And close to 56.5 kPa pressure,not reached,");
    expect(lines).toContain("view,Oxygen,0 tests within 3 points of 34%,gap");
  });

  it("quotes text that holds a comma or a quotation mark", () => {
    expect(csv).toContain('question,"Why, exactly?","Because ""solids"" stayed below 22.2%.",');
  });
});

describe("blockText and blockFileName", () => {
  const b = blockRecord(input);

  it("reads as a short note", () => {
    const text = blockText(b);
    expect(text.split("\n")[0]).toBe("Analysis 2: Lunar surface habitat, 34% oxygen, 56.5 kPa, on the Moon, cotton fabric");
    expect(text).toContain("1,989  Tests in NASA's archive");
    expect(text).toContain("not reached  And close to 56.5 kPa pressure");
  });

  it("names the file after the cabin", () => {
    expect(blockFileName(b, "json")).toBe("flamelens-analysis-2-lunar-surface-habitat-34pct.json");
    expect(blockFileName(b, "csv")).toMatch(/\.csv$/);
  });
});
