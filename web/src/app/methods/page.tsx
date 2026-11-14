import type { Metadata } from "next";
import Link from "next/link";
import { getInvestigations, getQualityFindings, getReference, getSourceTables, getTotals } from "@/lib/data";
import { QUALITY_HELP, QUALITY_LABEL, bytes, int } from "@flamelens/shared/format";
import { DEFAULT_WEIGHTS, FUEL_EMULATED, FUEL_MISMATCH, UNKNOWN_PRESSURE_CREDIT } from "@flamelens/shared/scoring";

export const metadata: Metadata = { title: "Methods and limits" };

const LAYERS = [
  { name: "Raw", text: "Exact copies of what PSI served: the index of investigations, each investigation record, and every experimental table. Each file is stored with its fetch time and SHA-256 checksum and is never edited." },
  { name: "Staged", text: "The raw files parsed into tidy tables. PSI's own column names and values are kept as they are." },
  { name: "Curated", text: "Every column of every table mapped onto one dictionary of variables, with units converted. Each value keeps the raw cell it came from and a quality label." },
  { name: "Serving", text: "The curated files loaded into a Postgres database, which is what this site reads." },
];

const LIMITS = [
  ["Relevance is not safety.", "The score orders investigations by how closely they relate to a scenario. It says nothing about whether a material or a cabin is safe, and it is not a probability."],
  ["Missing is not zero.", "An empty value means PSI's table does not report it. It does not mean the quantity was zero or that it did not matter."],
  ["Close on the map is not the same test.", "Two tests at the same oxygen and pressure can differ in airflow, material, shape, sample size and how they were ignited. The map shows two conditions out of many."],
  ["A gap is relative to this archive.", "No tests near a scenario means none in the PSI experimental tables read here. Drop-tower and ground tests, and results published only in papers, are outside it."],
  ["A matching quote is not a review.", "Every curated statement carries a quotation that the build checks, character for character, against NASA's text. That proves where a statement comes from. It does not prove the statement is right, and no combustion scientist has reviewed this site."],
  ["All flight tests here ran in microgravity.", "PSI holds no test at lunar or Martian gravity. Microgravity and normal gravity can only bracket what happens in between."],
  ["Some pressures are assumed.", "Several tables do not list pressure. Where an experiment ran in the station cabin or in the Cygnus vehicle, cabin pressure is used and the value is marked as assumed and drawn hollow."],
];

