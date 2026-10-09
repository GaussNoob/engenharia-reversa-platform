import type {
  UserSummary,
  PublicCatalog,
  ProgressSummary,
  PublicExercise,
  Lab,
  ReferenceDocument,
} from "@nucleo/core";
import { lessonHref } from "@nucleo/core";
import { PageHeader } from "@nucleo/features/components/PageHeader";
import { ExerciseView as ExerciseDetail } from "@nucleo/features/modules/exercises/ExerciseView";
export function ExerciseView({
  exercise,
  lab,
  module,
  exercises,
}: {
  exercise: PublicExercise;
  lab: Lab;
  module: PublicCatalog["modules"][number];
  exercises: PublicExercise[];
}) {
  const following = exercises.slice(
    exercises.findIndex((item) => item.id === exercise.id) + 1,
  )[0];
  return (
    <>
      <PageHeader section="Exercícios" detail={exercise.title} />
      <ExerciseDetail
        key={exercise.id}
        exercise={exercise}
        lab={lab}
        moduleTitle={module.title}
        lessons={module.lessons
          .filter((lesson) => exercise.lessonIds.includes(lesson.id))
          .map((lesson) => ({
            id: lesson.id,
            title: lesson.title,
            href: lessonHref(lesson),
          }))}
        next={
          following ? { id: following.id, title: following.title } : undefined
        }
      />
    </>
  );
}
