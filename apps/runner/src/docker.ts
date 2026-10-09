import { spawn } from "node:child_process";
import { runnerConfig, sandboxUser } from "./config.ts";
export type ContainerResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  limited: "timed_out" | "output_limited" | "cancelled" | null;
  oom: boolean;
};
const OUTPUT_LIMIT = 65536;
export async function dockerCommand(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("docker", args, { stdio: ["ignore", "pipe", "pipe"] });
    let output = "",
      error = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("O serviço de containers não respondeu a tempo."));
    }, 20000);
    child.stdout.on("data", (chunk) => {
      output = (output + String(chunk)).slice(0, 1048576);
    });
    child.stderr.on("data", (chunk) => {
      error = (error + String(chunk)).slice(0, 1200);
    });
    child.on("error", (cause) => {
      clearTimeout(timer);
      reject(cause);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      code === 0
        ? resolve(output.trim())
        : reject(new Error(error || "Container operation failed."));
    });
  });
}
export async function runContainer(options: {
  name: string;
  directory: string;
  image: string;
  command: string[];
  memoryMiB: number;
  timeoutMs: number;
  cpuSeconds: number;
  writable?: boolean;
  signal?: AbortSignal;
}): Promise<ContainerResult> {
  const start = Date.now();
  const empty = {
    stdout: "",
    stderr: "",
    exitCode: null,
    durationMs: 0,
    limited: "cancelled" as const,
    oom: false,
  };
  if (options.signal?.aborted) return empty;
  const image = await dockerCommand([
    "image",
    "inspect",
    options.image,
    "--format",
    "{{.Id}}",
  ]);
  const args = [
    "create",
    "--name",
    options.name,
    "--label",
    "nucleo.execution=true",
    "--runtime",
    runnerConfig.RUNNER_DOCKER_RUNTIME,
    "--network",
    "none",
    "--cap-drop",
    "ALL",
    "--security-opt",
    "no-new-privileges",
    "--read-only",
    "--user",
    sandboxUser,
    "--memory",
    `${options.memoryMiB}m`,
    "--memory-swap",
    `${options.memoryMiB}m`,
    "--cpus",
    "1",
    "--pids-limit",
    "32",
    "--ulimit",
    `cpu=${options.cpuSeconds}:${options.cpuSeconds + 1}`,
    "--ulimit",
    "fsize=16777216:16777216",
    "--ulimit",
    "nofile=64:64",
    "--tmpfs",
    "/tmp:rw,noexec,nosuid,nodev,size=16m", // Only the compiler may write to the host job directory; user programs get the 16 MiB /tmp tmpfs.
    "--mount",
    `type=bind,source=${options.directory},target=/workspace${options.writable ? "" : ",readonly"}`,
    "--workdir",
    "/workspace",
    image,
    ...options.command,
  ];
  let limited: ContainerResult["limited"] = null,
    stdout = "",
    stderr = "",
    total = 0;
  let timer: ReturnType<typeof setTimeout> | undefined,
    killer: ReturnType<typeof setInterval> | undefined,
    hardStop: ReturnType<typeof setTimeout> | undefined;
  let cancel: (() => void) | undefined;
  try {
    await dockerCommand(args);
    if (options.signal?.aborted) return empty;
    const exitCode = await new Promise<number | null>((resolve) => {
      const child = spawn("docker", ["start", "--attach", options.name], {
        stdio: ["ignore", "pipe", "pipe"],
      });
      const stop = (reason: ContainerResult["limited"]) => {
        if (limited) return;
        limited = reason;
        const kill = () =>
          void dockerCommand(["kill", options.name]).catch(() => {});
        kill();
        killer = setInterval(kill, 250);
        hardStop = setTimeout(() => {
          child.kill("SIGKILL");
          resolve(null);
        }, 3500);
      };
      cancel = () => stop("cancelled");
      options.signal?.addEventListener("abort", cancel, { once: true });
      timer = setTimeout(() => stop("timed_out"), options.timeoutMs);
      const collect = (kind: "stdout" | "stderr", chunk: Buffer) => {
        const allowed = Math.max(0, OUTPUT_LIMIT - total);
        // NUL bytes cannot be stored in PostgreSQL jsonb, so they are dropped with terminal escapes.
        const text = chunk
          .subarray(0, allowed)
          .toString("utf8")
          .replace(/\x1b\][^\x07]*(?:\x07|\x1b\\)/g, "")
          .replaceAll("\u0000", "");
        if (kind === "stdout") stdout += text;
        else stderr += text;
        total += chunk.length;
        if (total > OUTPUT_LIMIT) stop("output_limited");
      };
      child.stdout.on("data", (chunk: Buffer) => collect("stdout", chunk));
      child.stderr.on("data", (chunk: Buffer) => collect("stderr", chunk));
      child.on("error", (error) => {
        stderr = error.message;
        resolve(null);
      });
      child.on("close", resolve);
      if (options.signal?.aborted) cancel();
    });
    let oom = false;
    try {
      oom =
        (await dockerCommand([
          "inspect",
          options.name,
          "--format",
          "{{.State.OOMKilled}}",
        ])) === "true";
    } catch {
      /* A cancelled container may already be gone. */
    }
    return {
      stdout,
      stderr,
      exitCode,
      durationMs: Date.now() - start,
      limited,
      oom,
    };
  } finally {
    if (timer) clearTimeout(timer);
    if (killer) clearInterval(killer);
    if (hardStop) clearTimeout(hardStop);
    if (cancel) options.signal?.removeEventListener("abort", cancel);
    await dockerCommand(["rm", "-f", options.name]).catch(() => {});
  }
}
