import { Hono } from "hono";
import { and, eq, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  exerciseCheckSchema,
  isTerminal,
  type ExerciseResult,
  type ExerciseSolution,
  type ExecutionResult,
} from "@nucleo/core";
import { exercises, exerciseDefinitions } from "@nucleo/content/server";
import type { ApiEnv } from "../../http/types.ts";
import { requireSession } from "../../http/session.ts";
import { db } from "../../db/client.ts";
import {
  assessmentAttempts,
  executionJobs,
  learningEvents,
} from "../../db/schema.ts";
import { gradeExercise } from "./grade.ts";

export const exerciseRoutes = new Hono<ApiEnv>();
exerciseRoutes.get("/", (context) => context.json(exercises));
exerciseRoutes.get("/progress", requireSession, async (context) => {
  const attempts = await db
    .select({
      id: assessmentAttempts.assessmentId,
      passed: assessmentAttempts.passed,
    })
    .from(assessmentAttempts)
    .where(
      and(
        eq(assessmentAttempts.userId, context.get("user").id),
        eq(assessmentAttempts.kind, "exercise"),
      ),
    );
  const ids = new Set(exercises.map((exercise) => exercise.id));
  return context.json({
    completed: [
      ...new Set(
        attempts
          .filter((attempt) => attempt.passed === 1 && ids.has(attempt.id))
          .map((attempt) => attempt.id),
      ),
    ],
    attempted: [
      ...new Set(
        attempts
          .filter((attempt) => ids.has(attempt.id))
          .map((attempt) => attempt.id),
      ),
    ],
  });
});
exerciseRoutes.get("/:id", (context) => {
  const exercise = exercises.find(
    (item) => item.id === context.req.param("id"),
  );
  return exercise
    ? context.json(exercise)
    : context.json({ error: "Exercício não encontrado." }, 404);
});
exerciseRoutes.get("/:id/solution", requireSession, async (context) => {
  const item = exerciseDefinitions.find(
    (item) => item.id === context.req.param("id"),
  );
  if (!item) return context.json({ error: "Exercício não encontrado." }, 404);
  const [attempt] = await db
    .select({ id: assessmentAttempts.id })
    .from(assessmentAttempts)
    .where(
      and(
        eq(assessmentAttempts.userId, context.get("user").id),
        eq(assessmentAttempts.assessmentId, item.id),
        eq(assessmentAttempts.kind, "exercise"),
      ),
    )
    .limit(1);
  if (!attempt)
    return context.json(
      { error: "Faça uma tentativa antes de abrir a solução comentada." },
      403,
    );
  const solution: ExerciseSolution =
    item.kind === "code"
      ? { explanation: item.explanation, solutionCode: item.solutionCode }
      : {
          explanation: item.explanation,
          answer:
            item.kind === "choice"
              ? item.choices.find((choice) => choice.id === item.answer)!.text
              : item.answer,
        };
  return context.json(solution);
});
exerciseRoutes.post("/:id/check", requireSession, async (context) => {
  const item = exerciseDefinitions.find(
    (item) => item.id === context.req.param("id"),
  );
  if (!item) return context.json({ error: "Exercício não encontrado." }, 404);
  const input = exerciseCheckSchema.parse(await context.req.json());
  if (
    item.kind === "choice" &&
    !item.choices.some((choice) => choice.id === input.answer)
  )
    return context.json({ error: "Selecione uma alternativa válida." }, 400);
  const userId = context.get("user").id;
  let evidence: ExecutionResult | null = null;
  if (item.kind === "code") {
    if (!input.jobId)
      return context.json(
        { error: "Execute o código nesta bancada antes de validar." },
        400,
      );
    const [job] = await db
      .select()
      .from(executionJobs)
      .where(
        and(
          eq(executionJobs.id, input.jobId),
          eq(executionJobs.userId, userId),
        ),
      )
      .limit(1);
    if (
      !job ||
      job.payload.exerciseId !== item.id ||
      job.payload.language !== item.language ||
      job.payload.mode !== item.mode
    )
      return context.json(
        { error: "A execução não pertence a este exercício e à sua conta." },
        400,
      );
    if (!isTerminal(job.status))
      return context.json(
        { error: "Aguarde a execução terminar antes de validar." },
        400,
      );
    evidence = job.status === "succeeded" ? job.result : null;
  }
  const passed = gradeExercise(item, input.answer, evidence);
  const feedback = passed
    ? "Exercício concluído. Seu resultado foi conferido no servidor."
    : "O resultado ainda não atende ao enunciado. Reveja os dados, abra uma dica e tente novamente.";
  const outcome = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`exercise:${userId}`}))`,
    );
    const [previousSubmission] = await tx
      .select()
      .from(assessmentAttempts)
      .where(eq(assessmentAttempts.id, input.submissionId))
      .limit(1);
    if (previousSubmission) {
      if (
        previousSubmission.userId !== userId ||
        previousSubmission.assessmentId !== item.id ||
        previousSubmission.kind !== "exercise"
      )
        return { conflict: true } as const;
      return {
        passed: previousSubmission.passed === 1,
        feedback: previousSubmission.feedback,
      };
    }
    const [quota] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(assessmentAttempts)
      .where(
        and(
          eq(assessmentAttempts.userId, userId),
          eq(assessmentAttempts.kind, "exercise"),
          sql`${assessmentAttempts.createdAt} > now() - interval '1 hour'`,
        ),
      );
    if ((quota?.count ?? 0) >= 120) return { limited: true } as const;
    const [completed] = await tx
      .select({ id: assessmentAttempts.id })
      .from(assessmentAttempts)
      .where(
        and(
          eq(assessmentAttempts.userId, userId),
          eq(assessmentAttempts.assessmentId, item.id),
          eq(assessmentAttempts.kind, "exercise"),
          eq(assessmentAttempts.passed, 1),
        ),
      )
      .limit(1);
    await tx.insert(assessmentAttempts).values({
      id: input.submissionId,
      userId,
      assessmentId: item.id,
      kind: "exercise",
      passed: passed ? 1 : 0,
      answer:
        item.kind === "code" ? { jobId: input.jobId } : { value: input.answer },
      feedback,
    });
    if (passed && !completed)
      await tx.insert(learningEvents).values({
        id: randomUUID(),
        userId,
        kind: "exercise_completed",
        label: item.title,
        href: `/exercicios/${item.id}`,
      });
    return { passed, feedback };
  });
  if ("conflict" in outcome)
    return context.json(
      { error: "Este identificador já foi usado em outra tentativa." },
      409,
    );
  if ("limited" in outcome)
    return context.json(
      {
        error:
          "Você atingiu o limite de tentativas desta hora. Retome em alguns minutos.",
      },
      429,
    );
  const result: ExerciseResult = {
    ...outcome,
    ...(outcome.passed ? { explanation: item.explanation } : {}),
  };
  return context.json(result);
});
