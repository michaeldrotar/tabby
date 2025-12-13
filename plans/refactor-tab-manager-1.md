---
goal: Refactor Tab Manager into modular, testable, and theme-ready components
version: 1.0
date_created: 2025-12-05
status: Planned
tags: [refactor, ui, testing, tab-manager]
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

This plan outlines the refactoring of the Tab Manager component to separate concerns between display and logic, improve testability, and prepare for future theming capabilities. The goal is to have small, pure display components and robust, testable logic hooks, enabling reuse for guided tours and easier maintenance.

## 1. Requirements & Constraints

- **REQ-001**: Separate display components from logic/data fetching.
- **REQ-002**: Display components must be pure, accepting data via props only.
- **REQ-003**: All functional components and hooks must have unit tests.
- **REQ-004**: Implement tests for window and tab selection logic.
- **REQ-005**: Implement tests for tab management actions (close, move, create).
- **REQ-006**: Display components must support theming (via CSS variables or class injection).
- **REQ-007**: Components must be reusable for guided tours (accepting mock data).
- **REQ-008**: Move shared UI components to `packages/ui` for accessibility by other pages (e.g., Welcome page).

## 2. Implementation Steps

### Implementation Phase 1: Atomic Display Components

- GOAL-001: Create pure, theme-ready UI components for the Tab Manager.

| Task     | Description                                                         | Completed | Date |
| -------- | ------------------------------------------------------------------- | --------- | ---- |
| TASK-001 | Create `TabManagerShell` component (main layout container).         |           |      |
| TASK-002 | Create `TabManagerSidebar` component (navigation rail for windows). |           |      |
| TASK-003 | Create `WindowRailItem` component (dot/thumbnail representation).   |           |      |
| TASK-004 | Create `TabList` component (container for tabs in a window).        |           |      |
| TASK-005 | Create `TabItem` component (individual tab display).                |           |      |
| TASK-006 | Create `TabManagerHeader` component (search trigger, actions).      |           |      |
| TASK-007 | Add basic unit tests for rendering each display component.          |           |      |

### Implementation Phase 2: Logic & State Hooks

- GOAL-002: Refactor logic into testable hooks.

| Task     | Description                                                               | Completed | Date |
| -------- | ------------------------------------------------------------------------- | --------- | ---- |
| TASK-008 | Create `useTabManagerData` hook (abstracts chrome API calls).             |           |      |
| TASK-009 | Create `useTabManagerSelection` hook (manages selected window/tab state). |           |      |
| TASK-010 | Create `useTabManagerActions` hook (close tab, new window, etc.).         |           |      |
| TASK-011 | Write unit tests for `useTabManagerData` (mocking chrome API).            |           |      |
| TASK-012 | Write unit tests for `useTabManagerSelection` and Actions.                |           |      |

### Implementation Phase 3: Integration & Smart Component

- GOAL-003: Reassemble the Tab Manager using the new architecture.

| Task     | Description                                                                  | Completed | Date |
| -------- | ---------------------------------------------------------------------------- | --------- | ---- |
| TASK-013 | Create new `TabManager` smart component integrating hooks and UI components. |           |      |
| TASK-014 | Connect `TabManager` to real data sources.                                   |           |      |
| TASK-015 | Ensure theming support is wired up.                                          |           |      |

### Implementation Phase 4: Comprehensive Testing

- GOAL-004: Verify functionality with integration tests.

| Task     | Description                                                       | Completed | Date |
| -------- | ----------------------------------------------------------------- | --------- | ---- |
| TASK-016 | Create integration test for Window switching.                     |           |      |
| TASK-017 | Create integration test for Tab actions (close, activate).        |           |      |
| TASK-018 | Verify mock data support for guided tours (render with fixtures). |           |      |

## 3. Alternatives

- **ALT-001**: Keep components in `pages/tab-manager`. (Rejected: Need to share components with Welcome page).

## 4. Dependencies

- **DEP-001**: `packages/ui` workspace setup.
- **DEP-002**: `vitest` for testing.
- **DEP-003**: `testing-library/react` for component testing.

## 5. Files

- `packages/ui/lib/tab-manager/ui/TabManagerShell.tsx`
- `packages/ui/lib/tab-manager/ui/TabManagerSidebar.tsx`
- `packages/ui/lib/tab-manager/ui/WindowRailItem.tsx`
- `packages/ui/lib/tab-manager/ui/TabList.tsx`
- `packages/ui/lib/tab-manager/ui/TabItem.tsx`
- `packages/ui/lib/tab-manager/hooks/useTabManagerData.ts`
- `packages/ui/lib/tab-manager/hooks/useTabManagerSelection.ts`
- `packages/ui/lib/tab-manager/TabManager.tsx` (Refactored)

## 6. Testing

- **TEST-001**: Unit tests for all new UI components.
- **TEST-002**: Unit tests for custom hooks.
- **TEST-003**: Integration tests for the full Tab Manager workflow.

## 7. Risks & Assumptions

- **RISK-001**: Moving components to `packages/ui` might require adjusting build configuration/imports.
- **ASSUMPTION-001**: The current chrome API wrappers are sufficient and don't need major refactoring, just abstraction.
