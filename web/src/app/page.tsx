import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";
import Link from "next/link";
import { SpaceHero } from "@/components/home/space-hero";
import { LoopVideo } from "@/components/home/loop-video";
import { SiMark } from "@/components/art";
import { Turntable } from "@/components/turntable";
import { CountUp, Reveal } from "@/components/reveal";
import { getClusters, getFootage, getInvestigations, getReference, getSourceTables, getTotals, getTrace } from "@/lib/data";
import { QUALITY_LABEL, int, pct } from "@flamelens/shared/format";
import { ART_NOTE, CABIN_ART } from "@/lib/media";
import { getExtras } from "@/lib/motion";
import { gapByPhase } from "@flamelens/shared/scoring";

/** The four incidents NASA names in its challenge statement, in NASA's words. */
const INCIDENTS = [
  { year: "1967", name: "Apollo 1", photo: "/img/apollo1.jpg", alt: "The three Apollo 1 astronauts in blue flight suits, with a model of their capsule.", credit: "The Apollo 1 crew, 1966", quote: "the Apollo 1 crew died in a pre-launch test when fire erupted in their oxygen-filled spacecraft", more: "https://sma.nasa.gov/sma-disciplines/accllp/apollo-1" },
  { year: "1970", name: "Apollo 13", photo: "/img/apollo13.jpg", alt: "The Apollo 13 service module drifting in space with one side panel blown away.", credit: "The damaged module, photographed by its crew", quote: "the Apollo 13 crew endured the life-threatening results of an oxygen tank explosion on their way to the Moon", more: "https://sma.nasa.gov/sma-disciplines/accllp/apollo-13" },
  { year: "1997", name: "Mir", photo: "/img/mir.jpg", alt: "The Mir space station above clouds and ocean.", credit: "Mir seen from the Space Shuttle, 1995", quote: "a multinational crew survived a fire aboard the Mir space station caused by an oxygen generator failure", more: "https://www.nasa.gov/history/25-years-ago-fire-aboard-space-station-mir/" },
  { year: "2026", name: "Artemis II", photo: "/img/artemis2.jpg", alt: "The Orion crew capsule for Artemis II suspended in an assembly hall.", credit: "The Artemis II capsule in assembly, 2023", quote: "make the fire alarm go off in your spacecraft when you’re still about 80,000 miles from home", more: "" },
];

/** The flames NASA's own briefing video shows, each a NASA photograph. */
const FLAMES: { name: string; photo: string; alt: string; text: string; href?: string }[] = [
  { name: "A candle", photo: "/img/candle-orbit.jpg", alt: "A candle flame in orbit: a small blue dome.", text: "With nothing rising, the flame is a small blue dome that does not flicker." },
  { name: "A plastic rod in a breeze", photo: "/img/bass2-flame.jpg", alt: "An acrylic rod burning in airflow on the space station.", text: "In BASS-II a fan blows air over burning acrylic. The plastic melts and bubbles, which gives the flame its ragged edge.", href: "/investigations/PSI-25" },
  { name: "A flame pulled by electricity", photo: "/img/efield-blue.jpg", alt: "A blue flame flattened by an electric field.", text: "In E-FIELD Flames an electric field tugs on the flame and reshapes it, standing in for weak gravity.", href: "/investigations/PSI-22" },
  { name: "A ball of burning gas", photo: "/img/flame-design-stages.jpg", alt: "Nine spherical gas flames, from blue to sooty yellow.", text: "In Flame Design, gas flames form spheres that turn from blue to sooty yellow.", href: "/investigations/PSI-10" },
];

/** Where crews live now and next, in the order the oxygen rises. Keys are NASA's atmospheres in the reference data. */
const NEXT_CABINS: { env: string; scene: string; name: string; note: string }[] = [
  { env: "cabin", scene: "station", name: "Space station", note: "The same air as at sea level on Earth." },
  { env: "exploration", scene: "habitat", name: "Moon habitat", note: "Thinner air with more oxygen, so crews can step outside sooner." },
  { env: "spacesuit", scene: "suit", name: "Spacesuit", note: "Pure oxygen at low pressure, to keep the suit flexible." },
];

