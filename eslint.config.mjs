import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.config({
    extends: ["plugin:@next/next/core-web-vitals", "next/typescript"],
  }),
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
