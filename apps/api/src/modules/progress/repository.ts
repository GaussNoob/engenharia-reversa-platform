import { and, desc, eq, ne, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { catalog, findLesson } from "@nucleo/content/server";
import {
  lessonHref,
  progressPercentage,
  type LessonProgress,
  type ProgressRepository,
  type ProgressSummary,
} from "@nucleo/core";
import { db } from "../../db/client.ts";
import {
  lessonProgress,
  learningEvents,
  activitySessions,
  assessmentAttempts,
} from "../../db/schema.ts";

function asProgress(row: typeof lessonProgress.$inferSelect): LessonProgress {
  return {
    lessonId: row.lessonId,
    status: row.status,
    anchor: row.anchor,
    startedAt: row.startedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    lastVisitedAt: row.lastVisitedAt.toISOString(),
  };
}
export class PgProgressRepository implements ProgressRepository {
  async visit(userId: string, lessonId: string, anchor: string | null) {
    const lesson = findLesson(lessonId);
    if (!lesson) throw new Error("Aula não encontrada.");
    if (anchor && !lesson.blocks.some((block) => block.id === anchor))
      throw new Error("Ponto de leitura inválido.");
    const [row] = await db
      .insert(lessonProgress)
      .values({ userId, lessonId, status: "in_progress", anchor })
      .onConflictDoUpdate({
        target: [lessonProgress.userId, lessonProgress.lessonId],
        set: { ...(anchor ? { anchor } : {}), lastVisitedAt: new Date() },
      })
      .returning();
    if (!row) throw new Error("Falha ao guardar progresso.");
    return asProgress(row);
  }
  async complete(userId: string, lessonId: string, eventId: string) {
    const lesson = findLesson(lessonId);
    if (!lesson) throw new Error("Aula não encontrada.");
    return db.transaction(async (tx) => {
      await tx
        .insert(lessonProgress)
        .values({ userId, lessonId, status: "in_progress" })
        .onConflictDoNothing();
      const [updated] = await tx
        .update(lessonProgress)
        .set({
          status: "completed",
          completedAt: new Date(),
          lastVisitedAt: new Date(),
        })
        .where(
          and(
            eq(lessonProgress.userId, userId),
            eq(lessonProgress.lessonId, lessonId),
            ne(lessonProgress.status, "completed"),
          ),
        )
        .returning();
      if (updated)
        await tx
          .insert(learningEvents)
          .values({
            id: eventId,
            userId,
            lessonId,
            kind: "lesson_completed",
            label: lesson.title,
            href: lessonHref(lesson),
          })
          .onConflictDoNothing();
      const row =
        updated ??
        (
          await tx
            .select()
            .from(lessonProgress)
            .where(
              and(
                eq(lessonProgress.userId, userId),
                eq(lessonProgress.lessonId, lessonId),
              ),
            )
            .limit(1)
        )[0];
      if (!row) throw new Error("Falha ao concluir aula.");
      return asProgress(row);
    });
  }
  async heartbeat(userId: string) {
    await db
      .insert(activitySessions)
      .values({ userId, lastHeartbeat: new Date(), activeSeconds: 0 })
      .onConflictDoUpdate({
        target: activitySessions.userId,
        set: {
          activeSeconds: sql`${activitySessions.activeSeconds} + CASE WHEN EXTRACT(EPOCH FROM (now() - ${activitySessions.lastHeartbeat})) BETWEEN 1 AND 45 THEN LEAST(30, FLOOR(EXTRACT(EPOCH FROM (now() - ${activitySessions.lastHeartbeat}))))::int ELSE 0 END`,
          lastHeartbeat: new Date(),
        },
      });
  }
  async getSummary(userId: string): Promise<ProgressSummary> {
    const [rows, activity, attempts, events] = await Promise.all([
      db
        .select()
        .from(lessonProgress)
        .where(eq(lessonProgress.userId, userId))
        .orderBy(desc(lessonProgress.lastVisitedAt)),
      db
        .select()
        .from(activitySessions)
        .where(eq(activitySessions.userId, userId))
        .limit(1),
      db
        .select({
          kind: assessmentAttempts.kind,
          count: sql<number>`count(distinct ${assessmentAttempts.assessmentId})::int`,
        })
        .from(assessmentAttempts)
        .where(
          and(
            eq(assessmentAttempts.userId, userId),
            eq(assessmentAttempts.passed, 1),
          ),
        )
        .groupBy(assessmentAttempts.kind),
      db
        .select()
        .from(learningEvents)
        .where(eq(learningEvents.userId, userId))
        .orderBy(desc(learningEvents.createdAt))
        .limit(30),
    ]);
    const total = catalog.modules.reduce(
      (sum, module) => sum + module.lessons.length,
      0,
    );
    const completed = rows.filter((row) => row.status === "completed").length;
    const count = (kind: string) =>
      attempts.find((row) => row.kind === kind)?.count ?? 0;
    const days = new Set(
      events.map((event) =>
        new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Bahia" }).format(
          event.createdAt,
        ),
      ),
    );
    let streak = 0;
    const today = new Intl.DateTimeFormat("sv-SE", {
      timeZone: "America/Bahia",
    }).format(new Date());
    let cursor = new Date(`${today}T12:00:00Z`);
    if (!days.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
    while (days.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
    }
    return {
      lessons: rows.map(asProgress),
      completedLessons: completed,
      totalLessons: total,
      percentage: progressPercentage(completed, total),
      activeSeconds: activity[0]?.activeSeconds ?? 0,
      passedExercises: count("exercise"),
      completedLabs: count("lab"),
      passedQuizzes: count("quiz"),
      streak,
      lastLessonId: rows[0]?.lessonId ?? null,
      activities: events.slice(0, 8).map((event) => ({
        id: event.id,
        kind: event.kind,
        label: event.label,
        href: event.href,
        createdAt: event.createdAt.toISOString(),
      })),
    };
  }
}
export const progressRepository = new PgProgressRepository();
