import { readdir, readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
const target = process.argv[2];
const tag = process.env.RELEASE_TAG;
if (
  !["desktop", "android"].includes(target) ||
  !/^v\d+\.\d+\.\d+$/.test(tag ?? "")
)
  throw new Error(
    "Publicação exige target desktop/android e tag semântica vX.Y.Z.",
  );
const directory = resolve(".runtime/release-artifacts");
const extension =
  target === "desktop" ? /\.(exe|msi|dmg|AppImage|deb)$/ : /\.(apk|aab)$/;
const files = [];
async function collect(folder) {
  for (const entry of await readdir(folder, { withFileTypes: true })) {
    const file = resolve(folder, entry.name);
    if (entry.isDirectory()) await collect(file);
    else if (extension.test(entry.name)) files.push(file);
  }
}
await collect(directory);
if (!files.length) throw new Error("Nenhum instalador encontrado.");
if (new Set(files.map((file) => basename(file))).size !== files.length)
  throw new Error("Artefatos com nomes duplicados.");
const checksum = resolve(directory, "SHA256SUMS-" + target);
const hashes = await Promise.all(
  files.map(
    async (file) =>
      createHash("sha256")
        .update(await readFile(file))
        .digest("hex") +
      "  " +
      basename(file),
  ),
);
await writeFile(checksum, hashes.join("\n") + "\n");
const notes = resolve(directory, "release-notes.md");
await writeFile(
  notes,
  "Builds de teste do Núcleo para " +
    tag +
    ". API HTTPS definida no ambiente do build. Desktop sem assinatura/notarização; APK de debug e AAB sem assinatura de loja. Consulte SHA256SUMS de cada target e docs/14-validacao-multiplataforma.md para limitações. Runner Linux e recuperação de senha exigem infraestrutura própria configurada.\n",
);
function gh(args, allowFailure = false) {
  const result = spawnSync("gh", args, { stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0 && !allowFailure)
    throw new Error("GitHub CLI retornou " + result.status);
  return result.status;
}
if (gh(["release", "view", tag], true) !== 0) {
  // Both targets may finish concurrently; accept the other job creating this release.
  if (
    gh(
      [
        "release",
        "create",
        tag,
        "--verify-tag",
        "--prerelease",
        "--title",
        "Núcleo " + tag + " — builds de teste",
        "--notes-file",
        notes,
      ],
      true,
    ) !== 0
  )
    gh(["release", "view", tag]);
}
gh(["release", "upload", tag, ...files, checksum, "--clobber"]);
