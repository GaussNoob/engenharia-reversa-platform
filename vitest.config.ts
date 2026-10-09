import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";
const source = (path: string) => fileURLToPath(new URL(path, import.meta.url));
export default defineConfig({
  resolve: {
    alias: {
      "@nucleo/core": source("./packages/core/src/index.ts"),
      "@nucleo/models": source("./packages/models/src/index.ts"),
      "@nucleo/content/server": source("./packages/content/src/server.ts"),
      "@nucleo/features": source("./packages/features/src"),
      "@nucleo/platform": source("./packages/platform/src"),
      "@nucleo/api-client": source("./packages/api-client/src"),
    },
  },
  test: {
    include: ["packages/*/src/**/*.test.ts", "apps/api/src/**/*.test.ts"],
    testTimeout: 10000,
  },
});
