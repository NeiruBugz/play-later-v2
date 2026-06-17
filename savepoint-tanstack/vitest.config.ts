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
    // Coverage is configured at the ROOT test block (not inside a project) so a
    // single `vitest run --coverage` invocation merges the `unit` (jsdom, mocked
    // Prisma) and `integration` (node, real PostgreSQL on :6432) projects into ONE
    // v8 report. This is the only way to get a true number for `src/{entities,features}`:
    // DB-backed entity `*.server.ts` files are 0% under jsdom-unit (they're exercised
    // by integration tests against Postgres), and feature UI/workers are 0% under
    // node-integration (they're exercised by jsdom-unit tests). Running both together
    // is what makes the Slice 23 cutover gate ("≥85% statements on src/{entities,features}
    // excluding barrels") measurable.
    coverage: {
      provider: "v8",
      // Only real implementation modules under the two FSD layers the gate scopes.
      // Extension-scoped so non-source files co-located in the tree (CLAUDE.md,
      // README.md) are never fed to the v8 remapper.
      include: ["src/entities/**/*.{ts,tsx}", "src/features/**/*.{ts,tsx}"],
      exclude: [
        // Barrels — re-export surfaces, not implementation. Gate excludes them.
        "**/index.ts",
        // Test files.
        "**/*.test.{ts,tsx}",
        // Type-only modules (component prop/view-model types + entity domain types).
        "**/*.type.ts",
        "**/model/types.ts",
        // Generated files (e.g. the committed route tree, if it ever lands here).
        "**/*.gen.ts",
        // createServerFn wrappers (feature `api/` non-worker modules). These are
        // thin RPC bridges that only run under the TanStack Start runtime, so they
        // cannot be unit/integration-tested directly (foot-gun #8) — the real logic
        // lives in their `*.worker.ts` (kept below) and the entity `*.server.ts`
        // queries, both of which ARE integration-tested. Excluding the un-runnable
        // bridge layer keeps the gate measuring code we can actually cover.
        "**/features/*/api/!(*.worker).ts",
      ],
      // text-summary + json-summary give the machine-readable per-scope %; html for
      // local inspection.
      reporter: ["text-summary", "json-summary", "html"],
      reportsDirectory: "./coverage",
      // Enforced thresholds (Slice 23 cutover gate). `statements: 85` IS the gate —
      // the spec target of ≥85% statements on src/{entities,features} (barrels
      // excluded). Do NOT lower it. The other three are regression FLOORS: set a
      // couple points below the verified actuals (branches 88.46 / lines 84.68 /
      // functions 81.17) so they catch backsliding without flapping on minor edits.
      thresholds: {
        statements: 85,
        branches: 86,
        lines: 83,
        functions: 79,
      },
    },
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
          fakeTimers: {
            toFake: ["setTimeout", "clearTimeout"],
            shouldAdvanceTime: true,
            advanceTimeDelta: 20,
          },
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
