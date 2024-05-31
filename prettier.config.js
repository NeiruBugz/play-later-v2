/** @type {import('prettier').Config} */
module.exports = {
  endOfLine: "lf",
  importOrderParserPlugins: ["typescript", "jsx", "decorators-legacy"],
  plugins: ["prettier-plugin-tailwindcss"],
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  tailwindConfig: "./tailwind.config.js",
  trailingComma: "es5",
};
