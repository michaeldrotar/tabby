---
description: Guidelines for updating project documentation files
applyTo: README.md, PRIVACY.md, **/*.md
---

# Documentation Update Instructions

## When to Update Documentation

Documentation should be updated alongside the code changes that affect it. Do not mark tasks as complete until related documentation is updated.

## Documentation Files

### README.md

**Update when:**

- Adding or removing Chrome extension permissions
- Adding major features that users should know about
- Changing installation or setup procedures
- Modifying the project structure significantly

**Sections to check:**

- Permissions table (must stay in sync with manifest and PRIVACY.md)
- Features list
- Installation instructions
- Quick start guide

### PRIVACY.md

**Update when:**

- Adding or removing Chrome extension permissions
- Changing how user data is collected, stored, or used
- Adding third-party integrations or services
- Modifying data retention policies

**Requirements:**

- Must stay in sync with README.md permissions table
- Must stay in sync with actual permissions in `chrome-extension/manifest.ts`
- Explain the "why" behind each permission in user-friendly language

### Cross-File Consistency

When updating permissions:

1. Update `chrome-extension/manifest.ts` (source of truth for code)
2. Update `README.md` permissions table
3. Update `PRIVACY.md` with explanation

All three must be updated together - never update just one.

## Maintaining Instructions

When you learn important information during a conversation that would be valuable for future work (e.g., architectural decisions, workflow patterns, common pitfalls), update these instruction files to capture that knowledge.

This includes updates to:

- `copilot-instructions.md` - Project overview and index
- `RELEASE.md` - Release process and guidelines
- Any instruction files in `.github/instructions/` - Domain-specific guidance
