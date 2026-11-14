"use client";

import { FilmStrip, Play } from "@phosphor-icons/react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { bytes } from "@flamelens/shared/format";
import { askTheSi } from "../si-chat";

/**
 * NASA's own video of one test, played straight from NASA's archive.
 *
 * Nothing is loaded until the visitor presses play: the site then asks PSI for a link to the
 * file and hands it to the browser. The picture is NASA's, unedited; the tests it is shown
 * for were tied to their files by the label in NASA's own file name.
 *
 * NASA keeps two kinds of file. An .mp4 plays as it is. A .ts file is the recording of the
 * rig's video downlink, which no browser opens directly: it is read in pieces from NASA's
 * storage and handed to the video element as it arrives (mpegts.js).
 */

/** The size of each view's file, in bytes, for a test that has a video. */
export type TestClips = { main?: number; second?: number };

type Props = {
  /** The test to show: its record id, its label in NASA's table, and its conditions in words. */
  test: { id: string; label: string; conditions: string } | null;
  clips: TestClips | undefined;
  experiment: string;
  /** How many tests in view have a video, out of how many. */
  have: number;
  of: number;
  /** What the visitor is looking at, in a sentence. */
  note: string;
  /** The SI, as the lower part of this card. */
  children?: ReactNode;
};

type State = { status: "idle" } | { status: "loading" } | { status: "playing"; url: string; stream: boolean; bytes: number } | { status: "failed"; why: string };

/** A file this large plays as it loads, and waits on a slow connection. */
const LARGE = 60e6;
const SKIPS: [string, number][] = [["Start", 0], ["¼", 0.25], ["Half", 0.5], ["¾", 0.75]];

