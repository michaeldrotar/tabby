import localRules from './eslint-rules/index.js'
import eslint from '@eslint/js'
import pluginQuery from '@tanstack/eslint-plugin-query'
import { defineConfig } from 'eslint/config'
import { flatConfigs as importXFlatConfig } from 'eslint-plugin-import-x'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended'
import reactPlugin from 'eslint-plugin-react'
import reactHooks from 'eslint-plugin-react-hooks'
import unusedImports from 'eslint-plugin-unused-imports'
import { browser, es2020, node } from 'globals'
import { configs as tsConfigs, parser as tsParser } from 'typescript-eslint'

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
    files: ['**/*.{ts,tsx}'],
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
    files: ['**/*.{ts,tsx}'],
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
      'unused-imports': unusedImports,
      local: localRules,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
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
      'import-x/order': [
        'error',
        {
          'newlines-between': 'never',
          alphabetize: { order: 'asc', caseInsensitive: true },
          groups: [
            'index',
            'sibling',
            'parent',
            'internal',
            'external',
            'builtin',
            'object',
            'type',
          ],
          pathGroups: [
            {
              pattern: '@*/**',
              group: 'internal',
              position: 'before',
            },
          ],
          pathGroupsExcludedImportTypes: ['type'],
        },
      ],
      'import-x/no-unresolved': 'off',
      'import-x/no-named-as-default': 'error',
      'import-x/no-named-as-default-member': 'error',
      'import-x/newline-after-import': 'error',
      'import-x/no-deprecated': 'error',
      'import-x/no-duplicates': [
        'error',
        { considerQueryString: true, 'prefer-inline': false },
      ],
      'import-x/consistent-type-specifier-style': 'error',
      'import-x/exports-last': 'off',
      'import-x/first': 'error',
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
