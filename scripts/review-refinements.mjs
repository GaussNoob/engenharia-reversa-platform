import { chromium } from "@playwright/test";
import { mkdir, readFile, writeFile } from "node:fs/promises";
const catalog = JSON.parse(
  await readFile("content/.generated/catalog.json", "utf8"),
);
const numberLesson = catalog.modules[1].lessons[0];
const browser = await chromium.launch({ headless: true });
const results = [],
  errors = [];
await mkdir(".runtime/qa", { recursive: true });
try {
  for (const width of [1440, 1024, 768, 390, 320]) {
    const page = await browser.newPage({
      viewport: { width, height: width < 500 ? 844 : 1000 },
      deviceScaleFactor: 1,
    });
    page.on("pageerror", (error) => errors.push(error.message));
    for (const [name, path] of [
      ["float", "/playground/float"],
      ["anatomy", "/playground/anatomy"],
      [
        "bits",
        `/aprender/fundamentos/${numberLesson.moduleId}/${numberLesson.slug}`,
      ],
    ]) {
      await page.goto(`http://127.0.0.1:3050${path}`, {
        waitUntil: "networkidle",
      });
      if (name === "anatomy") {
        await page
          .getByRole("tab", { name: "02 Memória", exact: true })
          .click();
        await page.locator(".three-canvas[data-renderer=three]").waitFor();
        await page
          .getByRole("button", {
            name: "Byte no endereço 0x00402004",
            exact: true,
          })
          .click();
      }
      if (name === "bits" && width <= 900)
        await page
          .getByRole("button", { name: "Abrir bancada", exact: false })
          .click();
      await page.waitForTimeout(400);
      const size = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        dialog: document.querySelector(".practice-dialog:modal")?.scrollWidth,
      }));
      results.push({ name, ...size });
      if (name !== "bits")
        await page
          .locator(name === "float" ? ".float-bench" : ".software-scene")
          .scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `.runtime/qa/${name}-refined-${width}.png`,
        timeout: 15000,
      });
      if (name === "anatomy" && width === 1440) {
        await page
          .getByRole("button", { name: "Isolar componente", exact: true })
          .click();
        await page.waitForTimeout(500);
        await page.screenshot({
          path: ".runtime/qa/anatomy-single-component.png",
        });
      }
      if (name === "bits" && width === 1440) {
        await page
          .getByRole("combobox", { name: "Operação de bits", exact: true })
          .click();
        await page.screenshot({ path: ".runtime/qa/custom-menu.png" });
      }
    }
    await page.close();
  }
  await writeFile(
    ".runtime/qa/refinements-results.json",
    JSON.stringify({ results, errors }, null, 2),
  );
  console.log(JSON.stringify({ results, errors }));
} finally {
  await browser.close();
}
