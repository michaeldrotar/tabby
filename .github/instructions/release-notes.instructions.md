---
description: When and how to update release notes for user-facing changes
applyTo: pages/**/*.{ts,tsx},product/releases/**/*.md
---

# Release Notes Instructions

## When to Update Release Notes

If the task involves a user-facing change or a bug fix for a previously released feature, you **MUST** include a todo item to update the relevant release note file in `product/releases/`.

**Important:** Do not mark the task as complete until release notes are updated.

## Guidelines

### Version Source of Truth

Always trust the current version in `package.json` when finding the release note file. The version is always updated first before adding release notes.

### One File Per Version

Do not create multiple release note files for the same version. Append your notes to the existing `v<version>-*.md` file for the current version.

### Bug Fixes

Only document fixes for bugs that existed in previous releases. Do not document fixes for issues introduced and resolved during current development.

### File Naming

The slug in the filename (e.g., `v1.2.0-tab-manager-settings.md`) is set during the release process, not during development. The initial template uses a generic slug that gets renamed when finalizing the release.

### Writing Guidelines

See the "Release Notes" section in `RELEASE.md` for how to write effective, user-focused release notes.

## Release Process

When asked about releases, version bumps, or preparing for release, refer to `RELEASE.md` for the complete release process.