/** The three features, each shown by a picture of its own screen. */
const FEATURES: { href: string; name: string; job: string; shot: string; alt: string; go: string; text: (filmed: number) => string }[] = [
  { href: "/explore", name: "Dashboard", job: "A question about one cabin", shot: "/img/home/dashboard.jpg", alt: "The dashboard: a cabin's air on the left, charts of NASA's tests in the middle, the SI's analysis on the right.", go: "Open the dashboard", text: () => "Describe a cabin. See which tests ran near it, where the evidence runs out, and what the SI makes of it." },
  { href: "/lab", name: "Flame Lab", job: "One test at a time", shot: "/img/home/lab.jpg", alt: "The Flame Lab: conditions on the left, NASA's video of a test in the middle, the tests near it on the right.", go: "Watch real flames", text: (filmed) => `Set the air around a plastic, a droplet or a gas flame and watch NASA's own video of the nearest test. ${filmed} tests are on film.` },
  { href: "/investigations", name: "Explorer", job: "The archive itself", shot: "/img/home/explorer.jpg", alt: "The Explorer: NASA's experiments as photo cards.", go: "Browse the archive", text: () => "All 24 experiments in plain words, fire safety in three moments, and every test row to filter and download." },
];

/** Shades for the bar that shows how the values were obtained. */
const QUALITY_SHADE: Record<string, string> = { reported: "var(--color-ink)", context: "#6b7480", derived: "#2a78d6", assumed: "#b9bfc7", corrected: "#eb6834" };

const H2 = "text-[30px] font-semibold leading-[1.12] tracking-[-0.02em]";
const GO = "mt-auto flex items-center gap-1.5 pt-4 text-[14.5px] font-medium text-accent";

