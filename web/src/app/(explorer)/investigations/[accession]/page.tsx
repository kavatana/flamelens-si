import { ArrowRight, ArrowSquareOut, CaretDown, ChartBar, Fire, Planet, SlidersHorizontal } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AskButton } from "@/components/ask-button";
import { RecordTable } from "@/components/record-table";
import { getExplorerRows, getInvestigation, getInvestigations, getQualityFindings, getReference, getVariation, type Variation } from "@/lib/data";
import { PHASE_VAR, bytes, int, kpa, num, pct, span } from "@flamelens/shared/format";
import { PILLARS, RELEVANCE, sourceLabel } from "@/lib/labels";
import { EXPERIMENT_PHOTO } from "@/lib/media";
import { JOBS, LEVEL, STRENGTH, facts, plainName } from "@/lib/plain";
import { RangeBar, SCALES, type Scale } from "@/components/range-bar";

export async function generateStaticParams() {
  const investigations = await getInvestigations();
  return investigations.map((i) => ({ accession: i.accession }));
}

export async function generateMetadata(props: PageProps<"/investigations/[accession]">): Promise<Metadata> {
  const { accession } = await props.params;
  const data = await getInvestigation(accession);
  return { title: data ? data.inv.short : "Investigation" };
}

const CARD = "rounded-sm border border-rule bg-surface shadow-[0_1px_2px_rgba(20,23,26,0.05),0_10px_24px_-18px_rgba(20,23,26,0.35)]";
const FACT_ICON = [Fire, Planet, ChartBar];
/** The Flame Lab bench that plays this experiment's tests, where there is one. */
const LAB_BENCH: Record<string, { href: string; label: string; note: string }> = {
  "PSI-25": { href: "/lab", label: "Watch its tests burn", note: "NASA's own video of each test, in the Flame Lab" },
  "PSI-69": { href: "/lab?bench=droplet", label: "See its droplets burn", note: "Its tests one by one, in the Flame Lab" },
  "PSI-39": { href: "/lab?bench=droplet", label: "Watch its droplets burn", note: "NASA's own video of its tests, in the Flame Lab" },
  "PSI-159": { href: "/lab?bench=gas", label: "Watch its flames", note: "NASA's own video of each test, in the Flame Lab" },
};

function Stat({ label, value, note, scale, range, color }: { label: string; value: string; note?: string; scale?: Scale; range?: { min: number; max: number } | null; color?: string }) {
  return (
    <div className="bg-surface px-4 py-3.5">
      <dt className="text-[12.5px] text-ink-3">{label}</dt>
      <dd className="num mt-0.5 text-[17px] font-medium">{value}</dd>
      {scale && <dd className="mt-2.5"><RangeBar scale={scale} range={range ?? null} color={color} /></dd>}
      {note && <dd className="mt-1 text-[12px] text-ink-3">{note}</dd>}
    </div>
  );
}

function variationValue(v: Variation): string {
  if (v.kind === "number" && v.min !== null && v.max !== null) {
    const fmt = v.unit === "fraction" ? (x: number) => pct(x) : v.unit === "kPa" ? kpa : (x: number) => `${num(x)}${v.unit && v.unit !== "ratio" && v.unit !== "count" ? ` ${v.unit}` : ""}`;
    return span(v.min, v.max, fmt);
  }
  return v.sample ?? "";
}

function Prose({ title, text }: { title: string; text: string }) {
  if (!text) return null;
  return (
    <details className="border-b border-rule py-3">
      <summary className="cursor-pointer text-[14px] font-medium">{title}</summary>
      <p className="mt-2 max-w-[75ch] whitespace-pre-line text-[14px] leading-relaxed text-ink-2">{text}</p>
    </details>
  );
}

