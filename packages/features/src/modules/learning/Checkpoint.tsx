"use client";
import { useEffect, useState } from "react";
import { Check, ChevronRight } from "lucide-react";
import type { QuizQuestion } from "@nucleo/core";
import { useAccount } from "@nucleo/features/components/AccountProvider";
import { api } from "@nucleo/api-client";
import { Link } from "@nucleo/platform";
type Answer = { passed: boolean; explanation: string; correctId: string };
export function Checkpoint({ question }: { question: QuizQuestion }) {
  const [selected, setSelected] = useState("");
  const [result, setResult] = useState<Answer | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const { user } = useAccount();
  useEffect(() => {
    if (!user) return;
    let alive = true;
    void api<(Answer & { choiceId: string }) | null>(
      `/assessments/quiz?id=${encodeURIComponent(question.id)}`,
    )
      .then((previous) => {
        if (!alive || !previous) return;
        setSelected((current) => current || previous.choiceId);
        setResult((current) => current ?? previous);
        setSaved(true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [user, question.id]);
  const check = async () => {
    setPending(true);
    setError("");
    try {
      const answer = await api<Answer>("/assessments/quiz", {
        method: "POST",
        body: JSON.stringify({
          questionId: question.id,
          choiceId: selected,
          submissionId: crypto.randomUUID(),
        }),
      });
      setResult(answer);
      setSaved(true);
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Não foi possível verificar.",
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <section className="checkpoint">
      <span className="overline">CHECKPOINT / CONTEÚDO COMPLEMENTAR</span>
      <h3>{question.question}</h3>
      <fieldset disabled={pending}>
        <legend className="sr-only">Escolha uma alternativa</legend>
        {question.choices.map((choice) => (
          <label
            key={choice.id}
            className={selected === choice.id ? "selected" : ""}
          >
            <input
              type="radio"
              name={question.id}
              value={choice.id}
              checked={selected === choice.id}
              onChange={() => {
                setSelected(choice.id);
                setResult(null);
                setSaved(false);
              }}
            />
            <span className="choice-letter mono">
              {choice.id.toUpperCase()}
            </span>
            <span>{choice.text}</span>
            {result?.correctId === choice.id && <Check size={16} />}
          </label>
        ))}
      </fieldset>
      {result && (
        <div
          className={
            result.passed
              ? "checkpoint-feedback correct"
              : "checkpoint-feedback"
          }
          role="status"
        >
          <strong>
            {result.passed
              ? "Você entendeu a relação."
              : "Vamos olhar mais de perto."}
          </strong>
          <p>{result.explanation}</p>
        </div>
      )}
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      {user ? (
        <button
          className="button button-secondary button-small"
          disabled={!selected || pending || saved}
          onClick={() => void check()}
        >
          {pending
            ? "Verificando…"
            : saved
              ? "Resposta salva"
              : "Conferir minha resposta"}
        </button>
      ) : (
        <p className="checkpoint-signin">
          <Link href="/entrar">Entre na sua conta</Link> para conferir e guardar
          sua tentativa.
        </p>
      )}
    </section>
  );
}
