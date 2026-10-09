import { defineConfig } from "@playwright/test";
import { fileURLToPath } from "node:url";
const cwd = fileURLToPath(new URL("../../", import.meta.url));
const port = Number(process.env.NUCLEO_WEB_UI_PORT ?? 3052);
export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: `http://localhost:${port}`,
    launchOptions: process.env.NUCLEO_BROWSER_EXECUTABLE
      ? { executablePath: process.env.NUCLEO_BROWSER_EXECUTABLE }
      : undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      cwd,
      command: "node tests/web-ui/api-fixture.mjs",
      url: "http://127.0.0.1:3172/api/catalog",
      reuseExistingServer: !process.env.CI,
    },
    {
      cwd,
      command: `node node_modules/next/dist/bin/next start apps/web --hostname 127.0.0.1 --port ${port}`,
      env: { API_INTERNAL_URL: "http://127.0.0.1:3172" },
      url: `http://localhost:${port}/entrar`,
      reuseExistingServer: !process.env.CI,
      timeout: 60000,
    },
  ],
});
