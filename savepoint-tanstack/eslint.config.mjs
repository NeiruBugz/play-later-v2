import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jestDom from "eslint-plugin-jest-dom";
import testingLibrary from "eslint-plugin-testing-library";
import boundaries from "eslint-plugin-boundaries";
import prettier from "eslint-config-prettier";

export default tseslint.config(
  {
    ignores: [
      "node_modules/**",
      "dist/**",
      "build/**",
      "coverage/**",
      ".tanstack/**",
      "src/routeTree.gen.ts",
      "eslint.config.mjs",
      "prettier.config.mjs",
      "vite.config.ts",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    plugins: {
      "testing-library": testingLibrary,
      "jest-dom": jestDom,
    },
    rules: {
      "testing-library/await-async-queries": "error",
      "testing-library/no-await-sync-queries": "error",
      "testing-library/no-debugging-utils": "warn",
      "testing-library/prefer-screen-queries": "error",
      "testing-library/no-container": "error",
      "testing-library/no-node-access": "error",
      "jest-dom/prefer-checked": "error",
      "jest-dom/prefer-enabled-disabled": "error",
      "jest-dom/prefer-required": "error",
      "jest-dom/prefer-to-have-attribute": "error",
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // FSD layer boundary enforcement — applies only to src/**
  {
    files: ["src/**/*.ts", "src/**/*.tsx"],
    plugins: {
      boundaries,
    },
    settings: {
      "boundaries/ignore": [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts",
        "**/*.spec.tsx",
      ],
      "boundaries/elements": [
        { type: "app", pattern: "src/app/**/*", mode: "file" },
        { type: "routes", pattern: "src/routes/**/*", mode: "file" },
        { type: "widgets", pattern: "src/widgets/**/*", mode: "file" },
        { type: "features", pattern: "src/features/**/*", mode: "file" },
        { type: "entities", pattern: "src/entities/**/*", mode: "file" },
        { type: "shared", pattern: "src/shared/**/*", mode: "file" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "disallow",
          rules: [
            {
              from: { type: "app" },
              allow: {
                to: { type: ["routes", "widgets", "features", "entities", "shared"] },
              },
            },
            {
              from: { type: "routes" },
              allow: {
                to: { type: ["widgets", "features", "entities", "shared"] },
              },
            },
            {
              from: { type: "widgets" },
              allow: {
                to: { type: ["features", "entities", "shared"] },
              },
            },
            {
              from: { type: "features" },
              allow: {
                to: { type: ["entities", "shared"] },
              },
            },
            {
              from: { type: "entities" },
              allow: {
                to: { type: ["shared"] },
              },
            },
            {
              from: { type: "shared" },
              allow: {
                to: { type: ["shared"] },
              },
            },
          ],
        },
      ],
      "boundaries/no-unknown": "off",
      "boundaries/no-unknown-files": "off",
    },
  },
  prettier,
);
