"use client";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  PlatformProvider,
  type Platform,
  type LinkProps,
} from "@nucleo/platform";
import { ApiError } from "@nucleo/api-client";
import { AccountProvider, useAccount } from "../components/AccountProvider";
import { AuthPage } from "../components/AuthPage";
import { Navigation } from "../components/Navigation";
import { CommandPalette } from "../components/CommandPalette";
import { PasswordRecovery } from "../modules/auth/PasswordRecovery";
import { installedPath, loadInstalledPage, localInstalledPage } from "./routes";
import { ConnectionScreen } from "./ConnectionScreen";
import { Brand } from "../components/Brand";
import { Link } from "@nucleo/platform";
function readRoute() {
  return installedPath(location.hash.slice(1) || "/");
}
export function InstalledApp({
  platform,
}: {
  platform: Pick<Platform, "target" | "download" | "openExternal">;
}) {
  useEffect(() => {
    const external = (event: MouseEvent) => {
      const anchor = (
        event.target as Element | null
      )?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href") ?? "";
      if (/^https?:/.test(href)) {
        event.preventDefault();
        event.stopPropagation();
        void platform.openExternal(href);
      }
    };
    document.addEventListener("click", external, true);
    return () => document.removeEventListener("click", external, true);
  }, [platform.openExternal]);
  const [route, setRoute] = useState(readRoute),
    [revision, setRevision] = useState(0);
  const push = useCallback((href: string) => {
    location.hash = installedPath(href);
  }, []);
  const replace = useCallback((href: string) => {
    history.replaceState(null, "", "#" + installedPath(href));
    setRoute(readRoute());
  }, []);
  useEffect(() => {
    const change = () => {
      setRoute(readRoute());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  function NativeLink({ href, onClick, ...props }: LinkProps) {
    const external = !href.startsWith("/");
    return (
      <a
        {...props}
        href={external ? href : "#" + installedPath(href)}
        onClick={(event) => {
          onClick?.(event);
          if (event.defaultPrevented) return;
          if (external) {
            event.preventDefault();
            void platform.openExternal(href);
          } else if (!event.ctrlKey && !event.metaKey && event.button === 0) {
            event.preventDefault();
            push(href);
          }
        }}
      />
    );
  }
  return (
    <PlatformProvider
      value={{
        ...platform,
        pathname: route.split("#")[0]!,
        home: "/dashboard",
        Link: NativeLink,
        push,
        replace,
        refresh: () => setRevision((value) => value + 1),
      }}
    >
      <AccountProvider>
        <InstalledContent
          route={route.split("#")[0]!}
          revision={revision}
          replace={replace}
        />
        <CommandPalette />
      </AccountProvider>
    </PlatformProvider>
  );
}
function InstalledContent({
  route,
  revision,
  replace,
}: {
  route: string;
  revision: number;
  replace: (href: string) => void;
}) {
  const { user, loading, error: accountError, refresh } = useAccount();
  const [page, setPage] = useState<ReactNode>(null),
    [error, setError] = useState(""),
    [pending, setPending] = useState(true),
    [retry, setRetry] = useState(0);
  const authRoute = ["/entrar", "/criar-conta", "/recuperar-senha"].includes(
    route,
  );
  const localPage =
    !user || accountError ? localInstalledPage(route, true) : null;
  const localRoute = localPage !== null;
  useEffect(() => {
    if (loading || accountError || localRoute) return;
    if (!user && !authRoute) replace("/entrar");
    else if (user && authRoute) replace("/dashboard");
  }, [user, loading, accountError, authRoute, localRoute, replace]);
  useEffect(() => {
    if (!user || authRoute) return;
    const controller = new AbortController();
    setPending(true);
    setError("");
    void loadInstalledPage(route, user, controller.signal)
      .then((page) => {
        if (!controller.signal.aborted) setPage(page);
      })
      .catch((cause) => {
        if (controller.signal.aborted) return;
        if (cause instanceof ApiError && cause.status === 401) void refresh();
        else
          setError(
            cause instanceof Error
              ? cause.message
              : "Não foi possível carregar a página.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setPending(false);
      });
    return () => controller.abort();
  }, [route, user, authRoute, revision, retry, refresh]);
  if (localPage)
    return (
      <>
        <header className="offline-header">
          <Brand />
          <nav aria-label="Navegação local">
            <Link href="/explorar">Experimentos</Link>
            <Link
              className="button button-secondary"
              href={user ? "/dashboard" : "/entrar"}
              onClick={() => void refresh()}
            >
              {user ? "Minha bancada" : "Conectar conta"}
            </Link>
          </nav>
        </header>
        <p className="offline-notice" role="status">
          Bancada local · os experimentos funcionam sem internet. Para registrar
          seu progresso, conecte sua conta.
        </p>
        {localPage}
      </>
    );
  if (loading) return <ConnectionScreen pending />;
  if (accountError && !user) return <ConnectionScreen onRetry={refresh} />;
  if (!user)
    return route === "/recuperar-senha" ? (
      <PasswordRecovery />
    ) : (
      <AuthPage signup={route === "/criar-conta"} />
    );
  return (
    <>
      <Navigation />
      <div className="app-content">
        {accountError && (
          <div className="connection-banner" role="status">
            <p>{accountError}</p>
            <button
              className="button button-secondary"
              onClick={() => void refresh()}
            >
              Reconectar
            </button>
          </div>
        )}
        {pending ? (
          <div className="page-body" role="status">
            Carregando seu espaço…
          </div>
        ) : error ? (
          <ConnectionScreen
            title="Não foi possível abrir esta página."
            description="Tente carregar novamente. Você também pode continuar nos experimentos locais enquanto a conexão é retomada."
            onRetry={() => setRetry((value) => value + 1)}
          />
        ) : (
          page
        )}
      </div>
    </>
  );
}
