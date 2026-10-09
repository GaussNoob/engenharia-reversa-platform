import { LabView } from "@nucleo/features/pages/LabView";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCatalog, serverApi } from "@/lib/server-api";
import { PageHeader } from "@nucleo/features/components/PageHeader";
import { LabSurface } from "@nucleo/features/modules/labs/LabSurface";
import { LabChallenge } from "@nucleo/features/modules/labs/LabChallenge";
import { lessonHref, type PublicExercise } from "@nucleo/core";
import { ExerciseLinks } from "@nucleo/features/modules/exercises/ExerciseLinks";
export default async function LabPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [catalog, exercises] = await Promise.all([
    getCatalog(),
    serverApi<PublicExercise[]>("/exercises"),
  ]);
  return <LabView id={id} catalog={catalog} exercises={exercises} />;
}
