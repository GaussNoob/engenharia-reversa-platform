import { createMiddleware } from "hono/factory";
import { auth } from "../auth.ts";
import type { ApiEnv } from "./types.ts";
export const requireSession = createMiddleware<ApiEnv>(
  async (context, next) => {
    const session = await auth.api.getSession({
      headers: context.req.raw.headers,
      query: { disableCookieCache: true },
    });
    if (!session)
      return context.json(
        {
          error: "Entre na sua conta para guardar o estudo.",
          code: "UNAUTHENTICATED",
        },
        401,
      );
    context.set("user", {
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
    });
    await next();
  },
);
