import type {
  UserSummary,
  PublicCatalog,
  ProgressSummary,
  PublicExercise,
  Lab,
  ReferenceDocument,
} from "@nucleo/core";
import { Link } from "@nucleo/platform";
import { PageHeader } from "@nucleo/features/components/PageHeader";
import { LabSurface } from "@nucleo/features/modules/labs/LabSurface";
import { LabChallenge } from "@nucleo/features/modules/labs/LabChallenge";
import { lessonHref } from "@nucleo/core";
import { ExerciseLinks } from "@nucleo/features/modules/exercises/ExerciseLinks";
export function LabView({
  id,
  catalog,
  exercises,
}: {
  id: string;
  catalog: PublicCatalog;
  exercises: PublicExercise[];
}) {
  const lab = catalog.labs.find((lab) => lab.id === id);
  if (!lab) throw new Error("Laboratório não encontrado.");
  const lessons = catalog.modules
    .flatMap((module) => module.lessons)
    .filter((lesson) => lab.lessonIds.includes(lesson.id));
  return (
    <>
      <PageHeader section="Laboratórios" detail={lab.title} />
      <main id="main" className="page-body lab-detail">
        <div className="lab-detail-intro">
          <span className="overline">
            MÓDULO {lab.moduleNumber} / LABORATÓRIO
          </span>
          <h1>{lab.title}</h1>
          <p>{lab.learningOutcome}</p>
          <div>
            <span className="tag">{lab.minutes} min estimados</span>
            <span className="tag tag-accent">
              {lab.engine.replaceAll("-", " ")}
            </span>
          </div>
        </div>
        <div className="lab-detail-grid">
          <div className="standalone-bench">
            <LabSurface lab={lab} />
          </div>
          <aside>
            <LabChallenge labId={lab.id} />
            <ExerciseLinks
              exercises={exercises.filter(
                (exercise) => exercise.labId === lab.id,
              )}
            />
            {lessons.length > 0 && (
              <section className="lab-related">
                <span className="mono">NA TRILHA</span>
                {lessons.map((lesson) => (
                  <Link href={lessonHref(lesson)} key={lesson.id}>
                    {lesson.title}
                  </Link>
                ))}
              </section>
            )}
            <section className="lab-guidance">
              <strong>Observe antes e depois.</strong>
              <p>
                Altere uma informação por vez. Tente prever o resultado e use a
                bancada para conferir sua hipótese.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </>
  );
}
