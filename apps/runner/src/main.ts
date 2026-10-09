import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, eq, inArray, sql } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { unlink } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { executionInputSchema } from "@nucleo/core";
import { executionJobs, artifacts } from "../../api/src/db/schema.ts";
import { runnerConfig } from "./config.ts";
import { executeJob } from "./execute.ts";
const pool = new pg.Pool({
  connectionString: runnerConfig.RUNNER_DATABASE_URL,
  max: 4,
});
const db = drizzle(pool);
let stopped = false;
let running = 0;
async function claim() {
  return db.transaction(async (tx) => {
    const result = await tx.execute(
      sql`UPDATE execution_jobs SET status='provisioning',lease_id=${randomUUID()},lease_until=now()+interval '45 seconds',started_at=now(),attempts=attempts+1 WHERE id=(SELECT id FROM execution_jobs WHERE status='queued' ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id,payload,user_id,lease_id`,
    );
    const row = result.rows[0];
    if (!row) return null;
    return {
      id: String(row.id),
      userId: String(row.user_id),
      leaseId: String(row.lease_id),
      payload: row.payload,
    };
  });
}
async function processOne(job: NonNullable<Awaited<ReturnType<typeof claim>>>) {
  const controller = new AbortController();
  const cancelMonitor = setInterval(() => {
    void db
      .select({ status: executionJobs.status, leaseId: executionJobs.leaseId })
      .from(executionJobs)
      .where(eq(executionJobs.id, job.id))
      .limit(1)
      .then((rows) => {
        const current = rows[0];
        if (
          !current ||
          current.status === "cancelled" ||
          current.leaseId !== job.leaseId
        )
          controller.abort();
      })
      .catch(() => controller.abort());
  }, 300);
  try {
    const payload = executionInputSchema.parse(job.payload);
    const response = await executeJob(
      job.id,
      payload,
      async (stage) => {
        await db
          .update(executionJobs)
          .set({ status: stage, leaseUntil: new Date(Date.now() + 45000) })
          .where(
            and(
              eq(executionJobs.id, job.id),
              eq(executionJobs.leaseId, job.leaseId),
              inArray(executionJobs.status, [
                "provisioning",
                "compiling",
                "running",
              ]),
            ),
          );
      },
      controller.signal,
    );
    await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(executionJobs)
        .set({
          status: response.status,
          result: response.result,
          finishedAt: new Date(),
          leaseUntil: null,
        })
        .where(
          and(
            eq(executionJobs.id, job.id),
            eq(executionJobs.leaseId, job.leaseId),
            inArray(executionJobs.status, [
              "provisioning",
              "compiling",
              "running",
            ]),
          ),
        )
        .returning({ id: executionJobs.id });
      if (updated)
        for (const artifact of response.artifacts)
          await tx.insert(artifacts).values({
            ...artifact,
            jobId: job.id,
            userId: job.userId,
            expiresAt: new Date(Date.now() + 7 * 86400000),
          });
    });
  } catch (error) {
    console.error(
      "Job failed:",
      job.id,
      error instanceof Error ? error.message.slice(0, 500) : "unknown",
    );
    await db
      .update(executionJobs)
      .set({
        status: "failed",
        finishedAt: new Date(),
        result: {
          stdout: "",
          // Docker, filesystem and database messages stay in the runner log.
          stderr: "Falha no ambiente de execução. Tente executar novamente.",
          exitCode: null,
          durationMs: 0,
          truncated: false,
          artifacts: [],
        },
      })
      .where(
        and(
          eq(executionJobs.id, job.id),
          eq(executionJobs.leaseId, job.leaseId),
          inArray(executionJobs.status, [
            "provisioning",
            "compiling",
            "running",
          ]),
        ),
      );
  } finally {
    clearInterval(cancelMonitor);
  }
}
const artifactBase = resolve(runnerConfig.RUNNER_ARTIFACT_DIR);
let nextCleanup = 0;
/** Removes expired PE downloads so the artifact directory cannot grow forever. */
async function cleanArtifacts() {
  if (Date.now() < nextCleanup) return;
  nextCleanup = Date.now() + 10 * 60 * 1000;
  const expired = await db.execute(
    sql`DELETE FROM artifacts WHERE expires_at < now() RETURNING path`,
  );
  for (const row of expired.rows) {
    const path = resolve(String(row.path));
    if (!path.startsWith(artifactBase + sep)) continue;
    await unlink(path).catch(() => {});
  }
}
async function poll() {
  if (stopped) return;
  try {
    await db.execute(
      sql`UPDATE execution_jobs SET status='failed',finished_at=now(),result='{"stdout":"","stderr":"O ambiente de execução foi interrompido. Você pode executar novamente.","exitCode":null,"durationMs":0,"truncated":false,"artifacts":[]}'::jsonb WHERE status IN ('provisioning','compiling','running') AND lease_until < now()`,
    );
    await cleanArtifacts().catch((error) =>
      console.error(
        "Artifact cleanup failed:",
        error instanceof Error ? error.name : "unknown",
      ),
    );
    while (running < runnerConfig.RUNNER_CONCURRENCY) {
      const job = await claim();
      if (!job) break;
      running++;
      void processOne(job).finally(() => {
        running--;
      });
    }
  } catch (error) {
    console.error(
      "Runner poll failed:",
      error instanceof Error ? error.name : "unknown",
    );
  }
  setTimeout(() => void poll(), 400);
}
console.log(`Núcleo runner ready (${runnerConfig.RUNNER_DOCKER_RUNTIME}).`);
void poll();
for (const signal of ["SIGINT", "SIGTERM"] as const)
  process.on(signal, () => {
    stopped = true;
    const finish = setInterval(() => {
      if (!running) {
        clearInterval(finish);
        void pool.end().then(() => process.exit(0));
      }
    }, 100);
  });
