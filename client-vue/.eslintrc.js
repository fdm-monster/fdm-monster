const isProduction = process.env.NODE_ENV === "production";

module.exports = {
  root: true,
  env: {
    node: true,
  },
  extends: [
    "plugin:vue/essential",
    "eslint:recommended",
    "@vue/typescript/recommended",
    "@vue/prettier", // Quite finicky
    "@vue/eslint-config-typescript",
  ],
  parserOptions: {
    ecmaVersion: 2020,
  },
  rules: {
    "no-console": isProduction ? "warn" : "off",
    "no-debugger": isProduction ? "warn" : "off",
    "no-unreachable": isProduction ? "warn" : "off",
    "@typescript-eslint/no-explicit-any": isProduction ? "warn" : "off",
    "@typescript-eslint/explicit-module-boundary-types": isProduction ? "warn" : "off",
    "@typescript-eslint/no-empty-function": isProduction ? "warn" : "off",
    "@typescript-eslint/no-inferrable-types": "off",
    "vue/valid-v-slot": [
      "error",
      {
        allowModifiers: true,
      },
    ],
    "prettier/prettier": ["error", { endOfLine: "auto" }],
  },
  overrides: [
    {
      files: ["**/__tests__/*.{j,t}s?(x)", "**/tests/unit/**/*.spec.{j,t}s?(x)"],
      env: {
        jest: true,
      },
    },
  ],
};
