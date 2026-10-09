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
import { lessonHref } from "@nucleo/core";
export function ProgressView({
  catalog,
  progress,
}: {
  catalog: PublicCatalog;
  progress: ProgressSummary;
}) {
  const done = new Set(
    progress.lessons
      .filter((lesson) => lesson.status === "completed")
      .map((lesson) => lesson.lessonId),
  );
  return (
    <>
      <PageHeader section="Progresso" />
      <main id="main" className="page-body">
        <span className="overline">CONHECIMENTO QUE SE CONSTRÓI</span>
        <h1 className="page-title">Cada passo conta.</h1>
        <div className="progress-large">
          <strong>
            {progress.percentage}
            <small>%</small>
          </strong>
          <p>
            {progress.completedLessons} de {progress.totalLessons} aulas
            concluídas.
            <br />
            {Math.floor(progress.activeSeconds / 60)} minutos de atividade
            registrada.
          </p>
        </div>
        <div className="progress-module-list">
          {catalog.modules.map((module) => {
            const count = module.lessons.filter((lesson) =>
              done.has(lesson.id),
            ).length;
            return (
              <section key={module.id}>
                <div>
                  <span className="mono">{module.number}</span>
                  <h2>{module.title}</h2>
                  <span>
                    {count}/{module.lessons.length} aulas
                  </span>
                </div>
                <div className="progress-track">
                  <span
                    style={{
                      width: `${(count / module.lessons.length) * 100}%`,
                    }}
                  />
                </div>
                <Link
                  className="text-link"
                  href={lessonHref(
                    module.lessons.find((lesson) => !done.has(lesson.id)) ??
                      module.lessons[0]!,
                  )}
                >
                  {count === module.lessons.length
                    ? "Revisar módulo"
                    : "Continuar módulo"}
                </Link>
              </section>
            );
          })}
        </div>
        <div className="dashboard-stats">
          <div>
            <strong>{progress.completedLabs}</strong>
            <span>Laboratórios concluídos</span>
          </div>
          <div>
            <strong>{progress.passedQuizzes}</strong>
            <span>Checkpoints resolvidos</span>
          </div>
          <div>
            <strong>{progress.passedExercises}</strong>
            <span>Exercícios resolvidos</span>
          </div>
        </div>
      </main>
    </>
  );
}
