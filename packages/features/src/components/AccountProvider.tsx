"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "@nucleo/platform";
import type { UserSummary } from "@nucleo/core";
import { api, ApiError } from "@nucleo/api-client";
type AccountContext = {
  user: UserSummary | null;
  loading: boolean;
  error: string;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};
const Context = createContext<AccountContext | null>(null);
export function AccountProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSummary | null>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const router = useRouter();
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const epoch = ++generation.current;
    try {
      const value = await api<UserSummary>("/me");
      if (epoch === generation.current) {
        setUser(value);
        setError("");
      }
    } catch (cause) {
      if (epoch !== generation.current) return;
      if (cause instanceof ApiError && cause.status === 401) {
        setUser(null);
        setError("");
      } else
        setError("A conexão com sua conta está indisponível. Tente novamente.");
    } finally {
      if (epoch === generation.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const resume = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    window.addEventListener("nucleo:resume", resume);
    document.addEventListener("visibilitychange", resume);
    return () => {
      generation.current++;
      window.removeEventListener("nucleo:resume", resume);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [refresh]);
  const logout = async () => {
    await api("/auth/sign-out", { method: "POST", body: "{}" });
    generation.current++;
    setUser(null);
    setError("");
    router.push(router.target === "web" ? "/" : "/entrar");
    router.refresh();
  };
  return (
    <Context.Provider value={{ user, loading, error, refresh, logout }}>
      {children}
    </Context.Provider>
  );
}
export function useAccount() {
  const value = useContext(Context);
  if (!value) throw new Error("AccountProvider ausente.");
  return value;
}
