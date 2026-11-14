"use client";

import { ArrowRight, ArrowsClockwise } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import type { Briefing, Coverage, FlowCoverage, GravityPair } from "@/lib/data";
import { nearCabin, type FlowTest } from "@flamelens/shared/flow-map";
import { PHASE_LABEL, PHASE_VAR, int, kpa, pct, psia } from "@flamelens/shared/format";
import { blockRecord, type CabinContext } from "@/lib/block";
import { buildFunnel, describeFunnel, type FuelRow } from "@flamelens/shared/funnel";
import { gravitySummary } from "@/lib/gravity";
import { labHref } from "@/lib/lab-link";
import { GRAVITY, MATERIALS, materialById, type Gravity } from "@flamelens/shared/materials";
import { CABIN_ART } from "@/lib/media";
import type { Action, DockCabin } from "@/lib/requests";
import { planReveal } from "@/lib/reveal";
import { AT_REST, startRun, stopRun, useRunTime } from "@/lib/run-clock";
import { clampScenario, fromPreset, fromQuery, matchPreset, toQuery, toScenario, type ScenarioState } from "@/lib/scenario";
import { rankInvestigations, type Cluster, type Focus, type InvestigationFacts } from "@flamelens/shared/scoring";
import type { Environment, Priority, ScenarioPreset } from "@flamelens/shared/types";
import { useArrivalSearch } from "@/lib/use-location-search";
import { Art } from "../art";
import { answerText, useSiChat } from "../si-chat";
import { Tour, type TourStep } from "../tour";
import { AirView, OxygenView, PressureView, type Opened } from "./band-views";
import { EvidenceMap } from "./evidence-map";
import { ExperimentsView, reason, type ExperimentCard } from "./experiments-view";
import { GravityView } from "./gravity-view";
import { Inspector } from "./inspector";
import { SiPanel } from "./si-panel";

/**
 * The dashboard. On the left the visitor describes a cabin; nothing is worked out until they
 * press Analyze. Then the middle shows NASA's tests around that cabin, one view at a time,
 * and on the right the SI says what they mean and answers questions.
 */

type Props = {
  clusters: Cluster[];
  facts: InvestigationFacts[];
  /** What each experiment is, for the list of experiments. */
  cards: Record<string, ExperimentCard>;
  environments: Environment[];
  presets: ScenarioPreset[];
  coverage: Coverage;
  briefings: Record<string, { body: Briefing; model: string }>;
  pairs: GravityPair[];
  /** How many rows each experiment has of each fuel. */
  fuels: FuelRow[];
  /** Tests counted by experiment, fuel and the air speeds they ran at. */
  flows: FlowCoverage;
  /** Solid-fuel tests that give both oxygen and air speed. */
  flowTests: FlowTest[];
  /** Animated versions of the drawings, keyed by the drawing's path. */
  motion: Record<string, string>;
};

/** The data views. Each is one thing that decides how a fire behaves, or what to read about it. */
type View = "oxygen" | "air" | "pressure" | "gravity" | "experiments";
type Tab = { id: View; label: string; answer: string; gap: boolean };
/** One analysis: a cabin, with the questions asked about it kept under its id. */
type Block = { id: number; scenario: ScenarioState };

/** A cabin as the server takes it: numbers and fixed words only. */
const cabinOf = (s: ScenarioState): CabinContext => ({ o2: s.o2, p: s.p, gravity: s.gravity, focus: s.focus, material: s.material });

const FOCI: { id: Focus; label: string }[] = [
  { id: "solid", label: "Solids" },
  { id: "liquid", label: "Liquids" },
  { id: "gas", label: "Gases" },
  { id: "any", label: "Any" },
];

const PRIORITIES: { id: Priority; label: string }[] = [
  { id: "balanced", label: "Balanced" },
  { id: "prevention", label: "Prevention" },
  { id: "detection", label: "Detection" },
  { id: "suppression", label: "Suppression" },
];

const PLACE_SHORT: Record<Gravity, string> = { orbit: "Orbit", moon: "Moon", mars: "Mars" };
const OWN_CABIN = "This is your own cabin, so there is no prepared explanation yet. Every number on this page is counted for it.";

/** The tour steps that point at the start of the page, before anything is analyzed. */
const BEFORE_RESULTS = new Set(["[data-tour=scenario]", "[data-tour=analyze]"]);

