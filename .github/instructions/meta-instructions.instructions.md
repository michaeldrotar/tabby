# Creating Instructions & Documentation

## Purpose

This file provides guidelines for creating and maintaining instruction files (skills) that help AI assistants work effectively on this project.

## What Are Instruction Files?

Instruction files are markdown documents that encode:

- Domain expertise (e.g., "Chrome extension patterns")
- Process knowledge (e.g., "how to conduct releases")
- Architectural patterns (e.g., "component organization")
- Team conventions (e.g., "naming standards")

## File Organization

### Entry Point: copilot-instructions.md

- Keep this file lean - it should be a quick reference and router to other instruction files
- Include only essential project overview and technology stack
- Reference specialized instruction files for detailed guidance
- Think of it as a "table of contents" for all project knowledge

### Specialized Instruction Files

Store in `.github/instructions/` with descriptive names:

- `workflow.instructions.md` - Release management, planning, documentation
- `commands.instructions.md` - Which commands to run when
- `testing.instructions.md` - Testing practices and patterns
- `architecture.instructions.md` - Code organization and component design
- `chrome-extension.instructions.md` - Chrome extension specifics
- `reactjs.instructions.md` - React patterns and best practices
- `typescript-5-es2022.instructions.md` - TypeScript guidelines
- `meta-instructions.instructions.md` - This file, for creating instructions

## Writing Effective Instructions

### Structure

1. **Clear Headers:** Use hierarchical headers to organize content
2. **Actionable Guidance:** State what to do, not just what exists
3. **Examples:** Include code samples when helpful
4. **Rationale:** Explain the "why" behind non-obvious rules

### Content Guidelines

- **Be Specific:** "Use `pnpm type-check` after TypeScript changes" vs. "verify your changes"
- **Be Declarative:** "Do X" vs. "You should consider X"
- **Be Complete:** Include all context needed to follow the instruction
- **Be Concise:** Remove unnecessary words while maintaining clarity

### When to Create New Instructions

Create a new instruction file when:

- A topic is substantial enough to deserve its own focus (50+ lines)
- Multiple people or contexts will reference this knowledge
- The guidance applies to a specific type of work (e.g., testing, deployment)

Update existing files when:

- Learning new patterns that fit existing categories
- Clarifying ambiguous guidance
- Correcting outdated information

## Example Structure

```markdown
# [Topic Name] Instructions

## Overview

Brief description of what this file covers.

## [Principle/Pattern Name]

### When to Use

Clear criteria for when this applies.

### How to Implement

Step-by-step or code examples.

### Rationale

Why we do it this way.

## Common Pitfalls

What to avoid and why.
```

## Maintenance

- Review instruction files quarterly or when major architectural changes occur
- Remove outdated guidance promptly
- Keep examples in sync with actual codebase patterns
- Cross-reference related instruction files where appropriate
