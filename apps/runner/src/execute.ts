import {
  mkdtemp,
  writeFile,
  readFile,
  stat,
  lstat,
  mkdir,
  copyFile,
  rm,
  chmod,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import type {
  ExecutionInput,
  ExecutionResult,
  JobStatus,
  CpuSnapshot,
} from "@nucleo/core";
import { runContainer, type ContainerResult } from "./docker.ts";
import { runnerConfig } from "./config.ts";
export type CollectedArtifact = {
  id: string;
  name: string;
  path: string;
  sha256: string;
  size: number;
  kind: string;
};
function status(result: ContainerResult): JobStatus {
  return (
    result.limited ??
    (result.oom
      ? "memory_limited"
      : result.exitCode === 0
        ? "succeeded"
        : "failed")
  );
}
export async function executeJob(
  id: string,
  input: ExecutionInput,
  onStage: (stage: "compiling" | "running") => Promise<void>,
  signal?: AbortSignal,
): Promise<{
  status: JobStatus;
  result: ExecutionResult;
  artifacts: CollectedArtifact[];
}> {
  const directory = await mkdtemp(join(tmpdir(), "nucleo-job-"));
  await chmod(directory, 0o700);
  const start = Date.now();
  const collected: CollectedArtifact[] = [];
  try {
    for (const file of input.files)
      await writeFile(join(directory, file.name), file.content, {
        mode: 0o600,
      });
    let outcome: ContainerResult;
    const run = (
      phase: string,
      image: string,
      command: string[],
      memory = 128,
      timeout = 5000,
      cpu = 2,
    ) =>
      runContainer({
        name: `nucleo-${id}-${phase}`,
        directory,
        image,
        command,
        memoryMiB: memory,
        timeoutMs: timeout,
        cpuSeconds: cpu,
        writable: phase === "compile",
        signal,
      });
    if (input.language === "python") {
      await onStage("running");
      outcome = await run("run", "nucleo-python:local", [
        "python3",
        "-I",
        "-B",
        `/workspace/${input.entryFile}`,
      ]);
    } else if (input.language === "assembly") {
      await writeFile(
        join(directory, "model-input.json"),
        JSON.stringify({
          code: input.files.find((file) => file.name === input.entryFile)!
            .content,
          mode: input.mode,
        }),
        { mode: 0o600 },
      );
      await onStage("running");
      outcome = await run(
        "model",
        "nucleo-model:local",
        [
          "node",
          "--v8-pool-size=1",
          "/opt/model-runner.mjs",
          "/workspace/model-input.json",
        ],
        256,
      );
    } else {
      await onStage("compiling");
      const entries = input.files
        .filter((file) =>
          input.language === "c"
            ? file.name.endsWith(".c")
            : input.language === "windows-cpp"
              ? /\.(cpp|c)$/.test(file.name)
              : file.name === input.entryFile,
        )
        .map((file) => `/workspace/${file.name}`);
      const binary = input.language === "c" ? "program" : "program.exe";
      const unicode = input.files.some((file) =>
        /\bL"|\bWCHAR\b|\bLPCWSTR\b/.test(file.content),
      );
      const command =
        input.language === "fasm"
          ? [
              "qemu-i386",
              "/usr/bin/fasm",
              `/workspace/${input.entryFile}`,
              `/workspace/${binary}`,
            ]
          : input.language === "windows-cpp"
            ? [
                "x86_64-w64-mingw32-g++",
                "-O0",
                ...(unicode ? ["-DUNICODE", "-D_UNICODE"] : []),
                ...entries,
                "-luser32",
                "-ladvapi32",
                "-o",
                `/workspace/${binary}`,
              ]
            : [
                "gcc",
                "-std=c2x",
                "-O0",
                "-g",
                ...entries,
                "-o",
                `/workspace/${binary}`,
              ];
      outcome = await run(
        "compile",
        "nucleo-compiler:local",
        command,
        1024,
        15000,
        10,
      );
      if (outcome.exitCode === 0 && !outcome.limited) {
        if (input.language === "c") {
          await onStage("running");
          outcome = await run("run", "nucleo-native:local", [
            `/workspace/${binary}`,
          ]);
        } else {
          const file = join(directory, binary);
          const info = await lstat(file);
          if (!info.isFile() || info.isSymbolicLink() || info.size > 8388608)
            throw new Error("Artefato inválido.");
          const artifactId = randomUUID();
          const base = resolve(runnerConfig.RUNNER_ARTIFACT_DIR);
          await mkdir(base, { recursive: true, mode: 0o750 });
          const destination = join(base, artifactId);
          await copyFile(file, destination);
          await chmod(destination, 0o640);
          const bytes = await readFile(destination);
          collected.push({
            id: artifactId,
            name: binary,
            path: destination,
            sha256: createHash("sha256").update(bytes).digest("hex"),
            size: bytes.length,
            kind: "pe",
          });
          outcome.stdout +=
            "\nPE compilado para inspeção. O executável Windows não foi executado no host.\n";
        }
      }
    }
    let cpu: CpuSnapshot | undefined;
    if (input.language === "assembly" && outcome.exitCode === 0) {
      const parsed: unknown = JSON.parse(outcome.stdout);
      if (
        typeof parsed === "object" &&
        parsed !== null &&
        "registers" in parsed
      )
        cpu = parsed as CpuSnapshot;
      outcome.stdout = cpu
        ? `Modelo concluído em ${cpu.steps} instruções.\nRIP ${cpu.ip}\n${Object.entries(
            cpu.registers,
          )
            .map(([name, value]) => `${name} ${value}`)
            .join("\n")}\n${cpu.output.join("\n")}`
        : outcome.stdout;
    }
    return {
      status: status(outcome),
      result: {
        stdout: outcome.stdout,
        stderr: outcome.stderr,
        exitCode: outcome.exitCode,
        durationMs: Date.now() - start,
        truncated: outcome.limited === "output_limited",
        artifacts: collected.map(({ id, name, size, kind }) => ({
          id,
          name,
          size,
          kind,
        })),
        ...(cpu ? { cpu } : {}),
      },
      artifacts: collected,
    };
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}
