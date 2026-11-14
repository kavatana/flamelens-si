"use client";

import { ArrowRight, Binoculars, CaretDown, Compass, Fire, House, SquaresFour, type Icon } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useLayoutEffect, useRef, useState, type PointerEvent } from "react";
import { EXPLORER, inExplorer } from "./explorer-bar";

/**
 * The way around the site: home and the three features, in one bar that floats over the page.
 * The dashboard answers a question about one cabin, the Flame Lab shows one test, and the
 * Explorer is the archive itself (its experiments, its safety topics, its data), reached
 * through one menu. A dark marker sits under where the visitor is and slides to the next
 * place. The bar leans a little toward the pointer, as an object would. The SI has no entry:
 * it sits inside each feature.
 */
const NAV: { href: string; label: string; icon: Icon; exact?: boolean }[] = [
  { href: "/", label: "Home", icon: House, exact: true },
  { href: "/explore", label: "Dashboard", icon: SquaresFour },
  { href: "/lab", label: "Flame Lab", icon: Fire },
];

const ITEM = "nav-item relative flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[13px] font-medium sm:px-3.5 sm:text-[13.5px]";
const tone = (active: boolean) => (active ? "text-white" : "text-ink-2 hover:text-ink");
/** How far the bar leans, in degrees, with the pointer at its edge. */
const LEAN = { across: 7, along: 9 };

