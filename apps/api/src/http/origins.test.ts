import { describe, it, expect } from "vitest";
import { allowedOrigins, mutationAllowed } from "./origins";
describe("client origin policy", () => {
  it("requires explicit production preview origins", () => {
    const origins = allowedOrigins(
      "https://nucleo.example.com",
      ["https://preview.example.com"],
      true,
      true,
    );
    expect(origins).toContain("https://localhost");
    expect(origins).toContain("tauri://localhost");
    expect(origins).not.toContain("http://localhost:3070");
    expect(mutationAllowed("POST", "https://evil.example.com", origins)).toBe(
      false,
    );
    expect(mutationAllowed("POST", undefined, origins)).toBe(false);
    expect(
      mutationAllowed("POST", "https://preview.example.com", origins),
    ).toBe(true);
  });
  it("does not enable installed clients unless configured", () => {
    expect(
      allowedOrigins("https://nucleo.example.com", [], false, true),
    ).toEqual(["https://nucleo.example.com"]);
  });
  it("rejects wildcard, path and insecure production origins", () => {
    for (const origin of [
      "https://preview.example.com/path",
      "http://preview.example.com",
      "https://*.vercel.app",
    ]) {
      if (origin.includes("*"))
        expect(mutationAllowed("POST", "https://a.vercel.app", [origin])).toBe(
          false,
        );
      else
        expect(() =>
          allowedOrigins("https://nucleo.example.com", [origin], true, true),
        ).toThrow();
    }
  });
});
