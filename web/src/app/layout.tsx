import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { SiProvider } from "@/components/si-chat";
import { SiteHeader } from "@/components/site-header";
import { getInvestigations, getReference } from "@/lib/data";
import { kpa, pct } from "@flamelens/shared/format";
import { fromPreset, toQuery } from "@/lib/scenario";
import "./globals.css";

const plexSans = IBM_Plex_Sans({ variable: "--font-plex-sans", subsets: ["latin"], weight: ["400", "500", "600"] });
const plexMono = IBM_Plex_Mono({ variable: "--font-plex-mono", subsets: ["latin"], weight: ["400", "500"] });

export const metadata: Metadata = {
  title: { default: "FlameLens SI", template: "%s · FlameLens SI" },
  description:
    "Every itemized test in NASA's microgravity combustion archive, placed by oxygen and pressure, ranked for your cabin atmosphere, with the source of every value.",
  // NASA Space Apps asks that SI-generated code and pictures say so in text and in metadata.
  other: {
    "si-use": "Code, data pipeline and site text written with Claude (Anthropic). Concept illustrations generated with Higgsfield and marked SI-generated. All numbers come from NASA PSI tables through code, not from a model. Details: /methods#ai",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // What the SI needs to carry out a request: the experiments by name, and NASA's cabins as dashboard links.
  const [investigations, reference] = await Promise.all([getInvestigations(), getReference()]);
  const names = Object.fromEntries(investigations.map((i) => [i.accession, i.short]));
  const cabins = reference.scenarios.map((preset) => {
    const cabin = fromPreset(preset, reference.environments);
    return { id: preset.id, name: preset.name, label: `the ${preset.name.toLowerCase()} (${pct(cabin.o2)} oxygen at ${kpa(cabin.p)})`, query: toQuery(cabin) };
  });
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="flex min-h-[100dvh] flex-col">
        <a href="#main" className="btn btn-solid sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50">
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 pb-20 pt-8 sm:px-6">
          <SiProvider names={names} cabins={cabins}>{children}</SiProvider>
        </main>
        <footer className="border-t border-rule">
          <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-2 px-4 py-6 text-[13px] text-ink-3 sm:px-6 md:flex-row md:justify-between">
            <p className="max-w-[70ch]">
              FlameLens SI (Super Intelligence) is built on open data from NASA&apos;s Physical Sciences Informatics repository. It is an
              independent 2026 NASA Space Apps Challenge entry and is not affiliated with or endorsed by NASA.
            </p>
            <p>
              Relevance is not safety. Read the <a className="link" href="/methods">methods and limits</a>.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
