#!/usr/bin/env node
/**
 * Build the site.
 *
 * The pages are prerendered from the API, so the API has to be answering while the web is
 * built. If it is not running on this machine, this starts it for the length of the build.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");

/** One setting from an env file, or undefined when the file or the line is not there. */
function setting(file, name) {
  try {
    const line = fs.readFileSync(path.join(root, file), "utf8").match(new RegExp(`^${name}=(.*)$`, "m"));
    return line ? line[1].trim().replace(/^["']|["']$/g, "") : undefined;
  } catch {
    return undefined;
  }
}

const apiUrl = (process.env.API_URL ?? setting("web/.env.local", "API_URL") ?? "http://localhost:4000").replace(/\/+$/, "");
const local = ["localhost", "127.0.0.1"].includes(new URL(apiUrl).hostname);

async function answering() {
  try {
    return (await fetch(`${apiUrl}/health`)).ok;
  } catch {
    return false;
  }
}

let api = null;
function stopApi() {
  if (!api?.pid) return;
  try {
    process.kill(-api.pid, "SIGTERM"); // the whole group: the runner, and the server it started
  } catch {
    api.kill();
  }
}

if (!(await answering())) {
  if (!local) {
    console.error(`The API at ${apiUrl} is not answering, so the pages cannot be built from it.`);
    process.exit(1);
  }
  console.log(`Starting the API at ${apiUrl} for the build`);
  // Started directly, not through pnpm, so that stopping it after the build is not reported as a failed script.
  const tsx = createRequire(path.join(root, "api", "package.json")).resolve("tsx/cli");
  api = spawn(process.execPath, [tsx, "src/server.ts"], { cwd: path.join(root, "api"), stdio: "inherit", detached: true, env: { ...process.env, API_PORT: new URL(apiUrl).port || "80" } });
  const deadline = Date.now() + 30_000;
  while (!(await answering())) {
    if (api.exitCode !== null || Date.now() > deadline) {
      console.error(`The API did not come up at ${apiUrl}. Check DATABASE_URL in api/.env, and that the database is loaded (pnpm db:setup).`);
      stopApi();
      process.exit(1);
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }
}

const build = spawnSync("pnpm", ["--filter", "@flamelens/web", "run", "build"], { cwd: root, stdio: "inherit", env: { ...process.env, API_URL: apiUrl } });
stopApi();
process.exit(build.status ?? 1);
