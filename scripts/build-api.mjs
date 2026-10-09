import "./prepare-api-content.mjs";
import { build } from "esbuild";
import { readFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const outfile = resolve(root, "apps/api/dist/app.mjs");
await build({
  absWorkingDir: root,
  entryPoints: ["apps/api/src/app.ts"],
  outfile,
  bundle: true,
  packages: "external",
  platform: "node",
  format: "esm",
  target: "node24",
  tsconfig: "tsconfig.base.json",
  alias: {
    "@nucleo/core": resolve(root, "packages/core/src/index.ts"),
    "@nucleo/models": resolve(root, "packages/models/src/index.ts"),
    "@nucleo/content/server": resolve(root, "packages/content/src/server.ts"),
    "@nucleo/content": resolve(root, "packages/content/src/index.ts"),
  },
  plugins: [
    {
      name: "preserve-module-asset-paths",
      setup(plugin) {
        plugin.onLoad({ filter: /\.ts$/ }, async (args) => {
          if (
            !args.path.startsWith(root) ||
            args.path.includes(sep + "node_modules" + sep)
          )
            return;
          const source = await readFile(args.path, "utf8");
          // A bundled module's import.meta.url points at the output. Keep its local data URLs correct.
          const contents = source.replace(
            /new URL\(\s*("[^"\n]+")\s*,\s*import\.meta\.url\s*,?\s*\)/g,
            (_, literal) => {
              const original = new URL(
                JSON.parse(literal),
                pathToFileURL(args.path),
              );
              if (original.protocol !== "file:")
                return "new URL(" + literal + ", import.meta.url)";
              const asset =
                relative(dirname(outfile), fileURLToPath(original))
                  .split(sep)
                  .join("/") + (original.pathname.endsWith("/") ? "/" : "");
              return "new URL(" + JSON.stringify(asset) + ", import.meta.url)";
            },
          );
          return { contents, loader: "ts" };
        });
      },
    },
  ],
  logLevel: "info",
});
console.log(
  "API Hono compilada com pacotes de domínio compartilhados e dados privados do servidor.",
);
