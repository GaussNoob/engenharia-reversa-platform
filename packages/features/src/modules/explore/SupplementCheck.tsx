"use client";
import { useState } from "react";
import { supplements, type SupplementId } from "@nucleo/core";
import { api } from "@nucleo/api-client";
import { useAccount } from "@nucleo/features/components/AccountProvider";
import { Link } from "@nucleo/platform";
export function SupplementCheck({ id }: { id: SupplementId }) {
  const item = supplements.find((item) => item.id === id)!;
  const { user } = useAccount();
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [pending, setPending] = useState(false);
  async function submit() {
    setPending(true);
    try {
      const result = await api<{ feedback: string }>(
        "/assessments/supplement",
        {
          method: "POST",
          body: JSON.stringify({
            id,
            answer,
            submissionId: crypto.randomUUID(),
          }),
        },
      );
      setFeedback(result.feedback);
    } catch (cause) {
      setFeedback(
        cause instanceof Error ? cause.message : "Não foi possível conferir.",
      );
    } finally {
      setPending(false);
    }
  }
  return (
    <section className="lab-challenge">
      <span className="overline">CONEXÃO FINAL</span>
      <h3>{item.question}</h3>
      <div className="challenge-options">
        {item.choices.map((choice) => (
          <label key={choice}>
            <input
              type="radio"
              name={`supplement-${id}`}
              checked={answer === choice}
              onChange={() => setAnswer(choice)}
            />
            {choice}
          </label>
        ))}
      </div>
      {user ? (
        <button
          className="button button-secondary"
          disabled={!answer || pending}
          onClick={() => void submit()}
        >
          {pending ? "Conferindo…" : "Conferir e registrar"}
        </button>
      ) : (
        <Link href="/entrar" className="text-link">
          Entre para conferir e registrar sua descoberta.
        </Link>
      )}
      {feedback && (
        <p className="supplement-feedback" role="status">
          {feedback}
        </p>
      )}
    </section>
  );
}
