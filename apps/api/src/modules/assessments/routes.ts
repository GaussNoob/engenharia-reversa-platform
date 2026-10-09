import { Hono } from "hono";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import {
  quizzes,
  publicQuestion,
  catalog,
  exercises,
} from "@nucleo/content/server";
import type { ApiEnv } from "../../http/types.ts";
import { requireSession } from "../../http/session.ts";
import { db } from "../../db/client.ts";
import {
  assessmentAttempts,
  learningEvents,
  labDrafts,
} from "../../db/schema.ts";
import { draftSchema, supplements, languages } from "@nucleo/core";
export const assessmentRoutes = new Hono<ApiEnv>();
assessmentRoutes.use("*", requireSession);
assessmentRoutes.get("/questions/:id", (context) => {
  const question = quizzes.find((item) => item.id === context.req.param("id"));
  return question
    ? context.json(publicQuestion(question))
    : context.json({ error: "Checkpoint não encontrado." }, 404);
});
/** Latest answer of the signed-in user, so a checkpoint shows what was saved. */
assessmentRoutes.get("/quiz", async (context) => {
  const id = z
    .string()
    .max(250)
    .parse(context.req.query("id") ?? "");
  const question = quizzes.find((item) => item.id === id);
  if (!question)
    return context.json({ error: "Checkpoint não encontrado." }, 404);
  const [attempt] = await db
    .select({
      answer: assessmentAttempts.answer,
      passed: assessmentAttempts.passed,
    })
    .from(assessmentAttempts)
    .where(
      and(
        eq(assessmentAttempts.userId, context.get("user").id),
        eq(assessmentAttempts.assessmentId, question.id),
        eq(assessmentAttempts.kind, "quiz"),
      ),
    )
    .orderBy(desc(assessmentAttempts.createdAt))
    .limit(1);
  const choiceId = (attempt?.answer as { choiceId?: string } | null)?.choiceId;
  if (!attempt || !choiceId) return context.json(null);
  return context.json({
    choiceId,
    passed: attempt.passed === 1,
    explanation: question.explanation,
    correctId: question.correctId,
  });
});
assessmentRoutes.post("/quiz", async (context) => {
  const input = z
    .object({
      questionId: z.string().max(250),
      choiceId: z.string().max(20),
      submissionId: z.uuid(),
    })
    .strict()
    .parse(await context.req.json());
  const question = quizzes.find((item) => item.id === input.questionId);
  if (
    !question ||
    !question.choices.some((choice) => choice.id === input.choiceId)
  )
    return context.json({ error: "Questão ou alternativa inválida." }, 400);
  const userId = context.get("user").id;
  const [quota] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(assessmentAttempts)
    .where(
      and(
        eq(assessmentAttempts.userId, userId),
        sql`${assessmentAttempts.createdAt} > now() - interval '1 hour'`,
      ),
    );
  if ((quota?.count ?? 0) >= 300)
    return context.json(
      { error: "Muitas respostas nesta hora. Tente novamente mais tarde." },
      429,
    );
  const passed = input.choiceId === question.correctId;
  const result = {
    passed,
    explanation: question.explanation,
    correctId: question.correctId,
  };
  await db
    .insert(assessmentAttempts)
    .values({
      id: input.submissionId,
      userId,
      assessmentId: question.id,
      kind: "quiz",
      passed: passed ? 1 : 0,
      answer: { choiceId: input.choiceId },
      feedback: question.explanation,
    })
    .onConflictDoNothing();
  return context.json(result);
});
assessmentRoutes.get("/drafts/:labId", async (context) => {
  const [draft] = await db
    .select({ version: labDrafts.version, payload: labDrafts.payload })
    .from(labDrafts)
    .where(
      and(
        eq(labDrafts.userId, context.get("user").id),
        eq(labDrafts.labId, context.req.param("labId")),
      ),
    )
    .limit(1);
  return context.json(draft ?? null);
});
assessmentRoutes.put("/drafts/:labId", async (context) => {
  const labId = z.string().max(200).parse(context.req.param("labId"));
  if (
    !catalog.labs.some((lab) => lab.id === labId) &&
    !catalog.modules.some((module) =>
      module.lessons.some((lesson) => lesson.id === labId),
    ) &&
    !exercises.some((exercise) => `exercise-${exercise.id}` === labId) &&
    !languages.some((language) => `playground-${language}` === labId)
  )
    return context.json({ error: "Bancada inválida." }, 400);
  const { expectedVersion, ...payload } = draftSchema.parse(
    await context.req.json(),
  );
  const userId = context.get("user").id;
  const [draft] =
    expectedVersion === 0
      ? await db
          .insert(labDrafts)
          .values({ userId, labId, payload, version: 1 })
          .onConflictDoNothing()
          .returning({ version: labDrafts.version })
      : await db
          .update(labDrafts)
          .set({
            payload,
            version: sql`${labDrafts.version} + 1`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(labDrafts.userId, userId),
              eq(labDrafts.labId, labId),
              eq(labDrafts.version, expectedVersion),
            ),
          )
          .returning({ version: labDrafts.version });
  return draft
    ? context.json(draft)
    : context.json(
        {
          error:
            "Este rascunho foi alterado em outra sessão. Seu código local foi preservado; exporte-o antes de recarregar.",
        },
        409,
      );
});
assessmentRoutes.post("/supplement", async (context) => {
  const input = z
    .object({
      id: z.string().max(80),
      answer: z.string().max(200),
      submissionId: z.uuid(),
    })
    .strict()
    .parse(await context.req.json());
  const item = supplements.find((item) => item.id === input.id);
  const answers: Record<string, string> = {
    "camadas-do-software": "CPU",
    "fluxo-de-controle": "JA, na comparação sem sinal",
    "ponto-flutuante": "23 bits",
    "ordem-dos-bytes": "0x78",
  };
  if (!item || !(item.choices as readonly string[]).includes(input.answer))
    return context.json({ error: "Experimento ou resposta inválida." }, 400);
  const userId = context.get("user").id;
  const passed = input.answer === answers[item.id];
  const feedback = passed
    ? `Correto. ${item.takeaway}`
    : "Volte ao roteiro, teste a hipótese na bancada e tente novamente.";
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${userId + item.id}))`,
    );
    const previous = await tx
      .select({ id: assessmentAttempts.id })
      .from(assessmentAttempts)
      .where(
        and(
          eq(assessmentAttempts.userId, userId),
          eq(assessmentAttempts.assessmentId, `extra:${item.id}`),
          eq(assessmentAttempts.passed, 1),
        ),
      )
      .limit(1);
    const inserted = await tx
      .insert(assessmentAttempts)
      .values({
        id: input.submissionId,
        userId,
        assessmentId: `extra:${item.id}`,
        kind: "exercise",
        passed: passed ? 1 : 0,
        answer: { value: input.answer },
        feedback,
      })
      .onConflictDoNothing()
      .returning({ id: assessmentAttempts.id });
    if (passed && inserted.length && !previous.length)
      await tx.insert(learningEvents).values({
        id: randomUUID(),
        userId,
        kind: "experiment_completed",
        label: item.title,
        href: `/explorar/${item.id}`,
      });
  });
  return context.json({ passed, feedback });
});
