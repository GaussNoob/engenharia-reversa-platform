export function allowedOrigins(
  publicOrigin: string,
  webOrigins: string[],
  nativeEnabled: boolean,
  production: boolean,
) {
  const web = [publicOrigin, ...webOrigins].map((origin) => {
    const url = new URL(origin);
    if (
      url.origin !== origin ||
      url.username ||
      url.password ||
      (production && url.protocol !== "https:")
    )
      throw new Error("WEB_ORIGINS exige origens HTTPS exatas em produção.");
    return origin;
  });
  if (!production) {
    const url = new URL(publicOrigin);
    if (["localhost", "127.0.0.1"].includes(url.hostname))
      web.push(
        url.protocol +
          "//" +
          (url.hostname === "localhost" ? "127.0.0.1" : "localhost") +
          ":" +
          url.port,
      );
  }
  return [
    ...new Set([
      ...web,
      ...(nativeEnabled
        ? [
            "tauri://localhost",
            "http://tauri.localhost",
            "https://tauri.localhost",
            "capacitor://localhost",
            "https://localhost",
          ]
        : []),
      ...(!production
        ? [
            "http://localhost:3070",
            "http://localhost:3071",
            "http://127.0.0.1:3070",
            "http://127.0.0.1:3071",
          ]
        : []),
    ]),
  ];
}
export function mutationAllowed(
  method: string,
  origin: string | undefined,
  origins: readonly string[],
) {
  return (
    ["GET", "HEAD", "OPTIONS"].includes(method) ||
    (!!origin && origins.includes(origin))
  );
}
