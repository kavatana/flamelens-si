import { MATERIALS, type Gravity } from "@flamelens/shared/materials";
import { DEFAULT_WEIGHTS, type Focus, type PillarName, type Scenario } from "@flamelens/shared/scoring";
import type { Environment, Priority, ScenarioPreset } from "@flamelens/shared/types";

/** What the user controls. Kept small so it fits in a shareable URL. */
export type ScenarioState = {
  o2: number;
  p: number;
  focus: Focus;
  priority: Priority;
  /** A specific solid material, or null for the whole fuel type in `focus`. */
  material: string | null;
  /** Where the cabin is, which sets its gravity. */
  gravity: Gravity;
};

const GRAVITIES: Gravity[] = ["orbit", "moon", "mars"];
/** The space station is in orbit; NASA's other named cabins are for the lunar surface. */
const gravityOf = (presetId: string): Gravity => (presetId === "station" ? "orbit" : "moon");

export const O2_RANGE: [number, number] = [0.1, 1];
export const P_RANGE: [number, number] = [25, 550];

const FOCI: Focus[] = ["solid", "liquid", "gas", "any"];
const PRIORITIES: Priority[] = ["balanced", "prevention", "detection", "suppression"];

const clamp = (x: number, [lo, hi]: [number, number]) => Math.min(hi, Math.max(lo, x));

export function pillarWeights(priority: Priority): Record<PillarName, number> {
  if (priority === "balanced") return { prevention: 1, detection: 1, suppression: 1 };
  const w = { prevention: 0.35, detection: 0.35, suppression: 0.35 };
  w[priority] = 1;
  return w;
}

export function toScenario(state: ScenarioState): Scenario {
  return { o2: state.o2, p: state.p, focus: state.focus, pillars: pillarWeights(state.priority), weights: DEFAULT_WEIGHTS };
}

export function fromPreset(preset: ScenarioPreset, environments: Environment[]): ScenarioState {
  const env = environments.find((e) => e.id === preset.environment)!;
  return { o2: env.o2_fraction!, p: env.pressure_kpa!, focus: preset.fuel_focus, priority: preset.priority, material: null, gravity: gravityOf(preset.id) };
}

export function matchPreset(state: ScenarioState, presets: ScenarioPreset[], environments: Environment[]): string | null {
  for (const preset of presets) {
    const s = fromPreset(preset, environments);
    // A cabin is its air. What might burn in it, and which safety job matters most, are the visitor's to change.
    if (Math.abs(s.o2 - state.o2) < 5e-4 && Math.abs(s.p - state.p) < 0.06) return preset.id;
  }
  return null;
}

export function toQuery(state: ScenarioState): string {
  const q = new URLSearchParams({
    o2: (state.o2 * 100).toFixed(1).replace(/\.0$/, ""),
    p: state.p.toFixed(1).replace(/\.0$/, ""),
    fuel: state.focus,
    pri: state.priority,
    g: state.gravity,
  });
  if (state.material) q.set("mat", state.material);
  return q.toString();
}

export function fromQuery(params: URLSearchParams): Partial<ScenarioState> | null {
  const out: Partial<ScenarioState> = {};
  const o2 = Number(params.get("o2"));
  const p = Number(params.get("p"));
  if (params.has("o2") && Number.isFinite(o2)) out.o2 = clamp(o2 / 100, O2_RANGE);
  if (params.has("p") && Number.isFinite(p)) out.p = clamp(p, P_RANGE);
  const fuel = params.get("fuel") as Focus | null;
  if (fuel && FOCI.includes(fuel)) out.focus = fuel;
  const pri = params.get("pri") as Priority | null;
  if (pri && PRIORITIES.includes(pri)) out.priority = pri;
  const g = params.get("g") as Gravity | null;
  if (g && GRAVITIES.includes(g)) out.gravity = g;
  const mat = params.get("mat");
  if (mat && MATERIALS.some((m) => m.id === mat)) {
    out.material = mat;
    out.focus = "solid";
  }
  return Object.keys(out).length ? out : null;
}

export function clampScenario(state: ScenarioState): ScenarioState {
  return { ...state, o2: clamp(state.o2, O2_RANGE), p: clamp(state.p, P_RANGE) };
}
