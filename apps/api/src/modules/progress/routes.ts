import { Hono } from "hono";
import { z } from "zod";
import type { ApiEnv } from "../../http/types.ts";
import { requireSession } from "../../http/session.ts";
import { progressRepository } from "./repository.ts";
import { findLesson } from "@nucleo/content/server";
const visitInput = z
  .object({
    lessonId: z.string().max(200),
    anchor: z.string().max(250).nullable().default(null),
  })
  .strict();
const completeInput = z
  .object({ lessonId: z.string().max(200), eventId: z.uuid() })
  .strict();
export const progressRoutes = new Hono<ApiEnv>();
progressRoutes.use("*", requireSession);
progressRoutes.get("/", async (context) =>
  context.json(await progressRepository.getSummary(context.get("user").id)),
);
progressRoutes.post("/visit", async (context) => {
  const input = visitInput.parse(await context.req.json());
  if (!findLesson(input.lessonId))
    return context.json({ error: "Aula não encontrada." }, 404);
  return context.json(
    await progressRepository.visit(
      context.get("user").id,
      input.lessonId,
      input.anchor,
    ),
  );
});
progressRoutes.post("/complete", async (context) => {
  const input = completeInput.parse(await context.req.json());
  if (!findLesson(input.lessonId))
    return context.json({ error: "Aula não encontrada." }, 404);
  return context.json(
    await progressRepository.complete(
      context.get("user").id,
      input.lessonId,
      input.eventId,
    ),
  );
});
progressRoutes.post("/heartbeat", async (context) => {
  await progressRepository.heartbeat(context.get("user").id);
  return context.json({ ok: true });
});
