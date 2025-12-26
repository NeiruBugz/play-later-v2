import type { KnipConfig } from "knip";

const config: KnipConfig = {
  entry: [
    // Next.js App Router
    "app/**/page.tsx",
    "app/**/layout.tsx",
    "app/**/route.ts",
    "app/**/loading.tsx",
    "app/**/error.tsx",
    "app/**/not-found.tsx",
    "app/global-error.tsx",
    "middleware.ts",
    "auth.ts",

    // Config files
    "next.config.mjs",
    "postcss.config.mjs",
    "env.mjs",
    "vitest.config.ts",
    "vitest.coverage.config.ts",
    "playwright.config.ts",
    "prisma.config.ts",
    "eslint.config.mjs",
    "prettier.config.mjs",
  ],

  project: [
    "app/**/*.{ts,tsx}",
    "features/**/*.{ts,tsx}",
    "data-access-layer/**/*.ts",
    "shared/**/*.{ts,tsx}",
    "*.{ts,mjs}",
  ],

  ignore: [
    "test/**",
    "e2e/**",
    "stories/**",
    "coverage/**",
    "playwright-report/**",
    "test-results/**",
    ".next/**",
  ],

  ignoreDependencies: [
    // ESLint plugins - loaded dynamically via eslint.config.mjs
    "@eslint/compat",
    "@eslint/js",
    "@next/eslint-plugin-next",
    "@tanstack/eslint-plugin-query",
    "@typescript-eslint/eslint-plugin",
    "@typescript-eslint/parser",
    "eslint-config-next",
    "eslint-config-prettier",
    "eslint-import-resolver-typescript",
    "eslint-plugin-import",
    "eslint-plugin-jsx-a11y",
    "eslint-plugin-prettier",
    "eslint-plugin-react",
    "eslint-plugin-react-hooks",
    "eslint-plugin-tailwindcss",

    // Tailwind - used via @tailwindcss/postcss
    "tailwindcss",
    "tw-animate-css",

    // Commitlint - extends config-conventional
    "@commitlint/config-conventional",

    // CLI tools used via pnpm scripts
    "pino-pretty",

    // Test utilities - used in test files (which are ignored)
    "@faker-js/faker",
  ],

  ignoreExportsUsedInFile: true,

  ignoreIssues: {
    // Repository layer - public API for services
    "data-access-layer/repository/**/*.ts": ["exports"],

    // IGDB service internals - query builders and schemas
    "data-access-layer/services/igdb/queries.ts": ["exports"],
    "data-access-layer/services/igdb/schemas/*.ts": ["exports"],

    // Service layer - base classes and utilities
    "data-access-layer/services/index.ts": ["exports"],
    "data-access-layer/services/types.ts": ["exports", "types", "enumMembers"],
    "data-access-layer/services/profile/mappers.ts": ["exports"],

    // Feature barrel files - public API exports
    "features/*/ui/index.ts": ["exports"],
    "features/*/ui/*.tsx": ["exports", "types"],
    "features/*/server-actions/index.ts": ["exports"],
    "features/*/server-actions/*.ts": ["exports"],
    "features/*/use-cases/index.ts": ["exports"],
    "features/onboarding/index.ts": ["exports"],
    "features/setup-profile/server-actions/index.ts": ["exports"],
    "features/*/schemas.ts": ["exports", "types"],

    // Shared library barrel files - re-exports
    "shared/lib/index.ts": ["exports"],
    "shared/lib/*/index.ts": ["exports"],
    "shared/lib/*/*.ts": ["exports", "types"],
    "shared/lib/*.ts": ["exports"],
    "shared/config/*.ts": ["exports"],
    "shared/constants/*.ts": ["exports", "enumMembers"],

    // Shared component barrel files - public API
    "shared/components/*/index.ts": ["exports"],
    "shared/components/*/*.tsx": ["exports"],
    "shared/components/*/*.ts": ["exports"],

    // shadcn/ui components - export many sub-components
    "shared/components/ui/*.tsx": ["exports"],

    // Handler types - public API
    "data-access-layer/handlers/types.ts": ["exports", "types"],

    // Service/Repository types - public API for consumers
    "data-access-layer/repository/types.ts": [
      "exports",
      "types",
      "enumMembers",
    ],
    "data-access-layer/repository/*/types.ts": ["exports", "types"],
    "data-access-layer/services/*/types.ts": ["exports", "types"],

    // Shared types - public API
    "shared/types/*.ts": ["exports", "types", "enumMembers"],
  },

  next: {
    entry: [
      "app/**/page.tsx",
      "app/**/layout.tsx",
      "app/**/route.ts",
      "app/**/loading.tsx",
      "app/**/error.tsx",
      "app/**/not-found.tsx",
      "middleware.ts",
    ],
  },

  vitest: {
    entry: ["vitest.config.ts", "vitest.coverage.config.ts"],
  },

  playwright: {
    entry: ["playwright.config.ts", "e2e/**/*.ts"],
  },
};

export default config;
