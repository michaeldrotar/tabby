# Feature: Theming with shadcn and Tailwind

**Date:** December 6, 2025  
**Model:** Claude Sonnet 4.5  
**Status:** Planned

## Checklist

### Phase 1: Discovery & Tokenization

- [ ] Scan all components in packages/ui for repeated Tailwind usage
- [ ] Produce theme-tokens.json with canonical tokens
- [ ] Add tooling script to convert JSON to CSS variables

### Phase 2: Theming Infrastructure

- [ ] Introduce packages/ui/lib/themes with default/light/dark.json
- [ ] Implement convert-theme-to-css-vars.ts and setup build step
- [ ] Update packages/ui/tailwind.config.ts to reference CSS variables
- [ ] Add ThemeProvider component

### Phase 3: Integrate with shadcn Components

- [ ] Identify shadcn components that hard-code colors
- [ ] Replace concrete class names with token-aware utilities
- [ ] Add useThemeTokens() hook

### Phase 4: Custom/Third-party Theme Injection

- [ ] Implement setThemeVars() API in packages/ui/lib/theming
- [ ] Namespace all CSS variables with --tabby- prefix
- [ ] Create doc page showing how to create a user theme

## Introduction

This proposal describes a practical, incremental plan to provide first-class multi-theme support for shadcn components built on Tailwind, while also providing a clear transition path to an alternative styling solution (Stitches) if needed. The plan focuses on:

- Creating an interoperable theming token system (CSS variables) that works with Tailwind utilities and shadcn components.
- Making it simple to add dozens of themes and accept user-provided themes without CSS class explosion or conflicts.
- Providing a migration path from Tailwind -> Stitches (or other token-based library) including tooling, docs, and tests.

## 1. Requirements & Constraints

- **REQ-001**: Support multiple distinct themes (>= 12) without duplicating component class sets.
- **REQ-002**: Support user-supplied themes at runtime (via JSON or CSS variable injection) without global CSS conflicts.
- **REQ-003**: Provide theme switching at runtime with minimal layout reflow and no flash-of-unstyled content (FOUC).
- **REQ-004**: Make shadcn-based components compatible with the theming system with little-or-no per-component changes.
- **REQ-005**: Maintain the existing Tailwind build and not degrade bundle size or runtime performance for the default theme.
- **REQ-006**: Provide optional migration plan to an alternative (Stitches) for teams/projects preferring CSS-in-JS token-based styling.
- **SEC-001**: Theme namespacing must avoid collisions with other extensions or pages (prefix all variables with `--tabby-`).
- **CON-001**: Avoid breaking consumers of `packages/ui` and pages using Tailwind utility classes directly.
- **GUD-001**: Prefer small, incremental changes and test coverage for each phase.

## 2. Implementation Steps

### Implementation Phase 1: Discovery & Tokenization

- GOAL-001: Discover existing Tailwind styles used in `packages/ui` and project pages, create a canonical token map.

| Task     | Description                                                                                                          | Completed | Date |
| -------- | -------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-001 | Scan all components in `packages/ui` for repeated Tailwind colours, radii, spacing, and font usage.                  |           |      |
| TASK-002 | Produce `theme-tokens.json` with canonical tokens (colors, text sizes, radius, shadows, spacing) and default values. |           |      |
| TASK-003 | Add tooling script `scripts/generate-css-vars.ts` to convert JSON to CSS variables.                                  |           |      |

**Validation**: Token map has 1:1 mapping to existing tailwind color usage; a coverage report lists components still using inline classes.

### Implementation Phase 2: Theming Infrastructure (Tailwind-friendly)

- GOAL-002: Add a CSS variables layer and Tailwind integration so tokens are available as CSS variables and Tailwind vars in `tailwind.config.ts`.

