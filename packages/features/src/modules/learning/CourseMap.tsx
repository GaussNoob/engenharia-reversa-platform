"use client";
import { Link } from "@nucleo/platform";
import { useEffect, useState } from "react";
import {
  ChevronDown,
  Check,
  Play,
  FlaskConical,
  Clock,
  Layers,
} from "lucide-react";
import {
  lessonHref,
  type PublicCatalog,
  type ProgressSummary,
} from "@nucleo/core";
import { useAccount } from "@nucleo/features/components/AccountProvider";
import { api } from "@nucleo/api-client";
export function CourseMap({ catalog }: { catalog: PublicCatalog }) {
  const { user } = useAccount();
  const [progress, setProgress] = useState<ProgressSummary | null>(null);
  const [expanded, setExpanded] = useState("01-introducao");
  useEffect(() => {
    if (user)
      void api<ProgressSummary>("/progress")
        .then(setProgress)
        .catch(() => {});
  }, [user]);
  const completed = new Set(
    progress?.lessons
      .filter((lesson) => lesson.status === "completed")
      .map((lesson) => lesson.lessonId) ?? [],
  );
  const last =
    catalog.modules
      .flatMap((module) => module.lessons)
      .find((lesson) => lesson.id === progress?.lastLessonId) ??
    catalog.modules[0]!.lessons[0]!;
  return (
    <>
      <div className="course-overview">
        <div>
          <div className="overline">TRILHA DE ESTUDO / 01</div>
          <h1>
            Fundamentos de
            <br />
            <span>Engenharia Reversa.</span>
          </h1>
          <p>
            Entenda como números, memória e instruções se conectam.
            <br />
            Depois, coloque esse conhecimento sob o seu controle.
          </p>
          <div className="course-facts">
            <span>
              <Layers size={14} />9 módulos
            </span>
            <span>63 aulas</span>
            <span>
              <FlaskConical size={14} />
              35 laboratórios
            </span>
            <span>
              <Clock size={14} />
              ~21 horas de estudo
            </span>
          </div>
          <Link className="button" href={lessonHref(last)}>
            <Play size={14} />
            {progress?.lastLessonId
              ? "Continuar estudando"
              : "Começar pelo primeiro byte"}
          </Link>
        </div>
        <div className="course-progress-mark">
          <svg viewBox="0 0 140 140" aria-hidden="true">
            <circle
              cx="70"
              cy="70"
              r="57"
              fill="none"
              stroke="#2b3034"
              strokeWidth="3"
            />
            <circle
              cx="70"
              cy="70"
              r="57"
              fill="none"
              stroke="#e8ba70"
              strokeWidth="3"
              strokeDasharray={`${(progress?.percentage ?? 0) * 3.581} 358.1`}
              transform="rotate(-90 70 70)"
            />
          </svg>
          <strong>
            {progress?.percentage ?? 0}
            <small>%</small>
          </strong>
          <p>{progress?.completedLessons ?? 0} de 63 aulas</p>
          <span>SEU PROGRESSO</span>
        </div>
      </div>
      <div className="course-source">
        <span>Conteúdo e exemplos do livro</span>
        <strong>Fernando Mercês / Mente Binária</strong>
        <Link href="/referencias/sobre-o-livro">Conhecer a fonte</Link>
      </div>
      <div className="curriculum-label">
        <h2>A sequência da descoberta</h2>
        <span className="mono">09 MÓDULOS / DO FUNDAMENTO À PRÁTICA</span>
      </div>
      <div className="course-modules">
        {catalog.modules.map((module) => {
          const done = module.lessons.filter((lesson) =>
            completed.has(lesson.id),
          ).length;
          const opened = expanded === module.id;
          return (
            <section className="course-module" id={module.id} key={module.id}>
              <button
                className="module-toggle"
                onClick={() => setExpanded(opened ? "" : module.id)}
                aria-expanded={opened}
              >
                <span
                  className={`module-index ${done === module.lessons.length ? "complete" : ""}`}
                >
                  {done === module.lessons.length ? (
                    <Check size={17} />
                  ) : (
                    module.number
                  )}
                </span>
                <span className="module-copy">
                  <strong>{module.title}</strong>
                  <small>{module.objective}</small>
                </span>
                <span className="module-meta">
                  {module.lessons.length} aulas
                  <span>
                    {module.labCount} labs · {module.difficulty}
                  </span>
                </span>
                <span className="module-meter">
                  <span
                    style={{
                      width: `${(done / module.lessons.length) * 100}%`,
                    }}
                  />
                </span>
                <ChevronDown className={opened ? "rotated" : ""} size={18} />
              </button>
              {opened && (
                <div className="module-lessons">
                  <div className="module-prerequisite">
                    {module.prerequisites.length
                      ? `Pré-requisito recomendado: módulo ${module.number === "01" ? "01" : String(Number(module.number) - 1).padStart(2, "0")}.`
                      : "Ponto de partida: conhecimentos básicos de programação."}
                  </div>
                  {module.lessons.map((lesson) => (
                    <Link
                      key={lesson.id}
                      href={lessonHref(lesson)}
                      className="lesson-map-row"
                    >
                      <span className="lesson-status">
                        {completed.has(lesson.id) ? (
                          <Check size={14} />
                        ) : (
                          <span />
                        )}
                      </span>
                      <span className="mono lesson-map-index">
                        {String(lesson.order + 1).padStart(2, "0")}
                      </span>
                      <span>{lesson.title}</span>
                      <span className="lesson-map-minutes">
                        {lesson.minutes} min
                      </span>
                      <span className="lesson-map-kind">
                        {lesson.labIds.length ? "com prática" : "conceitos"}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
