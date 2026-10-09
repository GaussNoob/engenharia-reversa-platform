import { build } from "esbuild";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
const root = new URL("../", import.meta.url);
const purifier = new URL("node_modules/dompurify/dist/purify.es.mjs", root);
const version = JSON.parse(
  await readFile(new URL("node_modules/dompurify/package.json", root), "utf8"),
).version;
if (version !== "3.4.16")
  throw new Error(
    `Expected the audited DOMPurify 3.4.16; found ${version}. Run npm ci.`,
  );
const result = await build({
  absWorkingDir: fileURLToPath(root),
  entryPoints: {
    editor: "scripts/monaco-entry.ts",
    "editor.worker":
      "node_modules/monaco-editor/esm/vs/editor/editor.worker.js",
  },
  outdir: "apps/web/public/vendor/runtime",
  bundle: true,
  format: "iife",
  globalName: "NucleoMonaco",
  target: ["chrome110", "firefox115", "safari17"],
  minify: true,
  metafile: true,
  legalComments: "eof",
  loader: { ".ttf": "file" },
  plugins: [
    {
      name: "patched-monaco-sanitizer",
      setup(plugin) {
        plugin.onResolve({ filter: /dompurify\/dompurify\.js$/ }, () => ({
          path: fileURLToPath(purifier),
        }));
      },
    },
  ],
});
if (
  !Object.keys(result.metafile.inputs).some((input) =>
    input.endsWith("/dompurify/dist/purify.es.mjs"),
  )
)
  throw new Error(
    "The local editor build did not include the patched sanitizer.",
  );
// The former generated AMD assets are reproducible and no longer used.
await rm(new URL("apps/web/public/vendor/vs/", root), {
  recursive: true,
  force: true,
});
const fonts = new URL("apps/web/public/fonts/", root);
await mkdir(fonts, { recursive: true });
for (const family of ["instrument-sans", "literata"])
  await copyFile(
    new URL(`node_modules/@fontsource-variable/${family}/LICENSE`, root),
    new URL(`${family}-LICENSE.txt`, fonts),
  );
await copyFile(
  new URL("node_modules/monaco-editor/LICENSE", root),
  new URL("apps/web/public/vendor/runtime/monaco-LICENSE.txt", root),
);
await writeFile(
  new URL("apps/web/public/vendor/runtime/build-info.json", root),
  JSON.stringify(
    {
      monaco: "0.57.0",
      dompurify: version,
      languages: ["python", "c", "cpp", "assembly", "fasm"],
      source:
        "ESM with an explicitly patched sanitizer; not the upstream prebuilt AMD bundle",
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Local Monaco editor and worker built with DOMPurify ${version}; font licenses copied.`,
);
