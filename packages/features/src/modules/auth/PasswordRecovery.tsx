"use client";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@nucleo/api-client";
import { Link } from "@nucleo/platform";
export function PasswordRecovery({ token }: { token?: string }) {
  const [available, setAvailable] = useState<boolean | null>(null),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    void api<{ passwordReset: boolean }>("/auth-capabilities")
      .then((value) => setAvailable(value.passwordReset))
      .catch(() => setError("Não foi possível verificar a recuperação."));
  }, []);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await api(
        token ? "/auth/reset-password" : "/auth/request-password-reset",
        {
          method: "POST",
          body: JSON.stringify(
            token
              ? { token, newPassword: form.get("password") }
              : { email: form.get("email") },
          ),
        },
      );
      setMessage(
        token
          ? "Senha alterada. Entre novamente em seus dispositivos."
          : "Se este email possui uma conta, você receberá o link de recuperação.",
      );
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível concluir a recuperação.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <main id="main" className="page-body account-settings">
      <h1 className="page-title">
        {token ? "Defina sua nova senha." : "Recupere seu acesso."}
      </h1>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      {message ? (
        <p role="status">{message}</p>
      ) : available === false ? (
        <p>O envio de email ainda não está habilitado neste ambiente.</p>
      ) : available === null ? (
        <p role="status">Verificando disponibilidade…</p>
      ) : (
        <form className="auth-form" onSubmit={submit}>
          {token ? (
            <label>
              Nova senha
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={12}
                maxLength={128}
              />
            </label>
          ) : (
            <label>
              Email
              <input name="email" type="email" autoComplete="email" required />
            </label>
          )}
          <button className="button" disabled={busy}>
            {busy ? "Enviando…" : token ? "Salvar senha" : "Enviar link"}
          </button>
        </form>
      )}
      <Link className="text-link" href="/entrar">
        Voltar para o login
      </Link>
    </main>
  );
}
