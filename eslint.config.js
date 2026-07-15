import js from '@eslint/js';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';

export default [
  {
    ignores: ['coverage/**', 'node_modules/**', 'playwright-report/**', 'test-results/**']
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    plugins: {
      'simple-import-sort': simpleImportSort
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error'
    }
  },
  {
    files: ['src/static/js/**/*.js'],
    languageOptions: {
      globals: globals.browser
    }
  },
  {
    files: ['tests/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node
      }
    }
  },
  {
    files: ['*.config.js'],
    languageOptions: {
      globals: globals.node
    }
  }
];
