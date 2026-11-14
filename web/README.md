# FlameLens web

The site: Next.js pages and components. It holds no data.

- Server components read through `src/lib/data.ts`, which asks the API and caches the answer.
- The browser's requests under `/api` are passed on to the API by `src/app/api/[...path]/route.ts`.
- The rules for bands, scoring, filters and formats come from the `shared` package.

```bash
cp .env.example .env.local    # API_URL
pnpm dev                      # http://localhost:3000, with the API running
pnpm test
```

This version of Next.js differs from older ones. Its guides are in `node_modules/next/dist/docs/`; read them before changing how pages are cached or routed.