function ExplorerMenu({ pathname }: { pathname: string | null }) {
  const [open, setOpen] = useState(false);
  const menu = useRef<HTMLDivElement>(null);
  const active = inExplorer(pathname);
  useEffect(() => {
    if (!open) return;
    const away = (event: globalThis.PointerEvent) => {
      if (!menu.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", away);
    window.addEventListener("keydown", escape);
    return () => {
      window.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <div ref={menu} className="relative [transform-style:preserve-3d]" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      <button type="button" data-active={active} aria-expanded={open} aria-haspopup="true" aria-controls="explorer-menu" onClick={() => setOpen((on) => !on)} className={`${ITEM} ${tone(active)}`}>
        <Binoculars size={17} weight={active ? "fill" : "regular"} className="hidden shrink-0 sm:block" aria-hidden />
        Explorer
        <CaretDown size={12} weight="bold" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>
      {open && (
        <div id="explorer-menu" className="absolute right-0 top-full z-10 w-[min(316px,calc(100vw-2rem))] pt-3 [transform:translateZ(40px)]">
          <ul className="nav-menu rounded-[18px] p-1.5">
            {EXPLORER.map((view) => {
              const here = pathname !== null && view.under.some((path) => pathname.startsWith(path));
              return (
                <li key={view.href}>
                  <Link href={view.href} onClick={() => setOpen(false)} aria-current={here ? "page" : undefined} className={`group flex items-center gap-3 rounded-[13px] px-2.5 py-2.5 transition-colors ${here ? "bg-wash" : "hover:bg-wash"}`}>
                    <span className={`flex size-10 shrink-0 items-center justify-center rounded-[11px] transition-colors ${here ? "bg-ink text-white" : "bg-wash text-ink-2 group-hover:bg-ink group-hover:text-white"}`}>
                      <view.icon size={19} weight={here ? "fill" : "regular"} aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-semibold text-ink">{view.label}</span>
                      <span className="block truncate text-[12px] text-ink-3">{view.note}</span>
                    </span>
                    <ArrowRight size={15} className="shrink-0 -translate-x-1 text-ink-3 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function Links({ pathname }: { pathname: string | null }) {
  const bar = useRef<HTMLElement>(null);
  const marker = useRef<HTMLSpanElement>(null);

  // The marker is placed under where the visitor is. It is written straight to the element, before the
  // browser paints, so the first placement shows where it belongs and only later ones slide.
  useLayoutEffect(() => {
    const barEl = bar.current;
    const markerEl = marker.current;
    if (!barEl || !markerEl) return;
    const place = () => {
      const active = barEl.querySelector<HTMLElement>('[data-active="true"]');
      if (!active) {
        markerEl.style.opacity = "0";
        return;
      }
      const from = barEl.getBoundingClientRect();
      const to = active.getBoundingClientRect();
      markerEl.style.width = `${active.offsetWidth}px`;
      markerEl.style.transform = `translate3d(${(to.left - from.left + (active.offsetWidth - to.width) / 2).toFixed(1)}px, 0, 8px)`;
      markerEl.style.opacity = "1";
    };
    barEl.style.setProperty("--lean-x", "0deg");
    barEl.style.setProperty("--lean-y", "0deg");
    place();
    const ready = requestAnimationFrame(() => barEl.setAttribute("data-ready", "true"));
    const sizes = new ResizeObserver(place);
    sizes.observe(barEl);
    return () => {
      cancelAnimationFrame(ready);
      sizes.disconnect();
    };
  }, [pathname]);

  function lean(event: PointerEvent<HTMLElement>) {
    const barEl = bar.current;
    if (!barEl || event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = barEl.getBoundingClientRect();
    const x = Math.min(0.5, Math.max(-0.5, (event.clientX - box.left) / box.width - 0.5));
    const y = Math.min(0.5, Math.max(-0.5, (event.clientY - box.top) / box.height - 0.5));
    barEl.classList.add("is-leaning");
    barEl.style.setProperty("--lean-y", `${(x * LEAN.along).toFixed(2)}deg`);
    barEl.style.setProperty("--lean-x", `${(-y * LEAN.across).toFixed(2)}deg`);
  }
  function settle() {
    const barEl = bar.current;
    if (!barEl) return;
    barEl.classList.remove("is-leaning");
    barEl.style.setProperty("--lean-x", "0deg");
    barEl.style.setProperty("--lean-y", "0deg");
  }

  return (
    <nav ref={bar} aria-label="Main" onPointerMove={lean} onPointerLeave={settle} className="nav-bar relative flex items-center gap-0.5 rounded-full p-1">
      <span aria-hidden className="nav-plate" />
      <span ref={marker} aria-hidden className="nav-marker" />
      {NAV.map((item) => {
        const active = pathname !== null && (item.exact ? pathname === item.href : pathname.startsWith(item.href));
        return (
          <Link key={item.href} href={item.href} data-active={active} aria-current={active ? "page" : undefined} aria-label={item.label} className={`${ITEM} ${tone(active)}`}>
            <item.icon size={17} weight={active ? "fill" : "regular"} className={`shrink-0 ${item.exact ? "" : "hidden sm:block"}`} aria-hidden />
            <span className={item.exact ? "hidden sm:inline" : undefined}>{item.label}</span>
          </Link>
        );
      })}
      <ExplorerMenu pathname={pathname} />
    </nav>
  );
}

function ActiveLinks() {
  return <Links pathname={usePathname()} />;
}

export function SiteHeader() {
  return (
    <header className="site-header sticky top-0 z-40 h-[57px]">
      <div className="mx-auto flex h-full w-full max-w-[1400px] items-center justify-between gap-2 px-4 sm:px-6 md:grid md:grid-cols-[1fr_auto_1fr]">
        <Link href="/" className="float flex h-11 shrink-0 items-center gap-2 justify-self-start rounded-full pl-2 pr-2 transition-transform duration-300 hover:-translate-y-0.5 min-[430px]:pr-3.5" aria-label="FlameLens SI home">
          <span className="si-flame" style={{ width: 28, height: 28 }} aria-hidden />
          <span className="hidden text-[15.5px] font-semibold tracking-tight min-[430px]:block">FlameLens</span>
          <span className="num hidden rounded-xs border border-ink px-1 text-[11px] font-medium leading-[1.35] min-[430px]:block">SI</span>
        </Link>
        <Suspense fallback={<Links pathname={null} />}>
          <ActiveLinks />
        </Suspense>
        <Link href="/explore?tour=1" className="float group hidden h-11 items-center gap-1.5 justify-self-end rounded-full px-4 text-[13px] font-medium text-ink transition-transform duration-300 hover:-translate-y-0.5 md:flex">
          <Compass size={17} className="transition-transform duration-500 group-hover:rotate-45" aria-hidden />
          Take the tour
        </Link>
      </div>
    </header>
  );
}
