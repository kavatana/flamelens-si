import path from "node:path";
import type { NextConfig } from "next";

/**
 * What every page tells the browser about what it may load and where it may be shown.
 * NASA's recordings come from NASA's own storage, in pieces the player fetches; the 3D models
 * and the player build pictures and workers in memory (blob:), and the model decoder is
 * WebAssembly. Nothing else outside this site is loaded.
 */
const NASA_FILES = "https://*.amazonaws.com";
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `media-src 'self' blob: ${NASA_FILES}`,
  `connect-src 'self' blob: data: ${NASA_FILES}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");
const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CONTENT_SECURITY_POLICY },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The microphone is for speaking a question to the SI. Nothing else is asked for.
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  async headers() {
    // The models, clips and drawings keep their names between releases, so a browser may keep them for an hour.
    const kept = [{ key: "Cache-Control", value: "public, max-age=3600" }];
    return [
      { source: "/:path*", headers: SECURITY_HEADERS },
      ...["hero", "video", "illustrations"].map((folder) => ({ source: `/${folder}/:file*`, headers: kept })),
    ];
  },
  partialPrefetching: true,
  turbopack: {
    // The workspace root, so the shared package beside this app is found.
    root: path.join(__dirname, ".."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
