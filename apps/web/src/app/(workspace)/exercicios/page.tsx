import { ExercisesView } from "@nucleo/features/pages/ExercisesView";
import type { Metadata } from "next";
import type { PublicExercise } from "@nucleo/core";
import { getCatalog, serverApi } from "@/lib/server-api";
import { PageHeader } from "@nucleo/features/components/PageHeader";
import { ExerciseCatalog } from "@nucleo/features/modules/exercises/ExerciseCatalog";
export const metadata: Metadata = {
  title: "Exercícios",
  description:
    "Desafios progressivos de engenharia reversa, com dicas, bancada e soluções comentadas.",
};
export default async function ExercisesPage() {
  const [catalog, exercises] = await Promise.all([
    getCatalog(),
    serverApi<PublicExercise[]>("/exercises"),
  ]);
  return <ExercisesView catalog={catalog} exercises={exercises} />;
}