const TOUR: TourStep[] = [
  { target: "[data-tour=scenario]", title: "Describe your cabin", body: "Pick one of NASA's planned cabins, then say what might burn in it and where it is. Nothing is worked out yet." },
  { target: "[data-tour=analyze]", title: "Press Analyze", body: "The page waits for you. Press Analyze and it goes through NASA's tables for this cabin, one check at a time." },
  { target: "[data-tour=briefing]", title: "The SI shows its work", body: "Starting from every test in the archive, each bar keeps only the tests that also match your cabin. The first empty bar is the gap. Under the bars is the answer in plain words, and the test that would close the gap." },
  { target: "[data-tour=ask]", title: "Ask it anything about the archive", body: "Type a question and the SI answers here, with NASA's words quoted. It also takes requests, such as “show me the rover for fabric”." },
  { target: "[data-tour=views]", title: "Five questions, five short answers", body: "Each tab is one thing that decides how a fire behaves. The line under its name is the answer for your cabin. Orange means NASA has no test there." },
  { target: "[data-tour=grid]", view: "oxygen", title: "Where the evidence stops", body: "Each square counts NASA's tests for one fuel at one oxygen level. A grey 0 means no test. The column framed in black is your cabin. Click a square to list its tests, then a test to see where every value comes from." },
  { target: "[data-tour=airflow]", view: "air", title: "Oxygen and moving air", body: "The same oxygen columns, now against how fast the air moved past the sample. NASA names these two as what decides whether something burns." },
  { target: "[data-tour=pressure]", view: "pressure", title: "Oxygen and pressure", body: "The same columns against the pressure of the air. Diamonds mark the four cabins NASA plans. Outlined squares are tests whose table does not list the pressure." },
  { target: "[data-tour=gravity]", view: "gravity", title: "The gravity question", body: "Tests exist weightless and on Earth. Nothing in the archive was run at the gravity of the Moon or Mars. NASA says the two ends could bound what happens in between." },
  { target: "[data-tour=top]", view: "experiments", title: "The experiments to read first", body: "All of them, ranked for this cabin. Pick one to see NASA's photograph, what it did and why it ranks where it does." },
];

type Context = Pick<Props, "clusters" | "facts" | "environments" | "presets" | "briefings" | "fuels" | "flows" | "flowTests"> & { names: Record<string, string> };

/** Everything the page says about one cabin: the counts, the words, the ranking and the pace of showing them. */
function analyse(state: ScenarioState, ctx: Context) {
  const material = materialById(state.material);
  const funnel = buildFunnel({ clusters: ctx.clusters, fuels: ctx.fuels, o2: state.o2, p: state.p, focus: state.focus, material, gravity: state.gravity });
  const words = describeFunnel(funnel, state, ctx.names);
  const preset = matchPreset(state, ctx.presets, ctx.environments);
  const briefing = preset ? ctx.briefings[preset] : undefined;
  const meaning = briefing ? briefing.body.summary : OWN_CABIN;
  const ranked = rankInvestigations(ctx.facts, ctx.clusters, toScenario(state));

  // One line per view: the answer for this cabin, and whether it is a gap.
  const count = (id: string) => funnel.steps.find((s) => s.id === id)?.n ?? 0;
  const tests = (n: number) => `${int(n)} ${n === 1 ? "test" : "tests"}`;
  const solids = state.focus === "solid" || state.focus === "any";
  const drawn = material ? ctx.flowTests.filter((t) => material.match.includes(t.fuel ?? "")) : ctx.flowTests;
  const drawnNear = nearCabin(drawn, state.o2).close;
  const others = ctx.flows.totals.filter((t) => t.phase === state.focus);
  const listed = others.reduce((sum, t) => sum + t.listed, 0);
  const air = solids
    ? drawn.length === 0
      ? { answer: "no test gives oxygen and air speed", gap: true }
      : { answer: `${int(drawnNear)} of ${int(drawn.length)} within 3 points of ${pct(state.o2)}`, gap: drawnNear === 0 }
    : { answer: `given for ${int(listed)} of ${tests(others.reduce((sum, t) => sum + t.all, 0))}`, gap: listed === 0 };
  const tabs: Tab[] = [
    { id: "oxygen", label: "Oxygen", answer: `${tests(count("oxygen"))} within 3 points of ${pct(state.o2)}`, gap: count("oxygen") === 0 },
    { id: "air", label: "Air speed", ...air },
    { id: "pressure", label: "Pressure", answer: `${tests(count("air"))} also close to ${kpa(state.p)}`, gap: count("air") === 0 },
    { id: "gravity", label: "Gravity", answer: state.gravity === "orbit" ? "weightless, like every test" : `no test at ${GRAVITY[state.gravity].g}`, gap: state.gravity !== "orbit" },
    { id: "experiments", label: "Experiments", answer: ranked.length ? `${ranked[0].short} ranks first` : "", gap: false },
  ];
  const stopAt = funnel.stop ? funnel.steps.indexOf(funnel.stop) : -1;
  const plan = planReveal({ checks: funnel.steps.length, stopAt, tabs: tabs.length, verdict: words.verdict, next: words.next, meaning });

  // A named cabin keeps its name only where NASA places it; the same air somewhere else is the visitor's own cabin.
  const named = ctx.presets.find((p) => p.id === preset);
  const cabinName = named && fromPreset(named, ctx.environments).gravity === state.gravity ? named.name : "A cabin with this air";
  const burns = material ? material.label.toLowerCase() : state.focus === "any" ? "anything" : PHASE_LABEL[state.focus].toLowerCase();
  const line = `${cabinName} · ${pct(state.o2)} oxygen · ${kpa(state.p)} · ${GRAVITY[state.gravity].place} · ${burns}`;
  const question = `What does NASA's archive tell me about fire safety in a cabin at ${pct(state.o2)} oxygen and ${kpa(state.p)} ${GRAVITY[state.gravity].place}${state.focus === "any" ? "" : `, for ${burns}`}?`;
  return { material, funnel, words, briefing, meaning, ranked, tabs, plan, line, question, cabinName, burns, close: count("air") };
}

