/**
 * One analysis, as a record.
 *
 * Each press of Analyze makes one block in the SI panel: a cabin, the checks made for it,
 * what they add up to, and the questions asked about it. This module turns a block into
 * plain data in one fixed shape. The page's export buttons write it out, and it is the shape
 * an SI model is given, so what a person downloads and what the model reads are the same.
 */
import type { GravitySummary } from "./gravity";

/** The cabin of a block, in the only form that is ever sent to the server: numbers and fixed words, no free text. */
export type CabinContext = { o2: number; p: number; gravity: "orbit" | "moon" | "mars"; focus: "solid" | "liquid" | "gas" | "any"; material: string | null };

export type BlockRecord = {
  format: "flamelens.analysis/1";
  number: number;
  cabin: { name: string; oxygen_percent: number; pressure_kpa: number; place: string; gravity: string; what_might_burn: string };
  /** The checks in order. `tests` is null for a check that was never reached because an earlier one left nothing. */
  checks: { check: string; tests: number | null; experiments: string[] }[];
  /** The check at which no test was left, or null when tests match the whole cabin. */
  evidence_runs_out_at: string | null;
  finding: string;
  what_would_help: string;
  what_it_means: string | null;
  views: { view: string; answer: string; gap: boolean }[];
  read_first: { rank: number; experiment: string; accession: string; score: number; why: string }[];
  gravity: { finding: string; tested: string[]; not_tested: string[] };
  questions: { question: string; answer: string | null }[];
  source: string;
  si_use: string;
};

export type BlockInput = {
  number: number;
  cabin: BlockRecord["cabin"];
  steps: { label: string; n: number; from: { acc: string }[] }[];
  /** Index of the first check that left no test, or -1. */
  stopAt: number;
  finding: string;
  next: string;
  meaning: string | null;
  views: { label: string; answer: string; gap: boolean }[];
  ranked: { accession: string; short: string; total: number; why: string }[];
  gravity: GravitySummary;
  questions: { question: string; answer: string | null }[];
  names: Record<string, string>;
};

export const SOURCE = "NASA Physical Sciences Informatics (PSI), https://psi.nasa.gov, experimental tables";
export const SI_USE = "Counts are made by code from NASA's tables. No value was produced or estimated by a model. The explanation in words is written by an SI model and quotes NASA.";

export function blockRecord(input: BlockInput): BlockRecord {
  return {
    format: "flamelens.analysis/1",
    number: input.number,
    cabin: input.cabin,
    checks: input.steps.map((step, i) => ({
      check: step.label,
      tests: input.stopAt >= 0 && i > input.stopAt ? null : step.n,
      experiments: step.from.slice(0, 5).map((f) => input.names[f.acc] ?? f.acc),
    })),
    evidence_runs_out_at: input.stopAt >= 0 ? input.steps[input.stopAt].label : null,
    finding: input.finding,
    what_would_help: input.next,
    what_it_means: input.meaning,
    views: input.views.map((v) => ({ view: v.label, answer: v.answer, gap: v.gap })),
    read_first: input.ranked.slice(0, 5).map((r, i) => ({ rank: i + 1, experiment: r.short, accession: r.accession, score: Math.round(r.total), why: r.why })),
    gravity: { finding: input.gravity.finding, tested: input.gravity.stops.filter((s) => s.tested).map((s) => s.name), not_tested: input.gravity.stops.filter((s) => !s.tested).map((s) => s.name) },
    questions: input.questions,
    source: SOURCE,
    si_use: SI_USE,
  };
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/** The block as a flat table: one row per fact, so it opens cleanly in a spreadsheet. */
export function blockCsv(b: BlockRecord): string {
  const rows: unknown[][] = [["section", "item", "value", "note"]];
  rows.push(["cabin", "name", b.cabin.name, ""], ["cabin", "oxygen_percent", b.cabin.oxygen_percent, ""], ["cabin", "pressure_kpa", b.cabin.pressure_kpa, ""], ["cabin", "place", b.cabin.place, b.cabin.gravity], ["cabin", "what_might_burn", b.cabin.what_might_burn, ""]);
  for (const c of b.checks) rows.push(["check", c.check, c.tests ?? "not reached", c.tests === null || c.tests === 0 ? "" : c.experiments.join("; ")]);
  rows.push(["result", "evidence_runs_out_at", b.evidence_runs_out_at ?? "nowhere: tests match the whole cabin", ""], ["result", "finding", b.finding, ""], ["result", "what_would_help", b.what_would_help, ""]);
  if (b.what_it_means) rows.push(["result", "what_it_means", b.what_it_means, "written by the SI"]);
  for (const v of b.views) rows.push(["view", v.view, v.answer, v.gap ? "gap" : ""]);
  for (const r of b.read_first) rows.push(["read_first", `${r.rank}. ${r.experiment} (${r.accession})`, r.score, r.why]);
  rows.push(["gravity", "finding", b.gravity.finding, `tested: ${b.gravity.tested.join(", ")}; not tested: ${b.gravity.not_tested.join(", ")}`]);
  for (const q of b.questions) rows.push(["question", q.question, q.answer ?? "", ""]);
  rows.push(["about", "source", b.source, ""], ["about", "si_use", b.si_use, ""]);
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}

/** The block in words, for the clipboard. */
export function blockText(b: BlockRecord): string {
  const lines = [
    `Analysis ${b.number}: ${b.cabin.name}, ${b.cabin.oxygen_percent}% oxygen, ${b.cabin.pressure_kpa} kPa, ${b.cabin.place}, ${b.cabin.what_might_burn}`,
    "",
    ...b.checks.map((c) => `${c.tests === null ? "not reached" : c.tests.toLocaleString("en-US")}  ${c.check}`),
    "",
    b.finding,
    b.what_would_help,
  ];
  if (b.what_it_means) lines.push("", b.what_it_means);
  lines.push("", `Source: ${b.source}. ${b.si_use}`);
  return lines.join("\n");
}

/** A file name that says what is in it. */
export function blockFileName(b: BlockRecord, ext: "csv" | "json"): string {
  const cabin = b.cabin.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `flamelens-analysis-${b.number}-${cabin}-${b.cabin.oxygen_percent}pct.${ext}`;
}
