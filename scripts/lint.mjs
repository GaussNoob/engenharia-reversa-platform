import { readdir, readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
async function inspect(dir) {
  for (const entry of await readdir(resolve(root, dir), {
    withFileTypes: true,
  })) {
    const file = dir + "/" + entry.name;
    if (entry.isDirectory()) await inspect(file);
    else if (/\.tsx?$/.test(file)) {
      const source = await readFile(resolve(root, file), "utf8");
      const imports = [
        ...source.matchAll(/(?:from|import\()\s*['"]([^'"]+)/g),
      ].map((match) => match[1]);
      if (
        file.startsWith("packages/features") &&
        !file.includes(".test.") &&
        imports.some((name) =>
          /^(next(?:\/|$)|@tauri-apps|@capacitor|node:)/.test(name),
        )
      )
        throw new Error(
          file + ": infrastructure belongs in a platform adapter.",
        );
      if (
        file.startsWith("packages/core") &&
        imports.some((name) =>
          /^(react|next|@tauri-apps|@capacitor)/.test(name),
        )
      )
        throw new Error(
          file + ": domain must not depend on client frameworks.",
        );
    }
  }
}
await inspect("packages/features/src");
await inspect("packages/core/src");
const result = spawnSync(
  process.execPath,
  [
    resolve(root, "node_modules/prettier/bin/prettier.cjs"),
    "--check",
    "apps",
    "packages",
    "scripts/*.ts",
    "scripts/*.mjs",
    "tests",
    "infrastructure/production",
    "*.json",
    "*.ts",
  ],
  { cwd: root, stdio: "inherit" },
);
process.exitCode = result.status ?? 1;
