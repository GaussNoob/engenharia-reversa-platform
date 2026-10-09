"use client";
import { Link } from "@nucleo/platform";
import { useRouter } from "@nucleo/platform";
import { useState, type FormEvent } from "react";
import { useAccount } from "@nucleo/features/components/AccountProvider";
import { api } from "@nucleo/api-client";
export function AuthForm({ signup = false }: { signup?: boolean }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { refresh } = useAccount();
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setPending(true);
    const form = new FormData(event.currentTarget);
    try {
      await api(signup ? "/auth/sign-up/email" : "/auth/sign-in/email", {
        method: "POST",
        body: JSON.stringify({
          email: form.get("email"),
          password: form.get("password"),
          ...(signup ? { name: form.get("name") } : { rememberMe: true }),
        }),
      });
      await refresh();
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Não foi possível entrar.",
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <form className="auth-form" onSubmit={submit}>
      {signup && (
        <label>
          Como podemos chamar você?
          <input
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={80}
            placeholder="Seu nome"
          />
        </label>
      )}
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="voce@exemplo.com"
        />
      </label>
      <label>
        Senha
        <input
          name="password"
          type="password"
          autoComplete={signup ? "new-password" : "current-password"}
          required
          minLength={signup ? 12 : 1}
          maxLength={128}
          placeholder={signup ? "Pelo menos 12 caracteres" : "Sua senha"}
        />
      </label>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      <button className="button" type="submit" disabled={pending}>
        {pending
          ? "Preparando sua bancada…"
          : signup
            ? "Criar minha conta"
            : "Entrar na bancada"}
      </button>
      {!signup && (
        <Link className="text-link" href="/recuperar-senha">
          Esqueci minha senha
        </Link>
      )}
      <p className="auth-switch">
        {signup ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
        <Link href={signup ? "/entrar" : "/criar-conta"}>
          {signup ? "Entrar" : "Começar agora"}
        </Link>
      </p>
    </form>
  );
}
