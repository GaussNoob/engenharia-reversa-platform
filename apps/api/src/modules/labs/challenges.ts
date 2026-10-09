import { readFileSync } from "node:fs";
import { z } from "zod";
const definition = z.object({
  kind: z.enum(["code", "number", "choice"]),
  question: z.string(),
  choices: z.array(z.string()).optional(),
  answer: z.string().optional(),
  criteria: z
    .object({
      stdout: z.string().optional(),
      register: z.string().optional(),
      value: z.string().optional(),
      minSteps: z.number().optional(),
      artifact: z.string().optional(),
    })
    .optional(),
});
export const challenges = z
  .record(z.string(), definition)
  .parse(
    JSON.parse(
      readFileSync(
        new URL("../../../../../content/lab-challenges.json", import.meta.url),
        "utf8",
      ),
    ),
  );