/** A downlink recording (.ts), read from NASA's storage from a chosen point onward. */
function Stream({ url, size, label, onFail }: { url: string; size: number; label: string; onFail: (why: string) => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [from, setFrom] = useState(0);
  const [waiting, setWaiting] = useState(true);
  const failed = useRef(onFail);
  useEffect(() => {
    failed.current = onFail;
  });

  useEffect(() => {
    const element = video.current;
    if (!element) return;
    let stopped = false;
    let player: { destroy: () => void } | null = null;
    // A transport stream is made of 188-byte packets, so a starting point has to fall on one.
    const base = Math.floor((from * size) / 188) * 188;
    (async () => {
      const mpegts = (await import("mpegts.js")).default;
      if (stopped) return;
      if (!mpegts.isSupported()) return failed.current("This browser cannot play NASA's downlink recording.");
      mpegts.LoggingControl.enableAll = false;
      class FromHere {
        getConfig(source: string, range: { from: number; to: number }) {
          const start = base + range.from;
          return { url: source, headers: { Range: range.to === -1 ? `bytes=${start}-` : `bytes=${start}-${base + range.to}` } };
        }
        removeURLParameters(source: string) {
          return source;
        }
      }
      const made = mpegts.createPlayer({ type: "mpegts", isLive: true, url }, { enableWorker: false, enableStashBuffer: false, liveBufferLatencyChasing: false, seekType: "custom", customSeekHandler: FromHere });
      player = made;
      made.on(mpegts.Events.ERROR, () => failed.current("NASA's recording stopped loading. Try again in a moment."));
      made.attachMediaElement(element);
      made.load();
      element.play().catch(() => setWaiting(false));
    })();
    return () => {
      stopped = true;
      player?.destroy();
    };
  }, [url, size, from]);

  return (
    <>
      <video ref={video} controls muted playsInline className="h-full w-full" aria-label={label} onWaiting={() => setWaiting(true)} onPlaying={() => setWaiting(false)} />
      {waiting && <p className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[13px] text-white/80">Loading from NASA&apos;s archive<span className="si-dots" aria-hidden /></p>}
      <p className="absolute bottom-12 right-3 flex items-center gap-1 rounded-xs bg-black/70 px-1.5 py-1 text-[11.5px] text-white">
        <span className="mr-1 text-white/70">Skip to</span>
        {SKIPS.map(([name, point]) => (
          <button key={name} type="button" onClick={() => { setWaiting(true); setFrom(point); }} aria-pressed={from === point} className={`rounded-xs px-1.5 py-0.5 ${from === point ? "bg-white text-ink" : "hover:bg-white/20"}`}>
            {name}
          </button>
        ))}
      </p>
    </>
  );
}

function Player({ test, clips, experiment }: { test: NonNullable<Props["test"]>; clips: TestClips; experiment: string }) {
  const [view, setView] = useState<"main" | "second">(clips.main ? "main" : "second");
  const [state, setState] = useState<State>({ status: "idle" });
  const size = clips[view] ?? 0;
  const label = `NASA's video of ${experiment} test ${test.label}`;

  async function play(which: "main" | "second") {
    setView(which);
    setState({ status: "loading" });
    try {
      const response = await fetch(`/api/footage?id=${encodeURIComponent(test.id)}&view=${which}`);
      const body = (await response.json()) as { url?: string; file?: string; bytes?: number; error?: string };
      if (!response.ok || !body.url) throw new Error(body.error ?? "The video could not be opened.");
      setState({ status: "playing", url: body.url, stream: /\.ts$/i.test(body.file ?? ""), bytes: body.bytes ?? size });
    } catch (error) {
      setState({ status: "failed", why: error instanceof Error ? error.message : "The video could not be opened." });
    }
  }

  return (
    <>
      <div className="relative aspect-[3/2] bg-[#0f1114]">
        {state.status === "playing" ? (
          state.stream ? (
            <Stream key={state.url} url={state.url} size={state.bytes} label={label} onFail={(why) => setState({ status: "failed", why })} />
          ) : (
            <video key={state.url} src={state.url} controls autoPlay playsInline className="h-full w-full" aria-label={label} onError={() => setState({ status: "failed", why: "The browser could not play NASA's file." })} />
          )
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center text-white">
            <button type="button" onClick={() => play(view)} disabled={state.status === "loading"} className="flex size-16 items-center justify-center rounded-full bg-white text-ink transition-transform hover:scale-105 disabled:opacity-60" aria-label={`Play ${label}`}>
              <Play size={26} weight="fill" />
            </button>
            <p className="text-[15px] font-semibold">{state.status === "loading" ? "Asking NASA's archive for the video…" : `Play NASA's video of test ${test.label}`}</p>
            <p className="max-w-[44ch] text-[12.5px] leading-snug text-white/65">
              {state.status === "failed" ? (
                <span className="text-[#ffb37a]">{state.why}</span>
              ) : size > LARGE ? (
                <>NASA&apos;s full-quality recording, {bytes(size)}. It plays as it loads and pauses to catch up on a slow connection.</>
              ) : (
                <>{bytes(size)}, streamed from NASA&apos;s archive. Nothing loads until you press play.</>
              )}
            </p>
          </div>
        )}
        <p className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5 rounded-xs bg-white/95 px-2 py-1 text-[12px] font-medium text-ink">
          <FilmStrip size={14} /> NASA footage · {experiment} test {test.label}
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-rule px-4 py-2.5">
        <p className="min-w-0 text-[13px] leading-snug"><span className="font-semibold">Test {test.label}.</span> <span className="text-ink-2">{test.conditions}</span></p>
        <span className="flex gap-1.5">
          {clips.main && clips.second && (
            <span className="flex gap-1" role="group" aria-label="Camera">
              <button type="button" className="btn" aria-pressed={view === "main"} onClick={() => (state.status === "idle" ? setView("main") : play("main"))}>Camera 1</button>
              <button type="button" className="btn" aria-pressed={view === "second"} onClick={() => (state.status === "idle" ? setView("second") : play("second"))}>Camera 2</button>
            </span>
          )}
          <button type="button" className="btn" onClick={() => askTheSi(`What did ${experiment} test ${test.label} show?`)}>
            <span className="si-orb" aria-hidden /> Ask the SI
          </button>
        </span>
      </div>
    </>
  );
}

export function TestFootage({ test, clips, experiment, have, of, note, children }: Props) {
  return (
    <section aria-label="NASA's video of the nearest test" className="panel overflow-hidden">
      {test && clips && (clips.main || clips.second) ? (
        <Player key={test.id} test={test} clips={clips} experiment={experiment} />
      ) : (
        <div className="flex aspect-[3/1] flex-col items-center justify-center gap-1.5 bg-wash px-6 text-center">
          <FilmStrip size={22} className="text-ink-3" />
          <p className="text-[14px] font-semibold">{test ? `NASA's archive has no video named for test ${test.label}.` : "No test to show at this setting."}</p>
          <p className="max-w-[52ch] text-[12.5px] text-ink-2">
            {have > 0 ? `${have} of these ${of} tests have one. Choose a test marked Watch, or switch on "Only tests with NASA's video".` : "NASA's archive names no video for these tests. Their measurements are below."}
          </p>
        </div>
      )}
      <p title={note} className="border-t border-rule px-4 py-2 text-[11.5px] leading-snug text-ink-3">NASA&apos;s own recording, unedited, from the PSI archive.</p>
      {children}
    </section>
  );
}
