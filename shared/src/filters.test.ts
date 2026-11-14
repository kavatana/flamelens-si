import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, describeFilters, filterRows, filtersFromParams, filtersToParams, type RowLike } from "./filters";

const row = (id: string, patch: Partial<RowLike> = {}): RowLike => ({
  id,
  acc: "PSI-25",
  kind: "test",
  label: id,
  o2Min: 0.21,
  o2Max: 0.21,
  o2Basis: "ambient",
  pMin: 101.3,
  fuel: "PMMA",
  phase: "solid",
  geometry: "rod",
  endMode: null,
  flowMin: null,
  results: 0,
  ...patch,
});

const ROWS = [
  row("plain"),
  row("with-flow", { flowMin: 20 }),
  row("with-result", { results: 2 }),
  row("with-both", { flowMin: 5, results: 1 }),
  row("still-air", { flowMin: 0 }),
];

describe("the must-include filter", () => {
  it("keeps every row when nothing is required", () => {
    expect(filterRows(ROWS, EMPTY_FILTERS)).toHaveLength(ROWS.length);
  });

  it("keeps only rows that report airflow, and counts still air as reported", () => {
    const ids = filterRows(ROWS, { ...EMPTY_FILTERS, has: "flow" }).map((r) => r.id);
    expect(ids).toEqual(["with-flow", "with-both", "still-air"]);
  });

  it("keeps only rows that record a result", () => {
    const ids = filterRows(ROWS, { ...EMPTY_FILTERS, has: "result" }).map((r) => r.id);
    expect(ids).toEqual(["with-result", "with-both"]);
  });

  it("treats a row that carries neither field as having neither", () => {
    const bare = { ...row("bare"), flowMin: undefined, results: undefined };
    expect(filterRows([bare], { ...EMPTY_FILTERS, has: "flow" })).toHaveLength(0);
    expect(filterRows([bare], { ...EMPTY_FILTERS, has: "result" })).toHaveLength(0);
  });

  it("survives a round trip through the link and is named in the export scope", () => {
    const filters = filtersFromParams(filtersToParams({ ...EMPTY_FILTERS, has: "result", phase: "solid" }));
    expect(filters.has).toBe("result");
    expect(describeFilters(filters, {})).toBe("solid fuel, with a result recorded");
  });
});
