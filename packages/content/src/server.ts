import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type {
  Catalog,
  PublicCatalog,
  QuizDefinition,
  SearchEntry,
  Lesson,
} from "@nucleo/core";
import { exerciseHref } from "@nucleo/core";
import { exerciseDefinitions, publicExercise } from "./exercises.ts";
export { exerciseDefinitions } from "./exercises.ts";
const directory = new URL("../../../content/.generated/", import.meta.url);
function read<T>(name: string): T {
  return JSON.parse(
    readFileSync(fileURLToPath(new URL(name, directory)), "utf8"),
  ) as T;
}
export const catalog = read<Catalog>("catalog.json");
export const quizzes = read<QuizDefinition[]>("quizzes-private.json");
export const exercises = exerciseDefinitions.map((definition) =>
  publicExercise(definition, catalog),
);
export const searchEntries: SearchEntry[] = [
  ...read<SearchEntry[]>("search.json"),
  ...exercises.map((exercise) => ({
    id: `exercise/${exercise.id}`,
    title: exercise.title,
    kind: "exercício" as const,
    description: exercise.question,
    href: exerciseHref(exercise),
    keywords: exercise.concepts,
  })),
];
export const publicCatalog: PublicCatalog = {
  ...catalog,
  modules: catalog.modules.map((module) => ({
    ...module,
    lessons: module.lessons.map(({ blocks: _blocks, ...lesson }) => lesson),
  })),
  references: catalog.references.map(
    ({ blocks: _blocks, ...reference }) => reference,
  ),
};
export function findLesson(id: string): Lesson | undefined {
  return catalog.modules
    .flatMap((module) => module.lessons)
    .find((lesson) => lesson.id === id);
}
export function findLessonRoute(
  moduleId: string,
  slug: string,
): Lesson | undefined {
  return catalog.modules
    .find((module) => module.id === moduleId)
    ?.lessons.find((lesson) => lesson.slug === slug);
}
export function publicQuestion(question: QuizDefinition) {
  const {
    correctId: _answer,
    explanation: _explanation,
    ...publicFields
  } = question;
  return publicFields;
}
