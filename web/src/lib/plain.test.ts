import { describe, expect, it } from "vitest";
import { amount, burned, facts, place, plainName } from "./plain";

const stats = (over: Partial<Parameters<typeof amount>[0]> = {}) => ({ records: 0, tests: 0, sessions: 0, envelopes: 0, datasets: 0, fuels: [], ...over });

describe("plainName", () => {
  it("spells the name out and drops the programme in brackets", () => {
    expect(plainName({ short: "BRE", expansion: "Burning Rate Emulator (ACME)" })).toBe("Burning Rate Emulator");
  });
  it("keeps the short name when the full one is a sentence", () => {
    expect(plainName({ short: "SPICE soot analysis", expansion: "Computational and Experimental Analysis of SPICE Data Sets" })).toBe("SPICE soot analysis");
  });
});

describe("burned", () => {
  it("names solids the way a cabin designer would, most tested first", () => {
    const got = burned({ short: "", expansion: "", platform: "ISS", fuelPhases: ["solid"], stats: stats({ fuels: [{ name: "Nomex", records: 9 }, { name: "PMMA", records: 60 }] }) });
    expect(got).toEqual({ value: "Solid materials", note: "Acrylic plastic and flame-resistant fabric" });
  });
  it("counts the materials it does not list", () => {
    const fuels = ["methane", "ethylene", "ethane", "propane", "hydrogen"].map((name, i) => ({ name, records: 10 - i }));
    expect(burned({ short: "", expansion: "", platform: "ISS", fuelPhases: ["gas"], stats: stats({ fuels }) }).note).toBe("Methane, ethylene, ethane and 2 more");
  });
  it("says when a gas stood in for other fuels", () => {
    const got = burned({ short: "", expansion: "", platform: "ISS", fuelPhases: ["gas"], emulates: { phases: ["solid", "liquid"] }, stats: stats({ fuels: [{ name: "ethylene", records: 16 }] }) });
    expect(got.note).toBe("Ethylene. The gas stood in for solid and liquid fuels");
  });
  it("does not invent a fuel for an instrument test", () => {
    expect(burned({ short: "", expansion: "", platform: "ISS", fuelPhases: [], stats: stats() }).value).toBe("Nothing was burned");
  });
  it("falls back to a plain description when the table names no fuel", () => {
    expect(burned({ short: "", expansion: "", platform: "Computational", fuelPhases: ["liquid"], stats: stats() }).note).toBe("One small droplet at a time");
  });
});

describe("amount", () => {
  it("counts tests when every row is one test", () => {
    expect(amount(stats({ records: 129, tests: 129 })).value).toBe("129 tests");
  });
  it("counts test days when the table lists days", () => {
    expect(amount(stats({ records: 18, sessions: 18 })).value).toBe("18 test days");
  });
  it("counts rows when a row holds several tests", () => {
    expect(amount(stats({ records: 8, tests: 4, envelopes: 4 })).value).toBe("8 table rows");
  });
  it("says so when there is no table", () => {
    expect(amount(stats()).value).toBe("No test table");
  });
});

describe("facts", () => {
  it("gives the three facts in a fixed order", () => {
    const got = facts({ short: "", expansion: "", platform: "Cygnus", fuelPhases: ["solid"], stats: stats({ records: 2, tests: 2 }) });
    expect(got.map((f) => f.label)).toEqual(["What burned", "Where", "How much data"]);
    expect(got[1].value).toBe("In a cargo ship");
  });
  it("passes an unknown place through unchanged", () => {
    expect(place("Drop tower").value).toBe("Drop tower");
  });
});