export default async function Page() {
  const [reference, tables, findings, totals, investigations] = await Promise.all([
    getReference(),
    getSourceTables(),
    getQualityFindings(),
    getTotals(),
    getInvestigations(),
  ]);
  const names = Object.fromEntries(investigations.map((i) => [i.accession, i.short]));
  const quality = reference.value_quality;
  const totalValues = Object.values(quality).reduce((a, b) => a + b, 0);
  const w = DEFAULT_WEIGHTS;

  return (
    <div className="max-w-[1000px]">
      <h1 className="text-[30px] font-semibold leading-[1.12] tracking-[-0.02em]">Methods and limits</h1>
      <p className="mt-3 max-w-[66ch] text-[15.5px] leading-relaxed text-ink-2">
        How the data was collected, cleaned and scored, what this site cannot tell you, and where SI tools were used. Everything here can be rebuilt from the public repository with one command.
      </p>

      <section className="mt-12" aria-labelledby="limits">
        <h2 id="limits" className="text-[19px] font-semibold tracking-[-0.01em]">Read these before relying on anything</h2>
        <dl className="mt-4 divide-y divide-rule border-y border-rule">
          {LIMITS.map(([title, text]) => (
            <div key={title} className="grid gap-x-8 gap-y-1 py-3.5 md:grid-cols-[260px_minmax(0,1fr)]">
              <dt className="text-[14.5px] font-medium">{title}</dt>
              <dd className="text-[14.5px] leading-relaxed text-ink-2">{text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-14" aria-labelledby="source">
        <h2 id="source" className="text-[19px] font-semibold tracking-[-0.01em]">Where the data comes from</h2>
        <p className="mt-3 max-w-[70ch] text-[14.5px] leading-relaxed text-ink-2">
          All data is read from NASA&apos;s <a className="link" href="https://psi.nasa.gov" target="_blank" rel="noreferrer">Physical Sciences Informatics</a> repository, which NASA releases under CC0. The {investigations.length} investigations in the Combustion Science research area hold {bytes(totals.bytes)} of raw files. This site does not read the raw video or sensor files. It reads the experimental table that each team published: {tables.length} tables, {int(totals.records)} rows, {int(totals.values)} values.
        </p>
        <p className="mt-2 max-w-[70ch] text-[13.5px] leading-relaxed text-ink-3">
          NASA names PSI as the data source for this challenge. For background it points to its <a className="link" href="https://www.nasa.gov/missions/station/a-researchers-guide-to-combustion-science/" target="_blank" rel="noreferrer">Researcher&apos;s Guide to International Space Station Combustion Science</a> and its <a className="link" href="https://www.nasa.gov/glenn/glenn-expertise-space-exploration/physical-sciences-program/combustion-science/" target="_blank" rel="noreferrer">Combustion Science</a> pages. This site does not read either of them yet.
        </p>
        <p className="mt-2 max-w-[70ch] text-[13.5px] leading-relaxed text-ink-3">
          One more NASA file is read: the ReadMe that PSI holds for BASS-II. It says what the table&apos;s Air display column is (&ldquo;flow speed measured in the duct in cm/s&rdquo;), and that sentence is the stated source of every BASS-II air speed on this site.
        </p>
        <ol className="mt-5 grid gap-px overflow-hidden rounded-sm border border-rule bg-rule md:grid-cols-4">
          {LAYERS.map((layer, i) => (
            <li key={layer.name} className="bg-surface px-4 py-4">
              <p className="num text-[12px] text-ink-3">{i + 1}</p>
              <p className="mt-1 text-[15px] font-semibold">{layer.name}</p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2">{layer.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-14" aria-labelledby="quality">
        <h2 id="quality" className="text-[19px] font-semibold tracking-[-0.01em]">Where each value comes from</h2>
        <p className="mt-3 max-w-[70ch] text-[14.5px] leading-relaxed text-ink-2">
          Every one of the {int(totalValues)} values carries one of five labels. Click any row in the data to see its label, the raw PSI cell, and the note or quotation behind it.
        </p>
        <table className="table mt-4">
          <thead>
            <tr><th>Label</th><th>Meaning</th><th className="text-right">Values</th><th className="text-right">Share</th></tr>
          </thead>
          <tbody>
            {["reported", "context", "assumed", "derived", "corrected"].map((q) => (
              <tr key={q}>
                <td className="whitespace-nowrap"><span className={`tag ${q === "assumed" || q === "corrected" ? "tag-caution" : ""}`}>{QUALITY_LABEL[q]}</span></td>
                <td className="text-ink-2">{QUALITY_HELP[q]}</td>
                <td className="num text-right">{int(quality[q] ?? 0)}</td>
                <td className="num text-right">{(((quality[q] ?? 0) / totalValues) * 100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-14" aria-labelledby="repairs">
        <h2 id="repairs" className="text-[19px] font-semibold tracking-[-0.01em]">What was repaired, left out or flagged</h2>
        <p className="mt-3 max-w-[70ch] text-[14.5px] leading-relaxed text-ink-2">
          The tables were typed by hand over two decades and contain slips. Nothing is changed silently. This is the complete log.
        </p>
        <ul className="mt-4 divide-y divide-rule border-y border-rule text-[13.5px]">
          {findings.map((f) => (
            <li key={f.id} className="grid gap-x-6 gap-y-0.5 py-2.5 md:grid-cols-[150px_minmax(0,1fr)]">
              <Link className="link font-medium" href={`/investigations/${f.accession}`}>{names[f.accession] ?? f.accession}</Link>
              <span className="text-ink-2">{f.message}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-14 scroll-mt-20" id="scoring" aria-labelledby="scoring-title">
        <h2 id="scoring-title" className="text-[19px] font-semibold tracking-[-0.01em]">How the ranking score works</h2>
        <p className="mt-3 max-w-[70ch] text-[14.5px] leading-relaxed text-ink-2">
          The score is arithmetic, written in one file of the repository, and runs in your browser. No language model takes part in it. It is the weighted sum of five parts, each between 0 and 1, shown as 0 to 100.
        </p>
        <table className="table mt-4">
          <thead>
            <tr><th>Part</th><th className="text-right">Weight</th><th>How it is computed</th></tr>
          </thead>
          <tbody>
            <tr>
              <td className="font-medium">Conditions</td>
              <td className="num text-right">{Math.round(w.conditions * 100)}%</td>
              <td className="text-ink-2">
                Distance from the scenario to each of the investigation&apos;s tests, in steps: one step is 3 percentage points of oxygen, or a 25% change in pressure. The part combines the closest test (65%) with how many tests sit nearby (35%). A test with matching oxygen but no reported pressure earns {UNKNOWN_PRESSURE_CREDIT * 100}% credit. Inverse flames are excluded, because their oxygen value is the burner stream. An investigation with no oxygen value is shown as not available, not as zero.
              </td>
            </tr>
            <tr>
              <td className="font-medium">NASA focus</td>
              <td className="num text-right">{Math.round(w.relevance * 100)}%</td>
              <td className="text-ink-2">Three levels, each backed by a quotation: named by NASA as a spacecraft fire-safety study (1.0), supporting (0.67), or fundamental combustion science (0.33).</td>
            </tr>
            <tr>
              <td className="font-medium">Fuel</td>
              <td className="num text-right">{Math.round(w.fuel * 100)}%</td>
              <td className="text-ink-2">1.0 if the investigation burned the kind of fuel the scenario is concerned with, {FUEL_EMULATED} if it was a gas burner built to stand in for that fuel, {FUEL_MISMATCH} otherwise.</td>
            </tr>
            <tr>
              <td className="font-medium">Function</td>
              <td className="num text-right">{Math.round(w.function * 100)}%</td>
              <td className="text-ink-2">How much the investigation contributes to prevention, detection and suppression (0 to 3 each, with a quotation), averaged with the scenario&apos;s priority.</td>
            </tr>
            <tr>
              <td className="font-medium">Data</td>
              <td className="num text-right">{Math.round(w.data * 100)}%</td>
              <td className="text-ink-2">How much there is to work with: number of itemized tests (half), number of variables reported in the table (three tenths), publications with a DOI (two tenths).</td>
            </tr>
          </tbody>
        </table>
        <p className="mt-3 max-w-[70ch] text-[13.5px] leading-relaxed text-ink-3">
          The weights and the size of a step are judgements made for this project, not NASA values. They are constants in <span className="num">shared/src/scoring.ts</span>, covered by tests, and easy to change.
        </p>
      </section>

      <section className="mt-14 scroll-mt-20" id="lab" aria-labelledby="lab-title">
        <h2 id="lab-title" className="text-[19px] font-semibold tracking-[-0.01em]">How the Flame Lab and the coverage grid work</h2>
        <div className="mt-3 max-w-[76ch] space-y-3 text-[14.5px] leading-relaxed text-ink-2">
          <p>
            The Flame Lab is a replay, not a model. For the setting on its controls it finds the FLEX droplet tests of the same fuel that are closest, and shows what happened in them. Distance is counted in steps: one step is 3 points of oxygen, 5 points of carbon dioxide or helium, a 25% change in pressure, or 1.5 mm of droplet size. A test within one step counts as measured here, within two as close. Beyond two steps the lab replays the single nearest real test, says how far away it is and at what conditions it ran, and makes no claim about your setting.
          </p>
          <p>
            The outcome shown is the most common one among up to nine nearby tests, and the figures are their middle values. Because a bigger droplet takes longer to burn, burn time is compared as seconds per square millimetre of starting size and then scaled to the droplet size on the control. The picture and the chart show the droplet shrinking from its starting size to the size at which the burn ended, with its size squared falling steadily in between; the table gives only the two ends. When your air differs from plain station air, the same droplet in station air is replayed beside it. The flame&apos;s shape and colour are drawn.
          </p>
          <p>
            The lab has two more benches that work the same way. The plastic and fabric bench replays BASS-II: for a sample and a starting oxygen level it shows the carbon monoxide, carbon dioxide and oxygen readings taken from the chamber air after the nearest tests. One step there is 1 point of oxygen, or a 25% change in rod diameter, or a 50% change in sheet thickness. An oxygen reading that appears to rise during a test, or to fall by more than five points, is treated as a reading error and left out. The gas flame bench replays the CFI-G tests in which the oxygen was in the chamber air: whether each flame lit and how it ended. Its burn time and burner temperature are taken over the nearby tests that lit. The CFI-G flames fed with oxygen through the burner are not included, because that oxygen is not cabin air.
          </p>
          <p>
            The dashboard&apos;s analysis starts from every row in the archive and keeps, step by step, only the rows that also match what burns, report the oxygen in the air around the flame, sit within 3 points of the cabin&apos;s oxygen, are also close in pressure, and were run at the cabin&apos;s gravity. The first step that leaves no rows is marked as where the evidence runs out. The sentences beside it are assembled from those counts by fixed rules; no model writes them.
          </p>
          <p>
            The coverage grid on the dashboard counts test rows by fuel and by the oxygen in the surrounding air, in seven bands. Rows where the oxygen figure is the stream fed through a burner are left out, and so are rows with no oxygen value. The Moon and Mars rows are empty because no row in the archive was measured at either gravity.
          </p>
        </div>
      </section>

      <section className="mt-14" aria-labelledby="ai">
        <h2 id="ai" className="text-[19px] font-semibold tracking-[-0.01em]">Where SI tools were used</h2>
        <p className="mt-2 max-w-[70ch] text-[13.5px] leading-relaxed text-ink-3">SI is NASA&apos;s term in this challenge for super intelligence: language models, image and video generators and coding tools.</p>
        <dl className="mt-4 divide-y divide-rule border-y border-rule text-[14.5px]">
          {[
            ["Building the site", "The code, the data pipeline and this text were written with Claude (Anthropic), working with the team."],
            ["Reading the investigations", "The one-line summaries, the fire-safety level, the prevention, detection and suppression ratings and the short insights were written by the SI after reading each PSI record. Each carries a quotation, and the build stops if a quotation is not found in NASA's text."],
            ["Answering questions", "In the SI panel beside each feature, the SI answers by running fixed lookups over this database, lists them, and its figures are checked against what they returned. The questions the site suggests use wording prepared ahead of time, whether the live model is on or off; their lookups and the number check still run on every request. Any other question goes to a language model hosted on Amazon Bedrock (gpt-oss-120b, an open model from OpenAI), and an answer it has already given to the same question about the same cabin is shown again for a few hours. The Listen button reads an answer aloud with ElevenLabs where that is set up, and otherwise with the voice built into the browser; the words are the ones on the screen."],
            ["Images", "Every photograph and every piece of footage is NASA's. The line drawings of cabins, scenes and the three fire-safety jobs, the short animations of them, and the two white models that can be turned (a lunar habitat and a droplet chamber) are concept illustrations made with image and video models through Higgsfield (FLUX.2, Seedance 2.5, Nano Banana Pro, GPT Image 2.6). They show an idea and are not NASA designs or hardware. Each one carries a visible SI-generated mark, in the picture and beside it, and none contains a NASA logo, flag or mission badge. The candle flame on the home page that changes with gravity, and the droplet flame in the Flame Lab, are drawings made in code; the Flame Lab's timing and outcomes come from NASA's tests. None of these pictures is evidence."],
            ["The home page", "Earth, Mars, the Moon and the space station are NASA's own 3D models (Earth and Mars: NASA/JPL-Caltech, from NASA Science 3D resources; the Moon: NASA's Scientific Visualization Studio, from Lunar Reconnaissance Orbiter data; the station: NASA's ISS model). They are drawn in the browser with three.js. The flame between them is a drawing made in code, and its shape at the Moon's and Mars's gravity is a guess: no test exists there. NASA's downlink recordings in the Flame Lab are played with mpegts.js."],
            ["Not used for", "The numbers. No value on the map, in the tables or in the ranking was produced or estimated by a model. They come from PSI's tables through code that is in the repository."],
          ].map(([title, text]) => (
            <div key={title} className="grid gap-x-8 gap-y-1 py-3.5 md:grid-cols-[260px_minmax(0,1fr)]">
              <dt className="font-medium">{title}</dt>
              <dd className="leading-relaxed text-ink-2">{text}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-14" aria-labelledby="files">
        <h2 id="files" className="text-[19px] font-semibold tracking-[-0.01em]">Source files</h2>
        <p className="mt-3 max-w-[70ch] text-[14.5px] leading-relaxed text-ink-2">
          The exact PSI files this site was built from, with their checksums.
        </p>
        <div className="panel mt-4 overflow-x-auto">
          <table className="table">
            <thead>
              <tr><th>Investigation</th><th>PSI file</th><th className="text-right">Rows</th><th className="text-right">Kept</th><th>SHA-256</th></tr>
            </thead>
            <tbody>
              {tables.map((t) => (
                <tr key={t.fileName}>
                  <td className="whitespace-nowrap"><Link className="link" href={`/investigations/${t.accession}`}>{names[t.accession]}</Link></td>
                  <td className="num text-[12px] text-ink-2">{t.fileName}</td>
                  <td className="num text-right">{int(t.rowsInFile)}</td>
                  <td className="num text-right">{int(t.records)}</td>
                  <td className="num text-[12px] text-ink-3" title={t.sha256}>{t.sha256.slice(0, 12)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
