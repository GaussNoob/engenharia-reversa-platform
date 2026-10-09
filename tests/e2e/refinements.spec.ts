import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { Catalog } from "@nucleo/core";

const catalog = JSON.parse(
  readFileSync("content/.generated/catalog.json", "utf8"),
) as Catalog;
const imageLesson = catalog.modules
  .flatMap((module) => module.lessons)
  .find((lesson) => lesson.blocks.some((block) => block.type === "image"))!;
const numberLesson =
  catalog.modules.find((module) => module.number === "02")?.lessons[0] ??
  catalog.modules[1]!.lessons[0]!;

async function chooseLanguage(
  page: import("@playwright/test").Page,
  name: string,
) {
  await page
    .getByRole("combobox", { name: "Linguagem da bancada", exact: true })
    .click();
  await page.getByRole("option", { name, exact: true }).click();
}
async function writeInMonaco(
  page: import("@playwright/test").Page,
  source: string,
) {
  await page.locator(".monaco-editor .view-lines:visible").click();
  await page.keyboard.press("Control+a");
  await page.keyboard.type(source, { delay: 25 });
}

test("3D: camada isolada, endereços, componente individual e rotação", async ({
  page,
}) => {
  await page.goto("/playground/anatomy");
  await expect(page.locator(".three-canvas")).toHaveAttribute(
    "data-renderer",
    "three",
  );
  await page.getByRole("tab", { name: "02 Memória", exact: true }).click();
  await expect(page.locator(".three-canvas")).toHaveAttribute(
    "data-view",
    "isolated",
  );
  await page
    .getByRole("button", { name: "Byte no endereço 0x00402004", exact: true })
    .click();
  await expect(page.locator(".scene-part-detail")).toContainText(
    "0x00402004 → 4E",
  );
  await expect(page.locator(".scene-part-detail")).toContainText('"N"');
  await page
    .getByRole("button", { name: "Isolar componente", exact: true })
    .click();
  await expect(page.locator(".three-canvas")).toHaveAttribute(
    "data-view",
    "component",
  );
  await page
    .getByRole("button", { name: "Voltar à camada", exact: true })
    .click();
  await page.getByRole("tab", { name: "03 Executável", exact: true }).click();
  await page
    .getByRole("button", { name: "Inspecionar .idata", exact: true })
    .click();
  await expect(page.locator(".scene-part-detail")).toContainText(
    "preenche a IAT",
  );
  await page.getByLabel("Rotação do diagrama").fill("45");
  await expect(page.locator(".scene-rotation output")).toHaveText("45°");
});

test("todas as imagens auditadas carregam, e a aula permite ampliar com zoom", async ({
  page,
  request,
}) => {
  const images = [
    ...new Set(
      [
        ...catalog.modules.flatMap((module) => module.lessons),
        ...catalog.references,
      ].flatMap((document) =>
        document.blocks
          .filter((block) => block.type === "image")
          .map((block) => block.asset),
      ),
    ),
  ];
  expect(images).toHaveLength(28);
  for (const image of images) {
    const response = await request.get(
      `/api/assets/${encodeURIComponent(image)}`,
    );
    expect(response.status(), image).toBe(200);
    expect(response.headers()["content-type"]).toBe("image/png");
    const buffer = await response.body();
    expect([...buffer.slice(0, 8)]).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  }
  await page.goto(
    `/aprender/fundamentos/${imageLesson.moduleId}/${imageLesson.slug}`,
  );
  const image = page.locator(".source-image-open img").first();
  await image.scrollIntoViewIfNeeded();
  await expect
    .poll(() =>
      image.evaluate((element) => (element as HTMLImageElement).naturalWidth),
    )
    .toBeGreaterThan(0);
  await page.locator(".source-image-open").first().click();
  await expect(page.locator(".source-image-dialog[open]")).toBeVisible();
  await page
    .getByRole("button", { name: "Aumentar imagem", exact: true })
    .click();
  await expect(page.locator(".source-image-dialog[open] output")).toHaveText(
    "150%",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator(".source-image-dialog[open]")).toHaveCount(0);
});

