import type {
  UserSummary,
  PublicCatalog,
  ProgressSummary,
  PublicExercise,
  Lab,
  ReferenceDocument,
} from "@nucleo/core";
import { PageHeader } from "@nucleo/features/components/PageHeader";
import { CourseMap } from "@nucleo/features/modules/learning/CourseMap";
export function CourseView({ catalog }: { catalog: PublicCatalog }) {
  return (
    <>
      <PageHeader section="Aprender" detail="Fundamentos" />
      <main id="main" className="page-body course-page">
        <CourseMap catalog={catalog} />
      </main>
    </>
  );
}
