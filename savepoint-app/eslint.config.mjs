import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import boundaries from "eslint-plugin-boundaries";
import jestDom from "eslint-plugin-jest-dom";
import testingLibrary from "eslint-plugin-testing-library";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ["plugin:@next/next/core-web-vitals", "next/typescript"],
  }),
  // Architectural boundaries: focus on data flow only
  {
    plugins: {
      boundaries,
    },
    settings: {
      "import/resolver": {
        typescript: true,
      },
      "boundaries/ignore": [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts",
        "**/*.spec.tsx",
        "test/**/*",
      ],
      "boundaries/include": [
        "app/**/*",
        "features/**/*",
        "shared/**/*",
        "data-access-layer/**/*",
        "prisma/**/*",
        "test/**/*",
      ],
      "boundaries/elements": [
        {
          type: "prisma",
          pattern: "shared/lib/app/db.ts",
          mode: "file",
        },
        { type: "shared", pattern: "shared/**/*", mode: "file" },
        {
          type: "app-route",
          pattern: ["app/**/*", "!shared/**/*"],
          mode: "file",
        },
        {
          type: "server-action",
          pattern: "features/*/server-actions/**/*",
          mode: "file",
        },
        {
          type: "use-case",
          pattern: "features/*/use-cases/**/*",
          mode: "file",
        },
        {
          type: "ui-component",
          pattern: "features/*/ui/**/*",
          mode: "file",
        },
        {
          type: "handler",
          pattern: "data-access-layer/handlers/**/*",
          mode: "file",
        },
        {
          type: "service",
          pattern: "data-access-layer/services/**/*",
          mode: "file",
        },
        {
          type: "repository",
          pattern: "data-access-layer/repository/**/*",
          mode: "file",
        },
      ],
    },
    rules: {
      "boundaries/element-types": [
        "warn",
        {
          default: "disallow",
          rules: [
            // App routes can use everything except direct repository/prisma access
            // Can also import from other app routes (layouts, shared app components)
            {
              from: "app-route",
              allow: [
                "app-route",
                "handler",
                "use-case",
                "service",
                "server-action",
                "ui-component",
                "shared",
              ],
            },
            // Server actions can use use-cases and services
            // Can import from other server actions for shared utilities
            {
              from: "server-action",
              allow: ["server-action", "use-case", "service", "shared"],
            },
            // Handlers orchestrate use-cases and services
            // Handlers are the controller layer for API routes
            {
              from: "handler",
              allow: ["handler", "use-case", "service", "shared"],
            },
            // Use-cases orchestrate services only
            // May need to import types from app layer
            {
              from: "use-case",
              allow: ["service", "shared"],
            },
            // UI components can call server actions, use-cases (for Server Components), and use shared utilities
            {
              from: "ui-component",
              allow: ["use-case", "server-action", "shared", "ui-component"],
            },
            // Services can only use repositories and shared utilities
            // Allow service-to-service imports for shared types (e.g., ServiceError, base classes)
            // CRITICAL: Services should NOT instantiate other services
            {
              from: "service",
              allow: ["service", "repository", "shared"],
            },
            // Repositories can only use Prisma, shared utilities, and repository types
            // Allow repository-to-repository for shared types (e.g., RepositoryResult)
            {
              from: "repository",
              allow: ["repository", "prisma", "shared"],
            },
            // Shared can use other shared (utilities, components, types)
            {
              from: "shared",
              allow: ["shared"],
            },
          ],
        },
      ],
      // Reduce non-essential boundaries noise for now
      "boundaries/entry-point": "off",
      "boundaries/no-unknown-files": "off",
    },
  },
  // Enforce: server-actions, API routes, and handlers cannot import repositories or db directly
  {
    files: [
      "features/*/server-actions/**/*",
      "app/api/**/*",
      "app/**/route.ts",
      "data-access-layer/handlers/**/*",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/shared/lib/db",
              message:
                "Use services → repositories. Do not import Prisma client here",
            },
          ],
          patterns: [
            {
              group: [
                "@/data-access-layer/repository",
                "@/data-access-layer/repository/**",
              ],
              message:
                "Use services instead of repositories. Handlers should call services/use-cases.",
            },
          ],
        },
      ],
    },
  },
  // Allow db usage where necessary (auth config) and in tests
  {
    files: ["auth.ts", "**/*.test.ts", "**/*.test.tsx", "test/**/*"],
    rules: {
      "no-restricted-imports": "off",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Testing library rules for component and integration tests
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    plugins: {
      "testing-library": testingLibrary,
      "jest-dom": jestDom,
    },
    rules: {
      // Testing Library rules (error for critical issues)
      "testing-library/await-async-queries": "error",
      "testing-library/no-await-sync-queries": "error",
      "testing-library/no-debugging-utils": "warn",
      "testing-library/prefer-screen-queries": "error",

      // jest-dom rules (error for better assertions)
      "jest-dom/prefer-checked": "error",
      "jest-dom/prefer-enabled-disabled": "error",
      "jest-dom/prefer-required": "error",
      "jest-dom/prefer-to-have-attribute": "error",

      // Container and node access anti-patterns (upgraded to error after migration)
      "testing-library/no-container": "error",
      "testing-library/no-node-access": "error",
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "coverage/**",
      "next-env.d.ts",
      "test/setup/**",
      "commitlint.config.mjs",
      "prettier.config.mjs",
      "postcss.config.mjs",
      "next.config.mjs",
      "eslint.config.mjs",
      "tailwind.config.ts",
      "e2e/**",
    ],
  },
];

export default eslintConfig;
