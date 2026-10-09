import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const app = resolve(root, "apps/mobile");
const target = process.argv[2];
if (!["apk", "aab"].includes(target)) throw new Error("Use apk ou aab.");
if (!existsSync(resolve(app, "android/gradlew")))
  throw new Error(
    "Prepare Android: npm run build:mobile && npx cap add android (em apps/mobile).",
  );
function run(file, args, cwd) {
  const result = spawnSync(file, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run(
  process.execPath,
  [resolve(root, "scripts/build-native.mjs"), "mobile"],
  root,
);
run(
  process.execPath,
  [
    resolve(root, "node_modules/@capacitor/cli/bin/capacitor"),
    "sync",
    "android",
  ],
  app,
);
run(
  process.platform === "win32" ? "gradlew.bat" : "./gradlew",
  [target === "apk" ? "assembleDebug" : "bundleRelease", "--no-daemon"],
  resolve(app, "android"),
);
