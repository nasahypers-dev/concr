import { createBaseConfig } from '../../eslint.base.mjs';

export default [
  ...createBaseConfig(import.meta.dirname),
  {
    files: ['src/**/*.spec.ts', 'test/**/*.ts'],
    rules: {
      // jest.fn() mocks and supertest chains trip these in tests only
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
    },
  },
];
