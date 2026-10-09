import { build, context } from "esbuild";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const target = process.argv[2];
if (!["desktop", "mobile"].includes(target))
  throw new Error("Use desktop ou mobile.");
const serve = process.argv.includes("--serve"),
  development = serve || process.argv.includes("--development");
const origin =
  process.env.NUCLEO_API_URL || (development ? "http://localhost:3060" : "");
if (!origin)
  throw new Error("Defina NUCLEO_API_URL com a origem HTTPS pública da API.");
const url = new URL(origin);
if (
  url.origin !== origin ||
  url.username ||
  url.password ||
  (!development &&
    (url.protocol !== "https:" || url.hostname.endsWith(".invalid")))
)
  throw new Error(
    "NUCLEO_API_URL precisa ser uma origem HTTPS válida, sem secrets.",
  );
const outdir = resolve(root, "apps", target, "dist");
await mkdir(outdir, { recursive: true });
for (const name of ["fonts", "fixtures", "vendor"])
  await cp(resolve(root, "apps/web/public", name), resolve(outdir, name), {
    recursive: true,
  });
const aliases = {
  "@nucleo/features": resolve(root, "packages/features/src"),
  "@nucleo/platform": resolve(root, "packages/platform/src"),
  "@nucleo/api-client": resolve(root, "packages/api-client/src"),
  "@nucleo/core": resolve(root, "packages/core/src"),
  "@nucleo/models": resolve(root, "packages/models/src"),
  "@nucleo/design-tokens": resolve(root, "packages/design-tokens"),
};
const options = {
  absWorkingDir: root,
  entryPoints: { app: "apps/" + target + "/src/main.tsx" },
  outdir,
  bundle: true,
  format: "esm",
  splitting: true,
  platform: "browser",
  target: ["es2022"],
  jsx: "automatic",
  minify: !development,
  sourcemap: development,
  metafile: true,
  alias: aliases,
  external: ["/fonts/*"],
  loader: { ".woff2": "file", ".woff": "file", ".ttf": "file" },
  define: {
    __NUCLEO_API_URL__: JSON.stringify(origin),
    "process.env.NODE_ENV": JSON.stringify(
      development ? "development" : "production",
    ),
  },
  logLevel: "info",
};
const csp =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: " +
  origin +
  "; font-src 'self' data:; connect-src 'self' ipc: http://ipc.localhost " +
  origin +
  "; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'self'";
await writeFile(
  resolve(outdir, "index.html"),
  '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta http-equiv="Content-Security-Policy" content="' +
    csp +
    '"><title>Núcleo</title><link rel="stylesheet" href="./app.css"></head><body data-platform="' +
    target +
    '"><a href="#main" class="skip-link">Pular para o conteúdo</a><div id="root"></div><script type="module" src="./app.js"></script></body></html>',
);
if (serve) {
  const ctx = await context(options);
  await ctx.watch();
  await ctx.serve({
    servedir: outdir,
    host: "127.0.0.1",
    port: target === "desktop" ? 3070 : 3071,
  });
  console.log(
    "Núcleo " +
      target +
      " em http://localhost:" +
      (target === "desktop" ? 3070 : 3071),
  );
} else {
  const result = await build(options);
  await writeFile(
    resolve(outdir, "build-meta.json"),
    JSON.stringify(result.metafile, null, 2),
  );
}
