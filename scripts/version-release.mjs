import { readFile, writeFile } from "node:fs/promises";
const tag = process.env.GITHUB_REF_NAME || "";
if (!/^v\d+\.\d+\.\d+$/.test(tag)) {
  console.log("No release tag; preserving development versions.");
  process.exit(0);
}
const version = tag.slice(1);
for (const file of [
  "apps/desktop/package.json",
  "apps/mobile/package.json",
  "apps/desktop/src-tauri/tauri.conf.json",
]) {
  const data = JSON.parse(await readFile(file, "utf8"));
  data.version = version;
  await writeFile(file, JSON.stringify(data, null, 2) + "\n");
}
let cargo = await readFile("apps/desktop/src-tauri/Cargo.toml", "utf8");
cargo = cargo.replace(/^version = ".*"/m, 'version = "' + version + '"');
await writeFile("apps/desktop/src-tauri/Cargo.toml", cargo);
let gradle = await readFile("apps/mobile/android/app/build.gradle", "utf8");
const [major, minor, patch] = version.split(".").map(Number);
const code = major * 1000000 + minor * 1000 + patch;
if (minor > 999 || patch > 999 || code > 2100000000)
  throw new Error("Release version exceeds Android versionCode range.");
gradle = gradle
  .replace(/versionCode \d+/, "versionCode " + code)
  .replace(/versionName "[^"]+"/, 'versionName "' + version + '"');
await writeFile("apps/mobile/android/app/build.gradle", gradle);
