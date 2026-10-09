import { chromium } from "@playwright/test";
import { writeFile, mkdir } from "node:fs/promises";
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
await mkdir(".runtime/qa", { recursive: true });
try {
  await page.goto("http://127.0.0.1:3050/aprender/fundamentos");
  await page.getByRole("heading", { name: /Fundamentos de/ }).waitFor();
  await page.waitForTimeout(500);
  await page.screenshot({ path: ".runtime/qa/course.png" });
  await page.goto("http://127.0.0.1:3050/criar-conta");
  await page.locator("input[name=name]").fill("Pessoa de Teste");
  await page
    .locator("input[name=email]")
    .fill(`qa-${Date.now()}@example.invalid`);
  await page.locator("input[name=password]").fill("Nucleo-Teste-2026-seguro");
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await page.waitForURL("**/dashboard", { timeout: 15000 });
  await page.getByRole("heading", { name: /Olá, Pessoa/ }).waitFor();
  await page.screenshot({ path: ".runtime/qa/dashboard.png" });
  const lesson = "/aprender/fundamentos/08-assembly/registradores";
  await page.goto("http://127.0.0.1:3050" + lesson);
  await page
    .getByRole("heading", {
      name: "Registradores e subregistradores",
      exact: true,
    })
    .waitFor();
  await page.waitForTimeout(700);
  await page.screenshot({ path: ".runtime/qa/lesson.png" });
  await page
    .getByRole("button", { name: "Concluir esta aula", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Aula concluída", exact: true })
    .waitFor();
  await page.reload();
  await page
    .getByRole("button", { name: "Aula concluída", exact: true })
    .waitFor();
  await page.goto("http://127.0.0.1:3050/laboratorios/python-inicial");
  await page.getByRole("button", { name: "Executar", exact: true }).click();
  await page
    .getByText("SUCCEEDED", { exact: true })
    .waitFor({ timeout: 30000 });
  await page
    .getByRole("button", { name: "Validar desafio", exact: true })
    .click();
  await page
    .getByText("A execução conferida no servidor atende ao desafio.", {
      exact: true,
    })
    .waitFor();
  await page.screenshot({ path: ".runtime/qa/python.png" });
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox", { name: "Termo da busca" }).fill("RAX");
  await page.getByRole("dialog").getByRole("option").first().waitFor();
  await page.keyboard.press("Escape");
  console.log(
    JSON.stringify({
      course: true,
      signup: true,
      dashboard: true,
      lessonCompletion: true,
      progressRestored: true,
      isolatedPython: true,
      labGrading: true,
      search: true,
      pageErrors: errors,
    }),
  );
} catch (error) {
  await page.screenshot({ path: ".runtime/qa/failure.png" });
  console.error(error.message);
  console.error((await page.locator("body").innerText()).slice(-3000));
  process.exitCode = 1;
} finally {
  await browser.close();
}
