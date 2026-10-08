// Root config only covers files outside the workspaces (scripts, configs).
import { createBaseConfig } from './eslint.base.mjs';

export default [
  { ignores: ['apps/**', 'packages/**', 'infra/**', 'docs/**'] },
  ...createBaseConfig(import.meta.dirname),
];
