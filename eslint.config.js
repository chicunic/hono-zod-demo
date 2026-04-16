import { defineConfig } from 'eslint/config';
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default defineConfig({
  files: ['src/**/*.ts'],
  extends: [eslint.configs.recommended, ...tseslint.configs.strictTypeChecked, eslintConfigPrettier],
  languageOptions: {
    parserOptions: {
      projectService: true,
      tsconfigRootDir: import.meta.dirname,
    },
  },
  rules: {
    'sort-imports': ['error', { ignoreDeclarationSort: true }],
  },
});
