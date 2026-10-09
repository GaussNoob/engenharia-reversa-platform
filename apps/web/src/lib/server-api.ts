import { connection } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { PublicCatalog, UserSummary, ProgressSummary } from "@nucleo/core";
export async function serverApi<T>(
  path: string,
  privateRequest = false,
): Promise<T> {
  await connection();
  const requestHeaders = privateRequest ? await headers() : null;
  const response = await fetch(
    `${process.env.API_INTERNAL_URL ?? "http://127.0.0.1:3060"}/api${path}`,
    {
      headers: requestHeaders
        ? { cookie: requestHeaders.get("cookie") ?? "" }
        : {},
      cache: "no-store",
    },
  );
  if (response.status === 401 && privateRequest) redirect("/entrar");
  if (!response.ok) throw new Error("Não foi possível carregar este conteúdo.");
  return response.json() as Promise<T>;
}
export const getCatalog = () => serverApi<PublicCatalog>("/catalog");
export const getUser = () => serverApi<UserSummary>("/me", true);
export const getProgress = () => serverApi<ProgressSummary>("/progress", true);
