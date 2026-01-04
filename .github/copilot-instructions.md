# Copilot Instructions

This is the main entry point for AI assistant guidance on this project. For detailed instructions on specific topics, refer to the specialized instruction files below.

## ⚠️ CRITICAL: Read Instructions Before ANY Code Changes

**STOP. Before editing ANY code file, you MUST:**

1. **Identify which instruction files apply** (based on file patterns in the sections below)

2. **Read ALL applicable instruction files completely** (start to finish, every line)
   - Early sections often provide overview and context
   - Middle sections contain detailed implementation guidance
   - Later sections may include critical edge cases, gotchas, or important constraints
   - Missing any section can lead to incomplete or incorrect implementations

3. **Then proceed** with changes following those guidelines

**This is not optional.** Skipping this step leads to:

- Code that doesn't follow project patterns
- Missing required testing
- Violations of architectural principles
- Work that needs to be redone

**If you're unsure, read the instructions. Always read instructions first.**

### Standard Workflow for ANY Code Change

When receiving a code change request:

- [ ] Identify file types being modified (`.ts`, `.tsx`, `.md`, etc.)
- [ ] Check which instruction files apply (see "Instruction Files" section below)
- [ ] Read all applicable instruction files completely (do not stop partway through)
- [ ] Make changes following those guidelines
- [ ] Run appropriate commands per commands.instructions.md
- [ ] Verify changes meet project standards

## Instruction Files (Skills)

These specialized instruction files provide focused guidance for different aspects of development. Each file includes frontmatter with a description and `applyTo` patterns to help determine when to reference them.

### Core Development

- **[planning.instructions.md](.github/instructions/planning.instructions.md)** - Creating plans, managing checklists, definition of done
- **[commands.instructions.md](.github/instructions/commands.instructions.md)** - **CRITICAL: Read before running ANY command** - Which commands to run when, npm scripts vs direct tool invocation, development workflow
- **[architecture.instructions.md](.github/instructions/architecture.instructions.md)** - Code organization, component design patterns, package structure
- **[chrome-extension.instructions.md](.github/instructions/chrome-extension.instructions.md)** - Chrome extension architecture, permissions, storage patterns

### Technology-Specific

- **[reactjs.instructions.md](.github/instructions/reactjs.instructions.md)** - React patterns and best practices
- **[typescript-5-es2022.instructions.md](.github/instructions/typescript-5-es2022.instructions.md)** - TypeScript guidelines and conventions
- **[testing.instructions.md](.github/instructions/testing.instructions.md)** - Testing practices, when to test, test structure

### Documentation & Process

- **[documentation.instructions.md](.github/instructions/documentation.instructions.md)** - README, PRIVACY, and general documentation updates
- **[release-notes.instructions.md](.github/instructions/release-notes.instructions.md)** - When and how to update release notes

### Role-Specific

- **[design-ux.instructions.md](.github/instructions/design-ux.instructions.md)** - Design philosophy, UX principles, accessibility, shadcn components
- **[product-owner.instructions.md](.github/instructions/product-owner.instructions.md)** - Discovering user needs, feature validation, persona-driven development
- **[marketing.instructions.md](.github/instructions/marketing.instructions.md)** - Messaging, positioning, outcomes over features, Chrome Web Store optimization

## Maintaining Instructions

### When to Update Instructions

Update instruction files when you learn important information during a conversation that would be valuable for future work, such as:

- Architectural decisions and patterns
- Workflow processes and best practices
- Common pitfalls and their solutions
- Tool usage and conventions
- Domain-specific knowledge

### Creating New Instruction Files

Create a new instruction file when:

- A topic is substantial enough to deserve its own focus (50+ lines)
- Multiple people or contexts will reference this knowledge
- The guidance applies to a specific type of work (e.g., testing, deployment)

**File naming:** Use the pattern `topic-name.instructions.md`

**Required frontmatter:**

```yaml
---
description: Brief description of what this file covers
applyTo: Glob patterns for files this applies to (e.g., **/*.ts, packages/**/*)
---
```

### Instruction File Structure

```markdown
---
description: [Clear, concise description]
applyTo: [Relevant file patterns]
---

# [Topic Name] Instructions

## [Section Name]

### When to Use

Clear criteria for when this applies.

### How to Implement

Step-by-step or code examples.

### Rationale

Why we do it this way.

## Common Pitfalls

What to avoid and why.
```

### Content Guidelines

- **Be Specific:** "Use `pnpm type-check` after TypeScript changes" vs. "verify your changes"
- **Be Declarative:** "Do X" vs. "You should consider X"
- **Be Complete:** Include all context needed to follow the instruction
- **Be Concise:** Remove unnecessary words while maintaining clarity
- **Include Examples:** Code samples help clarify abstract concepts
- **Explain Rationale:** Help readers understand the "why" behind non-obvious rules

### Keeping Instructions Updated

- Review instruction files when major architectural changes occur
- Remove outdated guidance promptly
- Keep examples in sync with actual codebase patterns
- Cross-reference related instruction files where appropriate
- Update copilot-instructions.md index when adding new files

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
