import pg from "pg";
import { databasePoolConfig } from "./pool-config.ts";
import { drizzle } from "drizzle-orm/node-postgres";
import { courses, lessonRevisions } from "./schema.ts";
import { catalog, publicCatalog } from "@nucleo/content/server";
const pool = new pg.Pool(
  databasePoolConfig(process.env.MIGRATION_DATABASE_URL!, 1),
);
const db = drizzle(pool);

try {
  await db
    .insert(courses)
    .values({
      id: catalog.id,
      revision: catalog.revision,
      metadata: publicCatalog,
    })
    .onConflictDoUpdate({
      target: courses.id,
      set: { revision: catalog.revision, metadata: publicCatalog },
    });
  for (const module of publicCatalog.modules)
    for (const lesson of module.lessons) {
      await db
        .insert(lessonRevisions)
        .values({
          id: lesson.id,
          courseId: catalog.id,
          revision: catalog.revision,
          metadata: lesson,
        })
        .onConflictDoUpdate({
          target: lessonRevisions.id,
          set: { revision: catalog.revision, metadata: lesson },
        });
    }
  console.log("Course catalog and 63 lesson revisions stored.");
} catch (error) {
  const cause =
    error instanceof Error && "cause" in error ? error.cause : error;
  console.error(
    "Catalog seeding failed:",
    cause instanceof Error ? cause.message : "unknown error",
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
