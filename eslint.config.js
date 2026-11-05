import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist', 'coverage', 'node_modules'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
        __APP_VERSION__: 'readonly',
      },
    },
    plugins: {
      'react-refresh': reactRefresh,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: [
      'vite.config.ts',
      'eslint.config.js',
      'playwright.config.ts',
      'scripts/**/*.mjs',
      'e2e/**/*.ts',
    ],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },
);
