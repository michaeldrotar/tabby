# Feature: Migrate to HeroUI

**Date:** December 6, 2025  
**Model:** Claude Sonnet 4.5  
**Status:** Planned

## Checklist

### Phase 1: Discovery & Mapping

- [ ] Scan packages/ui/lib and pages for shadcn components
- [ ] Generate theme-token-map.json
- [ ] Create generate-theme-coverage-report.ts script

### Phase 2: HeroUI Theming & Token Adapter

- [ ] Create heroui-adapter.ts
- [ ] Add HeroUI theme JSON files (default, light, dark, secondary)
- [ ] Implement convert-heroui-theme-to-css-vars.ts
- [ ] Provide ThemeProvider.tsx with scope support

### Phase 3: Multi-theme Strategy & User Overlays

- [ ] Add packages/ui/lib/themes/index.ts for theme registration
- [ ] Implement theme-overlay.ts with mergeTheme() and setThemeVars()
- [ ] Extend ThemeProvider to accept userTheme and scope

### Phase 4: Progressive Component Migration

- [ ] Create migration plan for shadcn to HeroUI components
- [ ] Build codemods for automated component migration
- [ ] Migrate components incrementally with API parity

## Introduction

This plan describes a deterministic, incremental migration from the existing shadcn/Tailwind-based UI to HeroUI components while adding first-class support for multi-theme handling (beyond light/dark) and user-defined theme overlays. The goal is to provide a low-risk migration path that ensures visual parity, retains runtime performance, and supports user-supplied theme overrides applied on top of a chosen base theme.

Reference: https://www.heroui.com/docs/guide/introduction

## 1. Requirements & Constraints

- **REQ-001**: Support multiple distinct themes (>= 12) without duplicating component class sets and without causing class explosion.
- **REQ-002**: Support user-provided theme overlays (JSON / CSS variable maps) applied at runtime on top of the selected base theme.
- **REQ-003**: Provide theme switching at runtime with minimal layout reflow and no flash-of-unstyled content (FOUC).
- **REQ-004**: Offer a path to migrate existing shadcn-based components to HeroUI with minimal per-component rewrites and codemods for automation.
- **REQ-005**: Do not break consumers of `packages/ui` or pages that rely on Tailwind utilities; maintain backward compatibility for the default theme and small performance footprint.
- **SEC-001**: All CSS variables must use the `--tabby-` prefix to avoid collisions across other extensions and pages.
- **CON-001**: Avoid breaking embedded contexts (e.g., `omnibar-embed`, `omnibar-overlay`, extension pages) when applying runtime theme variables—scoping is required.
- **GUD-001**: Prefer incremental changes, automated tests, and CI gating for each phase.

## 2. Implementation Steps

### Implementation Phase 1: Discovery & Mapping

- GOAL-001: Inventory existing UI components, tokens, and usage patterns to plan the migration and token mapping for HeroUI.

| Task     | Description                                                                                                                      | Completed | Date |
| -------- | -------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-001 | Scan `packages/ui/lib` and `pages/**/src` for shadcn components, Tailwind color/radius/spacing utilities, and repeated patterns. |           |      |
| TASK-002 | Generate `packages/ui/lib/themes/theme-token-map.json` mapping `--tabby-` tokens to current Tailwind/utility usage.              |           |      |
| TASK-003 | Create a `tools/generate-theme-coverage-report.ts` script to detect un-tokenized inline Tailwind classes and produce a report.   |           |      |

Validation: Coverage report lists all inline style usages and confirmed token replacements for at least 90% of repeated styles.

### Implementation Phase 2: HeroUI Theming & Token Adapter

- GOAL-002: Build an adapter layer that converts project theme tokens into a HeroUI-compatible token shape while retaining CSS variable-first runtime behavior.

| Task     | Description                                                                                                                                                                                                                               | Completed | Date |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-004 | Create `packages/ui/lib/theming/heroui-adapter.ts` which maps `theme-token-map.json` into HeroUI token names and exports token conversion helpers.                                                                                        |           |      |
| TASK-005 | Add `packages/ui/lib/themes/heroui-default.json`, `heroui-light.json`, `heroui-dark.json`, and `heroui-secondary-*.json` for additional themes; each file contains hero-compatible token keys and values.                                 |           |      |
| TASK-006 | Implement `scripts/convert-heroui-theme-to-css-vars.ts` that converts each HeroUI JSON theme to CSS variables named `--tabby-<token>` in generated CSS files (one for each theme) and includes `:root` and `[data-theme='name']` scoping. |           |      |
| TASK-007 | Provide `packages/ui/lib/theming/ThemeProvider.tsx` which:                                                                                                                                                                                |

