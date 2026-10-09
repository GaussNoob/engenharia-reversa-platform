import type { PoolConfig } from "pg";
import { X509Certificate } from "node:crypto";

/** Preserve hostname verification when a managed database uses its own CA. */
export function databasePoolConfig(
  connectionString: string,
  max: number,
  caBase64 = process.env.DATABASE_SSL_CA_B64,
): PoolConfig {
  const configuration: PoolConfig = {
    connectionString,
    max,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 10000,
    allowExitOnIdle: true,
  };
  if (!caBase64) return configuration;
  const ca = Buffer.from(caBase64, "base64").toString("utf8");
  const certificates = ca.match(
    /-----BEGIN CERTIFICATE-----[\s\S]+?-----END CERTIFICATE-----/g,
  );
  if (!certificates?.length)
    throw new Error("DATABASE_SSL_CA_B64 deve conter certificados PEM.");
  for (const certificate of certificates) new X509Certificate(certificate);
  const url = new URL(connectionString);
  if (url.searchParams.get("sslmode") === "disable")
    throw new Error("A conexão com CA configurada exige TLS.");
  // pg's URL parser otherwise replaces the explicit SSL object and its CA.
  for (const key of ["sslmode", "sslcert", "sslkey", "sslrootcert"])
    url.searchParams.delete(key);
  return {
    ...configuration,
    connectionString: url.toString(),
    ssl: { ca, rejectUnauthorized: true },
  };
}
