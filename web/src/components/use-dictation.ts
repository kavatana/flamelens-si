"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { heardText, speechProblem, type Heard } from "@/lib/dictation";

/**
 * Speech to text for the SI's question box, done by the browser (the Web Speech API).
 * The words appear while the visitor is still speaking. The microphone switches itself off
 * a few seconds after they stop, so it is never left on by accident.
 */

/** How long to wait, in milliseconds, before switching the microphone off. */
const QUIET_AFTER_SPEECH = 3500;
const QUIET_BEFORE_SPEECH = 8000;

/** The part of the browser's recogniser this hook uses. TypeScript's own DOM types do not include it yet. */
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: { results: SpeechRecognitionResultList }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionClass = new () => Recognition;

function recognitionClass(): RecognitionClass | null {
  const w = window as unknown as { SpeechRecognition?: RecognitionClass; webkitSpeechRecognition?: RecognitionClass };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

const never = () => () => {};

export type Dictation = {
  /** False where the browser has no speech recognition; the microphone is then not offered. */
  supported: boolean;
  listening: boolean;
  /** Why it stopped, in words for the visitor, when it stopped by mistake. */
  problem: string | null;
  start: () => void;
  /** Stops listening. With `discard`, anything still on its way from the recogniser is dropped. */
  stop: (discard?: boolean) => void;
};

/** `onHeard` receives everything heard since the microphone was switched on, each time it changes. */
export function useDictation(onHeard: (text: string) => void): Dictation {
  const supported = useSyncExternalStore(never, () => recognitionClass() !== null, () => false);
  const [listening, setListening] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const session = useRef<{ recognition: Recognition; timer: number; live: boolean } | null>(null);
  const heard = useRef(onHeard);
  useEffect(() => {
    heard.current = onHeard;
  });

  const stop = useCallback((discard = false) => {
    const current = session.current;
    if (!current) return;
    window.clearTimeout(current.timer);
    if (discard) {
      current.live = false;
      current.recognition.abort();
    } else current.recognition.stop();
  }, []);

  const start = useCallback(() => {
    const Recognition = recognitionClass();
    if (!Recognition || session.current) return;
    const recognition = new Recognition();
    const current = { recognition, timer: 0, live: true };
    const quietFor = (ms: number) => {
      window.clearTimeout(current.timer);
      current.timer = window.setTimeout(() => recognition.stop(), ms);
    };
    recognition.lang = "en-US";
    recognition.interimResults = true;
    // Android's Chrome repeats itself when left listening across pauses, so there it takes one sentence at a time.
    recognition.continuous = !/Android/i.test(navigator.userAgent);
    recognition.onresult = (event) => {
      if (!current.live) return;
      const pieces: Heard[] = [];
      for (let i = 0; i < event.results.length; i++) pieces.push({ text: event.results[i][0].transcript, final: event.results[i].isFinal });
      heard.current(heardText(pieces));
      quietFor(QUIET_AFTER_SPEECH);
    };
    recognition.onerror = (event) => {
      if (current.live) setProblem(speechProblem(event.error));
    };
    recognition.onend = () => {
      window.clearTimeout(current.timer);
      if (session.current === current) session.current = null;
      setListening(false);
    };
    try {
      recognition.start();
    } catch {
      setProblem(speechProblem("start-failed"));
      return;
    }
    session.current = current;
    setProblem(null);
    setListening(true);
    quietFor(QUIET_BEFORE_SPEECH);
  }, []);

  // Leaving the page switches the microphone off.
  useEffect(() => () => stop(true), [stop]);

  return { supported, listening, problem, start, stop };
}
