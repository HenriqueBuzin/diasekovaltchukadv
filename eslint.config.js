import js from '@eslint/js';
import hooks from 'eslint-plugin-react-hooks';
import refresh from 'eslint-plugin-react-refresh';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: ['coverage/**', 'frontend/dist/**', 'node_modules/**', 'playwright-report/**', 'test-results/**']
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['frontend/src/**/*.{ts,tsx}'],
    ...hooks.configs.flat.recommended,
    ...refresh.configs.vite,
    languageOptions: {
      ecmaVersion: 'latest',
      globals: globals.browser,
      sourceType: 'module'
    },
    plugins: {
      ...hooks.configs.flat.recommended.plugins,
      ...refresh.configs.vite.plugins,
      'simple-import-sort': simpleImportSort
    },
    rules: {
      ...hooks.configs.flat.recommended.rules,
      ...refresh.configs.vite.rules,
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error'
    }
  },
  {
    files: ['frontend/tests/**/*.{ts,tsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaFeatures: { jsx: true } }
    }
  },
  {
    files: ['tests/e2e/**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } }
  },
  {
    files: ['*.config.{js,ts}', 'frontend/*.config.{js,ts}'],
    languageOptions: { globals: globals.node }
  }
];
