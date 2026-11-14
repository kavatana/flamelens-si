import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";
import { RangeBar, SCALES } from "@/components/range-bar";
import { SafetyStages, type Stage } from "@/components/safety-stages";
import { getDroplets, getInvestigations, getReference, type Investigation } from "@/lib/data";
import { int, pct } from "@flamelens/shared/format";
import { sourceLabel } from "@/lib/labels";
import { EXPERIMENT_PHOTO } from "@/lib/media";

export const metadata: Metadata = { title: "Safety" };

type Job = "prevention" | "detection" | "suppression";

const JOBS: { id: Job; when: string; label: string; plain: string; becomes: string; nasa: string; question: string }[] = [
  {
    id: "prevention",
    when: "Before a fire",
    question: "Is a lunar habitat safe from fire?",
    label: "Prevention",
    plain: "Stop a fire before it starts, by choosing materials that are hard to light in the air the crew will breathe.",
    becomes: "Rules for which fabrics, plastics and foams may fly, and how much oxygen a cabin can hold.",
    nasa: "Prevention is achieved by controlling ignition sources and through material selection, which depends on understanding flammability limits.",
  },
  {
    id: "detection",
    when: "Its first seconds",
    question: "What does smoke look like to a detector in space?",
    label: "Detection",
    plain: "Notice a fire in its first moments. Smoke does not rise in orbit, so it does not find a detector the way it does on Earth.",
    becomes: "Smoke detectors tuned to the particles that weightless smoke really makes.",
    nasa: "Fire detection was tested in microgravity through the Smoke and Aerosol Measurement Experiment studies (SAME and SAME-R).",
  },
  {
    id: "suppression",
    when: "While it burns",
    question: "What happens to a flame when the airflow stops?",
    label: "Suppression",
    plain: "Put the fire out, and be sure it stays out, in a sealed cabin where the crew breathes whatever the extinguisher releases.",
    becomes: "Extinguishers, and how much of a gas it takes before a flame can no longer survive.",
    nasa: "Suppression was studied in the Flame Extinguishment Experiment (FLEX) through dilution of the chamber atmosphere with carbon dioxide and helium, both of which suppress fire.",
  },
];

/** NASA's photograph for each job: the experiment that did most of its work. */
const JOB_PHOTO: Record<Job, string> = { prevention: "PSI-25", detection: "PSI-101", suppression: "PSI-69" };

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

function Bar({ label, value, max, text, color = "var(--color-ink)" }: { label: string; value: number; max: number; text: string; color?: string }) {
  return (
    <div className="grid grid-cols-[6.8rem_1fr_2.8rem] items-center gap-2 text-[12.5px]">
      <span className="truncate">{label}</span>
      <span className="h-2.5 rounded-full bg-wash"><span className="block h-full rounded-full" style={{ width: `${Math.min(100, (100 * value) / max)}%`, background: color }} /></span>
      <span className="num text-right">{text}</span>
    </div>
  );
}

function Dots({ score }: { score: number }) {
  return (
    <span className="flex gap-[3px]" aria-label={`${score} of 3`}>
      {[1, 2, 3].map((i) => <span key={i} className={`inline-block size-[7px] rounded-full ${i <= score ? "bg-ink" : "border border-rule-2"}`} />)}
    </span>
  );
}

/**
 * The three Earth uses NASA lists among the resources for this challenge. Wording follows
 * NASA's Spinoff pages; none of the three came from the experiments in the archive.
 */
const SPINOFFS = [
  { year: "1976", name: "Lighter air tanks for firefighters", text: "Built with NASA's Johnson Space Center from spacesuit technology. A 30-minute air supply at 20 pounds, 13 pounds less than the tanks before it.", url: "https://spinoff.nasa.gov/node/9582" },
  { year: "1978", name: "A fire detector that ignores dust", text: "Made for the space shuttle. It tells particles from a fire apart from dust, so it raises fewer false alarms, with uses in places such as mines.", url: "https://spinoff.nasa.gov/node/9407" },
  { year: "1982", name: "Safer clothing for firefighters", text: "A NASA and U.S. Fire Administration project put light, fire-resistant materials first made for astronauts' suits into firefighters' gear.", url: "https://spinoff.nasa.gov/node/9918" },
];

