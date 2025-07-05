import path from "path";
import { defineConfig } from "vitest/config";

// Integration test configuration with real database
export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./test/setup/global-integration.ts"], // Uses real database
    globals: true,
    isolate: true,
    pool: "forks", // Use forks for better database isolation
    testTimeout: 15000, // Longer timeout for database operations
    hookTimeout: 30000, // Long timeout for database setup/teardown
    include: [
      "**/*.{integration,e2e}.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    // Run integration tests sequentially to avoid database conflicts
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
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
          branches: 70, // Slightly lower for integration tests
          functions: 70,
          lines: 70,
          statements: 70,
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
