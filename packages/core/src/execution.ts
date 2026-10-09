import { z } from "zod";
export const languages = [
  "python",
  "c",
  "assembly",
  "fasm",
  "windows-cpp",
] as const;
export type ExecutionLanguage = (typeof languages)[number];
export const virtualFileSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-zA-Z0-9_-]+\.(py|c|cpp|h|asm|txt)$/),
  content: z.string().max(65536),
});
export const executionInputSchema = z
  .object({
    language: z.enum(languages),
    files: z.array(virtualFileSchema).min(1).max(8),
    entryFile: z.string().max(80),
    submissionId: z.uuid(),
    lessonId: z.string().max(200).optional(),
    labId: z.string().max(80).optional(),
    exerciseId: z
      .string()
      .regex(/^[a-z0-9-]+$/)
      .max(80)
      .optional(),
    mode: z.enum(["x86-32", "x86-64"]).default("x86-64"),
  })
  .strict()
  .superRefine((value, context) => {
    const names = value.files.map((file) => file.name);
    if (new Set(names).size !== names.length)
      context.addIssue({
        code: "custom",
        message: "Os nomes dos arquivos precisam ser únicos.",
      });
    if (!names.includes(value.entryFile))
      context.addIssue({
        code: "custom",
        message: "O arquivo principal não foi encontrado.",
      });
    if (
      value.files.reduce(
        (sum, file) => sum + new TextEncoder().encode(file.content).length,
        0,
      ) > 262144
    )
      context.addIssue({
        code: "custom",
        message: "O conjunto de arquivos excede 256 KiB.",
      });
    const extensions: Record<ExecutionLanguage, string[]> = {
      python: ["py"],
      c: ["c"],
      assembly: ["asm"],
      fasm: ["asm"],
      "windows-cpp": ["cpp", "c"],
    };
    if (
      !extensions[value.language].includes(
        value.entryFile.split(".").at(-1) ?? "",
      )
    )
      context.addIssue({
        code: "custom",
        message: "O arquivo principal não corresponde à linguagem.",
      });
  });
export type ExecutionInput = z.infer<typeof executionInputSchema>;
export const terminalStatuses = [
  "succeeded",
  "failed",
  "timed_out",
  "memory_limited",
  "output_limited",
  "cancelled",
] as const;
export type JobStatus =
  | "queued"
  | "provisioning"
  | "compiling"
  | "running"
  | (typeof terminalStatuses)[number];
export type ExecutionResult = {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  durationMs: number;
  truncated: boolean;
  artifacts: Array<{ id: string; name: string; size: number; kind: string }>;
  cpu?: CpuSnapshot;
};
export type CpuSnapshot = {
  mode: "x86-32" | "x86-64";
  registers: Record<string, string>;
  flags: Record<string, boolean | null>;
  ip: string;
  memory: Array<{ address: string; bytes: number[] }>;
  steps: number;
  halted: boolean;
  output: string[];
};
export type Job = {
  id: string;
  language: ExecutionLanguage;
  status: JobStatus;
  createdAt: string;
  result: ExecutionResult | null;
};
export type VirtualFile = z.infer<typeof virtualFileSchema>;
export const draftSchema = z
  .object({
    files: z.array(virtualFileSchema).min(1).max(8),
    language: z.enum(languages),
    activeFile: z.string().max(80),
    expectedVersion: z.number().int().min(0),
  })
  .strict()
  .superRefine((value, context) => {
    const names = value.files.map((file) => file.name);
    if (
      new Set(names).size !== names.length ||
      !names.includes(value.activeFile)
    )
      context.addIssue({
        code: "custom",
        message: "Arquivos ou seleção inválidos.",
      });
    if (
      value.files.reduce(
        (sum, file) => sum + new TextEncoder().encode(file.content).length,
        0,
      ) > 262144
    )
      context.addIssue({
        code: "custom",
        message: "O rascunho excede 256 KiB.",
      });
  });
export type DraftPayload = Omit<z.infer<typeof draftSchema>, "expectedVersion">;
export function isTerminal(status: JobStatus): boolean {
  return (terminalStatuses as readonly string[]).includes(status);
}
