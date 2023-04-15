/** @type {import("prettier").Config} */
module.exports = {
  singleQuote: true,
  semi: false,
  plugins: [require.resolve("prettier-plugin-tailwindcss")],
};
