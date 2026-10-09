import { test, expect } from "@playwright/test";
test("preserves the public landing page and compatible login routes", async ({
  page,
}) => {
  await page.route("**/api/me", (route) =>
    route.fulfill({
      status: 401,
      contentType: "application/json",
      body: '{"error":"Unauthenticated"}',
    }),
  );
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Entenda o software por dentro/ }),
  ).toBeVisible();
  await expect(page.locator(".landing-hero-scene")).toBeVisible();
  await page.goto("/login");
  await expect(page).toHaveURL(/\/entrar$/);
  await expect(
    page.getByRole("heading", { name: "Bom ter você de volta." }),
  ).toBeVisible();
});
test("guards private pages on the server", async ({ page }) => {
  for (const route of [
    "/dashboard",
    "/app/settings",
    "/progresso",
    "/execucoes",
  ]) {
    await page.goto(route);
    await expect(page).toHaveURL(/\/entrar$/);
  }
});
test("login reaches the server-rendered dashboard", async ({ page }) => {
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/sign-in/email") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "set-cookie": "nucleo_ui_test=1; Path=/; HttpOnly; SameSite=Lax",
        },
        body: "{}",
      });
    } else if (path === "/api/me") {
      const signed = (await page.context().cookies()).some(
        (cookie) => cookie.name === "nucleo_ui_test",
      );
      await route.fulfill({
        status: signed ? 200 : 401,
        contentType: "application/json",
        body: signed
          ? '{"id":"web-ui-test","name":"Pessoa de teste","email":"ui@example.test"}'
          : '{"error":"Unauthenticated"}',
      });
    } else await route.continue();
  });
  await page.goto("/entrar");
  await page.getByLabel("Email", { exact: true }).fill("ui@example.test");
  await page.getByLabel("Senha", { exact: true }).fill("Secure-ui-password!");
  await page.getByRole("button", { name: "Entrar na bancada" }).click();
  await expect(
    page.getByRole("heading", { name: /Olá, Pessoa/ }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard$/);
});