- Adds `[data-theme="<name>"]` to a root element (configurable via `options.scopeId`).
- Exposes `applyTheme(baseThemeName, userThemeOverlay?, { scope: string })`.
- Ensures user theme overlay variables only apply under the selected scope. | | |

Validation: Generated CSS files are available in `packages/ui/lib/themes/*.css` and the `ThemeProvider` applies CSS variables at runtime with zero FOUC on page load (verification: e2e tests confirm style computed values before paint).

### Implementation Phase 3: Multi-theme Strategy & User Overlays

- GOAL-003: Enable many (>=12) named themes and support user theme overlays applied on top of a chosen base theme (merging tokens at runtime).

| Task     | Description                                                                                                                                    | Completed | Date |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-008 | Add `packages/ui/lib/themes/index.ts` that registers available themes and supports lazy-loading theme CSS files to reduce initial bundle size. |           |      |
| TASK-009 | Implement `packages/ui/lib/theming/theme-overlay.ts` with functions:                                                                           |

- `mergeTheme(baseTheme: Theme, overlay: Partial<Theme>)` (deep merge with overlay precedence).
- `setThemeVars(scopeSelector: string, vars: Record<string, string>)` to set scoped CSS custom properties only under the specified DOM node. | | |
  | TASK-010 | Extend `ThemeProvider` to accept `userTheme: Partial<Theme>` and a `scope` (e.g., `#tabby-root`) and apply overlay by setting scoped CSS variables instead of modifying `:root`. | | |

Validation: Demonstrate at least 12 themes registered and a user-provided overlay JSON is applied at runtime and effectively overrides specific tokens for only the chosen scope; e2e tests should assert both base theme and overlay token precedence.

### Implementation Phase 4: Progressive Component Migration to HeroUI

- GOAL-004: Replace targeted shadcn/Tailwind components with HeroUI equivalents in `packages/ui` while maintaining the API and design tokens. Achieve this incrementally and with codemod automation for large-scale replacements.

| Task     | Description                                      | Completed | Date |
| -------- | ------------------------------------------------ | --------- | ---- |
| TASK-011 | Add `scripts/migrate-to-heroui-codemod.ts` that: |

- Replaces `import { Button } from 'shadcn/ui'` with `import { Button } from 'hero-ui'` when component APIs are compatible.
- Adds themes-aware props when necessary and maps class names using theme tokens where a direct mapping exists. | | |
  | TASK-012 | For incompatible APIs or new semantics (e.g., different prop names), implement wrapper components in `packages/ui/lib/compat/` to preserve older API signatures while delegating to HeroUI. | | |
  | TASK-013 | Add `packages/ui/lib/compat/heroui-compat/` with wrappers for commonly used components (e.g., `Button`, `Badge`, `Menu`, `Dropdown`) maintaining old props and mapping tokens to HeroUI equivalents. | | |

Validation: Components replaced in `packages/ui` unit tests render with the same class and token styling as before; snapshot diffs are minimal and intentional.

### Implementation Phase 5: Build & Tooling Integration

- GOAL-005: Make the theme generation and HeroUI migration tools part of the build process and create CI checks for theme coverage and style parity.

| Task     | Description                                                                                                                                                                                            | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---- |
| TASK-014 | Add `scripts/build-themes.mjs` that runs `convert-heroui-theme-to-css-vars.ts` during `packages/ui` build and outputs `lib/themes/*.css`. Update `packages/ui/package.json` build script to invoke it. |           |      |
| TASK-015 | Add a `ci/theme-coverage` script that runs `generate-theme-coverage-report.ts` and fails CI if a configurable percentage (default 95%) of repeated style usages are not tokenized.                     |           |      |
| TASK-016 | Update `packages/ui/tailwind.config.ts` to reference `var(--tabby-...)` tokens where possible and add `theme()` fallbacks for compiled values.                                                         |           |      |

Validation: `pnpm build` for `packages/ui` produces theme CSS files and the CI job validates tokenization coverage.

### Implementation Phase 6: Testing, Documentation & Release

- GOAL-006: Add tests, update documentation, and prepare release notes for the migration.

| Task     | Description                                                                                                                                       | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-017 | Add unit tests for `mergeTheme()` merging behavior and `setThemeVars()` scoping logic (Vitest).                                                   |           |      |
| TASK-018 | Add snapshot tests for representative `packages/ui` components across multiple HeroUI themes and a user overlay.                                  |           |      |
| TASK-019 | Add e2e tests in `tests/e2e` to verify theme switching, overlay application, and no FOUC.                                                         |           |      |
| TASK-020 | Update `packages/ui/README.md` with HeroUI migration notes and `packages/ui/lib/theming/README.md` with theme authoring and overlay API examples. |           |      |
| TASK-021 | Add release note skeleton `product/releases/v<version>-feature-migrate-heroui.md`.                                                                |           |      |

