"use client";
import { useState } from "react";
import { ArrowRight, RefreshCw, ShieldCheck, WifiOff } from "lucide-react";
import { Link } from "@nucleo/platform";
import { Brand, BrandLabel } from "../components/Brand";

export function ConnectionScreen({
  pending = false,
  title,
  description,
  onRetry,
  offline = true,
  standalone = false,
}: {
  pending?: boolean;
  title?: string;
  description?: string;
  onRetry?: () => Promise<void> | void;
  offline?: boolean;
  standalone?: boolean;
}) {
  const [reconnecting, setReconnecting] = useState(false);
  async function retry() {
    if (!onRetry || reconnecting) return;
    setReconnecting(true);
    try {
      await onRetry();
    } finally {
      setReconnecting(false);
    }
  }
  return (
    <main id="main" className="connection-screen">
      <header className="connection-top">
        <>
          {standalone ? (
            <span className="brand">
              <BrandLabel />
            </span>
          ) : (
            <Brand />
          )}
        </>
        <span className="mono">SUA BANCADA DE ESTUDO</span>
      </header>
      <div className="connection-layout">
        <section className="connection-editorial" aria-live="polite">
          <span className="overline">
            {pending ? "RETOMANDO SUA BANCADA" : "UMA PAUSA NA CONEXÃO"}
          </span>
          <h1>
            {title ??
              (pending
                ? "Preparando seu espaço."
                : "Seu próximo passo continua aqui.")}
          </h1>
          <p>
            {description ??
              (pending
                ? "Estamos verificando sua sessão para continuar de onde você parou."
                : "Não conseguimos conectar sua conta agora. Tente novamente ou continue investigando nos simuladores que já estão no aplicativo.")}
          </p>
          {pending ? (
            <p className="connection-wait" role="status">
              <RefreshCw size={18} />
              Conectando à sua conta…
            </p>
          ) : (
            <div className="connection-actions">
              <button
                className="button button-primary"
                onClick={() => void retry()}
                disabled={reconnecting}
              >
                <RefreshCw size={18} />
                {reconnecting ? "Reconectando…" : "Reconectar"}
              </button>
              {offline && (
                <Link className="button button-secondary" href="/explorar">
                  Explorar sem conexão
                  <ArrowRight size={18} />
                </Link>
              )}
            </div>
          )}
          <p className="connection-assurance">
            <ShieldCheck size={17} />
            Conta e progresso são sincronizados quando há conexão.
          </p>
        </section>
        <aside
          className="connection-card"
          aria-label="Disponibilidade do aplicativo"
        >
          <div className="connection-card-heading">
            <span className="overline">NÚCLEO / BANCADA LOCAL</span>
            <WifiOff size={22} />
          </div>
          <svg
            className="connection-diagram"
            viewBox="0 0 320 166"
            aria-hidden="true"
          >
            <path
              d="M28 45h54v76H28zM115 45h54v76h-54zM202 45h90v76h-90z"
              fill="none"
              stroke="currentColor"
            />
            <path
              d="M82 83h33m54 0h33"
              fill="none"
              stroke="currentColor"
              strokeDasharray="3 5"
            />
            <path
              d="M43 61h12l13 43V61h10v44H66L53 73v32H43z"
              fill="currentColor"
            />
            <path
              d="M131 65h22m-22 12h16m-16 12h22m-22 12h10"
              stroke="currentColor"
            />
            <path
              d="M218 100l14-27 15 14 15-23 13 11"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          <ul className="connection-capabilities">
            <li>
              <span>Aplicativo e simuladores</span>
              <strong>Disponíveis no aparelho</strong>
            </li>
            <li>
              <span>Conta e progresso</span>
              <strong>{pending ? "Conectando" : "Aguardando conexão"}</strong>
            </li>
            <li>
              <span>Execução de código</span>
              <strong>Requer servidor online</strong>
            </li>
          </ul>
          <p>
            Experimente bytes, memória, números e fluxo de controle. O progresso
            desses experimentos não é registrado sem conexão.
          </p>
        </aside>
      </div>
      <footer className="connection-footer">
        <span className="mono">ENGENHARIA REVERSA</span>
        <span>Aprender começa por investigar.</span>
      </footer>
    </main>
  );
}
