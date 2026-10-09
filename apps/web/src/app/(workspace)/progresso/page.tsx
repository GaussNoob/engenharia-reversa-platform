import { ProgressView } from "@nucleo/features/pages/ProgressView";
import Link from "next/link";
import { getProgress, getCatalog } from "@/lib/server-api";
import { PageHeader } from "@nucleo/features/components/PageHeader";
import { lessonHref } from "@nucleo/core";
export const metadata = {
  title: "Seu progresso",
  robots: { index: false, follow: false },
};
export default async function ProgressPage() {
  const [progress, catalog] = await Promise.all([getProgress(), getCatalog()]);
  return <ProgressView catalog={catalog} progress={progress} />;
}
