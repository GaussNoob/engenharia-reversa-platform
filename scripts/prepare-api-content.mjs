import { spawnSync } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { delimiter } from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const source = "references/fundamentos-engenharia-reversa";
const sourceDirectory = fileURLToPath(
  new URL("../" + source + "/", import.meta.url),
);
const pin = "3d24fc9313560d734d7a27c56c53d695f01163e1";
function execute(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    ...options,
  });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(command + " falhou com código " + result.status);
}
await mkdir(new URL("../references/", import.meta.url), { recursive: true });
try {
  await readFile(new URL("../" + source + "/.git/HEAD", import.meta.url));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  execute("git", [
    "clone",
    "--no-checkout",
    "https://github.com/mentebinaria/fundamentos-engenharia-reversa.git",
    source,
  ]);
  execute("git", ["-C", source, "checkout", "--detach", pin]);
}
const revision = spawnSync(
  "git",
  [
    "-c",
    "safe.directory=" + sourceDirectory.replace(/\\/g, "/").replace(/\/$/, ""),
    "-C",
    source,
    "rev-parse",
    "HEAD",
  ],
  {
    cwd: root,
    encoding: "utf8",
  },
);
if (revision.status !== 0 || revision.stdout.trim() !== pin)
  throw new Error("A fonte deve corresponder ao commit auditado " + pin);
const python =
  process.env.PYTHON ?? (process.platform === "win32" ? "python" : "python3");
const modules = fileURLToPath(
  new URL("../.runtime/api-python/", import.meta.url),
);
execute(python, [
  "-m",
  "pip",
  "install",
  "--target",
  modules,
  "-r",
  "scripts/requirements-analysis.txt",
]);
execute(python, ["scripts/import_book.py"], {
  env: {
    ...process.env,
    PYTHONPATH:
      modules +
      (process.env.PYTHONPATH ? delimiter + process.env.PYTHONPATH : ""),
  },
});
const catalog = JSON.parse(
  await readFile(
    new URL("../content/.generated/catalog.json", import.meta.url),
    "utf8",
  ),
);
if (catalog.sourceCommit !== pin)
  throw new Error("Revisão do catálogo inválida.");
console.log(
  "Conteúdo de servidor preparado a partir da revisão auditada; nenhum arquivo foi copiado para public/.",
);
