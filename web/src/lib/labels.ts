export const RELEVANCE: Record<number, { label: string; help: string }> = {
  3: { label: "Direct", help: "Named by NASA as a spacecraft fire-safety study." },
  2: { label: "Supporting", help: "Informs a fire-safety question, or models a direct study." },
  1: { label: "Fundamental", help: "Combustion science that NASA calls relevant, but not as strongly or directly." },
};

export const PILLARS = [
  { id: "prevention", label: "Prevention", help: "Material selection and flammability limits." },
  { id: "detection", label: "Detection", help: "Smoke and what a detector must sense." },
  { id: "suppression", label: "Suppression", help: "Putting a fire out, and when flames go out." },
] as const;

export const SOURCE_LABEL: Record<string, string> = {
  psi: "PSI record",
  challenge: "NASA challenge statement",
  table: "note in the PSI table",
  "doc:bass2-readme": "NASA's ReadMe for BASS-II",
};

export function sourceLabel(source: string): string {
  if (SOURCE_LABEL[source]) return SOURCE_LABEL[source];
  if (source.startsWith("doc:")) return "a NASA file in PSI";
  if (source.startsWith("file:")) return `NASA's file ${source.slice(5)}`;
  return source.startsWith("PSI-") ? `PSI record ${source}` : source;
}
