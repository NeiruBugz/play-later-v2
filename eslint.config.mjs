import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import boundaries from "eslint-plugin-boundaries";

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
        "prisma/**/*",
        "test/**/*",
      ],
      "boundaries/elements": [
        {
          type: "server-action",
          pattern: "features/*/server-actions/**/*",
          mode: "file",
        },
        { type: "service", pattern: "shared/services/**/*", mode: "file" },
        {
          type: "repository",
          pattern: "shared/lib/repository/**/*",
          mode: "file",
        },
        { type: "app-api", pattern: "app/api/**/*", mode: "file" },
        { type: "prisma", pattern: "shared/lib/db.ts", mode: "file" },
      ],
    },
    rules: {
      "boundaries/element-types": "off",
      // Reduce non-essential boundaries noise for now
      "boundaries/entry-point": "off",
      "boundaries/no-unknown-files": "off",
    },
  },
  // Enforce: server-actions and API routes cannot import repositories or db directly
  {
    files: [
      "features/*/server-actions/**/*",
      "app/api/**/*",
      "app/**/route.ts",
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
                "Use services instead of repositories in server-actions and API routes",
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
    ],
  },
];

export default eslintConfig;
