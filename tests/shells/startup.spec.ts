import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
const catalog = JSON.parse(
  await readFile("content/.generated/catalog.json", "utf8"),
);
const user = {
  id: "shell-test-user",
  name: "Pessoa de teste",
  email: "shell@example.test",
};
const progress = {
  lessons: [],
  completedLessons: 0,
  totalLessons: 63,
  percentage: 0,
  activeSeconds: 0,
  passedExercises: 0,
  completedLabs: 0,
  passedQuizzes: 0,
  streak: 0,
  lastLessonId: null,
  activities: [],
};
async function backend(
  page: import("@playwright/test").Page,
  authenticated: boolean,
) {
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    const json =
      path === "/api/me"
        ? authenticated
          ? user
          : { error: "Entre na sua conta." }
        : path === "/api/catalog"
          ? catalog
          : path === "/api/progress"
            ? progress
            : path === "/api/auth-capabilities"
              ? { passwordReset: false }
              : path === "/api/exercises"
                ? []
                : {};
    await route.fulfill({
      status: path === "/api/me" && !authenticated ? 401 : 200,
      contentType: "application/json",
      headers: {
        "access-control-allow-origin": new URL(page.url()).origin,
        "access-control-allow-credentials": "true",
      },
      body: JSON.stringify(json),
    });
  });
}
test("starts in login without exposing the landing page", async ({ page }) => {
  await backend(page, false);
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Bom ter você de volta." }),
  ).toBeVisible();
  await expect(page).toHaveURL(/#\/entrar$/);
  await expect(page.locator(".marketing-main,.marketing-nav")).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Voltar ao início" }),
  ).toHaveCount(0);
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
});
test("resumes an authenticated account in the dashboard and opens the editor", async ({
  page,
}, info) => {
  await backend(page, true);
  const failures: string[] = [];
  page.on("pageerror", (error) => failures.push(error.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /Olá, Pessoa/ }),
  ).toBeVisible();
  await page.goto("/#/playground/c");
  if (info.project.name === "mobile-shell") {
    await expect(page.locator(".cm-editor")).toBeVisible();
    await page.locator(".cm-content").click();
    await page.keyboard.type(" // teste");
    await expect(page.locator(".cm-content")).toContainText("teste");
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    ).toBe(true);
    await page.evaluate(() =>
      document.documentElement.style.setProperty(
        "--safe-area-inset-top",
        "24px",
      ),
    );
    expect(
      await page.evaluate(() => getComputedStyle(document.body).paddingTop),
    ).toBe("24px");
  } else {
    await expect(page.locator(".monaco-editor").first()).toBeVisible({
      timeout: 30000,
    });
  }
  expect(failures).toEqual([]);
});
test("an unavailable API offers reconnection without discarding the route", async ({
  page,
}) => {
  await page.route("**/api/me", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: '{"error":"temporarily unavailable"}',
    }),
  );
  await page.goto("/#/laboratorios");
  await expect(page.getByRole("button", { name: "Reconectar" })).toBeVisible();
  await expect(page).toHaveURL(/#\/laboratorios$/);
});
