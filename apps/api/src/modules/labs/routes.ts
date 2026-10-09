import { Hono } from "hono";
import { z } from "zod";
import { and, eq, desc, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import type { ApiEnv } from "../../http/types.ts";
import { requireSession } from "../../http/session.ts";
import { db } from "../../db/client.ts";
import {
  assessmentAttempts,
  learningEvents,
  executionJobs,
} from "../../db/schema.ts";
import { catalog } from "@nucleo/content/server";
import { challenges } from "./challenges.ts";
/** Language a lab's code challenge must be solved in, mirroring LabSurface. */
const labLanguage = (labId: string) => {
  const engine = catalog.labs.find((lab) => lab.id === labId)?.engine;
  return engine === "python"
    ? "python"
    : engine === "c-portable"
      ? "c"
      : engine === "assembler"
        ? "fasm"
        : "assembly";
};
export const labRoutes = new Hono<ApiEnv>();
labRoutes.get("/progress", requireSession, async (context) => {
  const rows = await db
    .selectDistinct({ id: assessmentAttempts.assessmentId })
    .from(assessmentAttempts)
    .where(
      and(
        eq(assessmentAttempts.userId, context.get("user").id),
        eq(assessmentAttempts.kind, "lab"),
        eq(assessmentAttempts.passed, 1),
      ),
    );
  return context.json(rows.map((row) => row.id));
});
labRoutes.get("/:id/challenge", (context) => {
  const item = challenges[context.req.param("id")];
  if (!item) return context.json({ error: "Laboratório não encontrado." }, 404);
  return context.json({
    kind: item.kind,
    question: item.question,
    choices: item.choices ?? [],
  });
});
labRoutes.post("/:id/check", requireSession, async (context) => {
  const labId = context.req.param("id");
  const item = challenges[labId];
  if (!item) return context.json({ error: "Laboratório não encontrado." }, 404);
  const input = z
    .object({ answer: z.string().max(200).default(""), submissionId: z.uuid() })
    .strict()
    .parse(await context.req.json());
  const userId = context.get("user").id;
  let passed = false;
  let feedback = "";
  if (item.kind === "code") {
    const [job] = await db
      .select()
      .from(executionJobs)
      .where(
        and(
          eq(executionJobs.userId, userId),
          eq(executionJobs.status, "succeeded"),
          sql`${executionJobs.payload}->>'labId' = ${labId}`,
          sql`${executionJobs.payload}->>'language' = ${labLanguage(labId)}`,
        ),
      )
      .orderBy(desc(executionJobs.createdAt))
      .limit(1);
    const result = job?.result;
    const criteria = item.criteria;
    passed = Boolean(result);
    if (criteria?.stdout)
      passed = passed && Boolean(result?.stdout.includes(criteria.stdout));
    if (criteria?.artifact)
      passed =
        passed &&
        Boolean(
          result?.artifacts.some(
            (artifact) => artifact.kind === criteria.artifact,
          ),
        );
    if (criteria?.register && criteria.value) {
      try {
        passed =
          passed &&
          BigInt(result?.cpu?.registers[criteria.register] ?? "-999") ===
            BigInt(criteria.value);
      } catch {
        passed = false;
      }
    }
    if (criteria?.minSteps)
      passed = passed && (result?.cpu?.steps ?? 0) >= criteria.minSteps;
    feedback = passed
      ? "A execução conferida no servidor atende ao desafio."
      : "Execute o desafio neste laboratório e confira o resultado pedido antes de validar.";
  } else if (item.kind === "number") {
    try {
      passed = BigInt(input.answer.trim()) === BigInt(item.answer ?? "0");
    } catch {
      passed = false;
    }
    feedback = passed
      ? "O resultado está correto. Observe como a representação e o contexto se conectam."
      : `Revise a bancada e os dados do enunciado. Uma resposta decimal ou hexadecimal precisa representar a quantidade correta.`;
  } else {
    passed = input.answer === item.answer;
    feedback = passed
      ? "Correto. Você reconheceu a relação importante deste experimento."
      : "Essa opção não descreve o efeito observado. Revise o conceito e experimente novamente.";
  }
  const limited = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`lab:${userId}`}))`,
    );
    const [quota] = await tx
      .select({ count: sql<number>`count(*)::int` })
      .from(assessmentAttempts)
      .where(
        and(
          eq(assessmentAttempts.userId, userId),
          eq(assessmentAttempts.kind, "lab"),
          sql`${assessmentAttempts.createdAt} > now() - interval '1 hour'`,
        ),
      );
    if ((quota?.count ?? 0) >= 120) return true;
    const previous = await tx
      .select({ id: assessmentAttempts.id })
      .from(assessmentAttempts)
      .where(
        and(
          eq(assessmentAttempts.userId, userId),
          eq(assessmentAttempts.assessmentId, labId),
          eq(assessmentAttempts.kind, "lab"),
          eq(assessmentAttempts.passed, 1),
        ),
      )
      .limit(1);
    const inserted = await tx
      .insert(assessmentAttempts)
      .values({
        id: input.submissionId,
        userId,
        assessmentId: labId,
        kind: "lab",
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
        kind: "lab_completed",
        label: labId.replaceAll("-", " "),
        href: `/laboratorios/${labId}`,
      });
    return false;
  });
  if (limited)
    return context.json(
      {
        error:
          "Muitas tentativas nesta hora. Revise a bancada e tente mais tarde.",
      },
      429,
    );
  return context.json({ passed, feedback });
});
