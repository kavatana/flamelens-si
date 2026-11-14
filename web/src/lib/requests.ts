/**
 * Requests the SI panel can carry out in the site itself: open a cabin on the dashboard,
 * an experiment or a page, compare experiments, start the tour.
 *
 * They are recognised by plain rules, not by a model, so an action is always one the site
 * really has. Anything that is not a request is treated as a question for the archive.
 */

import { labHref } from "./lab-link";
import { namedIn } from "@flamelens/shared/names";

export type DockCabin = { id: string; name: string; label: string; query: string };
export type Action = { reply: string; href: string };

const CABIN_WORDS: Record<string, RegExp> = {
  "lunar-habitat": /\b(lunar|moon|habitat)\b/,
  "pressurized-rover": /\brover\b/,
  station: /\b(station|iss)\b/,
  suit: /\b(suit|spacesuit|eva)\b/,
};
/** Words for what might burn: [fuel type, pattern, how to say it back, material id if it names one]. */
const FUEL_WORDS: [string, RegExp, string, string?][] = [
  ["solid", /\b(fabrics?|cloth|cotton|seats?)\b/, "cotton fabric", "fabric"],
  ["solid", /\b(plastics?|acrylic|pmma)\b/, "acrylic plastic", "acrylic"],
  ["solid", /\b(wires?|wiring|cables?|insulation|kapton|teflon)\b/, "wire insulation", "wire"],
  ["solid", /\b(foam|cushions?)\b/, "foam", "foam"],
  ["solid", /\bsilicone\b/, "silicone", "silicone"],
  ["solid", /\bnomex\b/, "flame-resistant fabric", "nomex"],
  ["solid", /\b(solids?|materials?)\b/, "solids"],
  ["liquid", /\b(liquids?|droplets?)\b/, "liquids"],
  ["gas", /\b(gas|gases)\b/, "gases"],
];
const PAGES: [RegExp, string, string][] = [
  [/\b(dashboard|cabins?)\b/, "/explore", "Opened the dashboard."],
  [/\b(flame ?lab|lab|simulator)\b/, "/lab", "Opened the Flame Lab."],
  [/\b(experiments?|investigations?|hardware)\b/, "/investigations", "Opened the experiments."],
  [/\bearth\b/, "/safety#earth", "Opened the Earth applications."],
  [/\b(safety|prevention|detection|suppression|extinguishers?)\b/, "/safety", "Opened the safety page."],
  [/\b(data|download|export|csv|json)\b/, "/data", "Opened the data. Filter the rows, then download them."],
  [/\b(methods?|limits|sources?)\b/, "/methods", "Opened the methods and limits."],
  [/\b(home|start page)\b/, "/", "Opened the home page."],
];
const QUESTION = /^(what|why|how|which|does|do|is|are|has|have|did|who|when|where)\b/;
const REQUEST = /\b(open|show|go to|take me|bring up|switch to|set|load|start|see|view|display|compare)\b/;

const plain = (text: string) => ` ${text.toLowerCase().replace(/[^a-z0-9%]+/g, " ").trim()} `;

/** What the visitor asked the site to do, or null when it is a question for the archive. */
export function requestIn(text: string, names: Record<string, string>, cabins: DockCabin[]): Action | null {
  const t = plain(text).trim();
  if (QUESTION.test(t) || !(REQUEST.test(t) || t.split(" ").length <= 3)) return null;
  if (/\b(tour|show me around|walk me through)\b/.test(t)) return { href: "/explore?tour=1", reply: "Starting the one-minute tour of the dashboard." };

  const found = namedIn(text, names);
  if (/\bcompare\b/.test(t)) {
    return found.length >= 2
      ? { href: `/compare?ids=${found.slice(0, 4).join(",")}`, reply: `Comparing ${found.slice(0, 4).map((a) => names[a]).join(", ")} side by side.` }
      : { href: "/compare", reply: "Opened the compare view. Choose up to four experiments there." };
  }

  const cabin = cabins.find((c) => CABIN_WORDS[c.id]?.test(t));
  if (cabin && /\b(flame ?lab|lab)\b/.test(t)) {
    const air = new URLSearchParams(cabin.query);
    const href = labHref(Number(air.get("o2")) / 100, Number(air.get("p")));
    return { href, reply: href === "/lab" ? `Opened the Flame Lab. The air of ${cabin.label} is outside what its droplet tests covered.` : `Opened the Flame Lab with the air of ${cabin.label}.` };
  }
  if (cabin) {
    const query = new URLSearchParams(cabin.query);
    const fuel = FUEL_WORDS.find(([, words]) => words.test(t));
    if (fuel) {
      query.set("fuel", fuel[0]);
      if (fuel[3]) query.set("mat", fuel[3]);
      else query.delete("mat");
    }
    return { href: `/explore?${query}`, reply: `Opened the dashboard for ${cabin.label}${fuel ? `, looking at ${fuel[2]}` : ""}.` };
  }

  if (found.length === 1) return { href: `/investigations/${found[0]}`, reply: `Opened ${names[found[0]]}.` };
  const page = PAGES.find(([words]) => words.test(t));
  return page ? { href: page[1], reply: page[2] } : null;
}
