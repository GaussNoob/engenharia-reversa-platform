"use client";
import { Link } from "@nucleo/platform";
import { usePathname } from "@nucleo/platform";
import {
  LayoutDashboard,
  BookOpen,
  FlaskConical,
  ListChecks,
  SquareTerminal,
  ChartNoAxesCombined,
  Library,
  Search,
  Menu,
  X,
  LogOut,
  Compass,
  Settings,
  History,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Brand } from "./Brand";
import { useAccount } from "./AccountProvider";
const links = [
  { href: "/dashboard", label: "Visão geral", icon: LayoutDashboard },
  { href: "/aprender/fundamentos", label: "Aprender", icon: BookOpen },
  { href: "/laboratorios", label: "Laboratórios", icon: FlaskConical },
  { href: "/exercicios", label: "Exercícios", icon: ListChecks },
  { href: "/playground", label: "Playground", icon: SquareTerminal },
  { href: "/explorar", label: "Experimentos", icon: Compass },
  { href: "/progresso", label: "Progresso", icon: ChartNoAxesCombined },
  { href: "/referencias", label: "Referências", icon: Library },
  { href: "/execucoes", label: "Execuções", icon: History },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
];
export function Navigation({
  variant = "app",
}: {
  variant?: "app" | "marketing";
}) {
  const pathname = usePathname();
  const { user, logout } = useAccount();
  const [open, setOpen] = useState(false),
    [mobile, setMobile] = useState(false);
  const sidebar = useRef<HTMLElement>(null);
  useEffect(() => {
    const query = matchMedia("(max-width:760px)");
    const change = () => {
      setMobile(query.matches);
      if (!query.matches) setOpen(false);
    };
    change();
    query.addEventListener("change", change);
    return () => query.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    if (!open || !mobile) return;
    const previous = document.activeElement as HTMLElement | null;
    const content = document.querySelector<HTMLElement>(".app-content");
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (content) content.inert = true;
    sidebar.current
      ?.querySelector<HTMLButtonElement>(".sidebar-mobile-close")
      ?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const nodes = [
        ...(sidebar.current?.querySelectorAll<HTMLElement>("a,button") ?? []),
      ].filter((node) => node.getClientRects().length > 0);
      const first = nodes[0],
        last = nodes.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = oldOverflow;
      if (content) content.inert = false;
      previous?.focus();
    };
  }, [open, mobile]);
  if (variant === "marketing")
    return (
      <header className="marketing-nav">
        <Brand />
        <nav aria-label="Navegação principal">
          <Link href="/aprender/fundamentos">A trilha</Link>
          <Link href="/laboratorios">Laboratórios</Link>
          <Link href="/playground">Playground</Link>
        </nav>
        <div className="nav-actions">
          <button
            className="icon-button"
            aria-label="Buscar conteúdo"
            onClick={() => window.dispatchEvent(new Event("nucleo:search"))}
          >
            <Search size={18} />
          </button>
          <Link
            className="button button-small"
            href={user ? "/dashboard" : "/entrar"}
          >
            {user ? "Minha bancada" : "Entrar"}
          </Link>
        </div>
      </header>
    );
  return (
    <>
      <button
        className="mobile-menu icon-button"
        aria-label="Abrir navegação"
        aria-controls="workspace-navigation"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <Menu size={20} />
      </button>
      {open && (
        <button
          tabIndex={-1}
          aria-label="Fechar navegação"
          className="nav-backdrop"
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        ref={sidebar}
        id="workspace-navigation"
        className={`app-sidebar ${open ? "is-open" : ""}`}
        inert={mobile && !open}
        role={mobile ? "dialog" : undefined}
        aria-modal={mobile && open ? true : undefined}
        aria-label="Navegação do espaço de estudo"
      >
        <Brand />
        <button
          className="icon-button sidebar-mobile-close"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
        >
          <X size={19} />
        </button>
        <div className="sidebar-main">
          <div className="workspace-label">
            <span className="mono">SEU ESPAÇO</span>
            <span>Fundamentos</span>
          </div>
          <nav aria-label="Navegação principal">
            {links.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={
                  pathname.startsWith(href) ? "nav-link active" : "nav-link"
                }
                aria-current={pathname.startsWith(href) ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                <Icon size={17} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
          <button
            className="sidebar-search"
            onClick={() => {
              setOpen(false);
              window.dispatchEvent(new Event("nucleo:search"));
            }}
          >
            <Search size={16} />
            <span>Buscar</span>
            <kbd>Ctrl K</kbd>
          </button>
        </div>
        <div className="sidebar-foot">
          <span className="mono">DICA</span>
          <p>Travou numa aula? Rode o exemplo na bancada e mude um valor.</p>
          {user ? (
            <div className="account-row">
              <span className="avatar">
                {user.name.slice(0, 1).toUpperCase()}
              </span>
              <span>
                {user.name}
                <small>Seu espaço de estudo</small>
              </span>
              <button
                className="icon-button"
                aria-label="Sair da conta"
                onClick={() => void logout()}
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link href="/entrar" className="button button-secondary">
              Guardar meu progresso
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
