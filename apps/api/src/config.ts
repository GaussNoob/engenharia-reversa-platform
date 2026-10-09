import { z } from "zod";
import { allowedOrigins } from "./http/origins.ts";
export const config = z
  .object({
    DATABASE_URL: z.string().min(1),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(20).default(10),
    BETTER_AUTH_SECRET: z.string().min(32),
    PUBLIC_ORIGIN: z.url().default("http://localhost:3050"),
    API_PORT: z.coerce.number().int().default(3060),
    API_HOST: z.string().default("127.0.0.1"),
    BOOK_DISTRIBUTION_AUTHORIZED: z.enum(["true", "false"]).default("false"),
    RUNNER_ENABLED: z.enum(["true", "false"]).default("false"),
    RUNNER_ARTIFACT_DIR: z.string().default(".runtime/artifacts"),
    API_PROXY_SECRET: z.string().min(32).optional(),
    WEB_ORIGINS: z.string().default(""),
    NATIVE_CLIENTS_ENABLED: z.enum(["true", "false"]).default("false"),
    RESEND_API_KEY: z.string().min(1).optional(),
    EMAIL_FROM: z.string().min(1).optional(),
  })
  .parse(process.env);
if (
  process.env.NODE_ENV === "production" &&
  !config.PUBLIC_ORIGIN.startsWith("https:")
)
  throw new Error("PUBLIC_ORIGIN must use https in production.");
if (Boolean(config.RESEND_API_KEY) !== Boolean(config.EMAIL_FROM))
  throw new Error("Configure RESEND_API_KEY e EMAIL_FROM juntos.");
export const CLIENT_IP_HEADER = "x-nucleo-client-ip";
export const trustedOrigins = allowedOrigins(
  config.PUBLIC_ORIGIN,
  config.WEB_ORIGINS.split(",")
    .map((x) => x.trim())
    .filter(Boolean),
  config.NATIVE_CLIENTS_ENABLED === "true",
  process.env.NODE_ENV === "production",
);
