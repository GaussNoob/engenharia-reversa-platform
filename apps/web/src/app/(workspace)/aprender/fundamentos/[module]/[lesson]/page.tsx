import { serverApi, getCatalog } from "@/lib/server-api";
import { LessonView } from "@nucleo/features/modules/learning/LessonView";
import type { Lesson, QuizQuestion, PublicExercise } from "@nucleo/core";
export default async function LessonPage({
  params,
}: {
  params: Promise<{ module: string; lesson: string }>;
}) {
  const route = await params;
  const [catalog, data, exercises] = await Promise.all([
    getCatalog(),
    serverApi<{ lesson: Lesson; questions: QuizQuestion[] }>(
      "/lessons/" +
        encodeURIComponent(route.module) +
        "/" +
        encodeURIComponent(route.lesson),
    ),
    serverApi<PublicExercise[]>("/exercises"),
  ]);
  return (
    <LessonView
      key={data.lesson.id}
      {...data}
      catalog={catalog}
      exercises={exercises.filter((exercise) =>
        exercise.lessonIds.includes(data.lesson.id),
      )}
    />
  );
}
