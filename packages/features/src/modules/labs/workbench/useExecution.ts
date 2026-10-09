"use client";
import { useEffect, useRef, useState } from "react";
import { isTerminal, type ExecutionInput, type Job } from "@nucleo/core";
import { api } from "@nucleo/api-client";
import { useAccount } from "@nucleo/features/components/AccountProvider";
export function useExecution() {
  const { user } = useAccount();
  const [job, setJob] = useState<Job | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const epoch = useRef(0);
  useEffect(
    () => () => {
      epoch.current++;
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  async function execute(
    input: Omit<ExecutionInput, "submissionId">,
    finished?: (job: Job) => void,
  ) {
    if (!user) {
      setError(
        "Entre para executar em um ambiente isolado. O modelo de Assembly permite avançar instruções sem login.",
      );
      return;
    }
    const generation = ++epoch.current;
    setBusy(true);
    setError("");
    setJob(null);
    async function poll(id: string) {
      try {
        const value = await api<Job>(`/executions/${id}`);
        if (epoch.current !== generation) return;
        setJob(value);
        if (isTerminal(value.status)) {
          setBusy(false);
          finished?.(value);
          return;
        }
        timer.current = setTimeout(() => void poll(id), 450);
      } catch (cause) {
        if (epoch.current === generation) {
          setBusy(false);
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível acompanhar a execução.",
          );
        }
      }
    }
    try {
      const value = await api<Job>("/executions", {
        method: "POST",
        body: JSON.stringify({ ...input, submissionId: crypto.randomUUID() }),
      });
      if (epoch.current !== generation) return;
      setJob(value);
      void poll(value.id);
    } catch (cause) {
      if (epoch.current === generation) {
        setBusy(false);
        setError(
          cause instanceof Error ? cause.message : "Não foi possível executar.",
        );
      }
    }
  }
  async function cancel() {
    if (!job) return;
    try {
      await api(`/executions/${job.id}/cancel`, { method: "POST", body: "{}" });
      epoch.current++;
      if (timer.current) clearTimeout(timer.current);
      const value = await api<Job>(`/executions/${job.id}`);
      setJob(value);
      setBusy(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Não foi possível cancelar.",
      );
    }
  }
  return { job, busy, error, execute, cancel };
}
