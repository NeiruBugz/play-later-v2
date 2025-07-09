import path from "path";
import { defineConfig } from "vitest/config";

// Unit test configuration with mocked Prisma
export default defineConfig({
  test: {
    environment: "jsdom",
    environmentMatchGlobs: [["**/*.server-action.test.ts", "node"]],
    setupFiles: ["./test/setup/global.ts"], // Uses mocked Prisma
    globals: true,
    isolate: true,
    pool: "threads",
    testTimeout: 5000, // Faster timeout for unit tests
    hookTimeout: 5000,
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/coverage/**",
      "**/*.integration.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "**/*.e2e.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    coverage: {
      all: true,
      exclude: [
        ".next/",
        "./idea",
        "**/*.d.ts",
        "**/node_modules/**",
        "**/*.config.*",
        "test/**",
        "prisma/migrations/**",
      ],
      reporter: ["text", "json", "html"],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