Validation: All tests pass and snapshots are reviewed; the documentation includes developer and user-facing instructions for theming and migration.

## 3. Alternatives

- **ALT-001**: Keep the current shadcn/Tailwind stack and implement HeroUI only for new/refactored components — chosen if the migration proves disruptive.
- **ALT-002**: Adopt vanila-extract or Stitches as a single source-of-truth for tokens; this would be more invasive and reduce runtime flexibility for user theme overlays.
- **ALT-003**: Use CSS-in-JS exclusively for theme overlays; rejected due to bundle size and impact on extension build constraints.

## 4. Dependencies

- **DEP-001**: `hero-ui` library dependency; verify compatibility with Vite and the current UI build setup.
- **DEP-002**: `tailwindcss` and `postcss` (existing), ensure CSS variables integration is set.
- **DEP-003**: `vitest` & `playwright` for tests and `node` for scripts.

## 5. Files

- **FILE-001**: `packages/ui/lib/theming/heroui-adapter.ts` — Token mapping and conversion helpers.
- **FILE-002**: `packages/ui/lib/themes/heroui-*.json` — Theme JSONs compatible with HeroUI tokens.
- **FILE-003**: `scripts/convert-heroui-theme-to-css-vars.ts` — Converts JSON to `--tabby-` CSS variables.
- **FILE-004**: `packages/ui/lib/theming/ThemeProvider.tsx` — Runtime theme management and overlay API.
- **FILE-005**: `packages/ui/lib/theming/theme-overlay.ts` — Overlay merging and scoped application helpers.
- **FILE-006**: `scripts/migrate-to-heroui-codemod.ts` — Codemod for mass code changes.
- **FILE-007**: `packages/ui/lib/compat/heroui-compat/*` — Per-component compatibility wrappers where API changes are non-trivial.
- **FILE-008**: `tests/e2e/heroui-migration.spec.ts` — E2E tests for theme switching, overlay merging, and no FOUC.
- **FILE-009**: `product/releases/v<version>-feature-migrate-heroui.md` — Release notes skeleton.

## 6. Testing

- **TEST-001**: Unit tests for conversion scripts ensuring JSON -> CSS variables produce expected `--tabby-<token>` keys.
- **TEST-002**: Unit tests for `mergeTheme()` and `setThemeVars()` behavior (scope, precedence, conflict avoidance).
- **TEST-003**: Vitest snapshot tests for components rendered with multiple HeroUI themes and a user overlay.
- **TEST-004**: Playwright e2e tests for theme switching including user overlay application and no FOUC across the extension UI and the `pages/*` build outputs.

## 7. Risks & Assumptions

- **RISK-001**: HeroUI API differences require additional wrapper components and validation, increasing migration surface area; mitigation: start with atomic components (Button, Badge) and create compatibility wrappers.
- **RISK-002**: Theme token mismatches between HeroUI and Tailwind utilities could cause visual differences; mitigation: thorough token mapping, snapshot audits, and visual checks for critical flows.
- **RISK-003**: User overlays might accidentally scope global CSS; mitigation: `setThemeVars` must require/disallow application to global `:root` by default and promote explicit scopes (e.g., `#tabby-root`).
- **ASSUMPTION-001**: The project can integrate `hero-ui` without an overall architecture rewrite (HeroUI works with existing React and Vite setup).
- **ASSUMPTION-002**: Most components’ visual design can be expressed using HeroUI tokens or small wrapper logic.

## 8. Related Specifications / Further Reading

[HeroUI Guide: Introduction](https://www.heroui.com/docs/guide/introduction)
[Tailwind CSS: Using CSS Variables & Theming](https://tailwindcss.com/docs/customizing-colors#using-css-variables)
[Shadcn UI: Patterns & Utilities](https://ui.shadcn.com)

---

### Completion Criteria (Quick Checklist)

- [ ] `packages/ui` generates HeroUI CSS variables and loads them from `lib/themes/`.
- [ ] `ThemeProvider` applies base theme and user overlays with scoping.
- [ ] Basic set of core components migrated to HeroUI with wrappers for compatibility.
- [ ] Tests (unit + e2e) cover core functionality and theming.
- [ ] Documentation & release note skeleton updated.
