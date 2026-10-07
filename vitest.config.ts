import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'scripts/**/*.spec.mjs',
      'packages/**/lib/**/*.spec.{ts,tsx}',
      'packages/**/src/**/*.spec.{ts,tsx}',
      'pages/**/src/**/*.spec.{ts,tsx}',
    ],
    environment: 'node',
    globals: false,
    coverage: {
      provider: 'v8',
    },
  },
})
