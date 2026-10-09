import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
const browser = await chromium.launch({ headless: true });
const results = [],
  errors = [];
await mkdir(".runtime/qa", { recursive: true });
try {
  for (const width of [1440, 1024, 768, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 1000 } });
    page.on("pageerror", (error) => errors.push(error.message));
    for (const [name, path] of [
      ["exercise-catalog", "/exercicios"],
      ["exercise-numeric", "/exercicios/hexadecimal-para-decimal"],
      ["exercise-code", "/exercicios/python-tres-representacoes"],
    ]) {
      await page.goto(`http://127.0.0.1:3050${path}`, {
        waitUntil: "networkidle",
      });
      if (name === "exercise-code" && width <= 900) {
        await page
          .getByRole("button", { name: "Abrir bancada", exact: false })
          .click();
        await page
          .locator(".practice-dialog:modal")
          .evaluate(async (element) => {
            await Promise.all(
              element.getAnimations().map((animation) => animation.finished),
            );
          });
      }
      await page.screenshot({ path: `.runtime/qa/${name}-${width}.png` });
      const measurement = await page.evaluate(() => ({
        width: innerWidth,
        page: document.documentElement.scrollWidth,
        dialog: document.querySelector(".practice-dialog:modal")?.scrollWidth,
      }));
      results.push({ name, ...measurement });
      if (measurement.page > width || (measurement.dialog ?? 0) > width)
        throw new Error(`Horizontal overflow: ${name} at ${width}px.`);
    }
    if (width === 1440 || width === 390) {
      await page.goto(
        "http://127.0.0.1:3050/aprender/fundamentos/07-windows-api/messagebox",
        { waitUntil: "networkidle" },
      );
      await page.locator(".lesson-code-block").first().scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `.runtime/qa/highlighted-lesson-${width}.png`,
      });
      if (width <= 900) {
        await page
          .getByRole("button", { name: "Abrir bancada", exact: false })
          .click();
        await page
          .locator(".practice-dialog:modal")
          .evaluate(async (element) => {
            await Promise.all(
              element.getAnimations().map((animation) => animation.finished),
            );
          });
      }
      await page.screenshot({
        path: `.runtime/qa/windows-api-spacing-${width}.png`,
      });
    }
    await page.close();
  }
  if (errors.length) throw new Error(errors.join("\n"));
  await writeFile(
    ".runtime/qa/exercises-results.json",
    JSON.stringify({ results, errors }, null, 2),
  );
  console.log(JSON.stringify({ results, errors }));
} finally {
  await browser.close();
}
