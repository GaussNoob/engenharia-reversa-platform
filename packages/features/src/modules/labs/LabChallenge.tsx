"use client";
import { useEffect, useState } from "react";
import { Link } from "@nucleo/platform";
import { Check } from "lucide-react";
import { api } from "@nucleo/api-client";
import { useAccount } from "@nucleo/features/components/AccountProvider";
type Challenge = {
  kind: "code" | "number" | "choice";
  question: string;
  choices: string[];
};
export function LabChallenge({ labId }: { labId: string }) {
  const { user } = useAccount();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<{
    passed: boolean;
    feedback: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  useEffect(() => {
    void api<Challenge>(`/labs/${labId}/challenge`)
      .then(setChallenge)
      .catch(() => setError("Não foi possível carregar o desafio."));
  }, [labId]);
  const check = async () => {
    setPending(true);
    setError("");
    try {
      setResult(
        await api(`/labs/${labId}/check`, {
          method: "POST",
          body: JSON.stringify({ answer, submissionId: crypto.randomUUID() }),
        }),
      );
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Não foi possível verificar.",
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <section className="lab-challenge">
      <span className="overline">DESAFIO / VALIDADO NO SERVIDOR</span>
      <h3>{challenge?.question ?? "Preparando o desafio…"}</h3>
      {challenge?.kind === "number" && (
        <label>
          Sua resposta
          <input
            className="field-input"
            placeholder="Por exemplo: 10 ou 0xA"
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            maxLength={200}
          />
        </label>
      )}
      {challenge?.kind === "choice" && (
        <div className="challenge-options">
          {challenge.choices.map((choice) => (
            <label key={choice}>
              <input
                type="radio"
                name={labId}
                checked={answer === choice}
                onChange={() => setAnswer(choice)}
              />
              {choice}
            </label>
          ))}
        </div>
      )}
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      {result && (
        <div
          className={
            result.passed ? "challenge-result correct" : "challenge-result"
          }
          role="status"
        >
          {result.passed && <Check size={17} />}
          <p>{result.feedback}</p>
        </div>
      )}
      {user ? (
        <button
          className="button button-secondary button-small"
          disabled={
            pending || !challenge || (challenge.kind !== "code" && !answer)
          }
          onClick={() => void check()}
        >
          {pending ? "Conferindo…" : "Validar desafio"}
        </button>
      ) : (
        <p>
          <Link href="/entrar" className="text-link">
            Entre para validar e guardar este laboratório.
          </Link>
        </p>
      )}
    </section>
  );
}
