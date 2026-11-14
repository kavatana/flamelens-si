/**
 * Reading an answer aloud, with ElevenLabs.
 *
 * It is off unless ELEVENLABS_API_KEY is set. The site then falls back to the voice built
 * into the visitor's browser, so the Listen button works either way.
 */

/** The longest text read aloud in one go, in characters. */
export const VOICE_LIMIT = 1000;

/** "River", one of ElevenLabs' own voices: relaxed, neutral, made for reading information. */
const VOICE = process.env.ELEVENLABS_VOICE_ID || "SAz9YHcvj6GT2YYXdXww";
/** The Flash model answers in well under a second and uses half the credits of the larger one. */
const MODEL = process.env.ELEVENLABS_MODEL || "eleven_flash_v2_5";
/** ElevenLabs' address. Set only to point at a gateway or a test double. */
const API = (process.env.ELEVENLABS_API_URL || "https://api.elevenlabs.io").replace(/\/+$/, "");

export function voiceConfigured(): boolean {
  return Boolean(process.env.ELEVENLABS_API_KEY);
}

/** Which reading this is: the same words in the same voice are the same reading. */
export const readingOf = (text: string) => `${VOICE}|${MODEL}|${text}`;

/** Asks ElevenLabs for the text as speech. The answer's body is an MP3 when the answer is ok. */
export function speak(text: string): Promise<Response> {
  return fetch(`${API}/v1/text-to-speech/${encodeURIComponent(VOICE)}?output_format=mp3_44100_64`, {
    method: "POST",
    signal: AbortSignal.timeout(20_000),
    headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY ?? "", "Content-Type": "application/json", Accept: "audio/mpeg" },
    body: JSON.stringify({ text, model_id: MODEL }),
  });
}