export default async function Page() {
  const [clusters, investigations, reference, totals, footage, trace, tables, extras] = await Promise.all([getClusters(), getInvestigations(), getReference(), getTotals(), getFootage(), getTrace(), getSourceTables(), getExtras()]);
  const filmed = new Set(footage.map((clip) => clip.recordId)).size;
  const exploration = reference.environments.find((e) => e.id === "exploration")!;
  const moon = { o2: exploration.o2_fraction!, p: exploration.pressure_kpa! };

  const nextCabins = NEXT_CABINS.map((cabin) => {
    const env = reference.environments.find((e) => e.id === cabin.env)!;
    const air = { o2: env.o2_fraction!, p: env.pressure_kpa! };
    const solids = gapByPhase(clusters, air).find((g) => g.phase === "solid")!;
    return { ...cabin, ...air, psi: env.pressure_psi!, solids: solids.comparable, art: extras.scenes[cabin.scene] ?? CABIN_ART[cabin.env].src, wide: Boolean(extras.scenes[cabin.scene]), href: `/explore?o2=${Number((air.o2 * 100).toFixed(1))}&p=${Number(air.p.toFixed(1))}&fuel=solid` };
  });

  // The finding the whole site turns on, counted from the table.
  const solidAir = clusters.filter((c) => c.phase === "solid" && !c.stream);
  const solidTop = Math.max(...solidAir.map((c) => c.o2));
  const solidAtMoon = solidAir.filter((c) => c.o2 >= 0.3).reduce((sum, c) => sum + c.n, 0);

  return (
    <div>
      {/* The first screen */}
      <SpaceHero
        tests={totals.records}
        solidTop={Number((solidTop * 100).toFixed(1))}
        solidAtMoon={solidAtMoon}
        moonHref={`/explore?o2=${Number((moon.o2 * 100).toFixed(1))}&p=${Number(moon.p.toFixed(1))}&fuel=solid&g=moon`}
      />

      {/* Why it matters */}
      <Reveal className="mt-24" aria-labelledby="why">
        <div className="max-w-[60ch]">
          <h2 id="why" className={H2}>In a spacecraft, there is nowhere to run.</h2>
          <p className="mt-3 text-[16.5px] leading-relaxed text-ink-2">
            A crew cannot open a window or step outside. Four moments NASA names when it explains why it studies fire, in its own words:
          </p>
        </div>
        <ol className="mt-8 grid gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          {INCIDENTS.map((item) => (
            <li key={item.name} className="relative border-t border-ink pr-5 pt-4">
              <span className="absolute -top-[5px] left-0 size-[9px] rounded-full bg-ink" aria-hidden />
              <p className="flex items-baseline gap-2.5">
                <span className="num text-[13px] text-ink-2">{item.year}</span>
                <span className="text-[19px] font-semibold tracking-[-0.01em]">{item.name}</span>
              </p>
              <Image src={item.photo} alt={item.alt} width={900} height={675} className="mt-3 aspect-[4/3] w-full rounded-sm object-cover" />
              <p className="mt-3 text-[14px] leading-relaxed text-ink-2">&ldquo;{item.quote}&rdquo;</p>
              <p className="mt-1.5 text-[11.5px] text-ink-3">
                {item.credit}. NASA photograph.
                {item.more && <> <a className="link" href={item.more} target="_blank" rel="noreferrer">NASA&apos;s account</a></>}
              </p>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-[12.5px] text-ink-3">Quotations are from NASA&apos;s challenge statement. The last is the Artemis II commander, on a smoke alarm that went off during the flight.</p>
      </Reveal>

      {/* A real fire */}
      <Reveal className="mt-24" aria-labelledby="real">
        <div className="grid items-center gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <figure>
          <LoopVideo src="/video/saffire-vi.mp4" poster="/video/saffire-vi-poster.jpg" label="Time-lapse of a flame spreading along a sheet of acrylic in microgravity, from NASA's Saffire-VI experiment." />
          <figcaption className="mt-2 text-[12.5px] leading-snug text-ink-3">
            Real footage, sped up. A sheet of acrylic burns inside an uncrewed Cygnus cargo ship during Saffire-VI, a later flight of the Saffire series. NASA Glenn Research Center.
          </figcaption>
        </figure>
        <div>
          <h2 id="real" className={H2}>So NASA lights real fires in space, on purpose.</h2>
          <p className="mt-4 text-[16.5px] leading-relaxed text-ink-2">
            It burns fabric, plastic, fuel droplets and gas inside sealed hardware in orbit, and records what happens. The results are public, but they sit in {int(investigations.length)} separate records that are hard to find, compare and read.
          </p>
          <dl className="mt-7 grid grid-cols-3 gap-x-6">
            <div>
              <dd className="text-[40px] font-semibold leading-none tracking-[-0.03em]"><CountUp value={investigations.length} /></dd>
              <dt className="mt-1.5 text-[13.5px] leading-snug text-ink-2">experiments in the archive</dt>
            </div>
            <div>
              <dd className="text-[40px] font-semibold leading-none tracking-[-0.03em]"><CountUp value={totals.records} /></dd>
              <dt className="mt-1.5 text-[13.5px] leading-snug text-ink-2">test rows, read into one table</dt>
            </div>
            <div>
              <dd className="text-[40px] font-semibold leading-none tracking-[-0.03em]"><CountUp value={filmed} /></dd>
              <dt className="mt-1.5 text-[13.5px] leading-snug text-ink-2">tests you can watch on NASA&apos;s own film</dt>
            </div>
          </dl>
          <Link href="/lab" className="btn btn-lg mt-8">Watch them in the Flame Lab <ArrowRight size={17} /></Link>
        </div>
        </div>
        <h3 className="mt-12 text-[19px] font-semibold tracking-[-0.01em]">Four flames you will only see in orbit</h3>
        <ul className="mt-4 grid grid-cols-2 gap-x-5 gap-y-7 lg:grid-cols-4">
          {FLAMES.map((flame) => {
            const body = (
              <>
                <Image src={flame.photo} alt={flame.alt} width={720} height={540} className="aspect-[4/3] w-full rounded-sm bg-ink object-cover" />
                <span className="mt-2.5 block text-[15.5px] font-semibold group-hover:underline group-hover:underline-offset-4">{flame.name}</span>
                <span className="mt-0.5 block text-[13.5px] leading-relaxed text-ink-2">{flame.text}</span>
              </>
            );
            return <li key={flame.name}>{flame.href ? <Link href={flame.href} className="group block">{body}</Link> : <div>{body}</div>}</li>;
          })}
        </ul>
        <p className="mt-3 text-[12px] text-ink-3">NASA photographs. These are the examples NASA&apos;s own briefing for this challenge shows.</p>
      </Reveal>

      {/* The next cabins */}
      <Reveal className="mt-24" aria-labelledby="next">
        <div className={extras.turns.habitat ? "grid items-center gap-x-12 gap-y-6 md:grid-cols-[minmax(0,1fr)_minmax(0,340px)]" : ""}>
          <div className="max-w-[60ch]">
            <h2 id="next" className={H2}>The next cabins will hold more oxygen.</h2>
            <p className="mt-3 text-[16.5px] leading-relaxed text-ink-2">
              More oxygen in the air makes almost everything easier to light. This is how the air changes from the space station to the Moon, and how many of NASA&apos;s tests on solid materials, such as fabric and plastic, were run in air like it.
            </p>
          </div>
          {extras.turns.habitat && (
            <figure>
              <Turntable src={extras.turns.habitat} label="A concept model of a lunar surface habitat" />
              <figcaption className="mt-1.5 text-[12px] text-ink-3">A concept model of a lunar habitat, not a NASA design.</figcaption>
            </figure>
          )}
        </div>
        <ol className="panel mt-7 grid divide-y divide-rule md:grid-cols-3 md:divide-x md:divide-y-0">
          {nextCabins.map((cabin) => (
            <li key={cabin.env}>
              <Link href={cabin.href} className="group flex h-full flex-col px-5 pb-5 pt-3 transition-colors hover:bg-wash">
                <span className="relative block">
                  <Image src={cabin.art} alt="" width={1280} height={720} className={`aspect-[16/9] w-full mix-blend-multiply ${cabin.wide ? "object-cover" : "object-contain"}`} />
                  <SiMark />
                </span>
                <h3 className="mt-2 text-[20px] font-semibold tracking-[-0.01em] group-hover:underline group-hover:underline-offset-4">{cabin.name}</h3>
                <p className="mt-1 text-[14px] leading-relaxed text-ink-2">{cabin.note}</p>
                <div className="mt-4">
                  <p className="flex items-baseline justify-between text-[13px] text-ink-2"><span>Oxygen in the air</span><span className="num text-[15px] font-semibold text-ink">{pct(cabin.o2, 0)}</span></p>
                  <div className="mt-1.5 h-3 rounded-full bg-wash" role="img" aria-label={`${pct(cabin.o2, 0)} oxygen`}>
                    <div className="h-full rounded-full bg-accent" style={{ width: `${cabin.o2 * 100}%` }} />
                  </div>
                  <p className="num mt-1.5 text-[12.5px] text-ink-3">at {cabin.psi} psi</p>
                </div>
                <p className="mt-auto flex items-baseline gap-2.5 border-t border-rule pt-3.5">
                  <span className="num text-[34px] font-semibold leading-none tracking-[-0.02em]" style={cabin.solids > 0 ? undefined : { color: "var(--color-ink-3)" }}>{int(cabin.solids)}</span>
                  <span className="text-[13.5px] leading-snug text-ink-2">tests on solid materials in air like this</span>
                </p>
              </Link>
            </li>
          ))}
        </ol>
        <p className="quote mt-5 max-w-[70ch]">&ldquo;Compared to Earth&rsquo;s atmosphere, that&rsquo;s more than a 40% increase in the oxygen concentration making materials much more flammable.&rdquo; <span className="text-ink-3">NASA challenge statement, on the Moon Base</span></p>
        <p className="mt-2 text-[12px] text-ink-3">{ART_NOTE} The Moon habitat figures are NASA&apos;s exploration atmosphere. Air like this means within 3 points of oxygen and a 25% change in pressure.</p>
      </Reveal>

      {/* The three features */}
      <Reveal className="mt-24" aria-labelledby="do">
        <h2 id="do" className={H2}>Three ways in</h2>
        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Link key={feature.href} href={feature.href} className="group flex flex-col overflow-hidden rounded-sm border border-rule bg-surface shadow-[0_1px_2px_rgba(20,23,26,0.05),0_18px_40px_-28px_rgba(20,23,26,0.45)] transition-[transform,border-color] duration-300 hover:-translate-y-1 hover:border-ink-3">
              <span className="relative block aspect-[16/10] overflow-hidden border-b border-rule bg-wash">
                <Image src={feature.shot} alt={feature.alt} fill sizes="(min-width: 1024px) 440px, 100vw" className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]" />
              </span>
              <span className="flex flex-1 flex-col px-5 pb-5 pt-4">
                <span className="text-[12.5px] font-medium text-accent">{feature.job}</span>
                <span className="mt-1 text-[22px] font-semibold tracking-[-0.015em]">{feature.name}</span>
                <span className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">{feature.text(filmed)}</span>
                <span className={GO}>{feature.go} <ArrowRight size={15} className="transition-transform group-hover:translate-x-0.5" /></span>
              </span>
            </Link>
          ))}
        </div>
      </Reveal>

      {/* Why this and not a chatbot */}
      <Reveal className="mt-24" aria-labelledby="trust">
        <div className="max-w-[62ch]">
          <h2 id="trust" className={H2}>Why not just ask a chatbot?</h2>
          <p className="mt-3 text-[16.5px] leading-relaxed text-ink-2">
            Ask how many solid-fuel tests ran near {pct(moon.o2, 0)} oxygen and a chatbot has to guess, because that number is written nowhere. It has to be counted, across {tables.length} NASA tables that use different columns and units. FlameLens did that work once, and shows it.
          </p>
        </div>
        <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
          {trace && (
            <div className="panel px-5 py-5">
              <p className="text-[12.5px] font-medium text-accent">One value, traced to its cell</p>
              <p className="mt-2 flex items-baseline gap-3">
                <span className="num text-[44px] font-semibold leading-none tracking-[-0.03em]">{pct(trace.value, 0)}</span>
                <span className="text-[15px] text-ink-2">oxygen, in a {trace.short} test on {trace.label}</span>
              </p>
              <dl className="num mt-4 grid grid-cols-[5.5rem_minmax(0,1fr)] gap-x-3 gap-y-1.5 border-t border-rule pt-3 text-[12.5px]">
                <dt className="text-ink-3">NASA file</dt><dd className="break-words">{trace.file}</dd>
                <dt className="text-ink-3">Row, column</dt><dd>{trace.row}, &ldquo;{trace.column}&rdquo;</dd>
                <dt className="text-ink-3">Cell reads</dt><dd><span className="rounded-xs bg-caution-wash px-1.5 py-0.5 text-caution">{trace.note.match(/'([^']+)'/)?.[1] ?? trace.raw}</span></dd>
                <dt className="text-ink-3">We show</dt><dd>{pct(trace.value, 0)}, labelled &ldquo;repaired&rdquo;</dd>
              </dl>
              <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">{trace.note}</p>
              <p className="mt-2 text-[12.5px] text-ink-3">Click any number on this site to open the same record for it.</p>
            </div>
          )}
          <div className="panel flex flex-col px-5 py-5">
            <p className="text-[12.5px] font-medium text-accent">Every value says how it was obtained</p>
            <p className="mt-2 flex items-baseline gap-3">
              <span className="num text-[44px] font-semibold leading-none tracking-[-0.03em]">{int(totals.values)}</span>
              <span className="text-[15px] text-ink-2">values from {int(totals.records)} test rows</span>
            </p>
            <div className="mt-4 flex h-4 overflow-hidden rounded-full bg-wash" role="img" aria-label="Values by how they were obtained">
              {Object.keys(QUALITY_SHADE).map((q) => <span key={q} style={{ width: `${(100 * (reference.value_quality[q] ?? 0)) / totals.values}%`, minWidth: reference.value_quality[q] ? 4 : 0, background: QUALITY_SHADE[q] }} />)}
            </div>
            <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[13px] sm:grid-cols-3">
              {Object.keys(QUALITY_SHADE).map((q) => (
                <li key={q} className="flex items-center gap-2">
                  <span className="inline-block size-2.5 shrink-0 rounded-full" style={{ background: QUALITY_SHADE[q] }} />
                  <span className="text-ink-2">{QUALITY_LABEL[q]}</span>
                  <span className="num ml-auto">{int(reference.value_quality[q] ?? 0)}</span>
                </li>
              ))}
            </ul>
            <ul className="mt-5 space-y-2 border-t border-rule pt-4 text-[14.5px] leading-snug">
              <li><span className="font-semibold">The numbers are counted, not written.</span> <span className="text-ink-2">Every chart and count comes straight from the table.</span></li>
              <li><span className="font-semibold">The SI can only read this table.</span> <span className="text-ink-2">Each figure it states is checked against what it looked up.</span></li>
              <li><span className="font-semibold">Where NASA never tested, it says so.</span> <span className="text-ink-2">At {pct(moon.o2, 0)} oxygen the archive runs thin.</span></li>
            </ul>
            <Link href="/methods" className="btn btn-lg mt-5 self-start">Read the methods and limits <ArrowRight size={17} /></Link>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
