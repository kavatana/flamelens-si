import { describe, expect, it } from "vitest";
import { dossierPath, extentOf, isRelativeLight, linePoints, nearestPoint, readable, type Curve } from "./dossier";

const curve = (t: number[], v: number[]): Curve => ({ variable: "droplet_diameter_mm", label: "Droplet diameter", unit: "mm", t, v });

describe("a test's dossier", () => {
  it("is fetched from a file named after the test, as the pipeline names it", () => {
    expect(dossierPath("PSI-25/bass2/101")).toBe("/evidence/tests/PSI-25_bass2_101.json");
    expect(dossierPath("../../secret")).toBe("/evidence/tests/_secret.json");
  });
});

describe("a curve", () => {
  it("covers the range of its points, and NASA's time axis may start below zero", () => {
    expect(extentOf(curve([-2, 0, 4], [3, 1, 2]))).toEqual({ tMin: -2, tMax: 4, vMin: 1, vMax: 3 });
  });
  it("is drawn through the middle when it is flat", () => {
    const flat = curve([0, 1, 2], [5, 5, 5]);
    const extent = extentOf(flat);
    expect(extent.vMin).toBeLessThan(5);
    expect(extent.vMax).toBeGreaterThan(5);
    expect(linePoints(flat, extent, 100, 40)).toBe("0.0,20.0 50.0,20.0 100.0,20.0");
  });
  it("puts its highest value at the top of the box", () => {
    const c = curve([0, 10], [1, 3]);
    expect(linePoints(c, extentOf(c), 200, 50)).toBe("0.0,50.0 200.0,0.0");
  });
  it("finds the point nearest to where the pointer is", () => {
    const c = curve([0, 1, 2, 10], [4, 3, 2, 1]);
    const extent = extentOf(c);
    expect(nearestPoint(c, extent, 0)).toBe(0);
    expect(nearestPoint(c, extent, 0.19)).toBe(2);
    expect(nearestPoint(c, extent, 5)).toBe(3);
  });
});

describe("a number on a curve", () => {
  it("is shown with the digits its size calls for", () => {
    expect(readable(7.474312)).toBe("7.47");
    expect(readable(0.004506)).toBe("0.00451");
    expect(readable(101.3251)).toBe("101.3");
    expect(readable(12345.6)).toBe("12,346");
    expect(readable(0)).toBe("0");
  });
  it("is marked as a relative reading for the gas flames' light", () => {
    expect(isRelativeLight("acme_pmt_oh_ua")).toBe(true);
    expect(isRelativeLight("droplet_diameter_mm")).toBe(false);
  });
});
