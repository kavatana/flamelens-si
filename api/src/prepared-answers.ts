/**
 * Prepared answers for the highlight questions.
 *
 * Used while the live model is switched off. Only the wording is prepared: the listed
 * lookups run on the database at request time, and every figure in the answer is checked
 * against what they return. If the data changes, the number check on the page shows it.
 */

export type PreparedAnswer = {
  question: string;
  steps: { tool: "search_tests" | "get_experiment" | "evidence_near_cabin" | "search_nasa_text"; input: Record<string, unknown> }[];
  /** The answer in one sentence. */
  short: string;
  /** The evidence, in short paragraphs, with [PSI-xx] citations. */
  answer: string;
  /** What the archive cannot say. */
  unknown?: string;
};

export const PREPARED: PreparedAnswer[] = [
  {
    question: "I am designing a lunar habitat with fabric seats. Which experiments should I read first?",
    steps: [
      { tool: "evidence_near_cabin", input: { oxygen_pct: 34, pressure_kpa: 56.5, fuel: "solid" } },
      { tool: "get_experiment", input: { accession: "PSI-20" } },
      { tool: "get_experiment", input: { accession: "PSI-25" } },
    ],
    short: "Start with BRE for the air, and BASS-II for the fabric. No experiment gives you both.",
    answer:
      "No test in the archive burned a solid near 34% oxygen at 56.5 kPa, so the ranking has to trade the right air against the right material.\n\nBRE [PSI-20] ranks first, with a score of 69. It used a gas burner built to imitate burning solids, and NASA's record says it examined the 34% oxygen atmosphere at 8.2 psia.\n\nFLEX [PSI-69] and CFI-G [PSI-159] rank next because their tests sit closest to this air, but they burned liquid droplets and gas. CFI-G has the only 10 tests that are close.\n\nFor the fabric itself, read BASS-II [PSI-25] and BASS [PSI-26], which burned a cotton and fiberglass fabric. BASS-II lowered the oxygen below normal air and never raised it.",
    unknown: "How a fabric seat burns in this air. The closest solid test, from BASS-II, is 4.8 steps away, and nothing here was measured at the Moon's gravity.",
  },
  {
    question: "Which experiments burned fabric, and at what airflow?",
    steps: [
      { tool: "search_tests", input: { text: "fabric" } },
      { tool: "get_experiment", input: { accession: "PSI-98" } },
      { tool: "get_experiment", input: { accession: "PSI-100" } },
    ],
    short: "Five experiments burned fabric, in 55 test rows. Four of them give an air speed, and BASS does not.",
    answer:
      "Most are small samples of a cotton and fiberglass fabric called SIBAL. BASS-II [PSI-25] has 30 rows, and NASA logged the air speed for every one: between 1 and 53 cm/s, often lowered step by step while the fabric burned. BASS [PSI-26] has 18 rows of the same fabric.\n\nThe three Saffire flights burned much larger sheets inside an uncrewed cargo ship. Saffire-I [PSI-98] and Saffire-II [PSI-99] ran at an airflow of 20 cm/s, and Saffire-III [PSI-100] repeated the large burn at 30 cm/s.",
    unknown: "The BASS table records which fabric was burned but not an air speed. And only the Saffire-II table says, test by test, how far the flame travelled.",
  },
  {
    question: "Has anything been tested at 34% oxygen?",
    steps: [
      { tool: "evidence_near_cabin", input: { oxygen_pct: 34, pressure_kpa: 56.5 } },
      { tool: "get_experiment", input: { accession: "PSI-20" } },
    ],
    short: "Yes, but not with solid materials such as fabric or plastic.",
    answer:
      "Close to NASA's exploration atmosphere of 34% oxygen at 56.5 kPa, the archive has 10 tests, and all of them burned gas, in CFI-G [PSI-159].\n\nFor liquids there is nothing close, though 25 droplet tests sit within two steps. The nearest is a FLEX test at 34% oxygen and 71 kPa [PSI-69].\n\nBRE [PSI-20] is worth reading next. It used a gas burner built to imitate burning solids and its test days list oxygen from 21% to 40%, but its table does not report pressure.",
    unknown: "How a solid burns in this atmosphere. The closest solid test is from BASS at 22.7% oxygen [PSI-26], which is 4.6 steps away.",
  },
  {
    question: "What happens to a flame when the airflow stops?",
    steps: [
      { tool: "search_nasa_text", input: { query: "combustion without air flow elevated-oxygen atmospheres" } },
      { tool: "get_experiment", input: { accession: "PSI-20" } },
    ],
    short: "It depends on the oxygen. At 21% the flame went out by itself. With more oxygen it kept burning.",
    answer:
      "Stopping the ventilation is a standard first step in fighting a fire on a spacecraft, because without gravity a flame relies on moving air to bring it fresh oxygen.\n\nThe Burning Rate Emulator [PSI-20] tested this directly, in still air. NASA reports that at 21% oxygen the flames went out by themselves in a short time. In atmospheres with more oxygen, the kind being considered for future spacecraft, burning continued with no airflow at all.",
    unknown: "Whether a lunar habitat could rely on switching off its fans. NASA calls these results preliminary, and they come from a gas burner that imitates a solid, not from real materials.",
  },
  {
    question: "How did the FLEX droplet tests end?",
    steps: [{ tool: "search_tests", input: { accession: "PSI-69" } }],
    short: "In 186 of 276 tests the flame went out before the fuel was used up.",
    answer:
      "FLEX [PSI-69] burned single droplets of fuel, and its table records how each test ended. A flame going out with fuel left is the result the experiment was looking for, because it shows where a flame can no longer survive. In 62 tests the droplet was disturbed and the test was cut short. In 28 tests the droplet burned to completion.\n\nThe tests covered atmospheres from 12% to 34% oxygen. Many of them added carbon dioxide or helium to the air, which is how FLEX measured the effect of a suppressant gas.",
    unknown: "FLEX burned droplets of liquid fuel. It does not show how a fabric or a plastic panel would behave.",
  },
  {
    question: "What does smoke look like to a detector in space?",
    steps: [
      { tool: "get_experiment", input: { accession: "PSI-102" } },
      { tool: "get_experiment", input: { accession: "PSI-101" } },
    ],
    short: "Different from smoke on Earth: nothing rises, so the particles stay together longer.",
    answer:
      "On the ground, hot smoke rises away from its source. In orbit it does not, and NASA's working idea was that the particles grow larger than they would at normal gravity.\n\nSAME [PSI-102] heated common spacecraft materials until they smoked, then measured the particles. The aim was to learn how sensitive existing smoke detectors are to this kind of smoke.\n\nSAME-R [PSI-101] flew again with better instruments and recorded 109 tests on Kapton, silicone, lamp wick, Pyrell foam and Teflon. It added tests with no airflow while the sample was heated, which is the case closest to a still corner of a cabin.",
    unknown: "The SAME tables in this archive list the tests but give no oxygen or pressure, so they cannot be placed near a particular cabin.",
  },
  {
    question: "Is a lunar habitat safe from fire?",
    steps: [{ tool: "evidence_near_cabin", input: { oxygen_pct: 34, pressure_kpa: 56.5 } }],
    short: "This archive cannot answer that. It can show how much evidence exists, and for a lunar habitat that is not much.",
    answer:
      "At NASA's exploration atmosphere of 34% oxygen and 56.5 kPa, there are 10 tests close by, all burning gas [PSI-159]. There are none for solid materials, which are what a habitat is built and furnished from.\n\nBeing close in oxygen and pressure does not make a test the same: airflow, material and shape all change how something burns.",
    unknown: "Every flight test here ran weightless, so nothing was measured at the Moon's gravity. Nobody should read a safety verdict into this page.",
  },
];

