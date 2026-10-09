import { fileURLToPath } from "node:url";
const workspace = fileURLToPath(new URL("../../", import.meta.url));
import { defineConfig, devices } from "@playwright/test";
export default defineConfig({
  testDir: ".",
  testMatch: "*.spec.ts",
  timeout: 45000,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    launchOptions: process.env.NUCLEO_BROWSER_EXECUTABLE
      ? { executablePath: process.env.NUCLEO_BROWSER_EXECUTABLE }
      : undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      cwd: workspace,
      command: "node scripts/build-native.mjs desktop --serve",
      url: "http://localhost:3070",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      cwd: workspace,
      command: "node scripts/build-native.mjs mobile --serve",
      url: "http://localhost:3071",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
  projects: [
    {
      name: "desktop-shell",
      use: { ...devices["Desktop Chrome"], baseURL: "http://localhost:3070" },
    },
    {
      name: "mobile-shell",
      use: {
        ...devices["iPhone 13"],
        defaultBrowserType: "chromium",
        baseURL: "http://localhost:3071",
      },
    },
  ],
});
