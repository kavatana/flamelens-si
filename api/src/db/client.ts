import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
}

// One connection pool per server instance. In development the module is re-evaluated on
// every edit, so the pool is kept on globalThis to avoid exhausting connections.
const globalForDb = globalThis as unknown as { __flamelensSql?: ReturnType<typeof postgres> };

const sql =
  globalForDb.__flamelensSql ??
  postgres(url, {
    max: 5,
    idle_timeout: 20,
    // Neon's pooled endpoint runs PgBouncer in transaction mode, which cannot keep prepared statements.
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") globalForDb.__flamelensSql = sql;

export const db = drizzle(sql, { schema });
export { schema };
