import { readdir, readFile, readlink } from "node:fs/promises";
const target = new URL("../", import.meta.url).pathname.replace(/\/$/, "");
for (const name of await readdir("/proc")) {
  if (!/^\d+$/.test(name)) continue;
  try {
    const cwd = await readlink(`/proc/${name}/cwd`);
    const args = (await readFile(`/proc/${name}/cmdline`, "utf8")).split("\0");
    if (cwd === target && args.includes("scripts/dev.ts")) {
      process.kill(Number(name), "SIGTERM");
      console.log("Stopped owned development supervisor.");
    }
  } catch {
    /* Processes may exit during inspection. */
  }
}
