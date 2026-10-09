import { assertApiPath, type Transport } from "./index";
export interface SessionStore {
  get(): Promise<string | null>;
  set(token: string): Promise<void>;
  clear(): Promise<void>;
}
/** Tokens remain in memory and the operating system vault, never browser storage. */
export function bearerTransport(
  origin: string,
  store: SessionStore,
  request: typeof fetch = fetch,
): Transport {
  const base = new URL(origin).origin;
  return async (path, init) => {
    assertApiPath(path);
    const headers = new Headers(init.headers);
    headers.delete("Cookie");
    headers.delete("Authorization");
    const token = await store.get();
    if (token) headers.set("Authorization", "Bearer " + token);
    const response = await request(base + "/api" + path, {
      ...init,
      headers,
      credentials: "omit",
      cache: "no-store",
      redirect: "error",
    });
    const renewed = response.headers.get("set-auth-token");
    if (response.ok && renewed) await store.set(renewed);
    if (response.status === 401 || (path === "/auth/sign-out" && response.ok))
      await store.clear();
    return response;
  };
}
