import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { getInvestigations, type Investigation } from "@/lib/data";
import { PHASE_VAR } from "@flamelens/shared/format";
import { Highlight } from "@/components/highlight";
import { EXPERIMENT_PHOTO } from "@/lib/media";
import { amount, burned, plainName } from "@/lib/plain";

export const metadata: Metadata = { title: "Experiments" };

/** Words a newcomer meets on these pages, in plain terms. */
const WORDS: [string, string][] = [
  ["Investigation", "One experiment campaign in NASA's archive. There are 24 about combustion."],
  ["Microgravity", "The near-weightlessness of orbit. Everything is in free fall, so hot gas does not rise."],
  ["Fuel", "What was burned: a solid (fabric, plastic), a liquid (one droplet) or a gas fed through a burner."],
  ["Oxygen concentration", "The share of the air that is oxygen. On Earth it is 21%. A Moon habitat is expected to hold 30% or more."],
  ["Pressure", "How tightly the air is packed. Sea level is 101 kPa (14.7 psi). A spacesuit runs at 4.3 psi."],
  ["Airflow", "Air moved by a fan. In orbit a flame depends on it to bring fresh oxygen."],
  ["Extinction", "The flame goes out by itself, with fuel still left."],
  ["Flammability limit", "The edge between conditions where a material will burn and where it will not."],
  ["Diluent", "A gas added to the air that does not burn, such as nitrogen, carbon dioxide or helium."],
  ["CIR and MSG", "Two test facilities on the space station: the Combustion Integrated Rack and the Microgravity Science Glovebox."],
];

/** The three groups, nearest to a spacecraft fire first. NASA's own grading decides the group. */
const GROUPS: { level: number; title: string; note: string }[] = [
  { level: 3, title: "Built for spacecraft fire safety", note: "NASA names these as fire-safety studies. Start here." },
  { level: 2, title: "Support fire safety", note: "They answer one fire-safety question, or model a study above." },
  { level: 1, title: "Basic flame science", note: "How flames behave without gravity. Useful background." },
];

function Card({ inv }: { inv: Investigation }) {
  const photo = EXPERIMENT_PHOTO[inv.accession];
  const name = plainName(inv);
  const rich = (inv.stats.o2_ambient?.max ?? 0) >= 0.3;
  const tags = [...inv.fuelPhases, ...(["prevention", "detection", "suppression"] as const).filter((job) => inv.pillars[job].score >= 2), ...(rich ? ["rich"] : [])];
  return (
    <Link href={`/investigations/${inv.accession}`} data-tile data-tags={tags.join(" ")} className="group flex flex-col overflow-hidden rounded-sm border border-rule bg-surface shadow-[0_1px_2px_rgba(20,23,26,0.05),0_10px_24px_-18px_rgba(20,23,26,0.35)] transition-[border-color,opacity,transform] duration-200 hover:-translate-y-0.5 hover:border-ink-3">
      <span className="relative block aspect-[16/9] bg-ink">
        {photo && <Image src={photo.src} alt="" fill sizes="(min-width: 1280px) 300px, (min-width: 640px) 45vw, 92vw" className="object-cover" />}
        {name !== inv.short && <span className="tag absolute left-2 top-2 bg-surface/95 text-ink">{inv.short}</span>}
      </span>
      <span className="flex flex-1 flex-col px-4 pb-3.5 pt-3">
        <span className="text-[15.5px] font-semibold leading-snug group-hover:underline group-hover:underline-offset-4">{name}</span>
        <span className="mt-1.5 line-clamp-3 text-[13.5px] leading-snug text-ink-2">{inv.oneLine}</span>
        <span className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-[12.5px] text-ink-2">
          <span className="inline-flex items-center gap-1.5">
            {inv.fuelPhases.map((p) => <span key={p} className="inline-block size-2.5 rounded-full" style={{ background: PHASE_VAR[p] }} />)}
            {burned(inv).value}
          </span>
          <span className="num text-ink-3">{amount(inv.stats).value.toLowerCase()}</span>
        </span>
      </span>
    </Link>
  );
}

export default async function Page() {
  const investigations = await getInvestigations();
  const byData = (a: Investigation, b: Investigation) => b.stats.records - a.stats.records;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-4">
        <div className="max-w-[60ch]">
          <h1 className="text-[30px] font-semibold leading-[1.12] tracking-[-0.02em]">{investigations.length} experiments on fire without gravity</h1>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/explore" className="btn btn-lg">Rank them for a cabin <ArrowRight size={15} /></Link>
          <Link href="/compare" className="btn btn-lg">Compare two</Link>
        </div>
      </div>

      <div className="mt-6"><Highlight total={investigations.length} /></div>

      <div className="mt-8 space-y-12">
        {GROUPS.map((group) => {
          const members = investigations.filter((i) => i.relevanceLevel === group.level).sort(byData);
          if (members.length === 0) return null;
          return (
            <section key={group.level} aria-labelledby={`g-${group.level}`}>
              <div className="flex flex-wrap items-baseline gap-x-3 border-b border-ink pb-2">
                <h2 id={`g-${group.level}`} className="text-[19px] font-semibold tracking-[-0.01em]">{group.title}</h2>
                <p className="text-[13.5px] text-ink-3"><span className="num">{members.length}</span> experiments</p>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {members.map((inv) => <Card key={inv.accession} inv={inv} />)}
              </div>
            </section>
          );
        })}
      </div>

      <details className="mt-12 border-t border-rule pt-4">
        <summary className="link inline cursor-pointer text-[13.5px] text-ink-2">New to this? Ten words, explained</summary>
        <dl className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2 xl:grid-cols-3">
          {WORDS.map(([word, meaning]) => (
            <div key={word} className="border-t border-rule pt-2.5">
              <dt className="text-[14px] font-semibold">{word}</dt>
              <dd className="mt-0.5 text-[13.5px] leading-relaxed text-ink-2">{meaning}</dd>
            </div>
          ))}
        </dl>
      </details>
    </div>
  );
}
