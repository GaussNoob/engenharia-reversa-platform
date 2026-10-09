import { z } from "zod";
import { languages } from "./execution.ts";

const base = {
  id: z
    .string()
    .regex(/^[a-z0-9-]+$/)
    .max(80),
  labId: z.string().max(80),
  title: z.string().min(5),
  objective: z.string().min(10),
  question: z.string().min(10),
  difficulty: z.enum(["fundamentos", "intermediário", "desafio"]),
  minutes: z.number().int().min(2).max(60),
  instructions: z.array(z.string()).min(1),
  hints: z.array(z.string()).min(1).max(4),
  concepts: z.array(z.string()).min(1),
  lessonSlugs: z.array(z.string()).min(1).optional(),
  explanation: z.string().min(15),
  origin: z.literal("complement"),
};
const answer = z.string().min(1).max(512);
export const exerciseDefinitionSchema = z.discriminatedUnion("kind", [
  z.object({ ...base, kind: z.literal("number"), answer }).strict(),
  z.object({ ...base, kind: z.literal("bytes"), answer }).strict(),
  z.object({ ...base, kind: z.literal("text"), answer }).strict(),
  z
    .object({
      ...base,
      kind: z.literal("choice"),
      choices: z
        .array(z.object({ id: z.string(), text: z.string() }).strict())
        .min(3),
      answer,
    })
    .strict(),
  z
    .object({
      ...base,
      kind: z.literal("code"),
      language: z.enum(languages),
      mode: z.enum(["x86-32", "x86-64"]).default("x86-64"),
      starterCode: z.string().max(65536),
      solutionCode: z.string().min(1).max(65536),
      criteria: z
        .object({
          stdout: z.string().optional(),
          registers: z.record(z.string(), z.string()).optional(),
          minSteps: z.number().int().min(1).optional(),
        })
        .strict()
        .refine(
          (value) =>
            value.stdout !== undefined ||
            (value.registers !== undefined &&
              Object.keys(value.registers).length > 0),
          "O desafio precisa de um resultado verificável.",
        ),
    })
    .strict(),
]);
export type ExerciseDefinition = z.infer<typeof exerciseDefinitionSchema>;
type PublicBase = Pick<
  ExerciseDefinition,
  | "id"
  | "labId"
  | "title"
  | "objective"
  | "question"
  | "difficulty"
  | "minutes"
  | "instructions"
  | "hints"
  | "concepts"
  | "origin"
> & {
  moduleNumber: string;
  lessonIds: string[];
};
export type PublicExercise = PublicBase &
  (
    | { kind: "number" | "bytes" | "text" }
    | { kind: "choice"; choices: Array<{ id: string; text: string }> }
    | {
        kind: "code";
        language: (typeof languages)[number];
        mode: "x86-32" | "x86-64";
        starterCode: string;
      }
  );
export type ExerciseResult = {
  passed: boolean;
  feedback: string;
  explanation?: string;
};
export type ExerciseSolution = {
  explanation: string;
  answer?: string;
  solutionCode?: string;
};
export const exerciseCheckSchema = z
  .object({
    answer: z.string().max(512).default(""),
    submissionId: z.uuid(),
    jobId: z.uuid().optional(),
  })
  .strict();
export function exerciseHref(exercise: Pick<PublicExercise, "id">): string {
  return `/exercicios/${exercise.id}`;
}
