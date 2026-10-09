import sharp from "sharp";
import {
  mkdir,
  readFile,
  writeFile,
  readdir,
  copyFile,
} from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
const root = fileURLToPath(new URL("../", import.meta.url));
const source = await readFile(resolve(root, "assets/brand/nucleo-icon.svg"));
const foreground = await readFile(
  resolve(root, "assets/brand/nucleo-foreground.svg"),
);
const generated = resolve(root, ".runtime/brand-icons");
await mkdir(generated, { recursive: true });
const master = resolve(generated, "icon.png");
await sharp(source).resize(1024, 1024).ensureAlpha().png().toFile(master);
const result = spawnSync(
  process.execPath,
  [
    resolve(root, "node_modules/@tauri-apps/cli/tauri.js"),
    "icon",
    master,
    "--output",
    resolve(generated, "tauri"),
  ],
  { cwd: root, stdio: "inherit" },
);
if (result.error) throw result.error;
if (result.status !== 0)
  throw new Error("Não foi possível gerar os ícones desktop.");
// Desktop uses only PNG, ICO and ICNS. Native Android owns its adaptive layers.
for (const entry of await readdir(resolve(generated, "tauri"), {
  withFileTypes: true,
})) {
  if (entry.isFile())
    await copyFile(
      resolve(generated, "tauri", entry.name),
      resolve(root, "apps/desktop/src-tauri/icons", entry.name),
    );
}
const res = resolve(root, "apps/mobile/android/app/src/main/res");
for (const [density, size, scale] of [
  ["mdpi", 48, 1],
  ["hdpi", 72, 1.5],
  ["xhdpi", 96, 2],
  ["xxhdpi", 144, 3],
  ["xxxhdpi", 192, 4],
]) {
  const dir = resolve(res, "mipmap-" + density);
  await mkdir(dir, { recursive: true });
  await sharp(source)
    .resize(size, size)
    .png()
    .toFile(resolve(dir, "ic_launcher.png"));
  const circle = Buffer.from(
    '<svg width="' +
      size +
      '" height="' +
      size +
      '"><circle cx="' +
      size / 2 +
      '" cy="' +
      size / 2 +
      '" r="' +
      size / 2 +
      '"/></svg>',
  );
  await sharp(source)
    .resize(size, size)
    .flatten({ background: "#0d0f10" })
    .composite([{ input: circle, blend: "dest-in" }])
    .png()
    .toFile(resolve(dir, "ic_launcher_round.png"));
  await sharp(foreground)
    .resize(108 * scale, 108 * scale)
    .png()
    .toFile(resolve(dir, "ic_launcher_foreground.png"));
}
const vector =
  '<?xml version="1.0" encoding="utf-8"?>\n<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108"><group android:translateX="4.08" android:translateY="4.08" android:scaleX="0.195" android:scaleY="0.195"><path android:fillColor="#e8ba70" android:pathData="M148,140h64l96,142V140h56v232h-62l-98,-146v146h-56z"/></group></vector>\n';
await writeFile(resolve(res, "drawable/nucleo_mark.xml"), vector);
await writeFile(
  resolve(res, "values/ic_launcher_background.xml"),
  '<resources><color name="ic_launcher_background">#0d0f10</color></resources>\n',
);
for (const version of [26, 33]) {
  const dir = resolve(res, "mipmap-anydpi-v" + version);
  await mkdir(dir, { recursive: true });
  const adaptive =
    '<?xml version="1.0" encoding="utf-8"?>\n<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android"><background android:drawable="@color/ic_launcher_background"/><foreground android:drawable="@drawable/nucleo_mark"/>' +
    (version === 33
      ? '<monochrome android:drawable="@drawable/nucleo_mark"/>'
      : "") +
    "</adaptive-icon>\n";
  for (const name of ["ic_launcher.xml", "ic_launcher_round.xml"])
    await writeFile(resolve(dir, name), adaptive);
}
console.log(
  "Ícones Núcleo gerados para desktop e Android (legado, adaptativo e monocromático).",
);
