"use client";

import { ArrowRight, Check, Warning } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { WORLDS, flameGlow, flameInk, gravityAt, scrollOfWorld, turnsAtScroll, worldAt } from "@/lib/worlds";
import { CountUp } from "../reveal";
import type { Layout } from "../space/scene";

/**
 * The home page's first screen: one flame at four gravities.
 *
 * NASA's 3D models of Earth, Mars, the Moon and the space station stand on an orbit around a
 * flame. The one in front is large, with the flame right above it, and the flame takes the
 * shape that its gravity would give it. The orbit turns by itself until the visitor scrolls;
 * from then on the scroll turns it. The page begins at a horizon lit in the flame's colour,
 * and one bar of glass floats on that horizon with the three numbers the site turns on.
 *
 * The scene is drawn by ../space/scene, fetched only in the browser after the words are shown.
 */

type Props = {
  tests: number;
  /** The most oxygen any solid material was burned in, in percent. */
  solidTop: number;
  /** How many tests on solid materials reach the oxygen planned for Moon cabins. */
  solidAtMoon: number;
  moonHref: string;
};

/** While the orbit turns by itself: how long each place stays in front, in seconds. */
const DWELL = 4.6;
/** Seconds after the scene starts during which the orbit takes its place at once. */
const SETTLE = 0.5;
/** From this width the picture runs down behind the bar of numbers, and the place in front rises from behind it. */
const WIDE = "(min-width: 1024px)";

