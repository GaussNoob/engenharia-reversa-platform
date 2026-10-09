import { ExerciseView } from "@nucleo/features/pages/ExerciseView";
import { notFound } from "next/navigation";
import { lessonHref, type PublicExercise } from "@nucleo/core";
import { getCatalog, serverApi } from "@/lib/server-api";
import { PageHeader } from "@nucleo/features/components/PageHeader";
async function load(id: string) {
  const [catalog, exercises] = await Promise.all([
    getCatalog(),
    serverApi<PublicExercise[]>("/exercises"),
  ]);
  const exercise = exercises.find((exercise) => exercise.id === id);
  if (!exercise) notFound();
  const lab = catalog.labs.find((lab) => lab.id === exercise.labId)!;
  const module = catalog.modules.find(
    (module) => module.number === exercise.moduleNumber,
  )!;
  return { catalog, exercises, exercise, lab, module };
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { exercise } = await load((await params).id);
  return { title: exercise.title, description: exercise.question };
}
export default async function ExercisePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { exercise, lab, module, exercises } = await load((await params).id);
  return (
    <ExerciseView
      exercise={exercise}
      lab={lab}
      module={module}
      exercises={exercises}
    />
  );
}
