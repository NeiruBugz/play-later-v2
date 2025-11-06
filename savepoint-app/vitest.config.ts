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
        "**/domain/**",
        "env.mjs",
        "auth.ts",
        "**/**/types/**.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
        "e2e",
        "**/shared/components/ui/**",
        "**/shared/providers/**",
        "**/shared/components/browser-back-button.tsx",
        "**/shared/components/loading-screen.tsx",
        "**/shared/config/**",
        "**/shared/hooks/use-mobile.tsx",
        "**/shared/lib/app/logger.ts",
        "**/shared/lib/game/get-game-type-label.ts",
        "**/shared/lib/game/get-game-url.ts",
        "**/shared/lib/igdb/image-utils.ts",
        "**/shared/lib/platform/platform-mapper.ts",
        "**/shared/lib/platform/platform-to-color.ts",
        "**/shared/lib/ui/string.ts",
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
            "**/*.integration.test.{js,ts,jsx,tsx}",
            "**/shared/components/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
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
            "**/*.server-action.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
            "**/data-access-layer/services/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
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
          poolOptions: {
            forks: {
              singleFork: true,
            },
          },
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
