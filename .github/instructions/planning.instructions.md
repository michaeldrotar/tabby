---
description: Guidelines for creating plans, managing checklists, and defining done
applyTo: plans/**/*.md
---

# Planning & Execution Instructions

## When to Create Plans

- **Plan First:** When asked to perform a multi-step task, use the `manage_todo_list` tool to plan your work.
- **Create Plan Documents:** When asked to make a plan, or for substantial features/refactors that require detailed analysis, create a plan document in the `plans/` folder.

## Plan Document Guidelines

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

## Definition of Done

- Tasks are not complete until all related documentation, tests, and release notes are updated.
- For plans with checklists, ensure all items are checked off or explicitly deferred with rationale.
