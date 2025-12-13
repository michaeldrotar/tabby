# Copilot Instructions

This file contains instructions for GitHub Copilot to follow when working on this project.

## Critical Workflow & Definition of Done

- **Plan First:** When asked to perform a multi-step task, use the \`manage_todo_list\` tool to plan your work.
- **Update Release Notes:** If the task involves a user-facing change or a bug fix, you **MUST** include a todo item to update the relevant release note file in \`product/releases/\`.
  - File naming convention: \`v<version>-<slug>.md\` (e.g., \`v1.0.0-the-launch.md\`).
  - **Version Source of Truth:** Always trust the current version in \`package.json\` when naming release note files. The version is always updated first before adding release notes.
  - **One File Per Version:** Do not create multiple release note files for the same version. If a \`v<version>-\*.md\` file already exists for the current version, append your notes to that file (renaming the existing file/slug is OK if you want a different title).
  - Do not mark the task as complete until this is done.
- **Documentation:**
  - Privacy changes should update \`PRIVACY.md\`.
  - Major feature additions should update \`README.md\`.

## Limitations

- Do not run builds unless asked or working specifically on changes to the build.
- Do not run tests unless asked or working specifically on test changes.

## Project Overview

- This is a Chrome Extension project named "Tabby".
- It uses React, TypeScript, Tailwind CSS, and Vite.
- It uses pnpm workspaces and turborepo.

## Coding Style

- Use functional components for React.
- Use TypeScript for all new files.
- Use Tailwind CSS for styling.
- Prefer `const` over `let`.
- Doc comments (JSDoc) are encouraged for components and utilities to explain their purpose and usage.

## Architecture & Best Practices

- **Feature-Based Organization:** Group components, hooks, and utils by feature (e.g., `omnibar/`) rather than by type (e.g., `components/`, `hooks/`, or `types/`).
- **General Utilities:** General utilities that don't belong to a specific feature should be placed in a `utils/` folder. Each utility should be in its own file (e.g., `utils/formatTimeAgo.ts`).
- **Single File Exports:** Prefer single file exports for everything, including for types and utils. Components with a props type can export both the component function and prop type. Avoid creating "bag" files like `utils.ts` or `types.ts` that contain multiple unrelated exports.
  - Types should also follow this rule. For example, `DataAttributes` should be in `DataAttributes.ts`, not `types.ts`.
- **Co-location:** Tightly coupled components (e.g., `TabList`, `TabListItem`) should be defined in the same file to improve maintainability and discoverability.
- **Naming Convention:** Name feature-specific types and utils to include the feature name (e.g., `OmnibarSearchItem`, `getOmnibarActionLabel`).
- **Minimal Props:** Custom components should have minimal properties. Avoid extending full HTML attributes (like `React.ButtonHTMLAttributes`) unless absolutely necessary.
- **DRY Principle:** Always check for existing components before creating new ones.
- Shared components (like `Favicon`, `Omnibar`) should live in `packages/ui`.
- If you find duplicated code, refactor it into a shared location.
- Remove unused code, imports, and files when refactoring or deleting features.

## Testing

- Use Vitest for testing.
- Tests are not needed for relatively simple changes like new features or modifications.
- Bug fixes must include tests to prevent regressions.
- Dummy UI components should have tests for their functionality, if any (e.g. conditional rendering, event handling).
- **Test Functionality, Not Implementation:** Tests should verify behavior and user-visible state (e.g., `aria-current`, `data-active`) rather than implementation details like CSS classes.
