import eslint from '@eslint/js'
import pluginQuery from '@tanstack/eslint-plugin-query'
import { defineConfig } from 'eslint/config'
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss'
import { flatConfigs as importXFlatConfig } from 'eslint-plugin-import-x'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import simpleImportSort from 'eslint-plugin-simple-import-sort'
import unusedImports from 'eslint-plugin-unused-imports'
import { browser, es2020, node } from 'globals'
import { configs as tsConfigs, parser as tsParser } from 'typescript-eslint'
import localRules from './eslint-rules/index.js'

export default defineConfig([
  // Shared configs
  eslint.configs.recommended,
  ...pluginQuery.configs['flat/recommended'],
  ...tsConfigs.recommended,
  reactHooks.configs.flat.recommended,
  jsxA11y.flatConfigs.recommended,
  importXFlatConfig.recommended,
  importXFlatConfig.typescript,
  eslintPluginPrettierRecommended,
  // ...fixupConfigRules(
  //   new FlatCompat().extends(
  //     // 'plugin:@tanstack/eslint-plugin-query/recommended',
  //     'plugin:react-hooks/recommended',
  //   ) as FixupConfigArray,
  // ),
  {
    files: ['**/*.{ts,tsx,mts}'],
    ...reactPlugin.configs.flat.recommended,
    ...reactPlugin.configs.flat['jsx-runtime'],
  },
  // Custom config
  {
    ignores: [
      '.*/**',
      '**/build/**',
      '**/dist/**',
      '**/dist-zip/**',
      '**/node_modules/**',
      'chrome-extension/manifest.js',
      'eslint-rules/**',
      'scripts/**',
      // Generated i18n file - skip linting
      'packages/i18n/lib/i18n.ts',
    ],
  },
  {
    files: ['**/*.{ts,tsx,mts}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
        projectService: true,
      },
      globals: {
        ...browser,
        ...es2020,
        ...node,
        chrome: 'readonly',
      },
    },
    plugins: {
      'better-tailwindcss': eslintPluginBetterTailwindcss,
      'unused-imports': unusedImports,
      'simple-import-sort': simpleImportSort,
      local: localRules,
    },
    settings: {
      'better-tailwindcss': {
        tailwindConfig: 'packages/tailwindcss-config/tailwind.config.ts',
      },
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...eslintPluginBetterTailwindcss.configs['recommended-warn']?.rules,
      ...eslintPluginBetterTailwindcss.configs['recommended-error']?.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'unused-imports/no-unused-imports': 'error',
      'unused-imports/no-unused-vars': [
        'warn',
        {
          vars: 'all',
          varsIgnorePattern: '^_',
          args: 'after-used',
          argsIgnorePattern: '^_',
        },
      ],
      'prefer-const': 'error',
      'no-var': 'error',
      'func-style': 'off', // Replaced by local/func-style-fix which has auto-fix
      'local/func-style-fix': 'error',
      'local/prefer-inline-export': 'error',
      'no-restricted-imports': [
        'error',
        {
          name: 'type-fest',
          message:
            'Please import from `@extension/shared` instead of `type-fest`.',
        },
      ],
      'arrow-body-style': ['off'],
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/consistent-type-exports': 'error',
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            [
              // Side effect imports.
              '^\\u0000',
              // Node.js builtins prefixed with `node:`.
              '^node:',
              // Packages.
              // Things that start with a letter (or digit or underscore), or `@` followed by a letter.
              '^@?\\w',
              // Absolute imports and other imports such as Vue-style `@/foo`.
              // Anything not matched in another group.
              '^(?!.*\\u0000$)',
              // Relative imports.
              // Anything that starts with a dot.
              '^\\.',
              // Type imports (ex. import type { ... })
              '^.*\\u0000$',
            ],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
      'import-x/order': 'off',
      'import-x/no-unresolved': 'off',
      'import-x/no-named-as-default': 'error',
      'import-x/no-named-as-default-member': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-deprecated': 'error',
      'import-x/no-duplicates': [
        'error',
        { considerQueryString: true, 'prefer-inline': false },
      ],
      'import-x/consistent-type-specifier-style': ['error', 'prefer-top-level'],
      'import-x/exports-last': 'off',
      'import-x/first': 'error',
      'better-tailwindcss/no-unregistered-classes': 'off',
    },
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  // Overrides Rules
  {
    files: ['**/packages/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  // Node.js scripts
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...node,
      },
    },
  },
])
