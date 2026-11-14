/**
 * An answer, made ready to be read aloud: what a listener needs and nothing a voice would
 * stumble on.
 */

/** The longest text sent to be read aloud, in characters. */
export const SPEECH_LIMIT = 600;

/** The text without its source tags, cut at the end of a sentence where it is too long. */
export function forSpeech(text: string): string {
  const plain = text
    .replace(/\s*\[PSI-\d+\]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
  if (plain.length <= SPEECH_LIMIT) return plain;
  const cut = plain.slice(0, SPEECH_LIMIT);
  const end = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("? "), cut.lastIndexOf("! "));
  return end > SPEECH_LIMIT / 2 ? cut.slice(0, end + 1) : cut.slice(0, cut.lastIndexOf(" ")).trimEnd();
}
