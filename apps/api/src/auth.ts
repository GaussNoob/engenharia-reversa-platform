import { bearer } from "better-auth/plugins";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { db } from "./db/client.ts";
import * as schema from "./db/auth-schema.ts";
import { APIError } from "better-auth/api";
import { config, trustedOrigins, CLIENT_IP_HEADER } from "./config.ts";
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", schema }),
  baseURL: config.PUBLIC_ORIGIN,
  secret: config.BETTER_AUTH_SECRET,
  trustedOrigins,
  plugins:
    config.NATIVE_CLIENTS_ENABLED === "true"
      ? [bearer({ requireSignature: true })]
      : [],
  user: { deleteUser: { enabled: true } },
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    revokeSessionsOnPasswordReset: true,
    ...(config.RESEND_API_KEY
      ? {
          sendResetPassword: async ({
            user,
            token,
          }: {
            user: { email: string };
            token: string;
          }) => {
            const url =
              config.PUBLIC_ORIGIN +
              "/redefinir-senha?token=" +
              encodeURIComponent(token);
            const response = await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                Authorization: "Bearer " + config.RESEND_API_KEY,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: config.EMAIL_FROM,
                to: [user.email],
                subject: "Recuperar acesso ao Núcleo",
                text: "Use este link para definir uma nova senha: " + url,
              }),
              signal: AbortSignal.timeout(10000),
            });
            if (!response.ok)
              throw new Error("O transporte de email não concluiu o envio.");
          },
        }
      : {}),
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
    cookieCache: { enabled: false },
  },
  rateLimit: {
    enabled: true,
    storage: "database",
    window: 60,
    max: 30,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": {
        window: 3600,
        max: process.env.NODE_ENV === "production" ? 5 : 60,
      },
    },
  },
  databaseHooks: {
    user: {
      update: {
        before: async (user) => {
          if (user.name === undefined) return;
          const name = user.name.trim();
          if (!name || name.length > 80)
            throw new APIError("BAD_REQUEST", {
              message: "Informe um nome com até 80 caracteres.",
            });
          return { data: { ...user, name } };
        },
      },
      create: {
        before: async (user) => {
          const name = typeof user.name === "string" ? user.name.trim() : "";
          if (!name || name.length > 80)
            throw new APIError("BAD_REQUEST", {
              message: "Informe um nome com até 80 caracteres.",
            });
          return { data: { ...user, name } };
        },
      },
    },
  },
  advanced: {
    useSecureCookies: config.PUBLIC_ORIGIN.startsWith("https:"),
    // Rate limits key on the IP resolved in main.ts, never on raw client headers.
    ipAddress: { ipAddressHeaders: [CLIENT_IP_HEADER] },
  },
});
