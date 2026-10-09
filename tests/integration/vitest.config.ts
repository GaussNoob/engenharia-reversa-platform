import { defineConfig } from "vitest/config";
import { existsSync } from "node:fs";
if (existsSync(".env")) process.loadEnvFile(".env");
export default defineConfig({
  test: {
    include: ["tests/integration/**/*.test.ts"],
    testTimeout: 45000,
    hookTimeout: 30000,
    fileParallelism: false,
  },
});
