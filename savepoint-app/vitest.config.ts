import path from "path";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    setupFiles: ["./test/setup/global.ts"],
    globals: true,
    isolate: true,
    pool: "threads",
    testTimeout: 10000,
    hookTimeout: 10000,
    unstubEnvs: true,
    unstubGlobals: true,
    // Note: Coverage is configured in vitest.coverage.config.ts
    // Coverage doesn't work with inline projects in Vitest 4.x
    // Use: pnpm test:coverage (which uses vitest.coverage.config.ts)
    projects: [
      {
        extends: true,
        test: {
          name: "utilities",
          environment: "node",
          include: [
            "**/shared/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
          ],
          exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "**/.next/**",
            "**/coverage/**",
            "**/*.integration.test.{js,ts,jsx,tsx}",
            "**/shared/components/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
            "**/shared/hooks/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
          ],
        },
      },
      {
        plugins: [react()],
        extends: true,
        test: {
          name: "components",
          environment: "jsdom",
          setupFiles: ["./test/setup/client-setup.ts"],
          include: [
            "**/features/**/ui/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
            "**/features/**/hooks/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
            "**/shared/components/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
            "**/app/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
            "**/shared/hooks/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
          ],
          exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "**/.next/**",
            "**/coverage/**",
            "**/*.integration.test.{js,ts,jsx,tsx}",
          ],
        },
      },
      {
        extends: true,
        test: {
          name: "backend",
          environment: "node",
          include: [
            "**/features/**/server-actions/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
            "**/features/**/lib/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
            "**/features/**/use-cases/*.unit.test.{js,ts,jsx,tsx}",
            "**/*.server-action.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
            "**/data-access-layer/services/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
            "**/data-access-layer/domain/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
            "**/data-access-layer/repository/**/*.unit.test.{js,ts,jsx,tsx}",
            "**/data-access-layer/handlers/**/*.unit.test.{js,ts,jsx,tsx}",
            "**/app/api/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
          ],
          exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "**/.next/**",
            "**/coverage/**",
            "**/*.integration.test.{js,ts,jsx,tsx}",
          ],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          environment: "node",
          testTimeout: 15000,
          hookTimeout: 15000,
          setupFiles: ["./test/setup/integration.ts"],
          pool: "forks",
          maxWorkers: 1,
          isolate: false,
          include: ["**/*.integration.test.{js,ts,jsx,tsx}"],
          exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "**/.next/**",
            "**/coverage/**",
          ],
        },
      },
    ],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
