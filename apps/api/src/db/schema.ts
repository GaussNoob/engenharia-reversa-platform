import {
  pgTable,
  text,
  timestamp,
  jsonb,
  integer,
  primaryKey,
  uuid,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type {
  ExecutionInput,
  ExecutionResult,
  JobStatus,
  LessonStatus,
} from "@nucleo/core";
import { user } from "./auth-schema.ts";
export * from "./auth-schema.ts";
export const courses = pgTable("courses", {
  id: text("id").primaryKey(),
  revision: text("revision").notNull(),
  metadata: jsonb("metadata").notNull(),
});
export const lessonRevisions = pgTable("lesson_revisions", {
  id: text("id").primaryKey(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id),
  revision: text("revision").notNull(),
  metadata: jsonb("metadata").notNull(),
});
export const lessonProgress = pgTable(
  "lesson_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessonRevisions.id),
    status: text("status").$type<LessonStatus>().notNull(),
    anchor: text("anchor"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    lastVisitedAt: timestamp("last_visited_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.lessonId] }),
    index("progress_last_visit_idx").on(table.userId, table.lastVisitedAt),
  ],
);
export const learningEvents = pgTable(
  "learning_events",
  {
    id: uuid("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id"),
    kind: text("kind").notNull(),
    label: text("label").notNull(),
    href: text("href").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("events_user_created_idx").on(table.userId, table.createdAt),
  ],
);
export const activitySessions = pgTable(
  "activity_sessions",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lastHeartbeat: timestamp("last_heartbeat", {
      withTimezone: true,
    }).notNull(),
    activeSeconds: integer("active_seconds").default(0).notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId] })],
);
export const assessmentAttempts = pgTable(
  "assessment_attempts",
  {
    id: uuid("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    assessmentId: text("assessment_id").notNull(),
    kind: text("kind").notNull(),
    passed: integer("passed").notNull(),
    answer: jsonb("answer"),
    feedback: text("feedback").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("attempts_user_assessment_idx").on(
      table.userId,
      table.assessmentId,
      table.createdAt,
    ),
  ],
);
export const labDrafts = pgTable(
  "lab_drafts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    labId: text("lab_id").notNull(),
    version: integer("version").default(1).notNull(),
    payload: jsonb("payload").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.labId] })],
);
export const executionJobs = pgTable(
  "execution_jobs",
  {
    id: uuid("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    submissionId: uuid("submission_id").notNull(),
    payload: jsonb("payload").$type<ExecutionInput>().notNull(),
    status: text("status").$type<JobStatus>().notNull(),
    result: jsonb("result").$type<ExecutionResult>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    leaseId: uuid("lease_id"),
    leaseUntil: timestamp("lease_until", { withTimezone: true }),
    attempts: integer("attempts").default(0).notNull(),
  },
  (table) => [
    uniqueIndex("jobs_submission_unique").on(table.userId, table.submissionId),
    index("jobs_queue_idx").on(table.status, table.createdAt),
    index("jobs_user_created_idx").on(table.userId, table.createdAt),
  ],
);
export const artifacts = pgTable(
  "artifacts",
  {
    id: uuid("id").primaryKey(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => executionJobs.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    path: text("path").notNull(),
    sha256: text("sha256").notNull(),
    size: integer("size").notNull(),
    kind: text("kind").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("artifacts_job_user_idx").on(table.jobId, table.userId)],
);
