"use client";
import { useState } from "react";
import { Link } from "@nucleo/platform";
import { Check, ArrowRight } from "lucide-react";
import {
  isTerminal,
  type PublicExercise,
  type Job,
  type ExerciseResult,
  type ExerciseSolution,
} from "@nucleo/core";
import { api } from "@nucleo/api-client";
import { useAccount } from "@nucleo/features/components/AccountProvider";
import { CodeSnippet } from "@nucleo/features/components/CodeSnippet";
import { useExerciseProgress } from "./useExerciseProgress";

export function ExerciseSubmission({
  exercise,
  job,
}: {
  exercise: PublicExercise;
  job: Job | null;
}) {
  const { user } = useAccount();
  const progress = useExerciseProgress();
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<ExerciseResult | null>(null);
  const [solution, setSolution] = useState<ExerciseSolution | null>(null);
  const [pending, setPending] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState("");
  const completed = progress.completed.includes(exercise.id);
  const attempted = result !== null || progress.attempted.includes(exercise.id);
  const ready =
    exercise.kind === "code"
      ? Boolean(job && isTerminal(job.status))
      : answer.trim().length > 0;
  async function check() {
    setPending(true);
    setError("");
    try {
      const value = await api<ExerciseResult>(
        `/exercises/${exercise.id}/check`,
        {
          method: "POST",
          body: JSON.stringify({
            answer,
            submissionId: crypto.randomUUID(),
            ...(job ? { jobId: job.id } : {}),
          }),
        },
      );
      setResult(value);
      progress.record(exercise.id, value.passed);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível validar sua resposta.",
      );
    } finally {
      setPending(false);
    }
  }
  async function showSolution() {
    setOpening(true);
    setError("");
    try {
      setSolution(
        await api<ExerciseSolution>(`/exercises/${exercise.id}/solution`),
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível carregar a solução.",
      );
    } finally {
      setOpening(false);
    }
  }
  return (
    <section className="exercise-submission">
      <div className="exercise-answer-heading">
        <span className="overline">SEU RESULTADO</span>
        {completed && (
          <span className="exercise-completed">
            <Check size={14} />
            Concluído
          </span>
        )}
      </div>
      {exercise.kind === "choice" ? (
        <fieldset className="exercise-choices">
          <legend>Selecione uma alternativa</legend>
          {exercise.choices.map((choice) => (
            <label
              className={answer === choice.id ? "selected" : ""}
              key={choice.id}
            >
              <input
                type="radio"
                name={exercise.id}
                checked={answer === choice.id}
                onChange={() => {
                  setAnswer(choice.id);
                  setResult(null);
                }}
              />
              <span>{choice.text}</span>
            </label>
          ))}
        </fieldset>
      ) : exercise.kind === "code" ? (
        <p className="exercise-code-status" role="status">
          {job
            ? `Última execução: ${job.status}. A validação usa o resultado desta execução.`
            : "Edite e execute na bancada. Depois volte aqui para validar o resultado."}
        </p>
      ) : (
        <label className="exercise-answer-label">
          {exercise.kind === "bytes"
            ? "Bytes em ordem"
            : exercise.kind === "text"
              ? "Texto recuperado"
              : "Sua resposta"}
          <input
            className="field-input"
            value={answer}
            onChange={(event) => {
              setAnswer(event.target.value);
              setResult(null);
            }}
            maxLength={512}
            autoComplete="off"
            spellCheck={false}
            placeholder={
              exercise.kind === "bytes"
                ? "Ex.: 78 56 34 12"
                : exercise.kind === "number"
                  ? "Decimal, hexadecimal, binário ou octal"
                  : "Digite o texto, respeitando maiúsculas e minúsculas"
            }
          />
        </label>
      )}
      {result && (
        <div
          className={`exercise-feedback ${result.passed ? "passed" : ""}`}
          role="status"
        >
          <strong>
            {result.passed ? "Hipótese confirmada." : "Mais uma tentativa."}
          </strong>
          <p>{result.feedback}</p>
          {result.explanation && <p>{result.explanation}</p>}
        </div>
      )}
      {(error || progress.error) && (
        <p className="error-text" role="alert">
          {error || progress.error}
        </p>
      )}
      <div className="exercise-submit-actions">
        {user ? (
          <button
            className="button button-small"
            disabled={pending || !ready}
            onClick={() => void check()}
          >
            {pending ? "Conferindo…" : "Validar resposta"}
            <ArrowRight size={14} />
          </button>
        ) : (
          <Link className="button button-small" href="/entrar">
            Entrar para validar e salvar
          </Link>
        )}
        {user && attempted && !solution && (
          <button
            className="tool-button"
            disabled={opening}
            onClick={() => void showSolution()}
          >
            {opening ? "Abrindo…" : "Ver solução comentada"}
          </button>
        )}
      </div>
      {!attempted && user && (
        <p className="exercise-solution-note">
          Faça uma tentativa para liberar a solução comentada.
        </p>
      )}
      {solution && (
        <section className="exercise-solution">
          <span className="overline">SOLUÇÃO COMENTADA</span>
          {solution.answer && <strong>{solution.answer}</strong>}
          {solution.solutionCode && (
            <CodeSnippet
              source={solution.solutionCode}
              language={exercise.kind === "code" ? exercise.language : "text"}
            />
          )}
          <p>{solution.explanation}</p>
          <p className="exercise-solution-note">
            Abrir a solução não conclui o exercício. Valide sua própria
            resposta.
          </p>
        </section>
      )}
    </section>
  );
}
