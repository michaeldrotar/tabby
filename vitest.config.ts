import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: [
      'packages/**/lib/**/*.spec.ts',
      'packages/**/src/**/*.spec.ts',
      'tests/**/*.spec.ts',
    ],
    environment: 'node',
    globals: false,
    coverage: {
      provider: 'v8',
    },
  },
});
