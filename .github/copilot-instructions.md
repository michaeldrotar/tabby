# Copilot Instructions

This file contains instructions for GitHub Copilot to follow when working on this project.

## Meta: Maintaining These Instructions

- **Keep Instructions Updated:** When you learn important information during a conversation that would be valuable for future work (e.g., architectural decisions, workflow patterns, common pitfalls), update these instructions to capture that knowledge.
- This includes updates to this file, \`RELEASE.md\`, or other documentation files as appropriate.

## Critical Workflow & Definition of Done

- **Plan First:** When asked to perform a multi-step task, use the \`manage_todo_list\` tool to plan your work.
- **Update Release Notes:** If the task involves a user-facing change or a bug fix for a previously released feature, you **MUST** include a todo item to update the relevant release note file in \`product/releases/\`.
  - **Version Source of Truth:** Always trust the current version in \`package.json\` when finding the release note file. The version is always updated first before adding release notes.
  - **One File Per Version:** Do not create multiple release note files for the same version. Append your notes to the existing \`v<version>-\*.md\` file for the current version.
  - **Bug Fixes:** Only document fixes for bugs that existed in previous releases. Do not document fixes for issues introduced and resolved during current development.
  - **File Naming:** The slug in the filename (e.g., \`v1.2.0-tab-manager-settings.md\`) is set during the release process, not during development. The initial template uses a generic slug that gets renamed when finalizing the release.
  - **Writing Guidelines:** See the "Release Notes" section in \`RELEASE.md\` for how to write effective, user-focused release notes.
  - Do not mark the task as complete until this is done.
- **Documentation:**
  - Permission or privacy changes should update both \`README.md\` (permissions table) and \`PRIVACY.md\`.
  - Major feature additions should update \`README.md\`.
- **Release Process:** When asked about releases, version bumps, or preparing for release, refer to \`RELEASE.md\` for the complete release process.

## Command Execution Guidelines

**DO NOT run these commands automatically:**

- `pnpm dev` - Never run this
- `pnpm build` - Only run when explicitly asked
- `pnpm test` or `pnpm test:watch` - Only run when explicitly asked or when working specifically on test changes

**You MAY run these commands when appropriate:**

- `pnpm type-check` - Use to verify TypeScript changes
- `pnpm lint:fix` - Use to automatically fix linting issues
- `pnpm format` - Use to format code

**Rationale:** Build and dev server commands are resource-intensive and time-consuming. The user will run them when ready. Focus on making code changes and using lightweight verification commands.

## Project Overview

**Tabby** is a Chrome Extension that provides keyboard-centric tab and bookmark management. It's built as a monorepo using **pnpm workspaces** and **Turborepo** with the following stack:

- **React 19** with functional components and hooks
- **TypeScript 5.x** targeting ES2022
- **Vite** for bundling with custom plugins for Chrome Extension builds
- **Tailwind CSS** with custom theming and dark mode
- **Vitest** for testing with jsdom environment

### Architecture Overview

The project follows a **modular Chrome Extension** architecture with distinct layers:

1. **`chrome-extension/`** - Background service worker, manifest generation
2. **`pages/`** - Individual UI entry points (omnibar-overlay, tab-manager, etc.)
3. **`packages/`** - Shared internal libraries with `@extension/*` namespace:
   - `@extension/ui` - Shared React components (Omnibar, TabList, etc.)
   - `@extension/chrome` - React hooks/utilities wrapping Chrome APIs with TanStack Query + Zustand
   - `@extension/storage` - Chrome storage abstractions (preferenceStorage)
   - `@extension/shared` - Common types, HOCs, and utilities
   - `@extension/i18n` - Internationalization utilities
   - `@extension/vite-config` - Shared Vite configuration (withPageConfig)
   - `@extension/tailwindcss-config` - Base Tailwind presets (extended via `withUI()`)
   - `@extension/env` - Environment variables and build flags

**Key architectural patterns:**

- Each page in `pages/` is a standalone Vite app with its own entry point and output directory
- Pages import from `@extension/*` packages using workspace protocol (`workspace:*`)
- Extension uses on-demand injection via `activeTab` permission, not persistent content scripts
- Background service worker handles keyboard commands and coordinates page injection

### Development Commands

```bash
pnpm dev              # Start dev server with HMR (watches all packages)
pnpm build            # Production build (outputs to dist/)
pnpm zip              # Build + create distributable zip file
pnpm test             # Run all Vitest tests
pnpm test:watch       # Run tests in watch mode
pnpm lint             # Run ESLint
pnpm lint:fix         # Auto-fix linting issues
pnpm type-check       # Type-check entire monorepo
pnpm clean            # Clean all build artifacts and node_modules
```

**Turborepo tasks:**

- `ready` - Build packages that other packages depend on (runs before dev/build)
- `dev` - Watch mode for development
- `build` - Production builds
- All tasks configured in `turbo.json` with dependency graphs

## Coding Style

- Use functional components for React.
- Use TypeScript for all new files.
- Use Tailwind CSS for styling.
- Prefer `const` over `let`.
- **Documentation:**
  - Doc comments (JSDoc) are encouraged for components and utilities to explain their purpose and usage.
  - Avoid inline comments within function bodies. Code should be self-documenting with clear variable and function names.
  - If logic is complex enough to warrant a comment, consider refactoring into well-named functions or variables that explain the intent.

## Architecture & Best Practices

- **Feature-Based Organization:** Group components, hooks, and utils by feature (e.g., `omnibar/`) rather than by type (e.g., `components/`, `hooks/`, or `types/`).
- **General Utilities:** General utilities that don't belong to a specific feature should be placed in a `utils/` folder. Each utility should be in its own file (e.g., `utils/formatTimeAgo.ts`).
- **Single File Exports:** Prefer single file exports for everything, including for types and utils. Components with a props type can export both the component function and prop type. Avoid creating "bag" files like `utils.ts` or `types.ts` that contain multiple unrelated exports.
  - Types should also follow this rule. For example, `DataAttributes` should be in `DataAttributes.ts`, not `types.ts`.
  - **ESLint Enforcement:** The custom `prefer-inline-export` rule automatically transforms standalone exports into inline exports (e.g., `export const foo = ...` instead of `const foo = ...; export { foo }`).
- **Co-location:** Tightly coupled components (e.g., `TabList`, `TabListItem`) should be defined in the same file to improve maintainability and discoverability.
- **Naming Convention:** Name feature-specific types and utils to include the feature name (e.g., `OmnibarSearchItem`, `getOmnibarActionLabel`).
- **Minimal Props:** Custom components should have minimal properties. Avoid extending full HTML attributes (like `React.ButtonHTMLAttributes`) unless absolutely necessary.
- **DRY Principle:** Always check for existing components before creating new ones.
- Shared components (like `Favicon`, `Omnibar`) should live in `packages/ui`.
- If you find duplicated code, refactor it into a shared location.
- Remove unused code, imports, and files when refactoring or deleting features.

### Working with Workspace Packages

When importing from internal packages:

```typescript
import { Omnibar } from '@extension/ui'
import { usePlatformInfo } from '@extension/chrome'
import { preferenceStorage } from '@extension/storage'
import { useThemeApplicator } from '@extension/shared'
```

**Package structure conventions:**

- Each package has `ready` script for build/type-gen (runs automatically)
- Main entry points use `.mts` extension for ES modules
- Package versions are `0.0.0` (only root package.json has real version)
- Use `workspace:*` for internal dependencies in package.json

### Vite Configuration Pattern

Pages use `withPageConfig` from `@extension/vite-config`:

```typescript
import { withPageConfig } from '@extension/vite-config'

export default withPageConfig({
  build: {
    outDir: resolve(__dirname, '..', '..', 'dist', 'omnibar-overlay'),
  },
})
```

### Tailwind Configuration Pattern

Pages extend UI package styles via `withUI`:

```typescript
import { withUI } from '@extension/ui'

export default withUI({
  content: ['./src/**/*.{ts,tsx}'],
})
```

This automatically includes `packages/ui/lib/**/*.{ts,tsx}` and applies the base preset with custom dark mode handling.

### Chrome Extension Specifics

- **Manifest:** Auto-generated from `chrome-extension/manifest.ts` (version synced from root package.json)
- **Background Worker:** Lives in `chrome-extension/src/background/index.ts`, handles commands and tab management
- **Content Injection:** Pages like omnibar-overlay are injected into iframes via `chrome.scripting.executeScript`
- **Permissions:** Uses `activeTab` (temporary access only when invoked), not persistent content scripts
- **Storage:** Use `@extension/storage` abstractions, not raw chrome.storage APIs

## Testing

- Use Vitest for testing with `// @vitest-environment jsdom` for React component tests.
- Tests are not needed for relatively simple changes like new features or modifications.
- Bug fixes must include tests to prevent regressions.
- Dummy UI components should have tests for their functionality, if any (e.g. conditional rendering, event handling).
- **Test Functionality, Not Implementation:** Tests should verify behavior and user-visible state (e.g., `aria-current`, `data-active`) rather than implementation details like CSS classes.
- Example test structure (see `packages/ui/lib/TabItem.spec.tsx`):

  ```typescript
  import { render, screen, fireEvent } from '@testing-library/react'
  import { describe, it, expect, vi } from 'vitest'

  describe('ComponentName', () => {
    it('should do something', () => {
      // Arrange, Act, Assert
    })
  })
  ```

## Privacy & Security Principles

- **Local-first:** All processing happens on device, no external servers
- **Minimal permissions:** Use `activeTab` over `<all_urls>` to avoid persistent access
- **Sandboxed UI:** Extension UI injected in isolated iframes to protect from page scripts
