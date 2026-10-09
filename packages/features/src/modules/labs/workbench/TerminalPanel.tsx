"use client";
import { ArtifactDownload } from "./ArtifactDownload";
import { useState } from "react";
import { Copy, Download, Check } from "lucide-react";
import type { Job } from "@nucleo/core";
const statuses: Record<string, string> = {
  queued: "Na fila",
  provisioning: "Preparando ambiente",
  compiling: "Compilando",
  running: "Executando",
  succeeded: "Concluído",
  failed: "Falha",
  cancelled: "Cancelado",
  timed_out: "Tempo esgotado",
  memory_limited: "Limite de memória",
  output_limited: "Limite de saída",
};
export function TerminalPanel({
  job,
  busy,
  onRun,
  onReset,
}: {
  job: Job | null;
  busy: boolean;
  onRun: () => void;
  onReset: () => void;
}) {
  const [command, setCommand] = useState("");
  const [messages, setMessages] = useState<string[]>([]);
  const [hiddenJob, setHiddenJob] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  function send() {
    const value = command.trim();
    setCommand("");
    if (value === "clear") {
      setMessages([]);
      setHiddenJob(job?.id ?? null);
      return;
    }
    if (value === "run") {
      if (!busy) onRun();
      return;
    }
    if (value === "reset") {
      onReset();
      return;
    }
    setMessages((items) =>
      [
        ...items,
        `› ${value}`,
        value === "help"
          ? "run    Executar o arquivo selecionado\nclear  Limpar a saída visível\nreset  Restaurar o exemplo\nhelp   Listar comandos da bancada"
          : "Comando da bancada desconhecido. Digite help para ver os comandos disponíveis.",
      ].slice(-30),
    );
  }
  const visible = job?.id !== hiddenJob;
  return (
    <div className="terminal-panel">
      <header>
        <span className="mono">
          {job ? job.status.toUpperCase() : "TERMINAL"}
        </span>
        <span>{job ? statuses[job.status] : "Output do programa"}</span>
        <button
          className="icon-button"
          aria-label="Copiar saída do terminal"
          onClick={() => {
            void navigator.clipboard
              .writeText(
                `${job?.result?.stdout ?? ""}\n${job?.result?.stderr ?? ""}`,
              )
              .then(() => setCopied(true));
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
        </button>
      </header>
      <div className="terminal-output" role="log" aria-live="polite">
        <pre>
          {visible
            ? (job?.result?.stdout ??
              (busy
                ? "Preparando e acompanhando a execução…"
                : "Edite o exemplo e execute para observar o resultado."))
            : ""}
        </pre>
        {visible && job?.result?.stderr && (
          <pre className="stderr">{job.result.stderr}</pre>
        )}
        {messages.map((message, index) => (
          <pre key={index}>{message}</pre>
        ))}
      </div>
      {visible && job?.result && (
        <div className="execution-metrics">
          <span>{(job.result.durationMs / 1000).toFixed(2)} s</span>
          <span>Código de saída {job.result.exitCode ?? "—"}</span>
          {job.result.truncated && <span>Saída limitada a 64 KiB</span>}
        </div>
      )}
      {job?.result?.artifacts.map((artifact) => (
        <ArtifactDownload key={artifact.id} artifact={artifact} />
      ))}
      <form
        className="terminal-command"
        onSubmit={(event) => {
          event.preventDefault();
          if (command.trim()) send();
        }}
      >
        <span aria-hidden="true">›</span>
        <input
          aria-label="Comando da bancada"
          placeholder="help, run, clear…"
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          autoComplete="off"
          spellCheck={false}
          maxLength={100}
        />
        <button type="submit">Enviar</button>
      </form>
      <p className="terminal-help">
        Comandos da bancada · execução do código pelo botão Executar ou pelo
        comando run.
      </p>
    </div>
  );
}
