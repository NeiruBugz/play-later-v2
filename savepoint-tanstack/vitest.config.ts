import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.dirname(__filename);

const sharedAlias = {
  "@": path.resolve(rootDir, "./src"),
  "#": path.resolve(rootDir, "./src"),
  "@env": path.resolve(rootDir, "./env.ts"),
};

export default defineConfig({
  resolve: {
    alias: sharedAlias,
  },
  test: {
    globals: true,
    projects: [
      {
        resolve: {
          alias: sharedAlias,
        },
        test: {
          name: "unit",
          environment: "jsdom",
          include: [
            "src/**/*.unit.test.{ts,tsx}",
            "src/**/*.test.{ts,tsx}",
            "test/canary/**/*.canary.test.{ts,tsx}",
            "test/eslint/**/*.test.{ts,tsx}",
          ],
          exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "**/*.integration.test.{ts,tsx}",
          ],
          setupFiles: ["./test/setup/unit.ts"],
          pool: "threads",
          globals: true,
        },
      },
      {
        resolve: {
          alias: sharedAlias,
        },
        test: {
          name: "integration",
          environment: "node",
          include: ["test/integration/**/*.test.{ts,tsx}"],
          exclude: ["**/node_modules/**", "**/dist/**"],
          setupFiles: ["./test/setup/integration.ts"],
          pool: "forks",
          maxWorkers: 1,
          testTimeout: 15000,
          hookTimeout: 15000,
          globals: true,
        },
      },
    ],
  },
});
