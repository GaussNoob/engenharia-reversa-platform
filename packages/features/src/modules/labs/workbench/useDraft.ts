"use client";
import { useEffect, useRef, useState } from "react";
import type { DraftPayload } from "@nucleo/core";
import { api } from "@nucleo/api-client";
import { useAccount } from "@nucleo/features/components/AccountProvider";

export function useDraft(
  key: string,
  payload: DraftPayload,
  edits: number,
  restore: (payload: DraftPayload) => void,
) {
  const { user } = useAccount();
  const [status, setStatus] = useState("");
  const [ready, setReady] = useState(false);
  const version = useRef(0);
  const restoreRef = useRef(restore);
  restoreRef.current = restore;
  const latestEdits = useRef(edits);
  latestEdits.current = edits;
  const serial = useRef(Promise.resolve());
  const generation = useRef(0);
  const conflict = useRef(false);
  useEffect(() => {
    const epoch = ++generation.current;
    version.current = 0;
    conflict.current = false;
    setReady(false);
    setStatus("");
    if (!user) return;
    const initialEdits = latestEdits.current;
    void api<{ version: number; payload: DraftPayload } | null>(
      `/assessments/drafts/${encodeURIComponent(key)}`,
    )
      .then((draft) => {
        if (generation.current !== epoch) return;
        version.current = draft?.version ?? 0;
        if (draft && latestEdits.current === initialEdits) {
          restoreRef.current(draft.payload);
          setStatus("Rascunho restaurado");
        }
        setReady(true);
      })
      .catch(() => {
        if (generation.current === epoch)
          setStatus(
            "Rascunho indisponível. Exporte uma cópia para guardar seu código.",
          );
      });
    return () => {
      generation.current++;
    };
  }, [user?.id, key]);
  useEffect(() => {
    if (!user || !ready || !edits || conflict.current) return;
    const epoch = generation.current;
    setStatus("Salvando…");
    const timeout = setTimeout(() => {
      serial.current = serial.current.then(async () => {
        if (generation.current !== epoch || conflict.current) return;
        try {
          const result = await api<{ version: number }>(
            `/assessments/drafts/${encodeURIComponent(key)}`,
            {
              method: "PUT",
              body: JSON.stringify({
                ...payload,
                expectedVersion: version.current,
              }),
            },
          );
          if (generation.current === epoch) {
            version.current = result.version;
            setStatus("Salvo na sua conta");
          }
        } catch (cause) {
          if (generation.current !== epoch) return;
          conflict.current = true;
          setStatus(
            cause instanceof Error
              ? cause.message
              : "Não foi possível salvar. Exporte seu código.",
          );
        }
      });
    }, 650);
    return () => clearTimeout(timeout);
  }, [edits, key, payload, ready, user]);
  return status;
}
