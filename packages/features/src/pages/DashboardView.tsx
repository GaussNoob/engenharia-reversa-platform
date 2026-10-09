import type {
  UserSummary,
  PublicCatalog,
  ProgressSummary,
  PublicExercise,
  Lab,
  ReferenceDocument,
} from "@nucleo/core";
import { Link } from "@nucleo/platform";
import { Play, FlaskConical, Clock, Check, BookOpen } from "lucide-react";
import { PageHeader } from "@nucleo/features/components/PageHeader";
import { lessonHref, nextLessonId } from "@nucleo/core";
import { DemoStepper } from "@nucleo/features/modules/labs/DemoStepper";
export function DashboardView({
  user,
  catalog,
  progress,
}: {
  user: UserSummary;
  catalog: PublicCatalog;
  progress: ProgressSummary;
}) {
  const lessons = catalog.modules.flatMap((module) => module.lessons);
  const done = new Set(
    progress.lessons
      .filter((item) => item.status === "completed")
      .map((item) => item.lessonId),
  );
  const current =
    lessons.find((lesson) => lesson.id === progress.lastLessonId) ??
    lessons[0]!;
  const next = lessons.find(
    (lesson) =>
      lesson.id ===
      nextLessonId(
        lessons.map((lesson) => lesson.id),
        done,
      ),
  );
  const module = catalog.modules.find(
    (module) => module.id === current.moduleId,
  )!;
  return (
    <>
      <PageHeader section="Visão geral">
        <span className="tag">
          {progress.streak
            ? `${progress.streak} dia${progress.streak > 1 ? "s" : ""} de constância`
            : "Sua jornada começa aqui"}
        </span>
      </PageHeader>
      <main id="main" className="page-body dashboard-page">
        <div className="dashboard-greeting">
          <div>
            <span className="overline">SEU ESPAÇO DE DESCOBERTA</span>
            <h1>
              Olá, {user.name.split(" ")[0]}
              <span className="accent-dot">.</span>
            </h1>
          </div>
          <p>
            Entender leva tempo.
            <br />O próximo passo já está aqui.
          </p>
        </div>
        <section className="continue-study">
          <div className="continue-copy">
            <span className="mono small-label">CONTINUAR ESTUDANDO</span>
            <div className="continue-chapter">
              Módulo {module.number}
              <span>/</span>
              {module.title}
            </div>
            <h2>{current.title}</h2>
            <p>{current.objective}</p>
            <Link className="button" href={lessonHref(current)}>
              <Play size={14} />
              {progress.lastLessonId
                ? "Voltar à aula"
                : "Abrir minha primeira aula"}
            </Link>
            <span className="continue-meta">
              <Clock size={13} />
              {current.minutes} min estimados
            </span>
          </div>
          <DemoStepper compact />
        </section>
        <div className="dashboard-progress">
          <div>
            <span>Fundamentos de Engenharia Reversa</span>
            <strong>
              {progress.percentage}
              <small>%</small>
            </strong>
          </div>
          <div className="progress-track">
            <span style={{ width: `${progress.percentage}%` }} />
          </div>
          <span>
            {progress.completedLessons} de {progress.totalLessons} aulas
            concluídas
          </span>
        </div>
        <div className="dashboard-stats">
          <div>
            <strong>
              {progress.completedLessons.toString().padStart(2, "0")}
            </strong>
            <span>Aulas concluídas</span>
          </div>
          <div>
            <strong>
              {Math.floor(progress.activeSeconds / 60)}
              <small> min</small>
            </strong>
            <span>Tempo ativo de estudo</span>
          </div>
          <div>
            <strong>
              {progress.completedLabs.toString().padStart(2, "0")}
            </strong>
            <span>Laboratórios realizados</span>
          </div>
          <div>
            <strong>
              {progress.passedQuizzes.toString().padStart(2, "0")}
            </strong>
            <span>Checkpoints resolvidos</span>
          </div>
        </div>
        <div className="dashboard-bottom">
          <section>
            <div className="section-heading">
              <h3>Na sua sequência</h3>
              <Link className="text-link" href="/aprender/fundamentos">
                Ver toda a trilha
              </Link>
            </div>
            {next && (
              <Link className="next-lesson" href={lessonHref(next)}>
                <span className="next-lesson-number mono">
                  {String(next.order + 1).padStart(2, "0")}
                </span>
                <div>
                  <strong>{next.title}</strong>
                  <p>{next.objective}</p>
                </div>
                <span className="tag">{next.minutes} min</span>
              </Link>
            )}
            <Link className="practice-link" href="/laboratorios">
              <FlaskConical size={18} />
              <div>
                <strong>Aprenda experimentando</strong>
                <span>35 laboratórios para levar conceitos à prática.</span>
              </div>
            </Link>
          </section>
          <section>
            <div className="section-heading">
              <h3>Última atividade</h3>
              <Link href="/progresso" className="text-link">
                Seu progresso
              </Link>
            </div>
            {progress.activities.length ? (
              progress.activities.map((activity) => (
                <Link
                  className="activity-row"
                  key={activity.id}
                  href={activity.href}
                >
                  <Check size={14} />
                  <span>
                    {activity.label}
                    <small>
                      {new Date(activity.createdAt).toLocaleDateString("pt-BR")}
                    </small>
                  </span>
                </Link>
              ))
            ) : (
              <p className="empty-state">
                A primeira aula concluída aparecerá aqui.
                <br />
                Cada passo constrói o próximo.
              </p>
            )}
          </section>
        </div>
      </main>
    </>
  );
}
