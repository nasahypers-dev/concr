import prettier from 'eslint-config-prettier';
import expoConfig from 'eslint-config-expo/flat.js';
import globals from 'globals';
import { createBaseConfig } from '../../eslint.base.mjs';

export default [
  { ignores: ['.expo/**', 'expo-env.d.ts', 'android/**', 'ios/**', 'assets/**'] },
  ...createBaseConfig(import.meta.dirname),
  ...expoConfig,
  {
    settings: {
      // eslint-plugin-react's automatic version detection uses an API removed in ESLint 10;
      // stating the version skips it.
      react: { version: '19.2' },
      // The Expo config wires an eslint-import-resolver-typescript build that is incompatible
      // with the hoisted eslint-plugin-import; the plain node resolver is enough here.
      'import/resolver': {
        node: { extensions: ['.js', '.jsx', '.ts', '.tsx', '.d.ts', '.json'] },
      },
    },
    rules: {
      // Module resolution is TypeScript's job (tsc --noEmit); the bundled import resolver
      // does not understand the `@/*` alias and `exports` maps.
      'import/no-unresolved': 'off',
      'import/namespace': 'off',
      // `i18next` is designed to be used through its default export.
      'import/no-named-as-default-member': 'off',
    },
  },
  {
    // Re-assert type-aware linting after the Expo config (it registers its own parser options).
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
      // Expo Router: default exports are mandatory for route files.
      'import/no-default-export': 'off',
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'jest.setup.js'],
    languageOptions: { globals: { ...globals.jest } },
    rules: {
      '@typescript-eslint/unbound-method': 'off',
    },
  },
  prettier,
];
