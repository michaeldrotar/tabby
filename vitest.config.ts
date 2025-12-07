import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    setupFiles: ['./tests/setup.ts'],
    include: [
      'packages/**/lib/**/*.spec.{ts,tsx}',
      'packages/**/src/**/*.spec.{ts,tsx}',
      'tests/**/*.spec.{ts,tsx}',
      'pages/**/src/**/*.spec.{ts,tsx}',
    ],
    environment: 'node',
    globals: false,
    coverage: {
      provider: 'v8',
    },
  },
})
