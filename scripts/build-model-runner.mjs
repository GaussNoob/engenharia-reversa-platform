import { build } from "esbuild";
await build({
  entryPoints: ["infrastructure/runner-images/model-entry.ts"],
  outfile: "infrastructure/runner-images/model-runner.mjs",
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node26",
  minify: false,
});
console.log("Isolated CPU model built.");
