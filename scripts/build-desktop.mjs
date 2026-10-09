import { writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const root = fileURLToPath(new URL("../", import.meta.url));
const development = process.argv.includes("--dev");
const origin =
  process.env.NUCLEO_API_URL || (development ? "http://localhost:3060" : "");
if (!origin)
  throw new Error("Defina NUCLEO_API_URL antes de compilar o instalador.");
const url = new URL(origin);
if (
  url.origin !== origin ||
  url.username ||
  url.password ||
  (!development &&
    (url.protocol !== "https:" || url.hostname.endsWith(".invalid")))
)
  throw new Error("Origem HTTPS de API inválida.");
const dir = resolve(root, ".runtime/desktop-build");
await mkdir(dir, { recursive: true });
const config = resolve(dir, "tauri.csp.json");
const csp =
  "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: " +
  origin +
  "; font-src 'self' data:; connect-src 'self' ipc: http://ipc.localhost " +
  origin +
  "; worker-src 'self' blob:; object-src 'none'; base-uri 'none'; form-action 'self'";
await writeFile(
  config,
  JSON.stringify({
    app: { security: { csp } },
    bundle: {
      targets:
        process.platform === "win32"
          ? ["nsis"]
          : process.platform === "darwin"
            ? ["app", "dmg"]
            : ["deb", "appimage"],
    },
  }),
);
const result = spawnSync(
  process.execPath,
  [
    resolve(root, "node_modules/@tauri-apps/cli/tauri.js"),
    development ? "dev" : "build",
    "--config",
    config,
  ],
  {
    cwd: resolve(root, "apps/desktop"),
    stdio: "inherit",
    env: { ...process.env, NUCLEO_API_URL: origin },
  },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
