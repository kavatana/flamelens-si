"use client";

import { Pause, Play } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { useNear } from "@/lib/use-near";

/**
 * A silent, looping clip with a pause control. It is fetched and started when the visitor scrolls
 * near it, and does not autoplay for visitors who ask for reduced motion.
 */
export function LoopVideo({ src, poster, label }: { src: string; poster: string; label: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const near = useNear(ref);

  useEffect(() => {
    const video = ref.current;
    if (!near || !video || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    video.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [near]);

  function toggle() {
    const video = ref.current;
    if (!video) return;
    if (video.paused) video.play().then(() => setPlaying(true)).catch(() => {});
    else {
      video.pause();
      setPlaying(false);
    }
  }

  return (
    <div className="relative overflow-hidden rounded-sm bg-ink">
      <video ref={ref} src={src} poster={poster} muted loop playsInline preload="none" aria-label={label} className="block aspect-[1120/534] w-full object-cover" />
      <button type="button" onClick={toggle} className="btn absolute bottom-3 right-3 bg-surface/95" aria-label={playing ? "Pause the video" : "Play the video"}>
        {playing ? <Pause size={14} weight="fill" /> : <Play size={14} weight="fill" />}
        {playing ? "Pause" : "Play"}
      </button>
    </div>
  );
}
