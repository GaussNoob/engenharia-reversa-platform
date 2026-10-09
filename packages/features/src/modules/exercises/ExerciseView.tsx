"use client";
import { useState } from "react";
import dynamic from "@nucleo/platform/lazy";
import { Link } from "@nucleo/platform";
import { ArrowRight, BookOpen } from "lucide-react";
import {
  exerciseHref,
  type PublicExercise,
  type Lab,
  type Job,
} from "@nucleo/core";
import { LessonPractice } from "@nucleo/features/modules/learning/LessonPractice";
import { LabSurface } from "@nucleo/features/modules/labs/LabSurface";
import { ExerciseHints } from "./ExerciseHints";
import { ExerciseSubmission } from "./ExerciseSubmission";
const CodeWorkbench = dynamic(
  () =>
    import("@nucleo/features/modules/labs/CodeWorkbench").then(
      (module) => module.CodeWorkbench,
    ),
  { ssr: false },
);
type RelatedLesson = { id: string; title: string; href: string };
export function ExerciseView({
  exercise,
  lab,
  moduleTitle,
  lessons,
  next,
}: {
  exercise: PublicExercise;
  lab: Lab;
  moduleTitle: string;
  lessons: RelatedLesson[];
  next?: Pick<PublicExercise, "id" | "title">;
}) {
  const [panel, setPanel] = useState("Aula");
  const [job, setJob] = useState<Job | null>(null);
  return (
    <main id="main" className="lesson-layout with-practice exercise-layout">
      <article className="lesson-reading exercise-reading">
        <div className="exercise-eyebrow">
          <span className="overline">
            MÓDULO {exercise.moduleNumber} / EXERCÍCIO
          </span>
          <span>Complemento pedagógico</span>
        </div>
        <h1>{exercise.title}</h1>
        <div className="exercise-meta">
          <span>{moduleTitle}</span>
          <span>{exercise.difficulty}</span>
          <span>{exercise.minutes} min</span>
        </div>
        <p className="exercise-objective">{exercise.objective}</p>
        <section className="exercise-brief">
          <span className="overline">O DESAFIO</span>
          <h2>{exercise.question}</h2>
          <ol>
            {exercise.instructions.map((instruction, index) => (
              <li key={index}>{instruction}</li>
            ))}
          </ol>
        </section>
        <ExerciseHints hints={exercise.hints} />
        <ExerciseSubmission exercise={exercise} job={job} />
        <section className="exercise-related-lessons">
          <span className="overline">PARA REVISAR O CONCEITO</span>
          {lessons.map((lesson) => (
            <Link href={lesson.href} key={lesson.id}>
              <BookOpen size={14} />
              {lesson.title}
            </Link>
          ))}
        </section>
        <nav className="exercise-next" aria-label="Próximo exercício">
          {next ? (
            <Link href={exerciseHref(next)}>
              <span>
                <small>CONTINUE PRATICANDO</small>
                <strong>{next.title}</strong>
              </span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <Link href="/exercicios">
              Voltar à coleção de exercícios
              <ArrowRight size={18} />
            </Link>
          )}
        </nav>
      </article>
      <LessonPractice
        title={exercise.title}
        expanded
        panel={panel}
        onPanel={setPanel}
      >
        {exercise.kind === "code" ? (
          <CodeWorkbench
            key={exercise.id}
            initialLanguage={exercise.language}
            initialCode={exercise.starterCode}
            initialMode={exercise.mode}
            exerciseId={exercise.id}
            labId={exercise.labId}
            scopeKey={`exercise-${exercise.id}`}
            onJobChange={setJob}
            panel={panel === "Aula" ? undefined : panel}
            onTab={setPanel}
          />
        ) : (
          <LabSurface
            lab={lab}
            panel={panel === "Aula" ? undefined : panel}
            onTab={setPanel}
          />
        )}
      </LessonPractice>
    </main>
  );
}
