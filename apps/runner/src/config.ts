import { z } from "zod";
export const runnerConfig = z
  .object({
    RUNNER_DATABASE_URL: z.string(),
    RUNNER_DOCKER_RUNTIME: z.enum(["runc", "runsc"]).default("runsc"),
    RUNNER_ARTIFACT_DIR: z.string().default(".runtime/artifacts"),
    RUNNER_CONCURRENCY: z.coerce.number().int().min(1).max(4).default(2),
    RUNNER_ALLOW_RUNC: z.enum(["true", "false"]).default("false"),
  })
  .parse(process.env);
if (
  process.env.NODE_ENV === "production" &&
  runnerConfig.RUNNER_DOCKER_RUNTIME !== "runsc"
)
  throw new Error("Production execution requires the gVisor runtime.");
// runc shares the host kernel with untrusted code; it must be an explicit local choice.
if (
  runnerConfig.RUNNER_DOCKER_RUNTIME !== "runsc" &&
  runnerConfig.RUNNER_ALLOW_RUNC !== "true"
)
  throw new Error(
    "RUNNER_DOCKER_RUNTIME=runc requires RUNNER_ALLOW_RUNC=true.",
  );

export const sandboxUser = `${process.getuid?.() || 1000}:${process.getgid?.() || 1000}`;
if (
  process.env.NODE_ENV === "production" &&
  (process.platform !== "linux" || process.getuid?.() === 0)
)
  throw new Error(
    "Production runner requires Linux and a non-root service account.",
  );
