import { DashboardView } from "@nucleo/features/pages/DashboardView";
import Link from "next/link";
import { Play, FlaskConical, Clock, Check, BookOpen } from "lucide-react";
import { getUser, getCatalog, getProgress } from "@/lib/server-api";
import { PageHeader } from "@nucleo/features/components/PageHeader";
import { lessonHref, nextLessonId } from "@nucleo/core";
import { DemoStepper } from "@nucleo/features/modules/labs/DemoStepper";
export const metadata = {
  title: "Sua bancada",
  robots: { index: false, follow: false },
};
export default async function DashboardPage() {
  const user = await getUser();
  const [catalog, progress] = await Promise.all([getCatalog(), getProgress()]);
  return <DashboardView user={user} catalog={catalog} progress={progress} />;
}
