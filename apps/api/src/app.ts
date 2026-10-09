import { Hono } from "hono";
import { timingSafeEqual } from "node:crypto";
import { cors } from "hono/cors";
import { randomUUID } from "node:crypto";
import { mutationAllowed } from "./http/origins.ts";
import { secureHeaders } from "hono/secure-headers";
import { bodyLimit } from "hono/body-limit";
import { ZodError } from "zod";
import { config, trustedOrigins, CLIENT_IP_HEADER } from "./config.ts";
import { auth } from "./auth.ts";
import { pool } from "./db/client.ts";
import { courseRoutes } from "./modules/courses/routes.ts";
import { progressRoutes } from "./modules/progress/routes.ts";
import { assessmentRoutes } from "./modules/assessments/routes.ts";
import { executionRoutes } from "./modules/execution/routes.ts";
import { labRoutes } from "./modules/labs/routes.ts";
import { exerciseRoutes } from "./modules/exercises/routes.ts";
import { requireSession } from "./http/session.ts";
import type { ApiEnv } from "./http/types.ts";

export const app = new Hono<ApiEnv>();
app.use("*", secureHeaders());
app.use(
  "/api/*",
  cors({
    origin: (origin) => (trustedOrigins.includes(origin) ? origin : ""),
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["set-auth-token"],
    credentials: true,
    maxAge: 600,
  }),
);
app.use("*", async (context, next) => {
  const requestId = randomUUID();
  const started = Date.now();
  context.header("X-Request-Id", requestId);
  await next();
  console.log(
    JSON.stringify({
      event: "http_request",
      requestId,
      method: context.req.method,
      path: context.req.path,
      status: context.res.status,
      durationMs: Date.now() - started,
    }),
  );
});
app.use(
  "/api/*",
  bodyLimit({
    maxSize: 524288,
    onError: (context) =>
      context.json({ error: "A requisição excedeu o limite permitido." }, 413),
  }),
);
app.use("/api/*", async (context, next) => {
  context.header("Cache-Control", "private, no-store");
  if (
    !mutationAllowed(
      context.req.method,
      context.req.header("origin"),
      trustedOrigins,
    )
  )
    return context.json({ error: "Origem não autorizada." }, 403);
  await next();
});
app.get("/api/live", (context) => context.json({ ok: true }));
app.get("/api/auth-capabilities", (context) =>
  context.json({ passwordReset: Boolean(config.RESEND_API_KEY) }),
);
app.get("/api/health", async (context) => {
  await pool.query("select 1");
  return context.json({
    ok: true,
    storage: "postgresql",
    runner: config.RUNNER_ENABLED === "true",
  });
});
/**
 * The API only listens on 127.0.0.1 behind Next and, in production, a reverse
 * proxy that must overwrite X-Forwarded-For with the peer address
 * (`proxy_set_header X-Forwarded-For $remote_addr`). The rightmost entry is the
 * one added by the closest trusted hop; earlier entries are client-controlled.
 */
const validIp = (value: string) =>
  /^[\d.]{7,15}$|^[\da-f:.]{2,45}$/i.test(value) ? value : "unknown";
const proxySecret = config.API_PROXY_SECRET
  ? Buffer.from(config.API_PROXY_SECRET)
  : null;
function clientIp(headers: Headers) {
  // The web app on Vercel vouches for the IP with a shared secret.
  const presented = Buffer.from(headers.get("x-nucleo-proxy-secret") ?? "");
  const vouched = headers.get("x-nucleo-client-ip")?.trim();
  if (
    proxySecret &&
    vouched &&
    presented.length === proxySecret.length &&
    timingSafeEqual(presented, proxySecret)
  )
    return validIp(vouched);
  return validIp(
    headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() ?? "",
  );
}
app.all("/api/auth/*", (context) => {
  const raw = context.req.raw;
  const headers = new Headers(raw.headers);
  headers.set(CLIENT_IP_HEADER, clientIp(raw.headers));
  headers.delete("x-nucleo-proxy-secret");
  const body = ["GET", "HEAD"].includes(raw.method) ? undefined : raw.body;
  return auth.handler(
    new Request(raw.url, {
      method: raw.method,
      headers,
      body,
      duplex: "half",
    } as RequestInit),
  );
});
app.get("/api/me", requireSession, (context) =>
  context.json(context.get("user")),
);
app.route("/api", courseRoutes);
app.route("/api/progress", progressRoutes);
app.route("/api/assessments", assessmentRoutes);
app.route("/api/executions", executionRoutes);
app.route("/api/labs", labRoutes);
app.route("/api/exercises", exerciseRoutes);
app.onError((error, context) => {
  if (error instanceof ZodError)
    return context.json(
      {
        error: "Dados inválidos.",
        details: error.issues.map((issue) => issue.message),
      },
      400,
    );
  if (error instanceof SyntaxError)
    return context.json({ error: "JSON inválido." }, 400);
  console.error("Request failed", { name: error.name, path: context.req.path });
  return context.json(
    { error: "Não foi possível concluir a operação. Tente novamente." },
    500,
  );
});

export default app;
