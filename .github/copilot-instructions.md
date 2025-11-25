# Copilot Instructions

This file contains instructions for GitHub Copilot to follow when working on this project.

## Critical Workflow & Definition of Done

- **Plan First:** When asked to perform a multi-step task, use the \`manage_todo_list\` tool to plan your work.
- **Update Release Notes:** If the task involves a user-facing change or a bug fix, you **MUST** include a todo item to update \`RELEASE_NOTES.md\`. Do not mark the task as complete until this is done.
- **Documentation:**
  - Privacy changes should update \`PRIVACY.md\`.
  - Major feature additions should update \`README.md\`.

## Project Overview

- This is a Chrome Extension project named "Tabby".
- It uses React, TypeScript, Tailwind CSS, and Vite.
- It uses pnpm workspaces and turborepo.

## Coding Style

- Use functional components for React.
- Use TypeScript for all new files.
- Use Tailwind CSS for styling.
- Prefer `const` over `let`.

## Architecture & Best Practices

- **Feature-Based Organization:** Group components, hooks, and utils by feature (e.g., `omnibar/`) rather than by type (e.g., `components/`, `hooks/`, or `types/`).
- **General Utilities:** General utilities that don't belong to a specific feature should be placed in a `utils/` folder. Each utility should be in its own file (e.g., `utils/formatTimeAgo.ts`).
- **Single File Exports:** Prefer single file exports for everything, including for types and utils. Components with a props type can export both the component function and prop type. Avoid creating "bag" files like `utils.ts` or `types.ts` that contain multiple unrelated exports.
- **Naming Convention:** Name feature-specific types and utils to include the feature name (e.g., `OmnibarSearchItem`, `getOmnibarActionLabel`).
- **DRY Principle:** Always check for existing components before creating new ones.
- Shared components (like `Favicon`, `Omnibar`) should live in `packages/ui`.
- If you find duplicated code, refactor it into a shared location.
- Remove unused code, imports, and files when refactoring or deleting features.

## Testing

- Use Vitest for testing.
- Tests are not needed for relatively simple changes like new features or modifications.
- Bug fixes must include tests to prevent regressions.
- Do not run builds or tests manually unless asked. The user will notify you if there are failures.
