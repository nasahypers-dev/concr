import prettier from 'eslint-config-prettier';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { defineConfig, globalIgnores } from 'eslint/config';
import { createBaseConfig } from '../../eslint.base.mjs';

export default defineConfig([
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts', 'coverage/**']),
  ...createBaseConfig(import.meta.dirname),
  ...nextVitals,
  ...nextTs,
  {
    // Re-assert type-aware linting after the Next config.
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'jest.setup.js'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  prettier,
]);
