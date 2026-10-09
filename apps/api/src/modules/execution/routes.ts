import { Hono } from "hono";
import { and, eq, inArray, gte, desc, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { executionInputSchema, isTerminal, type Job } from "@nucleo/core";
import {
  catalog,
  findLesson,
  exerciseDefinitions,
} from "@nucleo/content/server";
import { requireSession } from "../../http/session.ts";
import type { ApiEnv } from "../../http/types.ts";
import { db } from "../../db/client.ts";
import { executionJobs, artifacts } from "../../db/schema.ts";
import { config } from "../../config.ts";
import { readFile } from "node:fs/promises";
const active = ["queued", "provisioning", "compiling", "running"] as const;
/** Beyond this backlog new jobs are refused, so many accounts cannot starve the runner. */
const QUEUE_LIMIT = 60;
const dto = (row: typeof executionJobs.$inferSelect): Job => ({
  id: row.id,
  language: row.payload.language,
  status: row.status,
  createdAt: row.createdAt.toISOString(),
  result: row.result,
});
export const executionRoutes = new Hono<ApiEnv>();
executionRoutes.use("*", requireSession);
executionRoutes.get("/", async (context) => {
  const rows = await db
    .select()
    .from(executionJobs)
    .where(eq(executionJobs.userId, context.get("user").id))
    .orderBy(desc(executionJobs.createdAt))
    .limit(30);
  return context.json(rows.map(dto));
});
executionRoutes.post("/", async (context) => {
  if (config.RUNNER_ENABLED !== "true")
    return context.json(
      { error: "A bancada de execução está temporariamente indisponível." },
      503,
    );
  const input = executionInputSchema.parse(await context.req.json());
  const userId = context.get("user").id;
  if (input.lessonId && !findLesson(input.lessonId))
    return context.json({ error: "Aula inválida." }, 400);
  if (input.labId && !catalog.labs.some((lab) => lab.id === input.labId))
    return context.json({ error: "Laboratório inválido." }, 400);
  if (input.exerciseId) {
    const exercise = exerciseDefinitions.find(
      (item) => item.id === input.exerciseId,
    );
    if (
      !exercise ||
      exercise.kind !== "code" ||
      exercise.language !== input.language ||
      exercise.mode !== input.mode ||
      (input.labId && input.labId !== exercise.labId)
    )
      return context.json(
        { error: "Exercício ou ambiente de execução inválido." },
        400,
      );
  }
  const [backlog] = await db
    .select({ queued: sql<number>`count(*)::int` })
    .from(executionJobs)
    .where(eq(executionJobs.status, "queued"));
  if ((backlog?.queued ?? 0) >= QUEUE_LIMIT)
    return context.json(
      { error: "A fila de execução está cheia. Tente novamente em instantes." },
      503,
    );
  const result = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
    const [existing] = await tx
      .select()
      .from(executionJobs)
      .where(
        and(
          eq(executionJobs.userId, userId),
          eq(executionJobs.submissionId, input.submissionId),
        ),
      )
      .limit(1);
    if (existing) return { job: dto(existing) };
    const [count] = await tx
      .select({
        active: sql<number>`count(*) filter (where status in ('queued','provisioning','compiling','running'))::int`,
        hour: sql<number>`count(*) filter (where created_at > now() - interval '1 hour')::int`,
      })
      .from(executionJobs)
      .where(eq(executionJobs.userId, userId));
    if ((count?.active ?? 0) >= 2 || (count?.hour ?? 0) >= 40)
      return { error: true };
    const [row] = await tx
      .insert(executionJobs)
      .values({
        id: randomUUID(),
        userId,
        submissionId: input.submissionId,
        payload: input,
        status: "queued",
      })
      .returning();
    return { job: dto(row!) };
  });
  return result.error
    ? context.json(
        {
          error:
            "Você atingiu o limite de execuções. Aguarde as tarefas atuais ou tente mais tarde.",
        },
        429,
      )
    : context.json(result.job!, 202);
});
executionRoutes.get("/:id", async (context) => {
  const id = z.uuid().parse(context.req.param("id"));
  const [row] = await db
    .select()
    .from(executionJobs)
    .where(
      and(
        eq(executionJobs.id, id),
        eq(executionJobs.userId, context.get("user").id),
      ),
    )
    .limit(1);
  return row
    ? context.json(dto(row))
    : context.json({ error: "Execução não encontrada." }, 404);
});
executionRoutes.post("/:id/cancel", async (context) => {
  const id = z.uuid().parse(context.req.param("id"));
  const userId = context.get("user").id;
  const [row] = await db
    .select()
    .from(executionJobs)
    .where(and(eq(executionJobs.id, id), eq(executionJobs.userId, userId)))
    .limit(1);
  if (!row) return context.json({ error: "Execução não encontrada." }, 404);
  if (!isTerminal(row.status))
    await db
      .update(executionJobs)
      .set({ status: "cancelled", finishedAt: new Date() })
      .where(
        and(
          eq(executionJobs.id, id),
          eq(executionJobs.userId, userId),
          inArray(executionJobs.status, [...active]),
        ),
      );
  return context.json({ ok: true });
});
executionRoutes.get("/artifacts/:id", async (context) => {
  const id = z.uuid().parse(context.req.param("id"));
  const [row] = await db
    .select()
    .from(artifacts)
    .where(
      and(eq(artifacts.id, id), eq(artifacts.userId, context.get("user").id)),
    )
    .limit(1);
  if (!row || row.expiresAt.getTime() < Date.now())
    return context.json({ error: "Artefato não encontrado ou expirado." }, 404);
  const bytes = await readFile(row.path);
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${row.name}"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
