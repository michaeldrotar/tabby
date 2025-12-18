---
goal: Refactor Omnibar into modular, testable, and theme-ready components
version: 2.0
date_created: 2025-12-05
status: Planned
tags: [refactor, ui, testing, omnibar]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan outlines the refactoring of the Omnibar component to separate concerns between display and logic, improve testability, and prepare for future theming capabilities. The goal is to have small, pure display components and robust, testable logic hooks.

## 1. Requirements & Constraints

- **REQ-001**: Separate display components from logic/data fetching.
- **REQ-002**: Display components must be pure, accepting data via props only.
- **REQ-003**: All functional components and hooks must have unit tests.
- **REQ-004**: Implement comprehensive tests for search functionality.
- **REQ-005**: Implement tests for keyboard navigation (ArrowUp, ArrowDown).
- **REQ-006**: Implement tests for item activation (Enter, Shift+Enter, Cmd+Enter).
- **REQ-007**: Display components must support theming (via CSS variables or class injection).
- **REQ-008**: Components must be reusable for guided tours (accepting mock data).

## 2. Implementation Steps

### Implementation Phase 1: Atomic Display Components

- GOAL-001: Create pure, theme-ready UI components for the Omnibar.

| Task     | Description                                                           | Completed | Date |
| -------- | --------------------------------------------------------------------- | --------- | ---- |
| TASK-001 | Create `OmnibarShell` component (container/layout).                   |           |      |
| TASK-002 | Create `OmnibarInput` component (visual input field).                 |           |      |
| TASK-003 | Create `OmnibarList` component (scrollable list container).           |           |      |
| TASK-004 | Create `OmnibarItem` component (individual result item, visual only). |           |      |
| TASK-005 | Create `OmnibarGroup` component (optional group headers).             |           |      |
| TASK-006 | Create `OmnibarEmpty` component (empty state display).                |           |      |
| TASK-007 | Add basic unit tests for rendering each display component.            |           |      |

### Implementation Phase 2: Logic & State Hooks

- GOAL-002: Refactor logic into testable hooks.

| Task     | Description                                                            | Completed | Date |
| -------- | ---------------------------------------------------------------------- | --------- | ---- |
| TASK-008 | Refactor `useOmnibarSearch` to be deterministic and testable.          |           |      |
| TASK-009 | Create/Refactor `useOmnibarNavigation` for keyboard selection state.   |           |      |
| TASK-010 | Create/Refactor `useOmnibarActivation` for handling execution actions. |           |      |
| TASK-011 | Write unit tests for `useOmnibarSearch` (mocking search sources).      |           |      |
| TASK-012 | Write unit tests for `useOmnibarNavigation` (state transitions).       |           |      |

### Implementation Phase 3: Integration & Smart Component

- GOAL-003: Reassemble the Omnibar using the new architecture.

| Task     | Description                                                               | Completed | Date |
| -------- | ------------------------------------------------------------------------- | --------- | ---- |
| TASK-013 | Create new `Omnibar` smart component integrating hooks and UI components. |           |      |
| TASK-014 | Connect `Omnibar` to real data sources (tabs, bookmarks, etc.).           |           |      |
| TASK-015 | Ensure theming support is wired up (passing classes/styles).              |           |      |

### Implementation Phase 4: Comprehensive Testing

- GOAL-004: Verify functionality with integration tests.

| Task     | Description                                                                | Completed | Date |
| -------- | -------------------------------------------------------------------------- | --------- | ---- |
| TASK-016 | Create integration test for Search flow (input -> results).                |           |      |
| TASK-017 | Create integration test for Keyboard Navigation (Arrow keys -> selection). |           |      |
| TASK-018 | Create integration test for Activation (Enter keys -> action).             |           |      |
| TASK-019 | Verify mock data support for guided tours (render with fixtures).          |           |      |

## 3. Alternatives

- **ALT-001**: Keep existing monolithic component and just add tests. (Rejected: Doesn't solve modularity or theming goals).
- **ALT-002**: Use a third-party command palette library (e.g., kbar). (Rejected: Need full control over UI and custom data sources).

## 4. Dependencies

- **DEP-001**: `packages/ui` workspace setup.
- **DEP-002**: `vitest` for testing.
- **DEP-003**: `testing-library/react` for component testing.

## 5. Files

- `packages/ui/lib/omnibar/ui/OmnibarShell.tsx`
- `packages/ui/lib/omnibar/ui/OmnibarInput.tsx`
- `packages/ui/lib/omnibar/ui/OmnibarList.tsx`
- `packages/ui/lib/omnibar/ui/OmnibarItem.tsx`
- `packages/ui/lib/omnibar/hooks/useOmnibarNavigation.ts`
- `packages/ui/lib/omnibar/hooks/useOmnibarActivation.ts`
- `packages/ui/lib/omnibar/Omnibar.tsx` (Refactored)

## 6. Testing

- **TEST-001**: Unit tests for all new UI components.
- **TEST-002**: Unit tests for custom hooks.
- **TEST-003**: Integration tests for the full Omnibar workflow.

## 7. Risks & Assumptions

- **RISK-001**: Refactoring might break existing Omnibar functionality if not fully covered by tests.
- **ASSUMPTION-001**: The current search logic is reusable and just needs to be wrapped/hooked properly.
