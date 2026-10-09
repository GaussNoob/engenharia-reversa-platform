import { describe, it, expect, vi } from "vitest";
import { bearerTransport, type SessionStore } from "./native";
import { assertApiPath, configureApi } from "./index";
function vault(initial: string | null = null) {
  let token = initial;
  const store: SessionStore = {
    get: async () => token,
    set: async (value) => {
      token = value;
    },
    clear: async () => {
      token = null;
    },
  };
  return store;
}
describe("native sessions", () => {
  it("uses the OS store and suppresses cookies and caller-supplied authorization", async () => {
    const request = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response("{}", { headers: { "set-auth-token": "renewed.signed" } }),
      );
    const store = vault("original.signed");
    await bearerTransport(
      "https://api.example.com",
      store,
      request,
    )("/me", { headers: { Cookie: "unsafe", Authorization: "caller" } });
    const [url, init] = request.mock.calls[0]!;
    expect(url).toBe("https://api.example.com/api/me");
    expect(new Headers(init?.headers).get("Authorization")).toBe(
      "Bearer original.signed",
    );
    expect(new Headers(init?.headers).has("Cookie")).toBe(false);
    expect(init?.credentials).toBe("omit");
    expect(init?.redirect).toBe("error");
    expect(await store.get()).toBe("renewed.signed");
  });
  it("clears an expired session and a successful logout", async () => {
    for (const response of [
      new Response("{}", { status: 401 }),
      new Response("{}"),
    ]) {
      const store = vault("signed");
      await bearerTransport(
        "https://api.example.com",
        store,
        vi.fn<typeof fetch>().mockResolvedValue(response),
      )("/auth/sign-out", { method: "POST" });
      expect(await store.get()).toBeNull();
    }
  });
  it("preserves the session when the service is temporarily unavailable", async () => {
    const store = vault("signed");
    await bearerTransport(
      "https://api.example.com",
      store,
      vi
        .fn<typeof fetch>()
        .mockResolvedValue(new Response("{}", { status: 503 })),
    )("/me", {});
    expect(await store.get()).toBe("signed");
  });
  it("does not persist a token from a rejected sign-in", async () => {
    const store = vault();
    await bearerTransport(
      "https://api.example.com",
      store,
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response("{}", {
          status: 403,
          headers: { "set-auth-token": "injected" },
        }),
      ),
    )("/auth/sign-in/email", {});
    expect(await store.get()).toBeNull();
  });
  it("rejects paths that could escape the API origin", () => {
    for (const path of [
      "//evil.com",
      "/../secrets",
      "/a/../../b",
      "/a/%2e%2e/b",
      "/a\\b",
      "https://evil.com",
    ])
      expect(() => assertApiPath(path)).toThrow();
  });
  it("rejects production API origins with plaintext or embedded credentials", () => {
    const transport = vi.fn();
    expect(() =>
      configureApi({ transport, origin: "http://api.example.com" }),
    ).toThrow();
    expect(() =>
      configureApi({
        transport,
        origin: "https://secret:secret@api.example.com",
      }),
    ).toThrow();
  });
});
