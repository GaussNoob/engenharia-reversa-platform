import { expect, test, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import type { ExerciseDefinition } from "@nucleo/core";
const definitions = JSON.parse(
  readFileSync("content/exercises.json", "utf8"),
) as ExerciseDefinition[];
async function account(page: Page) {
  await page.goto("/criar-conta");
  await page.getByLabel("Como podemos chamar você?").fill("Pessoa exercícios");
  await page
    .getByLabel("Email", { exact: true })
    .fill(`exercise-${Date.now()}@example.invalid`);
  await page
    .getByLabel("Senha", { exact: true })
    .fill("Nucleo-Exercises-2026-seguro");
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page).toHaveURL(/dashboard/);
}
test("exercícios: coleção completa, filtros personalizados, busca global e mobile", async ({
  page,
}) => {
  await page.goto("/exercicios");
  await expect(page.locator(".exercise-index-row")).toHaveCount(45);
  await expect(page.locator("select")).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "Módulo dos exercícios", exact: true })
    .click();
  await page
    .getByRole("option", { name: "08 · Assembly", exact: true })
    .click();
  await expect(page.locator(".exercise-index-row")).toHaveCount(8);
  await page
    .getByRole("combobox", { name: "Dificuldade dos exercícios", exact: true })
    .click();
  await page.getByRole("option", { name: "desafio", exact: true }).click();
  await expect(page.locator(".exercise-index-row")).toHaveCount(2);
  await page.getByLabel("Buscar exercícios").fill("acumulador");
  await expect(page.locator(".exercise-index-row")).toHaveCount(1);
  await page.keyboard.press("Control+k");
  await page
    .getByRole("combobox", { name: "Termo da busca" })
    .fill("registrador errado");
  await expect(
    page.getByRole("dialog").getByRole("option").first(),
  ).toContainText("Encontrar o registrador errado");
  await page.keyboard.press("Escape");
  await page.setViewportSize({ width: 320, height: 740 });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(320);
});
test("exercício numérico: dicas, tentativa, solução, validação e restauração", async ({
  page,
}) => {
  await account(page);
  await page.goto("/exercicios/hexadecimal-para-decimal");
  await page
    .getByRole("button", { name: "Mostrar primeira dica", exact: true })
    .click();
  await expect(page.locator(".exercise-hints li")).toHaveCount(1);
  await page.getByLabel("Sua resposta", { exact: true }).fill("41");
  await page
    .getByRole("button", { name: "Validar resposta", exact: true })
    .click();
  await expect(page.locator(".exercise-feedback")).toContainText(
    "Mais uma tentativa.",
  );
  await page
    .getByRole("button", { name: "Ver solução comentada", exact: true })
    .click();
  await expect(page.locator(".exercise-solution")).toContainText("42");
  await page.getByLabel("Sua resposta", { exact: true }).fill("0x2A");
  await page
    .getByRole("button", { name: "Validar resposta", exact: true })
    .click();
  await expect(page.locator(".exercise-feedback.passed")).toBeVisible();
  await page.reload();
  await expect(page.locator(".exercise-completed")).toContainText("Concluído");
  await page.goto("/exercicios");
  await expect(page.locator(".exercise-result-count")).toContainText(
    "1 concluído",
  );
  await page.getByRole("button", { name: "Por resolver", exact: true }).click();
  await expect(page.locator(".exercise-index-row")).toHaveCount(44);
});
test("exercício de código no celular: execução vinculada, solução colorida e progresso", async ({
  page,
}) => {
  await account(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/exercicios/python-tres-representacoes");
  await page
    .getByRole("button", { name: "Abrir bancada", exact: false })
    .click();
  await expect(page.locator(".practice-dialog:modal")).toBeVisible();
  await expect(page.locator(".practice-dialog:modal")).toHaveCSS(
    "opacity",
    "1",
  );
  await page.getByRole("button", { name: "Executar", exact: true }).click();
  await expect(page.getByText("SUCCEEDED", { exact: true })).toBeVisible({
    timeout: 25000,
  });
  await page
    .getByRole("button", { name: "Voltar para a aula", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Validar resposta", exact: true })
    .click();
  await expect(page.locator(".exercise-feedback")).toContainText(
    "Mais uma tentativa.",
  );
  await page
    .getByRole("button", { name: "Ver solução comentada", exact: true })
    .click();
  await expect(
    page.locator(".exercise-solution .tok-string").first(),
  ).toBeVisible();
  const exercise = definitions.find(
    (item) => item.id === "python-tres-representacoes",
  )!;
  if (exercise.kind !== "code") throw new Error("Expected a code exercise.");
  await page
    .getByRole("button", { name: "Abrir bancada", exact: false })
    .click();
  await page.getByRole("tab", { name: "Código", exact: true }).click();
  await page.locator(".cm-content:visible").click();
  await page.keyboard.press("Control+a");
  await page.keyboard.insertText(exercise.solutionCode);
  await page.getByRole("button", { name: "Executar", exact: true }).click();
  await expect(page.getByText("SUCCEEDED", { exact: true })).toBeVisible({
    timeout: 25000,
  });
  await page
    .getByRole("button", { name: "Voltar para a aula", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Validar resposta", exact: true })
    .click();
  await expect(page.locator(".exercise-feedback.passed")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth))
    .toBeLessThanOrEqual(390);
  await page.reload();
  await expect(page.locator(".exercise-completed")).toBeVisible();
});
test("aulas: código com sintaxe colorida e espaço entre abas e formulário da API", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  for (const width of [1440, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/aprender/fundamentos/07-windows-api/messagebox");
    await expect(
      page.locator(".lesson-code-block .tok-keyword").first(),
    ).toBeVisible();
    await expect(
      page.locator(".lesson-code-block .tok-string").first(),
    ).toBeVisible();
    if (width <= 900)
      await page
        .getByRole("button", { name: "Abrir bancada", exact: false })
        .click();
    const gap = await page.locator(".windows-api-bench").evaluate((element) => {
      const tabs = element
        .querySelector(".bench-tabs")!
        .getBoundingClientRect();
      const fields = element
        .querySelector(".bench-fields")!
        .getBoundingClientRect();
      return fields.top - tabs.bottom;
    });
    expect(gap).toBeGreaterThanOrEqual(24);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBeLessThanOrEqual(width);
  }
  expect(errors).toEqual([]);
});
