/**
 * Coverage-specific Vitest configuration
 *
 * This config is used for running tests with coverage collection.
 * It doesn't use inline projects because Vitest 4.x has a known issue
 * where coverage doesn't work correctly with inline projects.
 *
 * Usage: pnpm test:coverage
 *
 * Note: This runs node-environment tests only. Component/UI tests
 * (which require jsdom) are excluded from coverage runs to avoid
 * environment conflicts. Use the main vitest.config.ts for running
 * all tests including component tests.
 */
import path from "path";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./test/setup/global.ts"],
    testTimeout: 10000,
    hookTimeout: 10000,
    unstubEnvs: true,
    unstubGlobals: true,
    include: [
      // Utilities
      "shared/**/*.unit.test.ts",
      "shared/**/*.test.ts",
      // Features (backend only - excludes UI)
      "features/**/*.unit.test.ts",
      "features/**/*.server-action.test.ts",
      // Data access layer
      "data-access-layer/**/*.unit.test.ts",
      "data-access-layer/**/*.test.ts",
      // API routes
      "app/**/*.test.ts",
    ],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.next/**",
      "**/coverage/**",
      // Exclude integration tests (they need real DB)
      "**/*.integration.test.*",
      // Exclude UI/component tests (they need jsdom environment)
      "**/ui/**",
      "**/hooks/**",
      "**/components/**",
    ],
    coverage: {
      provider: "v8",
      include: [
        "shared/**/*.ts",
        "features/**/*.ts",
        "data-access-layer/**/*.ts",
      ],
      exclude: [
        "**/*.test.ts",
        "**/*.spec.ts",
      ],
      reporter: ["text", "json", "html"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
