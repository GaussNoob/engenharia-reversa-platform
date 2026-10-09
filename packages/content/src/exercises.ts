import { readFileSync } from "node:fs";
import { z } from "zod";
import {
  exerciseDefinitionSchema,
  type Catalog,
  type ExerciseDefinition,
  type PublicExercise,
} from "@nucleo/core";

export const exerciseDefinitions = z
  .array(exerciseDefinitionSchema)
  .parse(
    JSON.parse(
      readFileSync(
        new URL("../../../content/exercises.json", import.meta.url),
        "utf8",
      ),
    ),
  );
if (
  new Set(exerciseDefinitions.map((item) => item.id)).size !==
  exerciseDefinitions.length
)
  throw new Error(
    "O catálogo de exercícios possui identificadores duplicados.",
  );

export function publicExercise(
  definition: ExerciseDefinition,
  catalog: Catalog,
): PublicExercise {
  const lab = catalog.labs.find((item) => item.id === definition.labId);
  if (!lab)
    throw new Error(`Laboratório inválido no exercício ${definition.id}.`);
  const module = catalog.modules.find(
    (item) => item.number === lab.moduleNumber,
  )!;
  const lessons = definition.lessonSlugs
    ? definition.lessonSlugs.map((slug) => {
        const lesson = module.lessons.find((item) => item.slug === slug);
        if (!lesson)
          throw new Error(
            `Aula inválida no exercício ${definition.id}: ${slug}.`,
          );
        return lesson.id;
      })
    : lab.lessonIds;
  const base = {
    id: definition.id,
    labId: definition.labId,
    title: definition.title,
    objective: definition.objective,
    question: definition.question,
    difficulty: definition.difficulty,
    minutes: definition.minutes,
    instructions: definition.instructions,
    hints: definition.hints,
    concepts: definition.concepts,
    origin: definition.origin,
    moduleNumber: lab.moduleNumber,
    lessonIds: lessons,
  };
  if (definition.kind === "code")
    return {
      ...base,
      kind: "code",
      language: definition.language,
      mode: definition.mode,
      starterCode: definition.starterCode,
    };
  if (definition.kind === "choice")
    return { ...base, kind: "choice", choices: definition.choices };
  return { ...base, kind: definition.kind };
}
