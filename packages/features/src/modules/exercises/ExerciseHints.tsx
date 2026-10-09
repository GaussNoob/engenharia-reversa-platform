"use client";
import { useState } from "react";
export function ExerciseHints({ hints }: { hints: string[] }) {
  const [visible, setVisible] = useState(0);
  return (
    <section className="exercise-hints" aria-label="Dicas progressivas">
      <div>
        <span className="overline">UMA PISTA DE CADA VEZ</span>
        <span>
          {visible} / {hints.length}
        </span>
      </div>
      {visible > 0 && (
        <ol aria-live="polite">
          {hints.slice(0, visible).map((hint, index) => (
            <li key={index}>{hint}</li>
          ))}
        </ol>
      )}
      {visible < hints.length && (
        <button
          className="text-link"
          onClick={() => setVisible((count) => count + 1)}
        >
          {visible ? "Mostrar próxima dica" : "Mostrar primeira dica"}
        </button>
      )}
    </section>
  );
}