| Task     | Description                                                                                                                                                           | Completed | Date |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-004 | Introduce `packages/ui/lib/themes` and `packages/ui/lib/themes/default.json` + `light.json` + `dark.json`.                                                            |           |      |
| TASK-005 | Implement `tools/convert-theme-to-css-vars.ts` and setup build step to generate `packages/ui/lib/themes/*.css` with `:root` and `[data-theme='name']` rules.          |           |      |
| TASK-006 | Update `packages/ui/tailwind.config.ts` to reference CSS variables with `var(--tabby-<token>)` using theme extensions and `theme()` fallback for the default minimum. |
| TASK-007 | Add a `ThemeProvider` component in `packages/ui/lib/theming/ThemeProvider.tsx` to set `data-theme` on the root element and expose API to switch themes at runtime.    |           |      |

**Validation**: Tailwind utilities in UI components resolve to CSS variables via Tailwind config; theme CSS files are generated and imported into `packages/ui` and extension pages.

### Implementation Phase 3: Integrate with shadcn Components

- GOAL-003: Make shadcn-based components respect tokenized values and remove direct color classes when necessary.

| Task     | Description                                                                                                                                        | Completed | Date |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-008 | Identify shadcn components that hard-code colors (e.g., `bg-...`, `text-...`, `border-...`).                                                       |           |      |
| TASK-009 | Replace concrete class names with token-aware utility classes or `style` attributes pointing to CSS variables (e.g., `bg-[var(--tabby-bg-card)]`). |           |      |
| TASK-010 | Add a `useThemeTokens()` hook that resolves theme tokens to computed values for runtime needs (e.g., hover color calculations).                    |           |      |

**Validation**: All shadcn UI components in `packages/ui/lib` render correctly with default, light and dark themes and pass UI snapshot/unit tests.

### Implementation Phase 4: Custom/Third-party Theme Injection & Conflict Avoidance

- GOAL-004: Provide a safe public API for runtime theme injection allowing users to provide CSS variable maps without introducing global selector conflicts.

| Task     | Description                                                                                                                                | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---- |
| TASK-011 | Implement `setThemeVars(themeName: string, vars: Record<string,string>, options?: { scope?: string })` API in `packages/ui/lib/theming`.   |           |      |
| TASK-012 | Namespace all CSS variables with `--tabby-` prefix; allow scoping (e.g., only within `#tabby-root` or `[data-theme]`) to avoid collisions. |           |      |
| TASK-013 | Create doc page showing how to create a user theme JSON and apply it via `ThemeProvider.setTheme()` or `setThemeVars()`.                   |           |      |

**Validation**: Users can inject a JSON theme and see the app apply colors at runtime; no external CSS rules are overwritten (manual and automated tests confirm).

### Implementation Phase 5: Optional Migration Path — Stitches (or CSS-in-JS)

- GOAL-005: Provide a migration strategy to move the `packages/ui` to Stitches for teams that prefer CSS-in-JS token-based theming.

| Task     | Description                                                                                                                                                                                                                       | Completed | Date |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-014 | Create a new package `packages/ui-styling` exposing a stable API matching `styled`, `css`, `createTheme`, and `globalStyle` from `@stitches/react`.                                                                               |           |      |
| TASK-015 | Implement an adapter `packages/ui/lib/theming/stitches-adapter.ts` that translates `theme-tokens.json` into Stitches tokens via `createTheme()` and sets runtime theme.                                                           |           |      |
| TASK-016 | Provide a migration codemod (AST) script in `scripts/migrate-tailwind-to-stitches.ts` that: extracts token usages, replaces tailwind color classes with `cn('bg', 'border', ... )` wrappers pointing to tokens (1:1 replacement). |           |      |
| TASK-017 | Add a migration guide to `packages/ui/README.md` describing best practices, performance tradeoffs, and how to handle a partial migration (component-by-component).                                                                |           |      |

**Validation**: The stitches adapter can render the same themes as the Tailwind setup, and we can run a sample page that uses Stitches for a handful of components side-by-side with Tailwind components.

### Implementation Phase 6: Tests, Tooling & Documentation

- GOAL-006: Add test coverage and documentation, and prepare for incremental rollout.

| Task     | Description                                                                                       | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-018 | Add unit tests verifying the CSS variables are present after theme generation.                    |           |      |
| TASK-019 | Add vitest snapshot tests for UI components with multiple themes.                                 |           |      |
| TASK-020 | Add e2e tests in `tests/e2e` for theme switching & custom theme injection.                        |           |      |
| TASK-021 | Add docs in `packages/ui/README.md` and root `README.md` for theme authoring and migration steps. |           |      |
| TASK-022 | Add `product/releases` release note skeleton `v<version>-feature-theming-shadcn-tailwind.md`.     |           |      |