export default async function Page(props: PageProps<"/investigations/[accession]">) {
  const { accession } = await props.params;
  const [data, allRows, investigations, findings, reference, variation] = await Promise.all([
    getInvestigation(accession),
    getExplorerRows(),
    getInvestigations(),
    getQualityFindings(),
    getReference(),
    getVariation(accession),
  ]);
  if (!data) notFound();
  const { inv, pubs, tables } = data;
  const names = Object.fromEntries(investigations.map((i) => [i.accession, i.short]));
  const rows = allRows.filter((r) => r.acc === accession);
  const s = inv.stats;
  const family = reference.families.find((f) => f.id === inv.family);
  const theme = inv.earth ? reference.earth_themes.find((t) => t.id === inv.earth!.theme) : null;
  const myFindings = findings.filter((f) => f.accession === accession);
  const streamOnly = s.o2 && s.o2_ambient && s.o2.max > s.o2_ambient.max + 1e-6;
  const changed = variation.filter((v) => v.distinct > 1);
  const fixed = variation.filter((v) => v.distinct === 1 && v.rows === s.records);
  const partial = variation.filter((v) => v.distinct === 1 && v.rows < s.records);
  const photo = EXPERIMENT_PHOTO[accession];
  const tint = inv.fuelPhases.length === 1 ? PHASE_VAR[inv.fuelPhases[0]] : "var(--color-ink)";
  const linked = [...new Set([...inv.buildsOn, ...inv.related])].filter((a) => names[a]);
  const usedBy = investigations.filter((i) => i.buildsOn.includes(accession));
  const name = plainName(inv);
  const glance = facts(inv);
  const bench = LAB_BENCH[accession];
  const next = [
    ...(bench ? [bench] : []),
    ...(rows.length > 0 ? [{ href: `/data?inv=${accession}`, label: "See every test in a table", note: `${int(rows.length)} rows, each traced to NASA's file` }] : []),
    { href: "/explore", label: "Rank it for a cabin", note: "Choose a cabin's air on the dashboard and see where this experiment lands" },
    ...(bench && rows.length > 0 ? [] : [{ href: `/compare?ids=${accession}`, label: "Compare it with another", note: "Two experiments side by side" }]),
  ];

  return (
    <article>
      <p className="text-[13px] text-ink-3">
        <Link href="/investigations" className="link">Experiments</Link> / {family?.name}
      </p>
      <header className={`mt-3 grid items-center gap-x-10 gap-y-6 ${photo ? "lg:grid-cols-[minmax(0,1fr)_minmax(0,440px)]" : ""}`}>
        <div className="max-w-[60ch]">
          <p className="flex flex-wrap items-center gap-2 text-[12.5px] text-ink-2">
            {name !== inv.short && <span className="tag">{inv.short}</span>}
            <span title={RELEVANCE[inv.relevanceLevel].help}>{LEVEL[inv.relevanceLevel]}</span>
          </p>
          <h1 className="mt-2 text-balance text-[34px] font-semibold leading-[1.08] tracking-[-0.02em]">{name}</h1>
          <p className="mt-4 text-[18px] leading-relaxed">{inv.oneLine}</p>
          <div className="mt-6 flex flex-wrap items-center gap-2">
            <AskButton question={`What did ${inv.short} find?`} className="btn btn-lg btn-accent">Ask the SI about it</AskButton>
            <a className="btn btn-lg" href={inv.psiUrl} target="_blank" rel="noreferrer">
              NASA&apos;s own record <ArrowSquareOut size={15} />
            </a>
          </div>
        </div>
        {photo && (
          <figure>
            <Image src={photo.src} alt={photo.alt} width={photo.width} height={photo.height} priority className="aspect-[3/2] w-full rounded-sm bg-ink object-cover" />
            <figcaption className="mt-1.5 text-[12px] text-ink-3">{photo.caption}</figcaption>
          </figure>
        )}
      </header>

      {/* At a glance */}
      <section aria-label="At a glance" className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {glance.map((fact, i) => {
          const Icon = FACT_ICON[i];
          return (
            <div key={fact.label} className={`${CARD} px-4 py-4`}>
              <p className="flex items-center gap-2 text-[12.5px] text-ink-3">
                <Icon size={16} weight={i === 0 ? "fill" : "regular"} style={i === 0 ? { color: tint } : undefined} /> {fact.label}
              </p>
              <p className="mt-2 text-[18px] font-semibold leading-snug">{fact.value}</p>
              {fact.note && <p className="mt-1 text-[13px] leading-snug text-ink-2">{fact.note}</p>}
            </div>
          );
        })}
        <div className={`${CARD} px-4 py-4`}>
          <p className="flex items-center gap-2 text-[12.5px] text-ink-3">
            <SlidersHorizontal size={16} /> What they changed between tests
          </p>
          <ul className="mt-2.5 flex flex-wrap gap-1.5">
            {inv.varied.map((v) => <li key={v} className="tag h-6 px-2 text-[12.5px]">{v}</li>)}
          </ul>
        </div>
      </section>

      {/* What it found */}
      <section className="mt-12" aria-labelledby="found">
        <h2 id="found" className="text-[21px] font-semibold tracking-[-0.01em]">What it found</h2>
        <ol className={`mt-4 grid gap-3 ${inv.insights.length > 1 ? "lg:grid-cols-2" : "max-w-[70ch]"}`}>
          {inv.insights.map((insight, i) => (
            <li key={insight.text} className={`${CARD} flex flex-col border-l-2 border-l-accent px-5 py-4`}>
              {inv.insights.length > 1 && <span className="num text-[12px] font-medium text-accent-ink">{i + 1} of {inv.insights.length}</span>}
              <p className="mt-1 text-[16px] leading-relaxed">{insight.text}</p>
              <details className="mt-auto pt-3 text-[12.5px]">
                <summary className="cursor-pointer text-ink-3 hover:text-ink">NASA&apos;s words</summary>
                <p className="quote mt-2 text-[12.5px]">
                  &ldquo;{insight.quote}&rdquo; <span className="text-ink-3">{sourceLabel(insight.source)}</span>
                </p>
              </details>
            </li>
          ))}
        </ol>
        <p className="mt-3 max-w-[80ch] text-[12px] text-ink-3">Summarized by the SI. Each summary is tied to a quotation that the build checks against NASA&apos;s text. A matching quote is not a scientific review.</p>
      </section>

      {/* What it helps with */}
      <section className="mt-12" aria-labelledby="helps">
        <h2 id="helps" className="text-[21px] font-semibold tracking-[-0.01em]">What it helps with</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {JOBS.map((job) => {
            const score = inv.pillars[job.id].score;
            return (
              <li key={job.id} className={`${CARD} px-4 py-4 ${score === 0 ? "bg-paper shadow-none" : ""}`}>
                <p className={`text-[15px] font-semibold leading-snug ${score === 0 ? "text-ink-3" : ""}`}>{job.label}</p>
                <p className="mt-0.5 text-[12.5px] text-ink-3">{job.help}</p>
                <p className="mt-3 flex items-center gap-2.5">
                  <span className="flex items-center gap-1" role="img" aria-label={`${score} of 3`}>
                    {[1, 2, 3].map((n) => (
                      <span key={n} className={`block h-1.5 w-7 rounded-full ${n <= score ? "bg-accent" : "bg-rule"}`} />
                    ))}
                  </span>
                  <span className={`text-[12.5px] font-medium ${score === 0 ? "text-ink-3" : ""}`}>{STRENGTH[score]}</span>
                </p>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Where to go next */}
      <nav aria-label="Go further" className="mt-12 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {next.map((step) => (
          <Link key={step.href} href={step.href} className="group flex items-center justify-between gap-4 rounded-sm border border-rule bg-surface px-4 py-3.5 transition-colors hover:border-ink-3">
            <span>
              <span className="block text-[14.5px] font-semibold group-hover:underline group-hover:underline-offset-4">{step.label}</span>
              <span className="mt-0.5 block text-[12.5px] text-ink-3">{step.note}</span>
            </span>
            <ArrowRight size={16} className="shrink-0 text-ink-3" />
          </Link>
        ))}
      </nav>

      {/* Everything below is the full record, for readers who want the detail. */}
      <details className="group mt-12 border-t-2 border-ink">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-[17px] font-semibold">For researchers: NASA&apos;s full record</span>
            <span className="mt-0.5 block text-[13px] text-ink-3">The conditions tested, every row of the table, NASA&apos;s description, publications and hardware</span>
          </span>
          <CaretDown size={18} className="shrink-0 transition-transform group-open:rotate-180" />
        </summary>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 text-[13px]">
        <span className="tag">{inv.platform}</span>
        <span className="tag">{inv.projectType}</span>
        {family && <span className="tag">{family.name}</span>}
        <Link className="btn" href={`/compare?ids=${accession}`}>Compare with others</Link>
        {inv.doi && (
          <a className="link num text-ink-2" href={`https://doi.org/${inv.doi}`} target="_blank" rel="noreferrer">doi:{inv.doi}</a>
        )}
      </div>
      {family && <p className="mt-3 max-w-[75ch] text-[13.5px] text-ink-2">Shared hardware: {family.text} Experiments that shared hardware share its limits, so their results can be compared directly.</p>}

      {/* Why NASA counts it */}
      <section className="mt-8 grid gap-x-12 gap-y-8 lg:grid-cols-2" aria-labelledby="why">
        <div>
          <h2 id="why" className="text-[15px] font-semibold">Why it counts as fire-safety research</h2>
          <p className="quote mt-3">
            &ldquo;{inv.relevance.quote}&rdquo; <span className="text-ink-3">{sourceLabel(inv.relevance.source)}</span>
          </p>
          {inv.emulates && (
            <p className="mt-4 text-[13.5px] text-ink-2">
              Burned gas, but was designed to stand in for {inv.emulates.phases.join(" and ")} fuels.
              <span className="quote mt-1.5 block text-[12.5px]">&ldquo;{inv.emulates.quote}&rdquo;</span>
            </p>
          )}
        </div>
        <div>
          <h2 className="text-[15px] font-semibold">NASA&apos;s words behind each rating</h2>
          <ul className="mt-3 divide-y divide-rule border-y border-rule">
            {PILLARS.map((p) => {
              const pillar = inv.pillars[p.id];
              return (
                <li key={p.id} className="py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-[14px] font-medium" title={p.help}>{p.label}</span>
                    <span className="num text-[12.5px] text-ink-3">{pillar.score} of 3</span>
                  </div>
                  {pillar.score > 0 ? (
                    <p className="quote mt-1.5 text-[12.5px]">&ldquo;{pillar.quote}&rdquo;</p>
                  ) : (
                    <p className="mt-1 text-[12.5px] text-ink-3">Not an aim of this investigation.</p>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Conditions */}
      <section className="mt-10" aria-labelledby="conditions">
        <h2 id="conditions" className="text-[15px] font-semibold">Conditions covered</h2>
        <dl className="mt-3 grid gap-px overflow-hidden rounded-sm border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Oxygen in the atmosphere"
            value={s.o2_ambient ? span(s.o2_ambient.min, s.o2_ambient.max, (x) => pct(x)) : "not reported"}
            note={streamOnly ? `burner stream up to ${pct(s.o2!.max)}` : s.o2_ambient ? undefined : "not in the PSI table"}
            scale={SCALES.o2}
            range={s.o2_ambient}
            color={tint}
          />
          <Stat label="Pressure" value={s.pressure ? span(s.pressure.min, s.pressure.max, kpa) : "not reported"} note={s.pressure ? undefined : "not in the PSI table"} scale={SCALES.pressure} range={s.pressure} color={tint} />
          <Stat label="Flow speed" value={s.flow ? `${span(Math.max(0, s.flow.min), s.flow.max, (x) => num(x))} cm/s` : "not reported"} note={s.flow ? undefined : "not in the PSI table"} scale={SCALES.flow} range={s.flow ? { min: Math.max(0, s.flow.min), max: s.flow.max } : null} color={tint} />
          <Stat
            label="Itemized rows"
            value={int(s.records)}
            note={[s.tests && `${int(s.tests)} tests`, s.sessions && `${int(s.sessions)} test days`, s.envelopes && `${int(s.envelopes)} envelopes`, s.datasets && `${int(s.datasets)} datasets`].filter(Boolean).join(", ") || "no table in PSI"}
          />
        </dl>
        <div className="mt-5 grid gap-x-12 gap-y-5 text-[14px] lg:grid-cols-2">
          <div>
            <h3 className="label">Fuels and materials</h3>
            <p className="mt-1.5 text-ink-2">
              {s.fuels.length ? s.fuels.slice(0, 8).map((f) => `${f.name} (${int(f.records)})`).join(", ") : "Not itemized in PSI."}
              {s.fuels.length > 8 ? `, and ${s.fuels.length - 8} more` : ""}
            </p>
          </div>
          <div>
            <h3 className="label">Measurements named in the PSI record</h3>
            <ul className="mt-1.5 flex flex-wrap gap-1.5">
              {inv.measurements.length ? inv.measurements.map((m) => <li key={m.id} className="tag" title={`"...${m.snippet}..."`}>{m.name}</li>) : <li className="text-ink-3">None named.</li>}
            </ul>
          </div>
        </div>
      </section>

      {/* How the tests differ */}
      {variation.length > 0 && s.records > 1 && (
        <section className="mt-12" aria-labelledby="variation">
          <h2 id="variation" className="text-[15px] font-semibold">How the tests differ, and how they are the same</h2>
          <p className="mt-1 max-w-[70ch] text-[13.5px] text-ink-3">Worked out from the {int(s.records)} rows of the PSI table. A variable that is not listed was not reported, which is different from being held fixed.</p>
          <div className="mt-3 grid gap-px overflow-hidden rounded-sm border border-rule bg-rule lg:grid-cols-2">
            <div className="bg-surface px-4 py-4">
              <h3 className="text-[13px] font-medium">Changed from test to test</h3>
              {changed.length ? (
                <dl className="mt-2 divide-y divide-rule text-[13.5px]">
                  {changed.map((v) => (
                    <div key={v.id} className="flex items-baseline justify-between gap-4 py-1.5">
                      <dt>{v.label}</dt>
                      <dd className="text-right text-ink-2">
                        <span className="num text-ink">{v.kind === "number" ? variationValue(v) : `${v.distinct} different values`}</span>
                        {v.rows < s.records && <span className="block text-[12px] text-ink-3">reported in {int(v.rows)} of {int(s.records)} rows</span>}
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-2 text-[13.5px] text-ink-3">Nothing in the table changes between rows.</p>
              )}
            </div>
            <div className="bg-surface px-4 py-4">
              <h3 className="text-[13px] font-medium">The same in every test</h3>
              {fixed.length ? (
                <dl className="mt-2 divide-y divide-rule text-[13.5px]">
                  {fixed.map((v) => (
                    <div key={v.id} className="flex items-baseline justify-between gap-4 py-1.5">
                      <dt>{v.label}</dt>
                      <dd className="num text-right">{variationValue(v)}{v.assumed && <span className="tag tag-caution ml-2 font-sans">assumed</span>}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-2 text-[13.5px] text-ink-3">No variable has the same value in every row.</p>
              )}
              {partial.length > 0 && (
                <p className="mt-3 text-[12.5px] text-ink-3">Reported for only some rows, with one value: {partial.map((v) => v.label.toLowerCase()).join(", ")}.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Records */}
      {rows.length > 0 && (
        <section className="mt-12" aria-labelledby="records">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="records" className="text-[15px] font-semibold">Rows from the PSI table</h2>
            <p className="text-[13px] text-ink-3">
              Click a row for the source of every value. <Link className="link" href={`/data?inv=${accession}`}>Filter and export</Link>
            </p>
          </div>
          <div className="mt-3">
            <RecordTable rows={rows} names={names} maxHeight={520} />
          </div>
        </section>
      )}

      {/* How the tables were read */}
      {tables.length > 0 && (
        <details className="mt-12 border-y border-rule py-3">
          <summary className="cursor-pointer text-[15px] font-semibold">How the table was read, and what was repaired</summary>
          <div className="mt-4 space-y-5">
            {tables.map((t) => (
              <div key={t.fileName} className="panel px-4 py-4 text-[13.5px]">
                <p className="font-medium">{t.title}</p>
                <p className="num mt-0.5 break-all text-[12px] text-ink-3">{t.fileName}</p>
                <p className="mt-2 text-ink-2">
                  {int(t.rowsInFile)} rows in the file, {int(t.records)} kept as records{t.excluded.length ? `, ${t.excluded.length} left out (${[...new Set(t.excluded.map((e) => e.reason))].join(" ")})` : ""}.
                  {t.recordNote ? ` ${t.recordNote}` : ""}
                </p>
                {[...t.headerNotes, ...t.footnotes].length > 0 && (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-2">
                    {[...t.headerNotes, ...t.footnotes].map((note) => <li key={note}>{note}</li>)}
                  </ul>
                )}
                {t.constants.filter((c) => c.quality === "assumed").map((c) => (
                  <p key={c.var} className="mt-2 text-caution">Assumed: {c.note}</p>
                ))}
                <p className="num mt-3 break-all text-[11.5px] text-ink-3">
                  sha256 {t.sha256}
                </p>
              </div>
            ))}
          </div>
          {myFindings.length > 0 && (
            <div className="mt-5">
              <h3 className="label">Repairs and warnings</h3>
              <ul className="mt-1.5 list-disc space-y-1 pl-5 text-[13.5px] text-ink-2">
                {myFindings.map((f) => <li key={f.id}>{f.message}</li>)}
              </ul>
            </div>
          )}
        </details>
      )}

      {/* NASA's description */}
      <section className="mt-12" aria-labelledby="nasa-text">
        <h2 id="nasa-text" className="text-[15px] font-semibold">NASA&apos;s description</h2>
        <div className="mt-2 border-t border-rule">
          <Prose title="Objectives" text={inv.objective} />
          <Prose title="Approach" text={inv.approach} />
          <Prose title="Hypothesis" text={inv.hypothesis} />
          <Prose title="Research impacts and Earth benefits" text={inv.researchImpacts} />
        </div>
      </section>

      <section className="mt-12 grid gap-x-12 gap-y-10 lg:grid-cols-2">
        <div>
          <h2 className="text-[15px] font-semibold">Publications</h2>
          <p className="mt-1 text-[13px] text-ink-3">{pubs.length} listed in PSI, {s.publications_with_doi} with a DOI.</p>
          <ol className="mt-3 space-y-2.5 text-[13.5px]">
            {pubs.slice(0, 6).map((p) => (
              <li key={p.id}>
                {p.doi ? <a className="link" href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer">{p.title}</a> : p.title}
                <span className="block text-[12.5px] text-ink-3">{p.authors}</span>
              </li>
            ))}
          </ol>
          {pubs.length > 6 && (
            <details className="mt-3 text-[13.5px]">
              <summary className="link inline cursor-pointer">Show the other {pubs.length - 6}</summary>
              <ol className="mt-3 space-y-2.5">
                {pubs.slice(6).map((p) => (
                  <li key={p.id}>
                    {p.doi ? <a className="link" href={`https://doi.org/${p.doi}`} target="_blank" rel="noreferrer">{p.title}</a> : p.title}
                    <span className="block text-[12.5px] text-ink-3">{p.authors}</span>
                  </li>
                ))}
              </ol>
            </details>
          )}
        </div>
        <div className="space-y-8">
          <div>
            <h2 className="text-[15px] font-semibold">Hardware and raw data</h2>
            <ul className="mt-2 space-y-1 text-[13.5px]">
              {inv.hardware.map((h) => (
                <li key={h.name}>{h.link.startsWith("http") ? <a className="link" href={h.link} target="_blank" rel="noreferrer">{h.name}</a> : h.name}</li>
              ))}
            </ul>
            <p className="mt-3 text-[13.5px] text-ink-2">
              {inv.totalBytes > 0 ? `${bytes(inv.totalBytes)} of raw data on PSI` : "No raw data volume listed"}
              {Object.keys(inv.files.categories).length > 0 && `: ${Object.entries(inv.files.categories).map(([k, v]) => `${k.toLowerCase()} ${int(v.count)}`).join(", ")}`}.
              FlameLens reads the experimental table, not the raw video or sensor files.
            </p>
          </div>
          {linked.length + usedBy.length > 0 && (
            <div>
              <h2 className="text-[15px] font-semibold">Linked investigations</h2>
              <ul className="mt-2 space-y-1 text-[13.5px]">
                {linked.map((a) => (
                  <li key={a}><Link className="link" href={`/investigations/${a}`}>{names[a]}</Link>{inv.buildsOn.includes(a) ? <span className="text-ink-3"> uses its flight data</span> : null}</li>
                ))}
                {usedBy.filter((u) => !linked.includes(u.accession)).map((u) => (
                  <li key={u.accession}><Link className="link" href={`/investigations/${u.accession}`}>{u.short}</Link><span className="text-ink-3"> re-analysed this data</span></li>
                ))}
              </ul>
            </div>
          )}
          {inv.earth && (
            <div>
              <h2 className="text-[15px] font-semibold">On Earth</h2>
              <p className="mt-2 text-[14px] text-ink-2">{theme?.name}: {inv.earth.text}</p>
              <p className="quote mt-2 text-[12.5px]">&ldquo;{inv.earth.quote}&rdquo;</p>
            </div>
          )}
        </div>
      </section>
      </details>
    </article>
  );
}
