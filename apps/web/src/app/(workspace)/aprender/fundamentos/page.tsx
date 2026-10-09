import { CourseView } from "@nucleo/features/pages/CourseView";
import type { Metadata } from "next";
import { getCatalog } from "@/lib/server-api";
import { PageHeader } from "@nucleo/features/components/PageHeader";
import { CourseMap } from "@nucleo/features/modules/learning/CourseMap";
export const metadata: Metadata = {
  title: "Fundamentos de Engenharia Reversa",
};
export default async function CoursePage() {
  const catalog = await getCatalog();
  return <CourseView catalog={catalog} />;
}
