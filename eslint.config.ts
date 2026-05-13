import { defineConfig } from "eslint/config";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";
import vitest from "@vitest/eslint-plugin";

export default defineConfig([
  {
    files: ["src/**/*.ts", "tests/**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.strictTypeChecked,
      ...tseslint.configs.stylisticTypeChecked,
      eslintConfigPrettier,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "sort-imports": ["error", { ignoreDeclarationSort: true }],
      "object-shorthand": "error",
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true, allowBoolean: true }],
    },
  },
  {
    files: ["tests/**/*.ts"],
    extends: [vitest.configs.recommended, eslintConfigPrettier],
  },
]);