**Validation**: Tests cover token generation, theme switching, and user-provided theme injection. Release notes created.

## 3. Alternatives

- **ALT-001: Keep using Tailwind-only (no tokenization)**: Rejected — scales poorly with many themes and introduces class explosion.
- **ALT-002: Use vanilla-extract**: Provides type-safe CSS and tokens; recommended if you prefer static extraction and compile-time tokens. It is more rigid for user runtime theme injection, so rejected as primary option for user-driven runtime themes but good as a second option for build-time themes.
- **ALT-003: Adopt CSS Modules + CSS variables**: Slightly simpler but harder to share tokens across micro-frontends; can be considered if the project avoids Tailwind entirely.
- **ALT-004: Migrate to Stitches**: Chosen as the recommended alternative if the team wants an easier runtime theming story and “component encapsulation”; a migration guide is included.

## 4. Dependencies

- **DEP-001**: `tailwindcss` (existing) and `postcss` build pipeline.
- **DEP-002**: `shadcn/ui` usage or any custom shadcn-derived components in `packages/ui`.
- **DEP-003**: Optional: `@stitches/react` if migrating to Stitches.
- **DEP-004**: `vitest` for unit tests & `playwright` for e2e theme switch testing.

## 5. Files

- **FILE-001**: `packages/ui/tailwind.config.ts` (update to support `var(--tabby-...)` tokens).
- **FILE-002**: `packages/ui/lib/theming/ThemeProvider.tsx` (new component exposing theme API).
- **FILE-003**: `packages/ui/lib/themes/*` (json + generated css for each theme).
- **FILE-004**: `scripts/generate-css-vars.ts` (converts JSON tokens to CSS variables).
- **FILE-005**: `packages/ui/lib/theming/useThemeTokens.ts` (hook for runtime token resolution).
- **FILE-006**: `packages/ui/lib/theming/stitches-adapter.ts` (optional adapter for Stitches).
- **FILE-007**: `scripts/migrate-tailwind-to-stitches.ts` (codemod helper for migration).
- **FILE-008**: `tests/e2e/theme-switch.spec.ts` (end-to-end tests for theme switching and injection).

## 6. Testing

- **TEST-001**: Unit test that `generate-css-vars.ts` correctly converts `theme-tokens.json` to a CSS file containing `:root` and `[data-theme="<name>"]` entries.
- **TEST-002**: Unit and snapshot tests for all `packages/ui` components with default, light, dark, and a custom theme.
- **TEST-003**: e2e tests for theme switching (Playwright) that verify computed color styles and no FOUC.
- **TEST-004**: Integration test to verify `setThemeVars()` correctly applies runtime themes to a scoped DOM node.

## 7. Risks & Assumptions

- **RISK-001**: Changing how themes are applied may cause a regression in pages that rely on raw Tailwind classes for color; mitigate by running a coverage search and gradually migrating components and pages.
- **RISK-002**: Generating variable-based values could produce subtle color mismatches vs. utility classes; mitigate by visually validating the most critical UI flows and adding snapshot tests.
- **RISK-003**: Stitches will add runtime JS for styling and may increase bundle size; use it as an optional package and not a hard requirement for the whole app.
- **ASSUMPTION-001**: Most existing UI components are small enough to be migrated incrementally without a large rewrite.
- **ASSUMPTION-002**: There is sufficient test coverage to make an incremental rollout safe.

## 8. Related Specifications / Further Reading

[Tailwind CSS: Custom Properties & Theming](https://tailwindcss.com/docs/customizing-colors#using-css-variables)
[Shadcn UI: Patterns & Utilities](https://ui.shadcn.com)
[Stitches: Runtime Theming + createTheme() docs](https://stitches.dev/docs/api#createTheme)
[vanilla-extract: Design Tokens](https://vanilla-extract.style/documentation/recipes/)
