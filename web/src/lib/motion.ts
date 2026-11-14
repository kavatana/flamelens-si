import "server-only";
import { readdir } from "node:fs/promises";
import path from "node:path";
import { cacheLife } from "next/cache";

/**
 * Animated versions of the concept drawings, if any have been added.
 *
 * A clip saved as public/illustrations/motion/<name>.mp4 (or .webm) is picked up for the
 * drawing public/illustrations/<name>.jpg. With no clips the site shows the still drawings.
 * Returns drawing path -> clip path.
 */
export async function getMotion(): Promise<Record<string, string>> {
  "use cache";
  cacheLife("days");
  try {
    const files = await readdir(path.join(process.cwd(), "public", "illustrations", "motion"));
    return Object.fromEntries(
      files.filter((f) => /\.(mp4|webm)$/.test(f)).map((f) => [`/illustrations/${f.replace(/\.(mp4|webm)$/, "")}.jpg`, `/illustrations/motion/${f}`]),
    );
  } catch {
    return {};
  }
}

/**
 * Optional pictures that are used only once they have been added to public/illustrations:
 * wider story scenes (scene-<name>.jpg) and turntable clips (motion/turn-<name>.mp4).
 */
export async function getExtras(): Promise<{ scenes: Record<string, string>; turns: Record<string, string> }> {
  "use cache";
  cacheLife("days");
  const list = async (...dir: string[]) => {
    try {
      return await readdir(path.join(process.cwd(), "public", "illustrations", ...dir));
    } catch {
      return [];
    }
  };
  const [stills, clips] = await Promise.all([list(), list("motion")]);
  const named = (files: string[], prefix: string, ext: RegExp, base: string) =>
    Object.fromEntries(files.filter((f) => f.startsWith(prefix) && ext.test(f)).map((f) => [f.slice(prefix.length).replace(ext, ""), `${base}/${f}`]));
  return {
    scenes: named(stills, "scene-", /\.(jpe?g|png|webp)$/, "/illustrations"),
    turns: named(clips, "turn-", /\.(mp4|webm)$/, "/illustrations/motion"),
  };
}