export default async function Page() {
  const [investigations, droplets, reference] = await Promise.all([getInvestigations(), getDroplets(), getReference()]);
  const byAcc = Object.fromEntries(investigations.map((i) => [i.accession, i]));
  const informs = (job: Job) => investigations.filter((i) => i.pillars[job].score >= 2).sort((a, b) => b.pillars[job].score - a.pillars[job].score || b.stats.records - a.stats.records);

  // Prevention: how much oxygen the solid-material studies reached.
  const solids = ["PSI-25", "PSI-26", "PSI-98", "PSI-99", "PSI-100", "PSI-20"].map((acc) => byAcc[acc]).filter(Boolean) as Investigation[];

  // Detection: what SAME-R made smoke from.
  const smoke = byAcc["PSI-101"];
  const smokeTop = Math.max(...(smoke?.stats.fuels.map((f) => f.records) ?? [1]));

  // Suppression: how fast a droplet burned, by what was added to the air around it.
  const rateOf = (rows: typeof droplets) => rows.flatMap((d) => (d.k === null ? [] : [d.k]));
  const suppression = [
    { label: "Nothing added", rows: droplets.filter((d) => d.co2 === 0 && d.he === 0) },
    { label: "30% CO₂ or more", rows: droplets.filter((d) => d.co2 >= 0.3) },
    { label: "Helium", rows: droplets.filter((d) => d.he > 0) },
  ].map((g) => ({ label: g.label, k: mean(rateOf(g.rows)), n: rateOf(g.rows).length }));
  const [none, co2, he] = suppression.map((g) => g.k ?? 0);
  const ended = ["extinction", "disruption", "burned to completion"].map((end) => droplets.filter((d) => d.end === end).length);

  const chart: Record<Job, React.ReactNode> = {
    prevention: (
      <>
        <p className="text-[13px] font-medium">How much oxygen the material studies reached</p>
        <ul className="mt-3 space-y-3">
          {solids.map((inv) => (
            <li key={inv.accession} className="grid grid-cols-[5.4rem_1fr] items-start gap-2 text-[12.5px]">
              <Link className="link truncate" href={`/investigations/${inv.accession}`}>{inv.short}</Link>
              {inv.stats.o2_ambient ? (
                <RangeBar scale={SCALES.o2} range={inv.stats.o2_ambient} color={inv.accession === "PSI-20" ? "#2a78d6" : "#eb6834"} showMarks={false} />
              ) : (
                <span className="text-ink-3">no oxygen value in its PSI table</span>
              )}
            </li>
          ))}
        </ul>
        <div className="mt-1 grid grid-cols-[5.4rem_1fr] gap-2"><span /><RangeBar scale={SCALES.o2} range={null} /></div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">
          Every test on a real fabric or plastic stopped near normal air. Only <Link className="link" href="/investigations/PSI-20">BRE</Link>, a gas burner built to imitate a solid (blue), reached the oxygen planned for the Moon.
        </p>
      </>
    ),
    detection: smoke ? (
      <>
        <p className="text-[13px] font-medium">What NASA made smoke from, in {int(smoke.stats.records)} tests</p>
        <div className="mt-3 space-y-2">
          {smoke.stats.fuels.map((f) => <Bar key={f.name} label={f.name} value={f.records} max={smokeTop} text={String(f.records)} />)}
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-2">
          <Link className="link" href="/investigations/PSI-101">SAME-R</Link> heated these common cabin materials until they smoked, with and without airflow, and measured the particles. Its PSI table gives no oxygen or pressure, so these tests cannot be matched to a particular cabin.
        </p>
      </>
    ) : null,
    suppression: (
      <>
        <p className="text-[13px] font-medium">How fast a fuel droplet burned, by what was added to the air</p>
        <div className="mt-3 space-y-2">
          {suppression.map((g) => <Bar key={g.label} label={g.label} value={g.k ?? 0} max={0.8} text={g.k === null ? "–" : g.k.toFixed(2)} color="#2a78d6" />)}
        </div>
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-2">
          {co2 < none && he > none && <>Carbon dioxide slowed the burning. Helium, which also puts flames out, made the droplet burn faster while it lasted. </>}
          Burn rate in mm² per second, averaged over <Link className="link" href="/investigations/PSI-69">FLEX</Link> tests ({suppression.map((g) => int(g.n)).join(", ")} in each group); the groups also differ in oxygen and droplet size. In {int(ended[0])} of {int(droplets.length)} tests the flame went out before the fuel was gone.
        </p>
        <Link href="/lab" className="btn mt-3">Try it in the Flame Lab <ArrowRight size={14} /></Link>
      </>
    ),
  };

  // The one number to remember for each job, each counted from the tables.
  const richest = Math.max(...solids.filter((i) => i.accession !== "PSI-20").map((i) => i.stats.o2_ambient?.max ?? 0));
  const figure: Record<Job, { value: string; note: string }> = {
    prevention: { value: pct(richest), note: "The most oxygen any real fabric or plastic was burned in. A Moon habitat plans 34%." },
    detection: { value: int(smoke?.stats.records ?? 0), note: `Smoke tests on ${smoke?.stats.fuels.length ?? 0} cabin materials, with and without airflow.` },
    suppression: { value: `${Math.round((100 * ended[0]) / Math.max(1, droplets.length))}%`, note: `of ${int(droplets.length)} fuel droplets went out by themselves, with fuel still left.` },
  };

  const stages: Stage[] = JOBS.map((job) => {
    const list = informs(job.id);
    const earth = list.find((i) => i.earth && i.pillars[job.id].score === 3) ?? list.find((i) => i.earth);
    return {
      id: job.id,
      photo: EXPERIMENT_PHOTO[JOB_PHOTO[job.id]],
      when: job.when,
      label: job.label,
      plain: job.plain,
      figure: figure[job.id].value,
      figureNote: figure[job.id].note,
      chart: chart[job.id],
      becomes: job.becomes,
      nasa: job.nasa,
      question: job.question,
      earth: earth?.earth ? (
        <div className="rounded-sm bg-wash px-4 py-3">
          <p className="text-[12.5px] font-medium text-ink-2">And on Earth</p>
          <p className="mt-1 text-[13.5px] leading-relaxed">{earth.earth.text}</p>
          <p className="mt-1.5 text-[12px] text-ink-3">{sourceLabel(earth.earth.source)}, <Link className="link" href={`/investigations/${earth.accession}`}>{earth.short}</Link></p>
        </div>
      ) : null,
      experiments: (
        <ul className="flex flex-wrap gap-1.5">
          {list.map((inv) => (
            <li key={inv.accession}>
              <Link href={`/investigations/${inv.accession}`} className="btn gap-2" title={inv.pillars[job.id].quote || inv.oneLine}>
                {inv.short} <Dots score={inv.pillars[job.id].score} />
              </Link>
            </li>
          ))}
        </ul>
      ),
    };
  });

  const themes = reference.earth_themes
    .map((theme) => ({ theme, members: investigations.filter((i) => i.earth?.theme === theme.id).sort((a, b) => b.relevanceLevel - a.relevanceLevel) }))
    .filter((t) => t.members.length > 0);

  return (
    <div>
      <h1 className="text-[30px] font-semibold leading-[1.12] tracking-[-0.02em]">A fire in space, in three moments</h1>

      <div className="mt-5">
        <SafetyStages stages={stages} />
      </div>
      <p className="mt-3 text-[12px] text-ink-3">Three dots mean NASA&apos;s own record names the experiment for that job; two mean it supports it.</p>

      <section id="earth" aria-labelledby="earth-title" className="mt-16 scroll-mt-20">
        <div className="max-w-[64ch]">
          <h2 id="earth-title" className="text-[24px] font-semibold tracking-[-0.015em]">What works in space works on Earth</h2>
        </div>
        <ol className="mt-7 grid gap-y-6 sm:grid-cols-3" aria-label="NASA fire technology already used on Earth">
          {SPINOFFS.map((s) => (
            <li key={s.url} className="relative border-t border-ink pr-6 pt-3.5">
              <span className="absolute -top-[5px] left-0 size-[9px] rounded-full bg-ink" aria-hidden />
              <p className="num text-[12.5px] text-ink-3">{s.year}</p>
              <p className="mt-0.5 text-[16px] font-semibold tracking-[-0.01em]">{s.name}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{s.text}</p>
              <a className="link mt-1.5 inline-block text-[12.5px]" href={s.url} target="_blank" rel="noreferrer">NASA Spinoff</a>
            </li>
          ))}
        </ol>
        <p className="mt-4 max-w-[70ch] text-[12.5px] leading-relaxed text-ink-3">
          NASA lists these three as examples for this challenge. They came from spacesuit and shuttle engineering, not from the experiments in this archive. What the experiments themselves offer on Earth is below.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {themes.map(({ theme, members }) => (
            <div key={theme.id} className="panel flex flex-col px-5 py-4">
              <p className="flex items-baseline justify-between gap-3">
                <span className="text-[17px] font-semibold tracking-[-0.01em]">{theme.name}</span>
                <span className="num text-[12.5px] text-ink-3">{members.length} experiments</span>
              </p>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{theme.text}</p>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {members.map((inv) => (
                  <li key={inv.accession}><Link href={`/investigations/${inv.accession}`} className="btn" title={inv.earth!.text}>{inv.short}</Link></li>
                ))}
              </ul>
              <details className="mt-auto pt-3 text-[12.5px]">
                <summary className="link inline cursor-pointer text-ink-2">NASA&apos;s words</summary>
                <ul className="mt-2 space-y-2">
                  {members.map((inv) => (
                    <li key={inv.accession}>
                      <span className="font-medium">{inv.short}.</span> {inv.earth!.text}
                      <span className="quote mt-1 block">&ldquo;{inv.earth!.quote}&rdquo;</span>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