export function SpaceHero({ tests, solidTop, solidAtMoon, moonHref }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const free = useRef<HTMLDivElement>(null);
  const dock = useRef<HTMLDListElement>(null);
  const chips = useRef<(HTMLButtonElement | null)[]>([]);
  const tag = useRef<HTMLParagraphElement>(null);
  const pulls = useRef<(HTMLSpanElement | null)[]>([]);
  const choose = useRef<(index: number) => void>(() => {});
  const [front, setFront] = useState(0);
  const [drawn, setDrawn] = useState(false);
  const world = WORLDS[front];

  useEffect(() => {
    const trackEl = track.current;
    const stageEl = stage.current;
    const canvasEl = canvas.current;
    const freeEl = free.current;
    const dockEl = dock.current;
    if (!trackEl || !stageEl || !canvasEl || !freeEl || !dockEl) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wide = window.matchMedia(WIDE);
    let stopped = false;
    let raf = 0;
    let cleanup = () => {};

    (async () => {
      const { createSpaceScene } = await import("../space/scene");
      if (stopped) return;
      let scene: ReturnType<typeof createSpaceScene>;
      try {
        scene = createSpaceScene(canvasEl, { still, small: window.innerWidth < 768 });
      } catch {
        return; // No WebGL: the words, the buttons and the numbers stand without the picture.
      }

      /** Tells the scene which part of the canvas is its own, and runs the horizon through the middle of the bar of numbers. */
      const measure = () => {
        const whole = canvasEl.getBoundingClientRect();
        const open = freeEl.getBoundingClientRect();
        const bar = dockEl.getBoundingClientRect();
        // On a wide screen the place in front reaches down behind the bar and ends inside it.
        scene.frame(Math.max(0, open.top - whole.top), wide.matches ? Math.max(0, whole.bottom - bar.bottom) + 6 : Math.max(0, whole.bottom - open.bottom));
        stageEl.style.setProperty("--ground", `${Math.round(whole.bottom - (bar.top + bar.height / 2))}px`);
      };
      measure();

      /** How far through the pinned stretch the page has scrolled, or null where the screen is not pinned. */
      const scrolled = () => {
        const range = trackEl.offsetHeight - stageEl.offsetHeight;
        if (range < 40) return null;
        return Math.min(1, Math.max(0, -trackEl.getBoundingClientRect().top / range));
      };

      let turns = 0;
      let goal = 0;
      let alone = !still;
      let shown = -1;
      let visible = true;
      let last = performance.now();
      // The scene's own clock: it runs only while the scene is drawn, so time spent on another page or tab is never made up for in a rush.
      let clock = 0;
      let nextTurn = DWELL;

      /** Puts each name under the world the scene drew, and the tag of the place in front beside it. */
      const label = (layout: Layout, settled: number) => {
        const tagEl = tag.current;
        if (tagEl) {
          // The tag steps aside while the orbit turns, and comes back when a place has arrived.
          tagEl.style.transform = `translate3d(${(layout.slot.x + layout.slot.r * 0.86).toFixed(1)}px, ${(layout.slot.y - layout.slot.r * 0.52).toFixed(1)}px, 0) translateY(-50%)`;
          tagEl.style.opacity = String(settled);
        }
        layout.bodies.forEach((spot, i) => {
          const chip = chips.current[i];
          if (!chip) return;
          // A label never covers the flame or the place in front: it fades while its world passes behind them.
          const clear = spot.behind ? Math.min(1, Math.max(0, (Math.abs(spot.x - layout.flame.x) - 70) / 60)) : 1;
          const aside = wide.matches ? Math.min(1, Math.max(0, (0.8 - spot.focus) / 0.3)) : 1;
          const see = Math.min(1, spot.shown * 1.4) * clear * aside;
          chip.style.transform = `translate3d(${spot.x.toFixed(1)}px, ${(spot.y + spot.r + 10).toFixed(1)}px, 0) translateX(-50%)`;
          chip.style.opacity = String(see);
          chip.style.pointerEvents = see < 0.5 ? "none" : "";
        });
      };

      const paint = (seconds: number, delta: number) => {
        const layout = scene.draw(turns, seconds, delta);
        const g = gravityAt(turns);
        stageEl.style.setProperty("--ink-flame", flameInk(g));
        stageEl.style.setProperty("--glow", flameGlow(g).join(" "));
        stageEl.style.setProperty("--flame-x", `${layout.flame.x.toFixed(1)}px`);
        stageEl.style.setProperty("--flame-y", `${((layout.flame.y + layout.flame.top) / 2).toFixed(1)}px`);
        for (const el of pulls.current) if (el) el.textContent = g.toFixed(2);
        label(layout, Math.min(1, Math.max(0, 1 - Math.abs(turns - Math.round(turns)) / 0.2)));
        const index = worldAt(turns);
        if (index !== shown) {
          shown = index;
          setFront(index);
        }
      };

      choose.current = (index) => {
        alone = false;
        const range = trackEl.offsetHeight - stageEl.offsetHeight;
        if (range >= 40) {
          // Pinned: the scroll position is the single source of truth, so the page moves to match.
          const top = trackEl.getBoundingClientRect().top + window.scrollY;
          window.scrollTo({ top: top + scrollOfWorld(index) * range, behavior: still ? "instant" : "smooth" });
          return;
        }
        goal = index + 4 * Math.round((turns - index) / 4);
        if (still) {
          turns = goal;
          paint(0, 1);
        }
      };

      const sizes = new ResizeObserver(measure);
      sizes.observe(stageEl);
      sizes.observe(freeEl);
      sizes.observe(dockEl);
      const watcher = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting));
      watcher.observe(stageEl);
      const point = (event: PointerEvent) => {
        if (event.pointerType === "mouse") scene.lean((event.clientX / window.innerWidth) * 2 - 1, 1 - (event.clientY / window.innerHeight) * 2);
      };
      if (!still) window.addEventListener("pointermove", point, { passive: true });

      cleanup = () => {
        sizes.disconnect();
        watcher.disconnect();
        window.removeEventListener("pointermove", point);
        scene.dispose();
      };

      if (still) {
        // One settled picture, drawn again as the models arrive.
        paint(0, 1);
        setDrawn(true);
        const settle = window.setInterval(() => paint(0, 1), 350);
        const done = window.setTimeout(() => window.clearInterval(settle), 15000);
        const before = cleanup;
        cleanup = () => {
          window.clearInterval(settle);
          window.clearTimeout(done);
          before();
        };
        return;
      }

      let first = true;
      raf = requestAnimationFrame(function frame(now) {
        raf = requestAnimationFrame(frame);
        const delta = Math.min(0.05, Math.max(0, now - last) / 1000);
        last = now;
        if (!visible) return;
        clock += delta;
        const seconds = clock;
        const p = scrolled();
        // Until the visitor scrolls or picks a place, the orbit goes round by itself.
        if (alone && p !== null && p > 0.012) alone = false;
        if (alone) {
          if (seconds > nextTurn) {
            nextTurn += DWELL;
            goal += 1;
          }
        } else if (p !== null) {
          // The same place is in front every four quarter turns: take the nearest way round from where the orbit is now.
          const asked = turnsAtScroll(p);
          goal = asked + 4 * Math.round((turns - asked) / 4);
        }
        // Coming back to this page, the browser puts the scroll back a moment after the scene starts.
        // For that first half second the orbit is simply where the page is, and does not race there.
        if (clock < SETTLE) turns = goal;
        else turns += (goal - turns) * (1 - Math.exp(-delta * 3.2));
        paint(seconds, delta);
        if (first) {
          first = false;
          setDrawn(true);
        }
      });
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      cleanup();
    };
  }, []);

  return (
    <section aria-label="One flame at four gravities" className="space-hero">
      <div ref={track} className="space-track">
        <div ref={stage} className="space-stage">
          <div aria-hidden className="space-sun" />
          <div aria-hidden className="space-bloom" />
          <div aria-hidden className="space-ground is-fill" />
          <div aria-hidden className="space-ground is-line" />
          <canvas ref={canvas} aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full transition-opacity duration-700 ${drawn ? "opacity-100" : "opacity-0"}`} />
          <p className="sr-only">An illustration: a flame drawn at the gravity of Earth, Mars, the Moon and orbit, with NASA&apos;s 3D model of each around it.</p>

          <div className="relative z-[2] mx-auto w-full max-w-[900px] px-4 pt-[clamp(14px,3.6vh,36px)] text-center sm:px-6">
            <h1 className="text-[clamp(38px,7.6vh,70px)] font-semibold leading-[1.02] tracking-[-0.035em]">
              Fire{" "}
              <span key={front} className="word-in inline-block" style={{ color: "var(--ink-flame)" }}>{world.place}</span>
            </h1>
            <p className="mx-auto mt-[clamp(6px,1.4vh,14px)] max-w-[36ch] text-[15.5px] leading-snug text-ink-2 sm:max-w-none sm:text-[17px]">
              Every fire test in NASA&apos;s open archive, and what was never tested.
            </p>
            <div className="mt-[clamp(10px,2.2vh,20px)] flex flex-wrap items-center justify-center gap-2.5">
              <Link href="/explore" className="btn btn-solid btn-lg">Open the dashboard <ArrowRight size={17} /></Link>
              <Link href="/lab" className="btn btn-lg">Watch real flames</Link>
            </div>
          </div>

          <div ref={free} className="relative z-[2] min-h-0 flex-1" />

          {/* Names that follow the worlds at the sides. On a phone they are a row under the picture instead. */}
          <div className="pointer-events-none absolute inset-0 z-[2] hidden sm:block">
            {WORLDS.map((w, i) => (
              <button
                key={w.id}
                ref={(el) => {
                  chips.current[i] = el;
                }}
                type="button"
                aria-pressed={i === front}
                onClick={() => choose.current(i)}
                style={{ opacity: 0 }}
                className="float pointer-events-auto absolute left-0 top-0 flex h-8 items-center gap-2 whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold text-ink transition-colors duration-300 hover:bg-surface"
              >
                {w.name}
                <span className="num text-[11.5px] font-normal text-ink-3">{w.g} g</span>
              </button>
            ))}
            <p ref={tag} style={{ opacity: 0 }} className="absolute left-0 top-0 hidden h-9 items-center gap-2.5 whitespace-nowrap rounded-full bg-ink pl-4 pr-3.5 text-[13.5px] font-semibold text-white shadow-[0_12px_24px_-12px_rgba(20,23,26,0.75)] lg:flex" aria-live="polite">
              {world.name}
              <span className="num text-[12.5px] font-normal text-white/70"><span ref={(el) => { pulls.current[0] = el; }}>{world.g.toFixed(2)}</span> g</span>
              <span key={world.id} className={`word-in flex items-center gap-1 border-l border-white/20 pl-2.5 text-[12px] font-medium ${world.tested ? "text-white/85" : "text-[#ffcf8a]"}`}>
                {world.tested ? <Check size={13} weight="bold" aria-hidden /> : <Warning size={13} weight="fill" aria-hidden />}
                {world.tested ? "NASA tested" : "never tested"}
              </span>
            </p>
          </div>

          <div className="relative z-[2] px-4 pb-3 text-center lg:hidden">
            <div role="group" aria-label="Choose a place" className="inline-flex gap-1 sm:hidden">
              {WORLDS.map((w, i) => (
                <button key={w.id} type="button" aria-pressed={i === front} onClick={() => choose.current(i)} className="btn h-8 px-2.5">{w.name}</button>
              ))}
            </div>
            <p className="mt-2 text-[13px] leading-snug text-ink-2">
              <span className="num font-medium" style={{ color: "var(--ink-flame)" }}><span ref={(el) => { pulls.current[1] = el; }}>{world.g.toFixed(2)}</span> g</span>
              <span key={world.id} className="word-in ml-2 inline-block">{world.tested ? "NASA tested this" : "Never tested: this shape is an estimate"}</span>
            </p>
          </div>

          {/* One bar of glass on the horizon: the three numbers the site turns on. */}
          <div className="relative z-[3] mx-auto w-full max-w-[860px] px-3 pb-[clamp(10px,2.4vh,24px)] sm:px-6">
            <dl ref={dock} className="dock grid grid-cols-3">
              <div className="dock-cell">
                <dd className="dock-figure"><CountUp value={tests} atLoad /></dd>
                <dt>
                  <span className="dock-title">NASA fire tests</span>
                  <span className="dock-note">read into one table</span>
                </dt>
              </div>
              <div className="dock-cell">
                <dd className="dock-figure"><CountUp value={solidTop} digits={1} atLoad />%</dd>
                <dt>
                  <span className="dock-title">Most oxygen tested</span>
                  <span className="dock-note">on fabric and plastic</span>
                </dt>
              </div>
              <div className="dock-cell">
                <dd className="dock-figure text-accent">30%+</dd>
                <dt>
                  <span className="dock-title">Planned for the Moon</span>
                  <Link href={moonHref} className="dock-note group font-medium text-caution hover:underline">
                    {solidAtMoon === 0 ? "never tested" : `${solidAtMoon} tests reach it`} <ArrowRight size={11} weight="bold" className="inline transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                </dt>
              </div>
            </dl>
          </div>
        </div>
      </div>
      <p className="mx-auto max-w-[1400px] px-4 pt-2 text-[11.5px] leading-snug text-ink-3 sm:px-6">
        The flame is an illustration drawn by code, not footage. Earth, Mars, the Moon and the space station are NASA&apos;s own 3D models.
      </p>
    </section>
  );
}
