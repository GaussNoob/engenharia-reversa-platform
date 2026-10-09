"use client";
import { useState } from "react";
import { Link } from "@nucleo/platform";
import { ArrowUpRight, Check, Search } from "lucide-react";
import { exerciseHref, type PublicExercise } from "@nucleo/core";
import { Select } from "@nucleo/features/components/Select";
import { useExerciseProgress } from "./useExerciseProgress";
type ModuleLabel = { number: string; title: string };
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
const kindLabels: Record<PublicExercise["kind"], string> = {
  code: "Código",
  number: "Cálculo",
  choice: "Análise",
  bytes: "Bytes",
  text: "Texto",
};
export function ExerciseCatalog({
  exercises,
  modules,
}: {
  exercises: PublicExercise[];
  modules: ModuleLabel[];
}) {
  const [query, setQuery] = useState("");
  const [module, setModule] = useState("all");
  const [difficulty, setDifficulty] = useState("all");
  const [remaining, setRemaining] = useState(false);
  const progress = useExerciseProgress();
  const visible = exercises.filter(
    (exercise) =>
      (module === "all" || module === exercise.moduleNumber) &&
      (difficulty === "all" || difficulty === exercise.difficulty) &&
      (!remaining || !progress.completed.includes(exercise.id)) &&
      normalize(
        [exercise.title, exercise.question, ...exercise.concepts].join(" "),
      ).includes(normalize(query)),
  );
  return (
    <>
      <div className="exercise-filter-bar">
        <label className="exercise-search">
          <Search size={16} />
          <input
            aria-label="Buscar exercícios"
            placeholder="Conceito, instrução, ferramenta…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <Select
          label="Módulo dos exercícios"
          value={module}
          onChange={setModule}
          options={[
            { value: "all", label: "Todos os módulos" },
            ...modules.map((item) => ({
              value: item.number,
              label: `${item.number} · ${item.title}`,
            })),
          ]}
        />
        <Select
          label="Dificuldade dos exercícios"
          value={difficulty}
          onChange={setDifficulty}
          options={[
            { value: "all", label: "Todas as dificuldades" },
            ...["fundamentos", "intermediário", "desafio"].map((value) => ({
              value,
              label: value,
            })),
          ]}
        />
        <button
          className={`exercise-remaining ${remaining ? "active" : ""}`}
          aria-pressed={remaining}
          onClick={() => setRemaining((value) => !value)}
        >
          Por resolver
        </button>
      </div>
      <div className="exercise-result-count" role="status">
        {visible.length} {visible.length === 1 ? "exercício" : "exercícios"}
        {progress.completed.length > 0 &&
          ` · ${progress.completed.length} ${progress.completed.length === 1 ? "concluído" : "concluídos"}`}
      </div>
      {progress.error && (
        <p className="error-text" role="alert">
          {progress.error}
        </p>
      )}
      <div className="exercise-index">
        {modules.map((module) => {
          const rows = visible.filter(
            (exercise) => exercise.moduleNumber === module.number,
          );
          if (!rows.length) return null;
          return (
            <section key={module.number}>
              <header>
                <span className="mono">{module.number}</span>
                <h2>{module.title}</h2>
                <span>
                  {rows.length} {rows.length === 1 ? "exercício" : "exercícios"}
                </span>
              </header>
              {rows.map((exercise) => (
                <Link
                  className="exercise-index-row"
                  href={exerciseHref(exercise)}
                  key={exercise.id}
                >
                  <div>
                    <strong>
                      {exercise.title}
                      {progress.completed.includes(exercise.id) && (
                        <Check size={15} aria-label="Concluído" />
                      )}
                    </strong>
                    <p>{exercise.question}</p>
                  </div>
                  <span className="exercise-row-kind">
                    {kindLabels[exercise.kind]}
                  </span>
                  <span className="exercise-row-level">
                    {exercise.difficulty}
                  </span>
                  <span>{exercise.minutes} min</span>
                  <ArrowUpRight size={17} />
                </Link>
              ))}
            </section>
          );
        })}
      </div>
      {!visible.length && (
        <p className="empty-state">
          Nenhum exercício com esses filtros. Experimente outro conceito ou
          módulo.
        </p>
      )}
    </>
  );
}
