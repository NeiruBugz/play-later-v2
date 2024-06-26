/** @type {import('prettier').Config} */
module.exports = {
  endOfLine: "lf",
  importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
  plugins: [
    "@ianvs/prettier-plugin-sort-imports",
    "prettier-plugin-tailwindcss",
  ],
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  tailwindConfig: "./tailwind.config.ts",
  trailingComma: "es5",
};