test("seletores personalizados: teclado, operação, largura e ausência de select nativo", async ({
  page,
}) => {
  await page.goto(
    `/aprender/fundamentos/${numberLesson.moduleId}/${numberLesson.slug}`,
  );
  await expect(page.locator("select")).toHaveCount(0);
  const operation = page.getByRole("combobox", {
    name: "Operação de bits",
    exact: true,
  });
  await operation.focus();
  await page.keyboard.press("Home");
  await page.keyboard.press("Enter");
  await expect(operation).toContainText("AND");
  await expect(page.locator(".bit-result strong")).toHaveText("0x04");
  await page.getByRole("combobox", { name: "Largura", exact: true }).click();
  await page.getByRole("option", { name: "64 bits", exact: true }).click();
  await expect(page.locator(".bit-byte button")).toHaveCount(64);
  await expect(page.locator(".bit-result strong")).toHaveText(
    "0x0000000000000004",
  );
  await page.setViewportSize({ width: 320, height: 740 });
  await page
    .getByRole("button", { name: "Abrir bancada", exact: false })
    .click();
  await expect(page.locator(".practice-dialog:modal")).toBeVisible();
  await expect(page.locator(".bit-operation")).toBeVisible();
  const widths = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth,
    dialog: document.querySelector(".practice-dialog")!.scrollWidth,
    viewport: innerWidth,
  }));
  expect(widths.page).toBeLessThanOrEqual(widths.viewport);
  expect(widths.dialog).toBeLessThanOrEqual(widths.viewport);
});

test("Monaco: autocomplete real em Python, C, C++, Assembly e FASM", async ({
  page,
}) => {
  await page.goto("/playground/c");
  await page.locator(".monaco-editor:visible").waitFor();
  await writeInMonaco(page, "pri");
  await expect(page.locator(".suggest-widget.visible")).toContainText("printf");
  await page.keyboard.press("Enter");
  await expect(page.locator(".view-lines:visible")).toContainText("printf");
  await chooseLanguage(page, "Python 3");
  await writeInMonaco(page, "import struct\nstruct.unp");
  await expect(page.locator(".suggest-widget.visible")).toContainText("unpack");
  await page.keyboard.press("Escape");
  await chooseLanguage(page, "C++ / Windows");
  await writeInMonaco(page, "std::vec");
  await expect(page.locator(".suggest-widget.visible")).toContainText("vector");
  await page.keyboard.press("Escape");
  await chooseLanguage(page, "Assembly");
  await writeInMonaco(page, "mov ra");
  await expect(page.locator(".suggest-widget.visible")).toContainText("rax");
  await page.keyboard.press("Escape");
  await chooseLanguage(page, "FASM");
  await writeInMonaco(page, "sec");
  await expect(page.locator(".suggest-widget.visible")).toContainText(
    "section",
  );
  await page.keyboard.press("Escape");
});

test("mobile: acesso fixo, autocomplete touch, menu em cima do modal e leitura preservada", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/aprender/fundamentos/08-assembly/registradores");
  await page.evaluate(() => scrollTo(0, 600));
  const scrollBefore = await page.evaluate(() => scrollY);
  await expect(
    page.getByRole("button", { name: "Abrir bancada", exact: false }),
  ).toBeInViewport();
  await page
    .getByRole("button", { name: "Abrir bancada", exact: false })
    .click();
  await chooseLanguage(page, "Python 3");
  const editor = page.locator(".cm-content:visible");
  await editor.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.type("pri", { delay: 50 });
  await page.getByRole("button", { name: "Sugestões", exact: true }).click();
  await expect(page.locator(".cm-tooltip-autocomplete")).toContainText("print");
  await page
    .locator(".cm-tooltip-autocomplete [role=option]")
    .filter({ hasText: /^print/ })
    .first()
    .click();
  await expect(editor).toContainText("print");
  await page
    .getByRole("button", { name: "Voltar para a aula", exact: true })
    .click();
  await expect(page.locator(".practice-dialog:modal")).toHaveCount(0);
  expect(
    Math.abs((await page.evaluate(() => scrollY)) - scrollBefore),
  ).toBeLessThan(5);
  await page
    .getByRole("button", { name: "Abrir bancada", exact: false })
    .click();
  await expect(editor).toContainText("print");
  await page.keyboard.press("Escape");
  await expect(page.locator(".practice-dialog:modal")).toHaveCount(0);
});
