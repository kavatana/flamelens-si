/** Starts the API as a Node server. */
import "./env";
import { serve } from "@hono/node-server";
import { app } from "./app";

const port = Number(process.env.API_PORT ?? process.env.PORT ?? 4000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`FlameLens API listening on http://localhost:${info.port}`);
});
