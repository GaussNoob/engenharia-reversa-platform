import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({ headless: true });
await mkdir(".runtime/qa", { recursive: true });
const errors = [];
const results = [];
for (const width of [1440, 1024, 768, 390, 320]) {
  const page = await browser.newPage({
    viewport: { width, height: 1000 },
    deviceScaleFactor: 1,
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("http://127.0.0.1:3050/", { waitUntil: "networkidle" });
  await page
    .locator(".three-canvas[data-renderer=three]")
    .waitFor({ timeout: 20000 })
    .catch(() => {});
  await page.waitForTimeout(400);
  await page.screenshot({
    path: `.runtime/qa/home-${width}.png`,
    timeout: 15000,
  });
  const overflow = await page.evaluate(() => ({
    width: innerWidth,
    scroll: document.documentElement.scrollWidth,
    renderer: document
      .querySelector(".three-canvas")
      ?.getAttribute("data-renderer"),
  }));
  results.push(overflow);
  await page.close();
}
await writeFile(
  ".runtime/qa/visual-results.json",
  JSON.stringify({ results, errors }, null, 2),
);
console.log(JSON.stringify({ results, errors }));
await browser.close();
