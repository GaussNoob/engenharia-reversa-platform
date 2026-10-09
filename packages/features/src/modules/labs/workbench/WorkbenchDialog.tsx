"use client";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
export function WorkbenchDialog({
  kind,
  close,
  confirm,
}: {
  kind: "reset" | "file" | null;
  close: () => void;
  confirm: (value: string) => string | void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    if (kind) {
      setName("");
      setError("");
      ref.current?.showModal();
    } else ref.current?.close();
  }, [kind]);
  return (
    <dialog
      ref={ref}
      className="workbench-dialog"
      onCancel={close}
      aria-labelledby="workbench-dialog-title"
      onClick={(event) => {
        if (event.target === ref.current) close();
      }}
    >
      <header>
        <h2 id="workbench-dialog-title">
          {kind === "file" ? "Adicionar arquivo" : "Restaurar o exemplo?"}
        </h2>
        <button className="icon-button" aria-label="Fechar" onClick={close}>
          <X size={18} />
        </button>
      </header>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const issue = confirm(name);
          if (issue) setError(issue);
          else close();
        }}
      >
        {kind === "file" ? (
          <label>
            Nome do arquivo
            <input
              autoFocus
              className="field-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="helper.h"
              maxLength={80}
              required
            />
            <small>Até 8 arquivos: .py, .c, .cpp, .h, .asm e .txt.</small>
          </label>
        ) : (
          <p>
            O código desta bancada será substituído pelo exemplo inicial.
            Exporte seus arquivos para guardar uma cópia.
          </p>
        )}
        {error && (
          <p className="error-text" role="alert">
            {error}
          </p>
        )}
        <footer>
          <button
            type="button"
            className="button button-secondary"
            onClick={close}
          >
            Cancelar
          </button>
          <button className="button" type="submit">
            {kind === "file" ? "Criar arquivo" : "Restaurar exemplo"}
          </button>
        </footer>
      </form>
    </dialog>
  );
}
