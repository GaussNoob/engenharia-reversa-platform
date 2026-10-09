import { spawnSync } from "node:child_process";
const executable =
  process.env.PYTHON || (process.platform === "win32" ? "python" : "python3");
const result = spawnSync(executable, process.argv.slice(2), {
  stdio: "inherit",
  env: { ...process.env, PYTHONUTF8: "1", PYTHONIOENCODING: "utf-8" },
});
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
