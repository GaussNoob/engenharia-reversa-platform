import pg from "pg";
import { databasePoolConfig } from "./pool-config.ts";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { fileURLToPath } from "node:url";

const migrationUrl = process.env.MIGRATION_DATABASE_URL;
if (!migrationUrl) throw new Error("MIGRATION_DATABASE_URL não configurada.");
const pool = new pg.Pool(databasePoolConfig(migrationUrl, 1));
const database = drizzle(pool);
try {
  await migrate(database, {
    migrationsFolder: fileURLToPath(
      new URL("../../../../infrastructure/migrations", import.meta.url),
    ),
  });
  for (const [role, url] of [
    ["nucleo_app", process.env.DATABASE_URL],
    ["nucleo_runner", process.env.RUNNER_DATABASE_URL],
  ] as const) {
    if (!url) throw new Error(`Configuração da role ${role} ausente.`);
    const password = decodeURIComponent(new URL(url).password);
    const exists = await pool.query<{ exists: boolean }>(
      "SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname = $1) AS exists",
      [role],
    );
    const verb = exists.rows[0]?.exists ? "ALTER" : "CREATE";
    const statement = await pool.query<{ statement: string }>(
      "SELECT format($1, $2::text, $3::text) AS statement",
      [
        `${verb} ROLE %I LOGIN PASSWORD %L NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS`,
        role,
        password,
      ],
    );
    await pool.query(statement.rows[0]!.statement);
  }
  await pool.query(`
    GRANT USAGE ON SCHEMA public TO nucleo_app, nucleo_runner;
    GRANT SELECT, INSERT, UPDATE, DELETE ON users, sessions, accounts, verifications, auth_rate_limits, lesson_progress, learning_events, activity_sessions, assessment_attempts, lab_drafts, execution_jobs TO nucleo_app;
    GRANT SELECT ON courses, lesson_revisions, artifacts TO nucleo_app;
    GRANT SELECT, UPDATE ON execution_jobs TO nucleo_runner;
    GRANT SELECT, INSERT, DELETE ON artifacts TO nucleo_runner;
    DO $constraints$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'progress_status_check' AND conrelid = 'lesson_progress'::regclass) THEN
        ALTER TABLE lesson_progress ADD CONSTRAINT progress_status_check CHECK (status IN ('in_progress','completed'));
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'active_seconds_check' AND conrelid = 'activity_sessions'::regclass) THEN
        ALTER TABLE activity_sessions ADD CONSTRAINT active_seconds_check CHECK (active_seconds >= 0);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attempt_passed_check' AND conrelid = 'assessment_attempts'::regclass) THEN
        ALTER TABLE assessment_attempts ADD CONSTRAINT attempt_passed_check CHECK (passed IN (0,1));
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'artifact_size_check' AND conrelid = 'artifacts'::regclass) THEN
        ALTER TABLE artifacts ADD CONSTRAINT artifact_size_check CHECK (size >= 0 AND size <= 8388608);
      END IF;
    END $constraints$;
  `);
  console.log("Migrations and restricted application/runner roles ready.");
} finally {
  await pool.end();
}
