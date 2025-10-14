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
    coverage: {
      all: true,
      exclude: [
        ".next/",
        "./idea",
        "**/*.d.ts",
        "**/node_modules/**",
        "**/*.config.*",
        "test/**",
        "app/**",
        "coverage/**",
        "domain/**",
        "env.mjs",
        "auth.ts",
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
            "**/features/**/ui/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
          ],
          exclude: [
            "**/node_modules/**",
            "**/dist/**",
            "**/.next/**",
            "**/coverage/**",
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
            "**/*.server-action.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
            "**/data-access-layer/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
          ],
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
