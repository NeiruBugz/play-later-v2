import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";
import jestDom from "eslint-plugin-jest-dom";
import testingLibrary from "eslint-plugin-testing-library";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    rules: {
      // React Compiler informational warning for libraries whose APIs
      // (e.g. react-hook-form's watch, @tanstack/react-virtual) cannot be
      // auto-memoized. Not a correctness issue; silenced project-wide.
      "react-hooks/incompatible-library": "off",
    },
  },
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
        "widgets/**/*",
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
          type: "widget",
          pattern: "widgets/**/*",
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
      "boundaries/dependencies": [
        "warn",
        {
          default: "disallow",
          rules: [
            {
              from: [["app-route"]],
              allow: [["app-route"], ["handler"], ["use-case"], ["service"], ["server-action"], ["ui-component"], ["widget"], ["shared"]],
            },
            {
              from: [["server-action"]],
              allow: [["server-action"], ["use-case"], ["service"], ["shared"]],
            },
            {
              from: [["handler"]],
              allow: [["handler"], ["use-case"], ["service"], ["shared"]],
            },
            {
              from: [["use-case"]],
              allow: [["service"], ["shared"]],
            },
            {
              from: [["ui-component"]],
              allow: [["use-case"], ["server-action"], ["shared"], ["ui-component"], ["widget"]],
            },
            {
              from: [["widget"]],
              allow: [["ui-component"], ["server-action"], ["shared"]],
            },
            {
              from: [["service"]],
              allow: [["service"], ["repository"], ["shared"]],
            },
            {
              from: [["repository"]],
              allow: [["repository"], ["prisma"], ["shared"]],
            },
            {
              from: [["shared"]],
              allow: [["shared"]],
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
