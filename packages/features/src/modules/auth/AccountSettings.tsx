"use client";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@nucleo/api-client";
import { useAccount } from "../../components/AccountProvider";
import { useRouter } from "@nucleo/platform";
import { PageHeader } from "../../components/PageHeader";
type Session = {
  token: string;
  createdAt: string;
  expiresAt: string;
  userAgent?: string;
  ipAddress?: string;
};
export function AccountSettings() {
  const { user, refresh } = useAccount();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]),
    [message, setMessage] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = async () =>
    setSessions(await api<Session[]>("/auth/list-sessions"));
  useEffect(() => {
    void load().catch(() =>
      setError("Não foi possível carregar suas sessões."),
    );
  }, []);
  const submit =
    (
      path: string,
      makeBody: (form: FormData) => object,
      done?: () => Promise<void>,
    ) =>
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const form = event.currentTarget;
      setBusy(true);
      setError("");
      setMessage("");
      try {
        await api(path, {
          method: "POST",
          body: JSON.stringify(makeBody(new FormData(form))),
        });
        await refresh();
        await load();
        form.reset();
        setMessage("Alterações salvas.");
        await done?.();
      } catch (cause) {
        setError(
          cause instanceof Error ? cause.message : "Não foi possível salvar.",
        );
      } finally {
        setBusy(false);
      }
    };
  return (
    <>
      <PageHeader section="Configurações" />
      <main id="main" className="page-body account-settings">
        <h1 className="page-title">Sua conta.</h1>
        <p>{user?.email}</p>
        {error && (
          <p role="alert" className="error-text">
            {error}
          </p>
        )}
        {message && <p role="status">{message}</p>}
        <section>
          <h2>Nome</h2>
          <form
            className="auth-form"
            onSubmit={submit("/auth/update-user", (form) => ({
              name: form.get("name"),
            }))}
          >
            <label>
              Como podemos chamar você?
              <input
                name="name"
                defaultValue={user?.name}
                required
                minLength={2}
                maxLength={80}
                autoComplete="name"
              />
            </label>
            <button className="button" disabled={busy}>
              Salvar nome
            </button>
          </form>
        </section>
        <section>
          <h2>Senha</h2>
          <form
            className="auth-form"
            onSubmit={submit("/auth/change-password", (form) => ({
              currentPassword: form.get("current"),
              newPassword: form.get("password"),
              revokeOtherSessions: true,
            }))}
          >
            <label>
              Senha atual
              <input
                name="current"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
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
            <button className="button" disabled={busy}>
              Alterar senha e encerrar outras sessões
            </button>
          </form>
        </section>
        <section>
          <h2>Sessões</h2>
          <p>
            Uma sessão expira após sete dias de inatividade. Revogar uma sessão
            encerra seu acesso neste dispositivo.
          </p>
          {sessions.map((session) => (
            <div className="account-session" key={session.token}>
              <span>
                {session.userAgent || "Aplicativo Núcleo"}
                <small>
                  Expira em{" "}
                  {new Date(session.expiresAt).toLocaleDateString("pt-BR")}
                </small>
              </span>
              <button
                className="button button-secondary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await api("/auth/revoke-session", {
                      method: "POST",
                      body: JSON.stringify({ token: session.token }),
                    });
                    await refresh();
                    await load();
                  } catch (cause) {
                    setError(
                      cause instanceof Error
                        ? cause.message
                        : "Não foi possível revogar.",
                    );
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Revogar
              </button>
            </div>
          ))}
        </section>
        <section>
          <h2>Excluir conta</h2>
          <p>
            A exclusão remove sua conta, progresso e rascunhos. Digite EXCLUIR e
            confirme com sua senha.
          </p>
          <form
            className="auth-form"
            onSubmit={async (event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              if (data.get("confirm") !== "EXCLUIR") {
                setError("Digite EXCLUIR para confirmar.");
                return;
              }
              setBusy(true);
              try {
                await api("/auth/delete-user", {
                  method: "POST",
                  body: JSON.stringify({ password: data.get("password") }),
                });
                await refresh();
                router.replace("/entrar");
                router.refresh();
              } catch (cause) {
                setError(
                  cause instanceof Error
                    ? cause.message
                    : "Não foi possível excluir.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <label>
              Confirmação
              <input
                name="confirm"
                required
                pattern="EXCLUIR"
                autoComplete="off"
              />
            </label>
            <label>
              Senha atual
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </label>
            <button className="button button-secondary" disabled={busy}>
              Excluir minha conta
            </button>
          </form>
        </section>
      </main>
    </>
  );
}
