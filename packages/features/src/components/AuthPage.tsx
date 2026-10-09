"use client";
import { Link, usePlatform } from "@nucleo/platform";
import { Brand } from "./Brand";
import { AuthForm } from "@nucleo/features/modules/auth/AuthForm";
import { DemoStepper } from "@nucleo/features/modules/labs/DemoStepper";
export function AuthPage({ signup = false }: { signup?: boolean }) {
  const { target } = usePlatform();
  return (
    <main id="main" className="auth-page">
      <div className="auth-editorial">
        <Brand />
        <div>
          <span className="overline">SUA CONTA</span>
          <h2>
            Continue de onde
            <br />
            você parou.
          </h2>
          <p>
            A conta guarda as aulas concluídas, as respostas
            <br />
            dos checkpoints e o código que você escreveu.
          </p>
          <DemoStepper compact />
        </div>
        <span className="mono auth-credit">FUNDAMENTOS · MENTE BINÁRIA</span>
      </div>
      <section className="auth-panel">
        {target === "web" && (
          <Link href="/" className="text-link auth-back">
            Voltar ao início
          </Link>
        )}
        <div>
          <span className="overline">SUA BANCADA DE ESTUDO</span>
          <h1>{signup ? "Criar conta" : "Bom ter você de volta."}</h1>
          <p>
            {signup
              ? "Leva menos de um minuto. Só precisamos de nome, email e senha."
              : "Entre para continuar de onde parou."}
          </p>
          <AuthForm signup={signup} />
        </div>
        {target !== "web" && (
          <Link href="/explorar" className="text-link">
            Explorar os simuladores sem conta
          </Link>
        )}
        {signup && <small>A senha precisa ter pelo menos 12 caracteres.</small>}
      </section>
    </main>
  );
}
