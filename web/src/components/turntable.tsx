"use client";

import { useEffect, useRef, useState } from "react";
import { SiMark } from "./art";

/**
 * A concept model the visitor can turn. The clip is one full orbit at constant speed, and a
 * sideways drag (or the arrow keys) moves through it, so the object seems to turn in the hand.
 * It turns slowly by itself until it is first touched.
 */
export function Turntable({ src, label, className = "" }: { src: string; label: string; className?: string }) {
  const video = useRef<HTMLVideoElement>(null);
  const drag = useRef<{ x: number; t: number; width: number } | null>(null);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    const el = video.current;
    if (!el) return;
    el.playbackRate = 0.5;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) el.pause();
    else el.play().catch(() => {});
  }, []);

  function seek(t: number) {
    const el = video.current;
    if (!el || !el.duration) return;
    el.currentTime = ((t % el.duration) + el.duration) % el.duration;
  }

  function hold() {
    video.current?.pause();
    setTouched(true);
  }

  return (
    <div
      role="group"
      tabIndex={0}
      aria-label={`${label}. Drag sideways or use the arrow keys to turn it.`}
      className={`relative cursor-grab touch-pan-y select-none overflow-hidden rounded-sm bg-white active:cursor-grabbing ${className}`}
      onPointerDown={(e) => {
        hold();
        drag.current = { x: e.clientX, t: video.current?.currentTime ?? 0, width: e.currentTarget.clientWidth };
        try {
          // Keep following the pointer if it leaves the picture mid-drag.
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Some pointers cannot be captured; the drag still works while over the picture.
        }
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        const el = video.current;
        if (d && el?.duration) seek(d.t - ((e.clientX - d.x) / d.width) * el.duration);
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
      onKeyDown={(e) => {
        const el = video.current;
        if (!el?.duration || (e.key !== "ArrowLeft" && e.key !== "ArrowRight")) return;
        e.preventDefault();
        hold();
        seek(el.currentTime + (e.key === "ArrowRight" ? 1 : -1) * (el.duration / 24));
      }}
    >
      <video ref={video} src={src} muted loop playsInline preload="auto" className="pointer-events-none block aspect-[4/3] w-full object-cover" />
      <SiMark className="!bottom-auto top-2" />
      <p className="pointer-events-none absolute bottom-2 left-2 rounded-xs bg-ink/80 px-2 py-1 text-[11.5px] text-white">{touched ? "Drag to turn" : "Drag to turn it yourself"}</p>
    </div>
  );
}
