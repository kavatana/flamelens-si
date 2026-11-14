import type { FlowCoverage } from "@/lib/data";
import { FLOW_BANDS } from "@flamelens/shared/bands";
import { PHASE_LABEL, PHASE_VAR, int } from "@flamelens/shared/format";
import type { Material } from "@flamelens/shared/materials";
import type { Focus, Phase } from "@flamelens/shared/scoring";

/**
 * How fast the air moved in NASA's tests, counted by fuel type. NASA names airflow beside
 * oxygen as what decides whether something burns in weightlessness. In many solid-fuel tests
 * the crew changed the flow while the sample burned, so one test can sit in several columns.
 */

const PHASES: Phase[] = ["solid", "liquid", "gas"];
const HATCH = "repeating-linear-gradient(135deg, transparent 0 7px, var(--color-rule-2) 7px 8px)";

type Props = {
  flows: FlowCoverage;
  focus: Focus;
  material?: Material | null;
  names: Record<string, string>;
  /** Leave out the heading and NASA's sentence, when the chart above already carries them. */
  bare?: boolean;
};

export function AirflowGrid({ flows, focus, material = null, names, bare = false }: Props) {
  const wanted = (phase: string | null, fuel: string | null): phase is Phase =>
    PHASES.includes(phase as Phase) && !(material && phase === "solid" && !material.match.includes(fuel ?? ""));

  const counts: Record<Phase, number[]> = { solid: FLOW_BANDS.map(() => 0), liquid: FLOW_BANDS.map(() => 0), gas: FLOW_BANDS.map(() => 0) };
  for (const c of flows.cells) if (wanted(c.phase, c.fuel)) counts[c.phase][c.band] += c.n;

  const unlisted: Record<Phase, number> = { solid: 0, liquid: 0, gas: 0 };
  // Per experiment, within what the visitor is looking at: tests in all, and tests with a speed.
  const byExperiment = new Map<string, { all: number; listed: number }>();
  let listed = 0;
  let total = 0;
  for (const t of flows.totals) {
    if (!wanted(t.phase, t.fuel)) continue;
    unlisted[t.phase] += t.all - t.listed;
    if (focus !== "any" && focus !== t.phase) continue;
    listed += t.listed;
    total += t.all;
    const e = byExperiment.get(t.acc) ?? { all: 0, listed: 0 };
    e.all += t.all;
    e.listed += t.listed;
    byExperiment.set(t.acc, e);
  }
  const top = Math.max(1, ...PHASES.flatMap((phase) => counts[phase]));
  const silent = [...byExperiment.entries()].filter(([, e]) => e.listed === 0).sort((a, b) => b[1].all - a[1].all).slice(0, 4);
  const subject = focus === "any" ? "" : focus === "solid" && material ? `${material.label.toLowerCase()} ` : `${PHASE_LABEL[focus].toLowerCase().replace(/s$/, "")}-fuel `;
  const cols = "grid-cols-[4.3rem_repeat(7,minmax(0,1fr))_minmax(0,1.25fr)] sm:grid-cols-[8.5rem_repeat(7,minmax(0,1fr))_minmax(0,1.35fr)]";

  return (
    <div>
      {!bare && (
        <>
          <h3 className="text-[15px] font-semibold">And how fast the air was moving</h3>
        </>
      )}

      <div className="mt-3">
        <div className={`grid ${cols} items-end gap-1 text-center text-[11.5px] leading-tight text-ink-2`}>
          <span className="text-left text-[11.5px] text-ink-3"><span className="sm:hidden">cm/s</span><span className="hidden sm:inline">Air speed, cm/s →</span></span>
          {FLOW_BANDS.map((b) => (
            <span key={b.id} className="pb-1">
              <span className="num block text-[10px] sm:hidden">{b.short}</span>
              <span className="num hidden sm:block">{b.label}</span>
            </span>
          ))}
          <span className="pb-1 text-ink-3"><span className="sm:hidden">none</span><span className="hidden sm:inline">not listed</span></span>
        </div>
        {PHASES.map((phase) => (
          <div key={phase} className={`mt-1 grid ${cols} items-stretch gap-1 ${focus !== "any" && focus !== phase ? "opacity-45" : ""}`}>
            <span className="flex items-center gap-1.5 pr-1 text-[13px] font-medium leading-tight">
              <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: PHASE_VAR[phase] }} />
              {phase === "solid" && material ? material.label : PHASE_LABEL[phase]}
            </span>
            {FLOW_BANDS.map((b, i) => {
              const n = counts[phase][i];
              const strength = n === 0 ? 0 : 14 + 72 * (Math.log(n + 1) / Math.log(top + 1));
              return (
                <span
                  key={b.id}
                  title={`${PHASE_LABEL[phase]}, air at ${b.label}${b.id === "still" ? "" : " cm/s"}: ${int(n)} ${n === 1 ? "test" : "tests"}`}
                  className={`num flex h-[34px] items-center justify-center rounded-xs text-[12px] font-semibold sm:h-[38px] sm:text-[13.5px] ${n === 0 ? "border border-dashed border-rule-2 bg-surface text-ink-3" : ""}`}
                  style={n === 0 ? undefined : { background: `color-mix(in oklab, ${PHASE_VAR[phase]} ${strength.toFixed(0)}%, var(--color-surface))`, color: strength > 52 ? "#fff" : "var(--color-ink)" }}
                >
                  {int(n)}
                </span>
              );
            })}
            <span title={`${PHASE_LABEL[phase]}: ${int(unlisted[phase])} tests with no air speed in NASA's table`} className="flex h-[34px] items-center justify-center rounded-xs border border-dashed border-rule-2 sm:h-[38px]" style={{ backgroundImage: HATCH }}>
              <span className="num rounded-xs bg-surface px-1 text-[12px] font-semibold text-ink-2 sm:text-[13.5px]">{int(unlisted[phase])}</span>
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[13.5px] leading-relaxed">
        <span className="font-semibold">NASA&apos;s tables give an air speed for {int(listed)} of {int(total)} {subject}tests.</span>{" "}
        {silent.length > 0 && (
          <span className="text-ink-2">
            None is given in {silent.map(([acc, e], i) => `${i > 0 ? (i === silent.length - 1 ? " and " : ", ") : ""}${names[acc] ?? acc} (${int(e.all)})`).join("")}.
          </span>
        )}
      </p>
      <details className="mt-2 text-[12px]">
        <summary className="link inline cursor-pointer text-ink-3">How these are counted</summary>
      <p className="mt-1.5 text-[12px] leading-relaxed text-ink-3">
        In many tests the crew changed the air speed while the sample burned, often lowering it until the flame went out. Such a test is counted once at each speed NASA lists for it. A test with no speed listed was not necessarily in still air.
      </p>
      </details>
    </div>
  );
}
