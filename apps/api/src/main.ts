import { serve } from "@hono/node-server";
import { app } from "./app.ts";
import { config } from "./config.ts";
import { pool } from "./db/client.ts";
export { app };
const server = serve({
  fetch: app.fetch,
  hostname: config.API_HOST,
  port: config.API_PORT,
});
console.log(JSON.stringify({ event: "api_ready", port: config.API_PORT }));
for (const signal of ["SIGTERM", "SIGINT"] as const)
  process.on(signal, () =>
    server.close(() => {
      void pool.end().then(() => process.exit(0));
    }),
  );