const normalize = (text: string) => text.toLowerCase().replace(/[^a-z0-9% ]+/g, " ").replace(/\s+/g, " ").trim();

/** Words that carry no topic, and a few everyday words mapped to the ones the questions use. */
const FILLER = new Set("a an the is are was were be been do does did has have had to of in on at for and or it its this that these those what which how when who why i am me my we you your with by from any anything something should can could would will there about nasa experiment experiments test tests tested please tell show".split(" "));
const SAME: Record<string, string> = { moon: "lunar", base: "habitat", cloth: "fabric", fabrics: "fabric", textile: "fabric", seat: "seats", wind: "airflow", fan: "airflow", fans: "airflow", ventilation: "airflow", stop: "stops", stopped: "stops", off: "stops", alarm: "detector", alarms: "detector", detectors: "detector", ended: "end", finish: "end", droplets: "droplet", drops: "droplet", o2: "oxygen" };
const topicWords = (text: string) => new Set(normalize(text).split(" ").map((w) => SAME[w] ?? w).filter((w) => w.length > 1 && !FILLER.has(w)));

/**
 * The prepared answer for a question: the same wording, or failing that the prepared
 * question that shares most of its topic words. Returns null when nothing is close.
 */
export function findPrepared(question: string): PreparedAnswer | null {
  const q = normalize(question);
  const exact = PREPARED.find((p) => normalize(p.question) === q);
  if (exact) return exact;
  const asked = topicWords(question);
  let best: PreparedAnswer | null = null;
  let bestScore = 0;
  for (const entry of PREPARED) {
    const words = topicWords(entry.question);
    const shared = [...asked].filter((w) => words.has(w)).length;
    if (shared < 2) continue;
    const overlap = shared / new Set([...asked, ...words]).size;
    const covered = shared / asked.size;
    const score = Math.max(overlap, covered >= 0.75 ? 0.4 + overlap / 2 : 0);
    if (score >= 0.4 && score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }
  return best;
}

/** True when two questions are the same apart from case and punctuation. */
export const sameQuestion = (a: string, b: string) => normalize(a) === normalize(b);
