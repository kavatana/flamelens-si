# FlameLens API

The data service behind the site: a small Node server (Hono) over Postgres (Drizzle).

| Where | What |
|---|---|
| `src/app.ts` | The routes, and the list of reads the site may ask for |
| `src/server.ts` | Starts the server |
| `src/queries.ts` | Every query, one function each |
| `src/routes/` | The endpoints the browser uses: one record, the export, the SI, NASA's video of a test, feedback |
| `src/guard.ts` | What a visitor may send: the cabin as checked numbers, and who counts as one visitor for the limits |
| `src/si.ts` | The SI: a language model, reached through Amazon Bedrock, that may only call fixed lookups, with a check on every number it writes |
| `src/db/` | The schema and the database client |
| `drizzle/`, `scripts/` | The migrations, and the scripts that apply them and load `data/curated` |

```bash
cp .env.example .env    # DATABASE_URL, API_PORT
pnpm db:setup           # create the tables and load data/curated
pnpm dev                # http://localhost:4000
pnpm test
```

The addresses are listed in the README at the root of the repository.
