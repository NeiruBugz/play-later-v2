import path from "path";
import { defineConfig } from "vitest/config";

// https://vitejs.dev/config/
export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup/global.ts"],
    globals: true,
    coverage: {
      all: true,
      exclude: [
        ".next/",
        "./idea",
        "**/*.d.ts",
        "**/node_modules/**",
        "**/*.config.*",
        "test/**",
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
