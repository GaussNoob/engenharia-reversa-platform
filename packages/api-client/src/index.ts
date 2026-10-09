export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
export type Transport = (path: string, init: RequestInit) => Promise<Response>;
export function assertApiPath(path: string): void {
  if (
    !path.startsWith("/") ||
    path.startsWith("//") ||
    /[\\\r\n]/.test(path) ||
    path
      .split(/[/?#]/)
      .some((part) => [".", "..", "%2e", "%2e%2e"].includes(part.toLowerCase()))
  )
    throw new Error("Caminho de API inválido.");
}
let transport: Transport = (path, init) =>
  fetch("/api" + path, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
  });
let origin = "";
/** Configure once in the installed client's composition root. No credential belongs here. */
export function configureApi(options: {
  transport: Transport;
  origin: string;
}) {
  const url = new URL(options.origin);
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new Error("A API precisa usar HTTPS.");
  if (
    url.username ||
    url.password ||
    url.pathname !== "/" ||
    url.search ||
    url.hash
  )
    throw new Error("Origem de API inválida.");
  transport = options.transport;
  origin = url.origin;
}
export function apiAssetUrl(path: string) {
  assertApiPath(path);
  return origin + "/api" + path;
}
export async function apiResponse(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  assertApiPath(path);
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type"))
    headers.set("Content-Type", "application/json");
  const response = await transport(path, { ...init, headers });
  if (!response.ok) {
    const value: unknown = await response.json().catch(() => null);
    const message =
      typeof value === "object" && value !== null
        ? "error" in value
          ? String(value.error)
          : "message" in value
            ? String(value.message)
            : ""
        : "";
    throw new ApiError(
      message || "Não foi possível concluir a operação.",
      response.status,
    );
  }
  return response;
}
export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  return (await apiResponse(path, init)).json() as Promise<T>;
}
