# Workflow & Process Instructions

## Planning & Execution

### When to Create Plans

- **Plan First:** When asked to perform a multi-step task, use the `manage_todo_list` tool to plan your work.
- **Create Plan Documents:** When asked to make a plan, or for substantial features/refactors that require detailed analysis, create a plan document in the `plans/` folder.

### Plan Document Guidelines

**File Naming:**

- Format: `YYYY-MM-DD-short-descriptive-name-ai-model.md`
- Example: `2025-12-24-architecture-refactoring-claude-sonnet-4-5.md`
- Use current date, a short descriptive name, and include the AI model generating the plan
- **Ignore archived plans:** Do not reference or base work on plans in `plans/archived/`

**Plan Structure:**

- Include document header with Date, Model/Author, and Status
- Executive Summary section for overview
- **Always include a checklist** with concrete, actionable items
- Use checkboxes (`- [ ]` and `- [x]`) so work can be tracked as it progresses
- Check off items as they are completed during implementation
- Include rationale and context for decisions

**Example Plan Header:**

```markdown
# [Plan Title]

**Date:** December 25, 2025  
**Model:** Claude Sonnet 4.5  
**Status:** In Progress

## Executive Summary

[Brief overview]

## Checklist

- [ ] Item 1: Description
- [ ] Item 2: Description
- [x] Item 3: Completed description
```

### Definition of Done

- Tasks are not complete until all related documentation, tests, and release notes are updated.
- For plans with checklists, ensure all items are checked off or explicitly deferred with rationale.

## Release Management

- **Update Release Notes:** If the task involves a user-facing change or a bug fix for a previously released feature, you **MUST** include a todo item to update the relevant release note file in `product/releases/`.
  - **Version Source of Truth:** Always trust the current version in `package.json` when finding the release note file. The version is always updated first before adding release notes.
  - **One File Per Version:** Do not create multiple release note files for the same version. Append your notes to the existing `v<version>-*.md` file for the current version.
  - **Bug Fixes:** Only document fixes for bugs that existed in previous releases. Do not document fixes for issues introduced and resolved during current development.
  - **File Naming:** The slug in the filename (e.g., `v1.2.0-tab-manager-settings.md`) is set during the release process, not during development. The initial template uses a generic slug that gets renamed when finalizing the release.
  - **Writing Guidelines:** See the "Release Notes" section in `RELEASE.md` for how to write effective, user-focused release notes.
  - Do not mark the task as complete until this is done.
- **Release Process:** When asked about releases, version bumps, or preparing for release, refer to `RELEASE.md` for the complete release process.

## Documentation Updates

- Permission or privacy changes should update both `README.md` (permissions table) and `PRIVACY.md`.
- Major feature additions should update `README.md`.

## Meta: Maintaining Instructions

- **Keep Instructions Updated:** When you learn important information during a conversation that would be valuable for future work (e.g., architectural decisions, workflow patterns, common pitfalls), update these instructions to capture that knowledge.
- This includes updates to copilot-instructions.md, RELEASE.md, or other documentation files as appropriate.
