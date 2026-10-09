"use client";
import { useEffect, useState } from "react";
import { useAccount } from "@nucleo/features/components/AccountProvider";
import { api } from "@nucleo/api-client";
type ExerciseProgress = { completed: string[]; attempted: string[] };
const empty: ExerciseProgress = { completed: [], attempted: [] };
export function useExerciseProgress() {
  const { user } = useAccount();
  const [progress, setProgress] = useState(empty);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    setProgress(empty);
    setError("");
    if (user)
      void api<ExerciseProgress>("/exercises/progress")
        .then((value) => {
          if (alive) setProgress(value);
        })
        .catch(() => {
          if (alive)
            setError(
              "Não foi possível carregar suas conclusões. Tente recarregar a página.",
            );
        });
    return () => {
      alive = false;
    };
  }, [user?.id]);
  function record(id: string, passed: boolean) {
    setProgress((current) => ({
      attempted: [...new Set([...current.attempted, id])],
      completed: passed
        ? [...new Set([...current.completed, id])]
        : current.completed,
    }));
  }
  return { ...progress, error, record };
}
