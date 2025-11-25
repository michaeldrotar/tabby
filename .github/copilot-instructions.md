# Copilot Instructions

This file contains instructions for GitHub Copilot to follow when working on this project.

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
- **Single File Exports:** Prefer single file exports for everything, including for types and utils. Components with a props type can export both the component function and prop type.
- **Naming Convention:** Name feature-specific types and utils to include the feature name (e.g., `OmnibarSearchItem`, `getOmnibarActionLabel`).
- **DRY Principle:** Always check for existing components before creating new ones.
- Shared components (like `Favicon`, `Omnibar`) should live in `packages/ui`.
- If you find duplicated code, refactor it into a shared location.
- Remove unused code, imports, and files when refactoring or deleting features.

## Testing

- Use Vitest for testing.

## Documentation

- User-facing changes should update `RELEASE_NOTES.md`.
- Privacy changes should update `PRIVACY.md`.
- Major feature additions should update `README.md`.
