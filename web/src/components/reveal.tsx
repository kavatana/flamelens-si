"use client";

import { useEffect, useRef, type ComponentProps } from "react";

/** A section that eases into place the first time it scrolls into view. Visible at once without scripting or with reduced motion. */
export function Reveal({ className = "", children, ...rest }: ComponentProps<"section">) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    el.classList.add("reveal");
    const watcher = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.classList.add("is-in");
        watcher.disconnect();
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    watcher.observe(el);
    return () => watcher.disconnect();
  }, []);

  return (
    <section ref={ref} className={className} {...rest}>
      {children}
    </section>
  );
}

/**
 * A figure that counts up from zero the first time it scrolls into view, or, with `atLoad`,
 * as the page opens. `digits` keeps that many decimal places.
 */
export function CountUp({ value, className, digits = 0, atLoad = false }: { value: number; className?: string; digits?: number; atLoad?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const written = (x: number) => x.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

  useEffect(() => {
    const el = ref.current;
    if (!el || value === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!atLoad && el.getBoundingClientRect().top < window.innerHeight) return;
    let raf = 0;
    const watcher = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      watcher.disconnect();
      const started = performance.now();
      raf = requestAnimationFrame(function tick(time) {
        const t = Math.min(1, (time - started) / 1100);
        el.textContent = (value * (1 - Math.pow(1 - t, 3))).toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
        if (t < 1) raf = requestAnimationFrame(tick);
      });
    });
    watcher.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      watcher.disconnect();
    };
  }, [value, digits, atLoad]);

  return <span ref={ref} className={className}>{written(value)}</span>;
}
