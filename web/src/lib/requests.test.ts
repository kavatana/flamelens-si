import { describe, expect, it } from "vitest";
import { requestIn, type DockCabin } from "./requests";

const names = { "PSI-25": "BASS-II", "PSI-26": "BASS", "PSI-69": "FLEX", "PSI-68": "FLEX-2", "PSI-99": "Saffire-II", "PSI-102": "SAME" };
const cabins: DockCabin[] = [
  { id: "lunar-habitat", name: "Lunar surface habitat", label: "the lunar surface habitat", query: "o2=34&p=56.5&fuel=solid&pri=prevention" },
  { id: "pressurized-rover", name: "Pressurized rover", label: "the pressurized rover", query: "o2=26.5&p=70.3&fuel=solid&pri=balanced" },
  { id: "station", name: "Space station cabin", label: "the space station cabin", query: "o2=21&p=101.4&fuel=any&pri=balanced" },
];
const act = (text: string) => requestIn(text, names, cabins)?.href ?? null;

describe("requests the SI panel carries out", () => {
  it("opens a cabin on the dashboard, with the fuel that was named", () => {
    expect(act("Show me the lunar habitat for fabric")).toBe("/explore?o2=34&p=56.5&fuel=solid&pri=prevention&mat=fabric");
    expect(act("open the rover for wire insulation")).toBe("/explore?o2=26.5&p=70.3&fuel=solid&pri=balanced&mat=wire");
    expect(act("open the space station for liquids")).toBe("/explore?o2=21&p=101.4&fuel=liquid&pri=balanced");
    expect(act("rover")).toBe("/explore?o2=26.5&p=70.3&fuel=solid&pri=balanced");
  });

  it("opens the experiment that was named, preferring the longer name", () => {
    expect(act("Open FLEX")).toBe("/investigations/PSI-69");
    expect(act("open flex-2 please")).toBe("/investigations/PSI-68");
    expect(act("show BASS-II")).toBe("/investigations/PSI-25");
  });

  it("compares the experiments that were named", () => {
    expect(act("Compare BASS and BASS-II")).toBe("/compare?ids=PSI-25,PSI-26");
    expect(act("compare")).toBe("/compare");
  });

  it("opens the Flame Lab with a cabin's air", () => {
    expect(act("open the lab for the lunar habitat")).toBe("/lab?fuel=methanol&o2=34&p=56.5&size=2");
    expect(act("show the rover in the flame lab")).toBe("/lab?fuel=methanol&o2=26.5&p=70.3&size=2");
  });

  it("starts the tour and opens pages", () => {
    expect(act("Take me on the tour")).toBe("/explore?tour=1");
    expect(act("go to the flame lab")).toBe("/lab");
    expect(act("download the data")).toBe("/data");
  });

  it("leaves questions for the archive", () => {
    expect(act("Has anything been tested at 34% oxygen?")).toBeNull();
    expect(act("What is the dashboard?")).toBeNull();
    expect(act("Is a lunar habitat safe from fire?")).toBeNull();
    expect(act("tell me about fabric tests in orbit")).toBeNull();
  });
});