/** The button that starts an analysis. It is the only thing on the page that does. */
function AnalyzeButton({ stale, onRun }: { stale: boolean; onRun: () => void }) {
  const running = useRunTime() !== AT_REST;
  return (
    <button type="button" data-tour="analyze" disabled={running} onClick={onRun} className={`btn btn-lg w-full justify-center ${stale || running ? "btn-accent" : ""} ${running ? "cursor-progress" : ""}`}>
      {running ? <>Analyzing<span className="si-dots" aria-hidden /></> : stale ? <>Analyze this cabin <ArrowRight size={16} weight="bold" /></> : <><ArrowsClockwise size={15} /> Analyze again</>}
    </button>
  );
}

/** The five views. During a run their answers come in one after another. */
function Tabs({ tabs, tabAt, view, onView }: { tabs: Tab[]; tabAt: number[]; view: View; onView: (view: View) => void }) {
  const t = useRunTime();
  const pending = tabAt.findIndex((at) => t < at);
  function onKey(e: KeyboardEvent<HTMLButtonElement>) {
    const move = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!move) return;
    e.preventDefault();
    const next = tabs[(tabs.findIndex((tab) => tab.id === view) + move + tabs.length) % tabs.length].id;
    onView(next);
    document.getElementById(`tab-${next}`)?.focus();
  }
  return (
    <div role="tablist" aria-label="NASA's tests around this cabin" data-tour="views" className="flex gap-px overflow-x-auto rounded-sm border border-rule bg-rule">
      {tabs.map((tab, i) => {
        const active = view === tab.id;
        return (
          <button key={tab.id} type="button" role="tab" id={`tab-${tab.id}`} aria-selected={active} aria-controls="view-panel" tabIndex={active ? 0 : -1} onClick={() => onView(tab.id)} onKeyDown={onKey} className={`flex min-w-[7.2rem] flex-1 flex-col px-3 pb-2 pt-2.5 text-left transition-colors ${active ? "bg-surface shadow-[inset_0_2.5px_0_var(--color-ink)]" : "bg-paper hover:bg-wash"}`}>
            <span className={`block text-[13.5px] ${active ? "font-semibold" : "font-medium text-ink-2"}`}>{tab.label}</span>
            <span className={`mt-0.5 block min-h-[2.75em] text-[11.5px] leading-snug ${tab.gap ? "font-medium text-caution" : "text-ink-3"}`}>
              {t >= tabAt[i] ? tab.answer : i === pending ? <span className="si-dots text-accent" aria-label="checking" /> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Covers the view while the tests are being counted, so the result arrives as one piece. */
function RunVeil({ until }: { until: number }) {
  const on = useRunTime() < until;
  return (
    <div className={`absolute inset-0 z-20 flex items-start justify-center rounded-sm bg-surface/85 backdrop-blur-[2px] transition-opacity duration-300 ${on ? "" : "pointer-events-none opacity-0"}`}>
      {on && (
        <p role="status" className="mt-24 flex items-center gap-2.5 rounded-sm border border-rule bg-surface px-4 py-2.5 text-[14px] font-medium shadow-[0_10px_30px_-14px_rgba(20,23,26,0.45)]">
          <span className="si-orb is-busy" aria-hidden /> Counting NASA&apos;s tests around this cabin<span className="si-dots" aria-hidden />
        </p>
      )}
    </div>
  );
}

/** What the dashboard opens on: the four cabins NASA plans, each one click from its analysis. */
function Start({ presets, environments, motion, onPick }: { presets: ScenarioPreset[]; environments: Environment[]; motion: Record<string, string>; onPick: (cabin: ScenarioState) => void }) {
  const [hot, setHot] = useState<string | null>(null);
  return (
    <section aria-labelledby="start-title" className="panel px-5 py-5 sm:px-6">
      <h2 id="start-title" className="text-[22px] font-semibold tracking-[-0.015em]">Start with a cabin</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {presets.map((preset) => {
          const cabin = fromPreset(preset, environments);
          const art = CABIN_ART[preset.id];
          return (
            <button key={preset.id} type="button" onClick={() => onPick(cabin)} onPointerEnter={() => setHot(preset.id)} onPointerLeave={() => setHot(null)} className="group flex flex-col overflow-hidden rounded-sm border border-rule bg-surface text-left transition-colors hover:border-ink">
              <Art src={art.src} clip={motion[art.src]} play={hot === preset.id} alt={art.alt} className="aspect-[5/2] w-full shrink-0 [&_img]:absolute [&_img]:inset-0 [&_video]:absolute [&_video]:inset-0" />
              <span className="flex w-full flex-1 flex-col border-t border-rule px-4 py-3">
                <span className="block text-[16px] font-semibold">{preset.name}</span>
                <span className="num block text-[12px] text-ink-3">{pct(cabin.o2, 0)} O₂ · {kpa(cabin.p)} · {GRAVITY[cabin.gravity].place}</span>
                <span className="mt-auto inline-flex items-center gap-1 pt-2 text-[13px] font-medium text-accent">Analyze this cabin <ArrowRight size={14} weight="bold" className="transition-transform group-hover:translate-x-0.5" /></span>
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

/** Every test as a dot: the detailed map, built only when the visitor opens it. */
function DotMap({ clusters, environments, names, scenario, onScenario, onSelect }: { clusters: Cluster[]; environments: Environment[]; names: Record<string, string>; scenario: ScenarioState; onScenario: (patch: Partial<ScenarioState>, commit: boolean) => void; onSelect: (cluster: Cluster) => void }) {
  const [wide, setWide] = useState(false);
  // One mark per experiment and condition, whatever was burned there.
  const merged = useMemo(() => {
    const groups = new Map<string, Cluster>();
    for (const c of clusters) {
      const key = [c.acc, c.o2, c.p, c.phase, c.stream, c.assumed, c.kind].join("|");
      const seen = groups.get(key);
      if (seen) seen.n += c.n;
      else groups.set(key, { ...c });
    }
    return [...groups.values()];
  }, [clusters]);
  return (
    <>
      <EvidenceMap clusters={merged} environments={environments} names={names} scenario={scenario} onScenario={onScenario} highlight={null} onSelect={onSelect} full={wide || scenario.o2 > 0.46} onFull={setWide} />
    </>
  );
}

export function Workbench({ clusters, facts, cards, environments, presets, coverage, briefings, pairs, fuels, flows, flowTests, motion }: Props) {
  const router = useRouter();
  const names = useMemo(() => Object.fromEntries(facts.map((f) => [f.accession, f.short])), [facts]);
  const levels = useMemo(() => Object.fromEntries(facts.map((f) => [f.accession, f.relevanceLevel])), [facts]);
  const ctx = useMemo<Context>(() => ({ clusters, facts, environments, presets, briefings, fuels, flows, flowTests, names }), [clusters, facts, environments, presets, briefings, fuels, flows, flowTests, names]);
  const cabins = useMemo<DockCabin[]>(
    () =>
      presets.map((preset) => {
        const cabin = fromPreset(preset, environments);
        return { id: preset.id, name: preset.name, label: `the ${preset.name.toLowerCase()} (${pct(cabin.o2)} oxygen at ${kpa(cabin.p)})`, query: toQuery(cabin) };
      }),
    [presets, environments],
  );

  // The cabin starts from the link the visitor came by (so a shared URL restores it), then follows the visitor.
  const search = useArrivalSearch();
  const linked = useMemo(
    () => clampScenario({ ...fromPreset(presets[0], environments), ...fromQuery(new URLSearchParams(search)) }),
    [search, presets, environments],
  );
  const [chosen, setChosen] = useState<ScenarioState | null>(null);
  /** What the left column shows: the cabin as the visitor has set it. */
  const draft = chosen ?? linked;
  /**
   * Each analysis is a block: a cabin, and the questions asked about it. The dashboard opens on
   * a start screen with no block, unless the link the visitor came by already names a cabin,
   * which is then the first block.
   */
  const arrived = useMemo(() => fromQuery(new URLSearchParams(search)) !== null, [search]);
  const [added, setAdded] = useState<Block[]>([]);
  const [cleared, setCleared] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const blocks = useMemo<Block[]>(() => (arrived && !cleared ? [{ id: 0, scenario: linked }, ...added] : added), [arrived, cleared, linked, added]);
  const active = blocks.find((block) => block.id === activeId) ?? blocks[blocks.length - 1] ?? null;
  const started = active !== null;
  /** The cabin whose results are on screen: that of the open block. */
  const shown = active?.scenario ?? draft;
  const stale = started && toQuery(shown) !== toQuery(draft);
  const [view, setView] = useState<View>("oxygen");
  const [selection, setSelection] = useState<Opened | null>(null);
  const close = useCallback(() => setSelection(null), []);
  useEffect(() => stopRun, []);

  function update(patch: Partial<ScenarioState>) {
    // The results on screen stay those of the open block until the visitor asks for a new analysis.
    stopRun();
    setChosen(clampScenario({ ...draft, ...patch }));
  }

  /** Makes a new block for a cabin and opens it. `shows` is false when it should simply be there, without the SI showing its work. */
  function analyze(target: ScenarioState, shows = true) {
    const again = active !== null && toQuery(active.scenario) === toQuery(target);
    if (!again) {
      const id = Math.max(0, ...blocks.map((block) => block.id)) + 1;
      setAdded((list) => [...list, { id, scenario: target }]);
      setActiveId(id);
    }
    if (shows) startRun(analyse(target, ctx).plan.total);
    setChosen(target);
    // The address names the analyzed cabin, so the link can be shared.
    window.history.replaceState(null, "", `?${toQuery(target)}`);
  }

  function run(target: ScenarioState = draft) {
    analyze(target);
    // On a narrow screen the SI is not beside the button, so it is brought into view.
    if (window.innerWidth < 1024) document.getElementById("si")?.scrollIntoView({ block: "start", behavior: "smooth" });
  }

  /** Goes back to an earlier block: its results return to the screen, and questions are about it again. */
  function open(id: number) {
    const block = blocks.find((x) => x.id === id);
    if (!block) return;
    stopRun();
    setActiveId(id);
    setChosen(block.scenario);
    window.history.replaceState(null, "", `?${toQuery(block.scenario)}`);
  }

  function startOver() {
    stopRun();
    setChosen(null);
    setAdded([]);
    setCleared(true);
    setActiveId(null);
    chat.clear();
    window.history.replaceState(null, "", window.location.pathname);
  }

  // A request typed to the SI: a cabin is analysed here, anything else is a page to open.
  function onAction(action: Action) {
    const url = new URL(action.href, window.location.origin);
    const patch = url.pathname === "/explore" && !url.searchParams.has("tour") ? fromQuery(url.searchParams) : null;
    if (patch) run(clampScenario({ ...draft, material: null, ...patch }));
    else if (url.pathname === "/explore") window.location.assign(action.href);
    else router.push(action.href);
  }
  // A question belongs to the open block, and the SI is told that block's cabin.
  const chat = useSiChat({ names, cabins, onAction, scope: active ? { block: active.id, cabin: cabinOf(active.scenario) } : null });
  // A question carried in the link (from the home page) is asked as soon as the dashboard opens.
  const asked = useRef(false);
  useEffect(() => {
    if (asked.current) return;
    asked.current = true;
    const question = new URLSearchParams(window.location.search).get("ask");
    if (question) chat.send(question);
  }, [chat]);

  const analysis = useMemo(() => analyse(shown, ctx), [shown, ctx]);
  const gravity = useMemo(() => gravitySummary(pairs, shown.gravity), [pairs, shown.gravity]);
  // Every block in a line or two, for the list in the SI panel.
  const summaries = useMemo(
    () =>
      blocks.map((block, i) => {
        const a = block.id === active?.id ? analysis : analyse(block.scenario, ctx);
        return { id: block.id, number: i + 1, line: a.line, finding: a.words.verdict };
      }),
    [blocks, active?.id, analysis, ctx],
  );
  const number = summaries.find((x) => x.id === active?.id)?.number ?? 1;
  /** The open block as plain data: what its export buttons write, and the shape an SI model reads. */
  const record = () =>
    blockRecord({
      number,
      cabin: { name: analysis.cabinName, oxygen_percent: Number((shown.o2 * 100).toFixed(1)), pressure_kpa: Number(shown.p.toFixed(1)), place: GRAVITY[shown.gravity].place, gravity: GRAVITY[shown.gravity].g, what_might_burn: analysis.burns },
      steps: analysis.funnel.steps,
      stopAt: analysis.funnel.stop ? analysis.funnel.steps.indexOf(analysis.funnel.stop) : -1,
      finding: analysis.words.verdict,
      next: analysis.words.next,
      meaning: analysis.briefing ? analysis.meaning : null,
      views: analysis.tabs,
      ranked: analysis.ranked.map((r) => ({ accession: r.accession, short: r.short, total: r.total, why: reason(r, levels[r.accession]) })),
      gravity,
      questions: chat.turns.filter((turn) => turn.block === active?.id && !turn.action).map((turn) => ({ question: turn.text, answer: turn.result ? answerText(turn.result) : null })),
      names,
    });
  const material = analysis.material;
  // For the air-speed view: the solid tests in view, counted.
  const solidFlow = useMemo(() => {
    const mine = flows.totals.filter((t) => t.phase === "solid" && (!material || material.match.includes(t.fuel ?? "")));
    const byExperiment = new Map<string, { all: number; listed: number }>();
    for (const t of mine) {
      const e = byExperiment.get(t.acc) ?? { all: 0, listed: 0 };
      e.all += t.all;
      e.listed += t.listed;
      byExperiment.set(t.acc, e);
    }
    const oxygen = clusters.filter((c) => c.phase === "solid" && !c.stream && (!material || material.match.includes(c.fuel ?? ""))).map((c) => c.o2);
    return {
      all: mine.reduce((sum, t) => sum + t.all, 0),
      listed: mine.reduce((sum, t) => sum + t.listed, 0),
      silent: [...byExperiment.entries()].filter(([, e]) => e.listed === 0).sort((a, b) => b[1].all - a[1].all).map(([acc, e]) => ({ name: names[acc] ?? acc, n: e.all })),
      top: oxygen.length ? Math.max(...oxygen) : null,
    };
  }, [flows, clusters, material, names]);

  const fuelCount = (test: (f: FuelRow) => boolean) => fuels.filter(test).reduce((sum, f) => sum + f.n, 0);
  const draftPreset = matchPreset(draft, presets, environments);
  const art = draftPreset ? CABIN_ART[draftPreset] : undefined;
  const common = { cabin: shown, material, names, onOpen: setSelection };
  const fade = `transition-[opacity,filter] duration-300 ${stale ? "opacity-50 saturate-50" : ""}`;

  return (
    <div className="-mt-4">
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-2">
        <h1 className="text-[22px] font-semibold leading-tight tracking-[-0.015em]">What does NASA know about fire in this cabin?</h1>
      </div>

      {/* On a wide screen the workspace fills the window and each column scrolls on its own, so nothing trails the page. */}
      <div className="mt-3 grid gap-4 lg:grid-cols-[minmax(0,1fr)_336px] lg:grid-rows-[auto_1fr] lg:[grid-template-areas:'controls_si'_'views_si'] xl:h-[calc(100dvh-141px)] xl:min-h-[520px] xl:grid-cols-[236px_minmax(0,1fr)_324px] xl:grid-rows-1 xl:[grid-template-areas:'controls_views_si'] 2xl:grid-cols-[264px_minmax(0,1fr)_352px]">
        {/* The cabin */}
        <section aria-label="Your cabin" data-tour="scenario" className="panel min-w-0 self-start lg:[grid-area:controls] xl:flex xl:max-h-full xl:flex-col">
          <div className="px-3 py-3 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
            <div className="grid gap-x-5 gap-y-3.5 sm:grid-cols-[15rem_minmax(0,1fr)] xl:grid-cols-1">
              <div>
                <p className="label">Cabin</p>
                <div className="mt-1.5 overflow-hidden rounded-sm border border-rule">
                  {art ? (
                    <Art key={art.src} src={art.src} clip={motion[art.src]} play alt={art.alt} className="aspect-[2/1] w-full xl:aspect-[5/2]" />
                  ) : (
                    <p className="flex aspect-[2/1] flex-col items-center justify-center gap-1 bg-wash text-center xl:aspect-[5/2]">
                      <span className="text-[13px] font-semibold">Your own cabin</span>
                      <span className="num text-[12px] text-ink-2">{pct(draft.o2)} O₂ · {kpa(draft.p)}</span>
                    </p>
                  )}
                </div>
                <div className="mt-1.5 grid gap-1" role="group" aria-label="Cabin">
                  {presets.map((preset) => {
                    const cabin = fromPreset(preset, environments);
                    return (
                      <button key={preset.id} type="button" title={preset.summary} aria-pressed={draftPreset === preset.id} onClick={() => update({ o2: cabin.o2, p: cabin.p, gravity: cabin.gravity })} className="btn w-full min-w-0 justify-between gap-2">
                        <span className="min-w-0 truncate">{preset.name}</span>
                        <span className="num shrink-0 text-[11px] font-normal opacity-70">{pct(cabin.o2, 0)} O₂<span className="sm:hidden"> · {kpa(cabin.p)}</span></span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <p className="label mb-1.5">What might burn in it</p>
                  <div className="flex flex-wrap gap-1.5 xl:grid xl:grid-cols-2">
                    {MATERIALS.map((m) => (
                      <button key={m.id} type="button" className="btn h-auto min-h-8 justify-between gap-1.5 py-1 text-left leading-tight xl:whitespace-normal xl:px-2" title={`${m.note}: ${int(fuelCount((f) => m.match.includes(f.fuel ?? "")))} tests`} aria-pressed={draft.material === m.id} onClick={() => update({ material: m.id, focus: "solid" })}>
                        {m.label} <span className="num text-[11px] font-normal opacity-60 xl:hidden">{int(fuelCount((f) => m.match.includes(f.fuel ?? "")))}</span>
                      </button>
                    ))}
                    {FOCI.map((f) => (
                      <button key={f.id} type="button" className="btn gap-1.5 xl:px-2" aria-pressed={!draft.material && draft.focus === f.id} onClick={() => update({ material: null, focus: f.id })}>
                        {f.id !== "any" && <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: PHASE_VAR[f.id] }} />}
                        {f.id === "any" ? "Anything" : `Any ${f.id}`}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="label mb-1.5">Where the cabin is</p>
                  <div className="grid max-w-[22rem] grid-cols-3 gap-1.5">
                    {(Object.keys(GRAVITY) as Gravity[]).map((g) => (
                      <button key={g} type="button" title={GRAVITY[g].label} className="btn h-auto flex-col items-start gap-0 px-2 py-1" aria-pressed={draft.gravity === g} onClick={() => update({ gravity: g })}>
                        <span>{PLACE_SHORT[g]}</span>
                        <span className="text-[11px] font-normal opacity-70">{GRAVITY[g].g}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <details open={!draftPreset}>
                  <summary className="link inline cursor-pointer text-[12.5px] text-ink-2">Set your own oxygen and pressure</summary>
                  <div className="mt-2.5 grid max-w-[22rem] grid-cols-2 gap-x-3 gap-y-3">
                    <label className="block">
                      <span className="label mb-1 block">Oxygen, %</span>
                      <input className="field num w-full" type="number" min={10} max={100} step={0.5} value={Number((draft.o2 * 100).toFixed(1))} onChange={(e) => e.target.value !== "" && update({ o2: Number(e.target.value) / 100 })} />
                    </label>
                    <label className="block">
                      <span className="label mb-1 block">Pressure, kPa</span>
                      <input className="field num w-full" type="number" min={25} max={550} step={0.5} value={Number(draft.p.toFixed(1))} onChange={(e) => e.target.value !== "" && update({ p: Number(e.target.value) })} />
                      <span className="num mt-0.5 block text-[11px] text-ink-3">{psia(draft.p)}</span>
                    </label>
                    <label className="col-span-2 block">
                      <span className="label mb-1 block">Safety job that matters most</span>
                      <select className="field w-full pr-7" value={draft.priority} onChange={(e) => update({ priority: e.target.value as Priority })}>
                        {PRIORITIES.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                      </select>
                    </label>
                  </div>
                </details>
              </div>
            </div>
          </div>
          <div className="border-t border-rule px-3 py-2.5">
            <AnalyzeButton stale={stale || !started} onRun={() => run()} />
            <p className="text-[11.5px] leading-snug text-caution" role="status">{stale && <span className="mt-1.5 block">You changed the cabin. The results still show the last analysis.</span>}</p>
          </div>
        </section>

        {/* The SI */}
        <div id="si" className="min-w-0 scroll-mt-[68px] self-start lg:sticky lg:top-[68px] lg:h-[calc(100dvh-141px)] lg:[grid-area:si] xl:static xl:h-full">
            <SiPanel
              blocks={summaries}
              activeId={active?.id ?? null}
              onOpen={open}
              cabin={active ? cabinOf(active.scenario) : null}
              record={record}
              stale={stale}
              funnel={analysis.funnel}
              words={analysis.words}
              plan={analysis.plan}
              meaning={analysis.meaning}
              briefing={analysis.briefing}
              showCaution={shown.gravity !== "mars"}
              names={names}
              chat={chat}
              question={started ? analysis.question : ""}
              suggestions={[`Has anything been tested at ${pct(shown.o2, 0)} oxygen?`, "Which experiments burned fabric, and at what airflow?", "Show me the pressurized rover for fabric"]}
              labHref={labHref(shown.o2, shown.p)}
            />
        </div>

        {/* NASA's tests, one view at a time. Its heading and tabs stay put; what is under them scrolls. */}
        <div className={`min-w-0 lg:[grid-area:views] xl:flex xl:h-full xl:min-h-0 xl:flex-col ${started ? "" : "max-lg:order-first"}`}>
          {started && (
            <>
              <p className={`mb-2 flex min-h-8 flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-sm border px-3 py-1 text-[12.5px] xl:shrink-0 ${stale ? "border-caution/30 bg-caution-wash text-caution" : "border-rule bg-surface text-ink-2"}`} role="status">
                <span>{stale ? "You changed the cabin. These results are still for" : "Results for"} <span className="font-medium">{analysis.line}</span></span>
                {stale ? (
                  <button type="button" className="link font-medium text-caution" onClick={() => run()}>Analyze the new cabin</button>
                ) : (
                  <button type="button" className="link text-ink-3" onClick={startOver}>Start over</button>
                )}
              </p>
              <div className={`mb-2 xl:shrink-0 ${fade}`}>
                <Tabs tabs={analysis.tabs} tabAt={analysis.plan.tabAt} view={view} onView={setView} />
              </div>
            </>
          )}
          <div className="xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
            {started ? (
              <div role="tabpanel" id="view-panel" aria-labelledby={`tab-${view}`} className={`panel relative px-4 py-4 sm:px-5 ${fade}`}>
                <RunVeil until={analysis.plan.verdict.start} />
                {view === "oxygen" && <OxygenView {...common} clusters={clusters} streamRows={coverage.stream} />}
                {view === "air" && <AirView {...common} tests={flowTests} flows={flows} counts={solidFlow} />}
                {view === "pressure" && (
                  <PressureView
                    {...common}
                    clusters={clusters}
                    presets={presets}
                    environments={environments}
                    close={analysis.close}
                    map={<DotMap clusters={clusters} environments={environments} names={names} scenario={draft} onScenario={(patch) => update(patch)} onSelect={setSelection} />}
                  />
                )}
                {view === "gravity" && <GravityView summary={gravity} />}
                {view === "experiments" && <ExperimentsView ranked={analysis.ranked} cards={cards} levels={levels} query={toQuery(shown)} onAsk={chat.send} />}
              </div>
            ) : (
              <Start presets={presets} environments={environments} motion={motion} onPick={(cabin) => run(clampScenario({ ...draft, o2: cabin.o2, p: cabin.p, gravity: cabin.gravity }))} />
            )}

          {/* The record of a test opens here, under the view it was picked from. */}
          <Inspector inline className="mt-3" selection={selection} name={selection ? names[selection.acc] : ""} onClose={close} />

          {/* Limits */}
          <details className="mt-4 max-w-[80ch]">
            <summary className="link inline cursor-pointer text-[13px] text-ink-2">Before you rely on this</summary>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-2">
              Oxygen and pressure are two of the conditions that decide how something burns. Airflow, material and shape matter too, and a test that is close on this page can still differ in all of them. Open a test to read its full record.
            </p>
            <details className="mt-2.5 text-[13px]">
              <summary className="link inline cursor-pointer">Where the {int(coverage.records)} rows come from, and which are not counted</summary>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2">
                <dt className="num text-right">{int(coverage.records)}</dt>
                <dd className="text-ink-2">rows read from {coverage.tables} PSI experimental tables, across {coverage.investigations} investigations. <Link className="link" href="/data">Open the data</Link></dd>
                <dt className="num text-right">{int(coverage.onMap)}</dt>
                <dd className="text-ink-2">have oxygen and pressure for the surrounding atmosphere</dd>
                <dt className="num text-right">{int(coverage.stream)}</dt>
                <dd className="text-ink-2">are inverse flames, where the oxygen value is the stream fed through the burner. They are never counted as close to a cabin</dd>
                <dt className="num text-right">{int(coverage.oxygenOnly)}</dt>
                <dd className="text-ink-2">report oxygen but not pressure</dd>
                <dt className="num text-right">{int(coverage.noOxygen)}</dt>
                <dd className="text-ink-2">have no oxygen value in their PSI table, so they cannot be placed. Missing means not reported. It does not mean zero.</dd>
              </dl>
              <ul className="mt-4 space-y-2.5">
                {coverage.absent.map((a) => (
                  <li key={a.accession}>
                    <Link className="link font-medium" href={`/investigations/${a.accession}`}>{a.short}</Link>
                    <span className="num text-ink-3"> {int(a.records)} rows</span>
                    {a.note && <span className="block text-ink-2">{a.note}</span>}
                  </li>
                ))}
                <li className="text-ink-2">{coverage.noTable.map((n) => n.short).join(", ")} are modelling and re-analysis studies with no itemized table in PSI.</li>
              </ul>
            </details>
            <p className="mt-2.5 text-[13px]">The drawings of the cabins are SI-generated concept illustrations, not NASA images. <Link className="link" href="/methods">Methods and limits</Link></p>
          </details>
          </div>
        </div>
      </div>

      <Tour
        steps={TOUR}
        onStep={(step) => {
          // From the third step on, the tour points at results, so they are shown for the cabin on the left.
          if (!BEFORE_RESULTS.has(step.target) && !started) analyze(draft, false);
          if (step.view) setView(step.view as View);
        }}
      />
    </div>
  );
}
