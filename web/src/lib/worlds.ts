/**
 * The four places the home page's flame burns in, from Earth's gravity down to none.
 *
 * NASA's archive holds fire tests at two of them: on the ground and in orbit. Nothing was
 * burned at the gravity of Mars or the Moon, so there the page says the shape is an estimate.
 */
export type World = {
  id: "earth" | "mars" | "moon" | "orbit";
  name: string;
  /** How the headline names it: "Fire on Earth", "Fire in orbit". */
  place: string;
  /** Its gravity, as a share of Earth's. */
  g: number;
  tested: boolean;
  line: string;
  /** NASA's photograph of a candle flame there, where one exists. */
  photo?: { src: string; alt: string; caption: string };
};

export const WORLDS: World[] = [
  {
    id: "earth",
    name: "Earth",
    place: "on Earth",
    g: 1,
    tested: true,
    line: "Hot gas rises. The flame stands tall.",
    photo: { src: "/img/candle-earth.jpg", alt: "NASA photograph of a candle flame on Earth: a tall yellow teardrop.", caption: "NASA photo" },
  },
  { id: "mars", name: "Mars", place: "on Mars", g: 0.38, tested: false, line: "Never tested at this gravity." },
  { id: "moon", name: "Moon", place: "on the Moon", g: 0.17, tested: false, line: "Never tested. The next crews will live here." },
  {
    id: "orbit",
    name: "Orbit",
    place: "in orbit",
    g: 0,
    tested: true,
    line: "Nothing rises. The flame is a blue ball.",
    photo: { src: "/img/candle-orbit.jpg", alt: "NASA photograph of a candle flame in orbit: a small, round, blue dome.", caption: "NASA photo" },
  },
];

const wrap = (i: number) => ((i % WORLDS.length) + WORLDS.length) % WORLDS.length;
const ease = (t: number) => t * t * (3 - 2 * t);

/** Which place is in front after `turns` quarter turns of the ring. Whole numbers are the four places in order, and the ring goes round. */
export const worldAt = (turns: number): number => wrap(Math.round(turns));

/** The pull of gravity at any point of the turn, easing from one place to the next. */
export function gravityAt(turns: number): number {
  const from = Math.floor(turns);
  const a = WORLDS[wrap(from)].g;
  const b = WORLDS[wrap(from + 1)].g;
  return a + (b - a) * ease(turns - from);
}

/**
 * Buoyancy does most of its work at the first fraction of a g, so the flame's shape follows
 * a root of gravity. 1 is the tall flame of Earth, 0 the ball of orbit.
 */
export const stretchOf = (g: number): number => Math.pow(Math.min(1, Math.max(0, g)), 0.6);

/**
 * How warm the flame looks: 1 is the orange of a flame that rises, 0 the blue of one that floats.
 * A flame stays a rising, sooty flame in any real pull of gravity, the Moon's included; it
 * only turns blue when almost nothing is left to lift its hot gas.
 */
export function warmthOf(g: number): number {
  const t = Math.min(1, Math.max(0, g / 0.13));
  return t * t * (3 - 2 * t);
}

type Rgb = [number, number, number];
const toLight = (c: number) => Math.pow(c / 255, 2.2);
const toScreen = (c: number) => Math.round(255 * Math.pow(c, 1 / 2.2));

/** A colour between the flame's blue and its amber, mixed the way light mixes. */
function between(cold: Rgb, warm: Rgb, warmth: number): Rgb {
  return [0, 1, 2].map((i) => toScreen(toLight(cold[i]) + (toLight(warm[i]) - toLight(cold[i])) * warmth)) as Rgb;
}

/** The flame's colour for words on the page's light background: dark enough to read. A slower flame burns a little redder. */
export function flameInk(g: number): string {
  return `rgb(${between([31, 79, 196], between([196, 52, 20], [217, 72, 15], stretchOf(g)), warmthOf(g)).join(" ")})`;
}

/** The flame's colour for light it throws on the page: glows and lit lines. The scene uses the same numbers. */
export function flameGlow(g: number): Rgb {
  return between([64, 112, 255], between([255, 116, 44], [255, 146, 36], stretchOf(g)), warmthOf(g));
}

/**
 * Where scrolling has turned the ring to. `progress` is 0 at the top of the pinned stretch and
 * 1 at its end; the ring rests a moment at each place and turns in between.
 */
export function turnsAtScroll(progress: number): number {
  const last = WORLDS.length - 1;
  const along = Math.min(1, Math.max(0, progress)) * last;
  const from = Math.min(last - 1, Math.floor(along));
  const t = Math.min(1, Math.max(0, (along - from - 0.18) / 0.64));
  return from + ease(t);
}

/** The scroll progress at which a place is squarely in front. */
export const scrollOfWorld = (index: number): number => index / (WORLDS.length - 1);
