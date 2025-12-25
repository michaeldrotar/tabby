# Copilot Instructions

This is the main entry point for AI assistant guidance on this project. For detailed instructions on specific topics, refer to the specialized instruction files below.

## Project: Tabby

**Tabby** is a Chrome Extension that provides keyboard-centric tab and bookmark management. Built as a monorepo using **pnpm workspaces** and **Turborepo**.

### Tech Stack

- **React 19** with functional components and hooks
- **TypeScript 5.x** targeting ES2022
- **Vite** for bundling with custom plugins for Chrome Extension builds
- **Tailwind CSS** with custom theming and dark mode
- **Vitest** for testing with jsdom environment

### Monorepo Structure

- `chrome-extension/` - Background service worker, manifest generation
- `pages/` - Individual UI entry points (omnibar-overlay, tab-manager, etc.)
- `packages/` - Shared internal libraries with `@extension/*` namespace

## Instruction Files (Skills)

These specialized instruction files provide focused guidance for different aspects of development:

### Core Development

- **[workflow.instructions.md](.github/instructions/workflow.instructions.md)** - Planning, release management, documentation updates, definition of done
- **[commands.instructions.md](.github/instructions/commands.instructions.md)** - Which commands to run when, development workflow
- **[architecture.instructions.md](.github/instructions/architecture.instructions.md)** - Code organization, component design patterns, package structure
- **[chrome-extension.instructions.md](.github/instructions/chrome-extension.instructions.md)** - Chrome extension architecture, permissions, storage patterns

### Technology-Specific

- **[reactjs.instructions.md](.github/instructions/reactjs.instructions.md)** - React patterns and best practices
- **[typescript-5-es2022.instructions.md](.github/instructions/typescript-5-es2022.instructions.md)** - TypeScript guidelines and conventions
- **[testing.instructions.md](.github/instructions/testing.instructions.md)** - Testing practices, when to test, test structure

### Role-Specific

- **[design-ux.instructions.md](.github/instructions/design-ux.instructions.md)** - Design philosophy, UX principles, accessibility, shadcn components
- **[product-owner.instructions.md](.github/instructions/product-owner.instructions.md)** - Discovering user needs, feature validation, persona-driven development
- **[marketing.instructions.md](.github/instructions/marketing.instructions.md)** - Messaging, positioning, outcomes over features, Chrome Web Store optimization

### Meta

- **[meta-instructions.instructions.md](.github/instructions/meta-instructions.instructions.md)** - How to create and maintain instruction files

## Quick Reference

### Basic Coding Style

- Use functional components for React
- Use TypeScript for all new files
- Use Tailwind CSS for styling
- Prefer `const` over `let`

### Package Imports

```typescript
import { Omnibar } from '@extension/ui'
import { usePlatformInfo } from '@extension/chrome'
import { preferenceStorage } from '@extension/storage'
```

### When in Doubt

1. Check existing code patterns first
2. Refer to the relevant instruction file above
3. Ask clarifying questions before making assumptions
