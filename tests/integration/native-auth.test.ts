import { beforeAll, describe, it, expect } from "vitest";
const base = process.env.API_TEST_URL || "http://127.0.0.1:3060";
const origin = "tauri://localhost";
const request = (
  path: string,
  body?: object,
  token?: string,
  source = origin,
) =>
  fetch(base + "/api" + path, {
    method: body ? "POST" : "GET",
    headers: {
      Origin: source,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: "Bearer " + token } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
beforeAll(async () => {
  for (let i = 0; i < 30; i++) {
    try {
      if ((await request("/health")).ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("API real com PostgreSQL indisponível.");
});
describe("installed client authentication against PostgreSQL", () => {
  it("shares accounts, rejects unsigned/revoked tokens and refuses unauthorized origins", async () => {
    const account = {
      name: "Sessão nativa",
      email: "native-" + crypto.randomUUID() + "@example.test",
      password: "Native-secure-password-2026!",
    };
    const signup = await request("/auth/sign-up/email", account);
    expect(signup.status).toBe(200);
    const token = signup.headers.get("set-auth-token");
    expect(token).toBeTruthy();
    expect(signup.headers.get("access-control-allow-origin")).toBe(origin);
    const me = await request("/me", undefined, token!);
    expect(me.status).toBe(200);
    expect((await me.json()).email).toBe(account.email);
    expect((await request("/me", undefined, token!.split(".")[0])).status).toBe(
      401,
    );
    expect((await request("/progress", undefined, token!)).status).toBe(200);
    const attack = await request(
      "/progress/heartbeat",
      {},
      token!,
      "https://untrusted.example.com",
    );
    expect(attack.status).toBe(403);
    const cors = await fetch(base + "/api/me", {
      method: "OPTIONS",
      headers: {
        Origin: "https://untrusted.example.com",
        "Access-Control-Request-Method": "GET",
      },
    });
    expect(cors.headers.get("access-control-allow-origin")).not.toBe(
      "https://untrusted.example.com",
    );
    expect((await request("/executions", undefined, token!)).status).toBe(200);
    expect((await request("/auth/sign-out", {}, token!)).status).toBe(200);
    expect((await request("/me", undefined, token!)).status).toBe(401);
    const signin = await request("/auth/sign-in/email", {
      email: account.email,
      password: account.password,
    });
    expect(signin.status).toBe(200);
    const renewed = signin.headers.get("set-auth-token");
    expect(renewed).toBeTruthy();
    expect(
      (
        await request(
          "/auth/delete-user",
          { password: account.password },
          renewed!,
        )
      ).status,
    ).toBe(200);
    expect((await request("/me", undefined, renewed!)).status).toBe(401);
  });
});
