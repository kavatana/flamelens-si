import { describe, expect, it } from "vitest";
import { checkNumbers } from "./number-check";

describe("checkNumbers", () => {
  const data = JSON.stringify({ total: 1989, tests_close: 76, oxygen_pct: 34, pressure_kpa: 56.5, flow: [20, 30] });

  it("passes when every figure is in the retrieved data", () => {
    expect(checkNumbers("76 tests sit close to 34% oxygen at 56.5 kPa, out of 1,989 rows.", data)).toEqual({ total: 4, found: 4, missing: [] });
  });

  it("reports a figure that was not retrieved", () => {
    const result = checkNumbers("About 120 tests ran at 34% oxygen.", data);
    expect(result).toMatchObject({ total: 2, found: 1, missing: ["120"] });
  });

  it("ignores citations, accession numbers and single digits", () => {
    expect(checkNumbers("BASS-II [PSI-25] and row [PSI-69/flex/12] cover 3 fuels. See PSI-99.", data)).toEqual({ total: 0, found: 0, missing: [] });
  });

  it("does not treat a sentence-ending full stop as part of the number", () => {
    expect(checkNumbers("The airflow was 20. Later it was 30.", data).missing).toEqual([]);
  });

  it("counts a repeated figure once", () => {
    expect(checkNumbers("34% here, 34% there.", data).total).toBe(1);
  });
  it("reads a figure with empty decimals as the same figure", () => {
    expect(checkNumbers("The air moved at 20.0 cm/s and 30.00 cm/s.", data).missing).toEqual([]);
    expect(checkNumbers("The air moved at 20.5 cm/s.", data).missing).toEqual(["20.5"]);
  });
});
