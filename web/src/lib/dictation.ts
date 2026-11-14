/**
 * Dictation: the words a visitor speaks, written into the SI's question box as they speak.
 * The browser's own speech recognition does the listening, so it costs nothing and needs no
 * key. These helpers decide what the box shows and what the visitor is told.
 */

/** The longest question the SI accepts. */
export const QUESTION_LIMIT = 500;

/** One piece of what the recogniser has heard. `final` pieces no longer change. */
export type Heard = { text: string; final: boolean };

/** Everything heard since the microphone was switched on, as one line of text. */
export function heardText(pieces: Heard[]): string {
  return pieces.map((p) => p.text).join(" ").replace(/\s+/g, " ").trim();
}

/** What the question box shows: what was typed before the microphone, then what was heard. */
export function joinSpeech(typed: string, heard: string): string {
  const before = typed.trimEnd();
  const said = heard.trim();
  if (!said) return typed;
  // A sentence that starts with speech starts with a capital, as a typed one would.
  const text = before ? `${before} ${said}` : said.charAt(0).toUpperCase() + said.slice(1);
  return text.slice(0, QUESTION_LIMIT);
}

/** What to tell the visitor when the recogniser stops with an error, or null when there is nothing to tell. */
export function speechProblem(code: string): string | null {
  switch (code) {
    case "aborted":
      return null;
    case "no-speech":
      return "Nothing was heard. Press the microphone and try again.";
    case "not-allowed":
    case "service-not-allowed":
      return "The browser blocked the microphone. Allow it for this site, then try again.";
    case "audio-capture":
      return "No microphone was found.";
    case "network":
      return "Speech-to-text needs an internet connection. You can still type your question.";
    case "language-not-supported":
      return "This browser cannot turn English speech into text. You can still type your question.";
    default:
      return "Speech-to-text stopped. Try again, or type your question.";
  }
}
