import { test, expect } from "@playwright/test";

test("home: Three.js, ordem dos bytes, Assembly e inspeção real", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Entenda o software por dentro." }),
  ).toBeVisible();
  await expect(page.locator(".three-canvas")).toHaveAttribute(
    "data-renderer",
    "three",
    { timeout: 20000 },
  );
  await page.getByRole("tab", { name: "02 Memória" }).click();
  await expect(
    page.getByText("Cada valor tem um endereço.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator(".three-canvas")).toHaveAttribute(
    "data-view",
    "isolated",
  );
  await page.getByRole("button", { name: "Visão geral", exact: true }).click();
  await page.getByRole("button", { name: "Agrupar camadas" }).click();
  await expect(
    page.getByRole("button", { name: "Separar camadas" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Avançar instrução" }).click();
  await expect(page.locator(".register-preview").first()).toContainText(
    "0000000000000005",
  );
  await page.getByRole("button", { name: "Avançar instrução" }).click();
  await expect(page.locator(".register-preview").first()).toContainText(
    "0000000000000008",
  );
  await page.getByRole("button", { name: "Big-endian", exact: true }).click();
  await expect(page.locator(".byte-story-cells button").first()).toContainText(
    "12",
  );
  await page.getByRole("button", { name: "Inspecionar estes bytes" }).click();
  await page.getByRole("tab", { name: "Imports", exact: true }).click();
  await expect(page.getByText("MessageBoxW", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Strings", exact: true }).click();
  await page.getByLabel("Filtrar strings").fill("MessageBox");
  await expect(page.locator(".binary-strings button")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("Assembly: parada, retomada, histórico e preservação entre ambientes", async ({
  page,
}) => {
  await page.goto("/playground/assembly");
  await page.getByRole("tab", { name: "Disassembly", exact: true }).click();
  await page
    .getByRole("button", { name: "Ponto de parada na linha 3", exact: true })
    .click();
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator(".disassembly-row.current")).toContainText(
    "add rax",
  );
  await page.getByRole("tab", { name: "CPU", exact: true }).click();
  await expect(page.locator(".register-grid>div").first()).toContainText(
    "0000000000000005",
  );
  await page.getByRole("button", { name: "Continuar", exact: true }).click();
  await expect(page.locator(".register-grid>div").first()).toContainText(
    "0000000000000008",
  );
  await page.getByRole("tab", { name: "Histórico", exact: true }).click();
  await expect(page.locator(".execution-history>div")).toHaveCount(4);
  await page
    .getByRole("tab", { name: "Memória Variáveis", exact: false })
    .click();
  await page.getByRole("tab", { name: "Assembly CPU", exact: false }).click();
  await expect(page.locator(".execution-history>div:visible")).toHaveCount(4);
});

test("complementos: comparação signed/unsigned e IEEE 754", async ({
  page,
}) => {
  await page.goto("/explorar/fluxo-de-controle");
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Avançar instrução" }).click();
  await expect(page.locator(".flow-fork .taken")).toContainText("Não desvia");
  await page
    .getByRole("combobox", { name: "Interpretação", exact: true })
    .click();
  await page
    .getByRole("option", { name: "Sem sinal / JA", exact: true })
    .click();
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Avançar instrução" }).click();
  await expect(page.locator(".flow-fork .taken")).toContainText(
    "A é maior que B",
  );
  await page.goto("/explorar/ponto-flutuante");
  await expect(page.locator(".float-result")).toContainText(
    "0.10000000149011612",
  );
  await page.getByRole("button", { name: "−0", exact: true }).click();
  await expect(page.locator(".float-result")).toContainText("0x80000000");
  await page.getByRole("button", { name: "NaN", exact: true }).click();
  await expect(page.locator(".float-result")).toContainText("NAN");
  await page.getByRole("button", { name: "Subnormal", exact: true }).click();
  await expect(page.locator(".float-result")).toContainText(
    "1.401298464324817e-45",
  );
});

test("mobile: menu, editor preservado, painéis e tabelas sem overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/aprender/fundamentos/08-assembly/registradores");
  await page
    .getByRole("button", { name: "Abrir bancada", exact: false })
    .click();
  await page.locator(".cm-content:visible").waitFor();
  const editor = page.locator(".cm-content:visible");
  await editor.click();
  await page.keyboard.press("Control+a");
  await page.keyboard.insertText("mov eax, 42\n");
  await page.getByRole("button", { name: "Aula", exact: true }).click();
  await page
    .getByRole("button", { name: "Abrir bancada", exact: false })
    .click();
  await expect(page.locator(".cm-content:visible")).toContainText(
    "mov eax, 42",
  );
  await page.getByRole("tab", { name: "Terminal", exact: true }).click();
  await expect(page.getByLabel("Comando da bancada")).toBeVisible();
  await page.getByLabel("Comando da bancada").fill("help");
  await page.getByRole("button", { name: "Enviar", exact: true }).click();
  await expect(page.locator(".terminal-output")).toContainText(
    "Listar comandos",
  );
  await page
    .getByRole("button", { name: "Voltar para a aula", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Abrir navegação", exact: true })
    .click();
  await page.getByRole("link", { name: "Experimentos", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: /Novas formas/ }),
  ).toBeVisible();
  for (const path of [
    "/laboratorios",
    "/playground/pe",
    "/explorar/ponto-flutuante",
    "/explorar/fluxo-de-controle",
    "/playground/memory",
  ]) {
    await page.goto(path);
    await page.waitForTimeout(250);
    const size = await page.evaluate(() => ({
      scroll: document.documentElement.scrollWidth,
      width: innerWidth,
    }));
    expect(size.scroll, `${path}: overflow`).toBeLessThanOrEqual(size.width);
  }
});

test("conta: criar, concluir aula, rascunho, sair e continuar após login", async ({
  page,
}) => {
  const email = `e2e-${Date.now()}@example.invalid`,
    password = "Nucleo-E2E-2026-seguro";
  await page.goto("/criar-conta");
  await page.getByLabel("Como podemos chamar você?").fill("Pessoa E2E");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Criar minha conta" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.goto("/aprender/fundamentos/08-assembly/registradores");
  await page
    .getByRole("button", { name: "Concluir esta aula", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Aula concluída", exact: true }),
  ).toBeVisible();
  await page.goto("/playground/c");
  await page.locator(".monaco-editor .view-lines:visible").click();
  await page.keyboard.press("Control+a");
  await page.keyboard.insertText(
    '#include <stdio.h>\nint main(void) { printf("rascunho-2026\\n"); return 0; }\n',
  );
  await expect(
    page.getByText("Salvo na sua conta", { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Rascunho restaurado", { exact: true }),
  ).toBeVisible();
  await expect(
    page.locator(".monaco-editor .view-lines:visible"),
  ).toContainText("rascunho-2026");
  await page.goto("/laboratorios/python-inicial");
  await page.getByRole("button", { name: "Executar", exact: true }).click();
  await expect(page.getByText("SUCCEEDED", { exact: true })).toBeVisible({
    timeout: 25000,
  });
  await page
    .getByRole("button", { name: "Validar desafio", exact: true })
    .click();
  await expect(
    page.getByText("A execução conferida no servidor atende ao desafio.", {
      exact: true,
    }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Sair da conta", exact: true })
    .click();
  await page.goto("/entrar");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Senha", { exact: true }).fill(password);
  await page.getByRole("button", { name: "Entrar na bancada" }).click();
  await expect(page).toHaveURL(/dashboard/);
  await page.goto("/aprender/fundamentos/08-assembly/registradores");
  await expect(
    page.getByRole("button", { name: "Aula concluída", exact: true }),
  ).toBeVisible();
  await page.keyboard.press("Control+k");
  await page.getByRole("combobox", { name: "Termo da busca" }).fill("RAX");
  await expect(
    page.getByRole("dialog").getByRole("option").first(),
  ).toBeVisible();
  await page.keyboard.press("Escape");
});

test("reduced motion: conteúdo e fallback acessíveis sem animações", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Entenda/ })).toBeVisible();
  expect(
    await page
      .locator(".landing-hero-scene")
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("none");
  await page.getByRole("tab", { name: "01 CPU" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "02 Memória" })).toBeFocused();
});
