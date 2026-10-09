import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { databasePoolConfig } from "./pool-config.ts";
const ca = readFileSync(
  new URL(
    "../../../../infrastructure/supabase/production-ca.crt",
    import.meta.url,
  ),
).toString("base64");
describe("managed PostgreSQL TLS", () => {
  it("keeps CA and hostname verification when pg URL contains sslmode", () => {
    const configuration = databasePoolConfig(
      "postgresql://test:password@db.example.test:5432/postgres?sslmode=verify-full",
      1,
      ca,
    );
    expect(configuration.max).toBe(1);
    expect(configuration.ssl).toEqual({
      ca: Buffer.from(ca, "base64").toString("utf8"),
      rejectUnauthorized: true,
    });
    expect(
      new URL(configuration.connectionString!).searchParams.has("sslmode"),
    ).toBe(false);
  });
  it("rejects disabled TLS with a configured CA", () => {
    expect(() =>
      databasePoolConfig(
        "postgresql://test:password@db.example.test/postgres?sslmode=disable",
        1,
        ca,
      ),
    ).toThrow("exige TLS");
  });
  it("rejects malformed certificate material", () => {
    expect(() =>
      databasePoolConfig(
        "postgresql://localhost/test",
        1,
        Buffer.from("invalid").toString("base64"),
      ),
    ).toThrow("certificados PEM");
  });
  it("preserves local database configuration without a custom CA", () => {
    expect(
      databasePoolConfig("postgresql://localhost/test", 4, "").ssl,
    ).toBeUndefined();
  });
});
