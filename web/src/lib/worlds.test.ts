import { describe, expect, it } from "vitest";
import { WORLDS, flameGlow, flameInk, gravityAt, scrollOfWorld, stretchOf, turnsAtScroll, warmthOf, worldAt } from "./worlds";

describe("the four places", () => {
  it("go from Earth's gravity down to none", () => {
    expect(WORLDS.map((w) => w.id)).toEqual(["earth", "mars", "moon", "orbit"]);
    expect(WORLDS.map((w) => w.g)).toEqual([1, 0.38, 0.17, 0]);
  });
  it("say that nothing was tested at the gravity of Mars or the Moon", () => {
    expect(WORLDS.filter((w) => !w.tested).map((w) => w.id)).toEqual(["mars", "moon"]);
    // A NASA photograph is shown only where NASA took one.
    expect(WORLDS.filter((w) => w.photo).map((w) => w.id)).toEqual(["earth", "orbit"]);
  });
});

describe("the ring", () => {
  it("has each place in front at a whole number of turns, and goes round", () => {
    expect([0, 1, 2, 3, 4, 5, -1].map(worldAt)).toEqual([0, 1, 2, 3, 0, 1, 3]);
    expect(worldAt(1.4)).toBe(1);
    expect(worldAt(1.6)).toBe(2);
  });
  it("gives each place its own gravity and eases between them", () => {
    expect(gravityAt(0)).toBe(1);
    expect(gravityAt(1)).toBe(0.38);
    expect(gravityAt(3)).toBe(0);
    expect(gravityAt(0.5)).toBeCloseTo(0.69, 5);
    // From orbit the ring comes back round to Earth.
    expect(gravityAt(3.5)).toBeCloseTo(0.5, 5);
    expect(gravityAt(4)).toBe(1);
  });
});

describe("the flame", () => {
  it("is tall on Earth and a ball in orbit", () => {
    expect(stretchOf(1)).toBe(1);
    expect(stretchOf(0)).toBe(0);
    expect(stretchOf(0.17)).toBeGreaterThan(0.17);
  });
  it("is amber with gravity and blue without, in words and in light", () => {
    expect(flameInk(1)).toBe("rgb(217 72 15)");
    expect(flameInk(0)).toBe("rgb(31 79 196)");
    expect(flameGlow(1)).toEqual([255, 146, 36]);
    expect(flameGlow(0)).toEqual([64, 112, 255]);
  });
  it("stays a warm flame wherever gravity still pulls, and turns blue only near none", () => {
    expect(warmthOf(0.38)).toBe(1);
    expect(warmthOf(0.17)).toBe(1);
    expect(warmthOf(0.06)).toBeLessThan(0.5);
    expect(warmthOf(0)).toBe(0);
    // A slower flame is a little redder, never purple.
    expect(flameInk(0.17)).toBe("rgb(204 60 18)");
  });
});

describe("scrolling", () => {
  it("rests at each place and ends in orbit", () => {
    expect(turnsAtScroll(0)).toBe(0);
    expect(turnsAtScroll(0.04)).toBe(0);
    expect(turnsAtScroll(scrollOfWorld(1))).toBe(1);
    expect(turnsAtScroll(scrollOfWorld(2))).toBe(2);
    expect(turnsAtScroll(1)).toBe(3);
    expect(turnsAtScroll(2)).toBe(3);
  });
  it("is halfway between two places halfway through the scroll between them", () => {
    expect(turnsAtScroll(1 / 6)).toBeCloseTo(0.5, 5);
  });
});
