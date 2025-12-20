# Tabby Product Roadmap

**Date:** December 19, 2025  
**Author:** GitHub Copilot (Gemini 3 Flash (Preview))

## Vision

Tabby aims to be the ultimate keyboard-centric browser companion, providing a seamless vertical tab experience and lightning-fast search to help users manage tab overload without friction.

## Current State Analysis

Tabby has a solid foundation with a functional Omnibar and a multi-window Tab Manager. The architecture is modern (React 19, Tailwind, Vite) and privacy-focused. However, it currently lacks advanced management features that power users expect from a premium extension.

---

## Feature Backlog & Ranking

| Rank | Feature                    | Value  | Complexity | Description                                                              |
| :--- | :------------------------- | :----- | :--------- | :----------------------------------------------------------------------- |
| 1    | **Tab Hibernation**        | High   | Medium     | Manually or automatically discard inactive tabs to save memory.          |
| 2    | **Session Management**     | High   | High       | Save and restore sets of windows and tabs.                               |
| 3    | **Fuzzy Search & Filters** | High   | Medium     | Improve Omnibar search with fuzzy matching and `t:`, `b:`, `h:` filters. |
| 4    | **Duplicate Detection**    | Medium | Low        | Identify and close duplicate tabs across windows.                        |
| 5    | **Workspaces**             | Medium | High       | Logical grouping of tabs by project/context beyond native tab groups.    |
| 6    | **Visual Previews**        | Medium | Medium     | Tab thumbnails in the Tab Manager for easier recognition.                |
| 7    | **Custom Shortcuts**       | Low    | Medium     | Allow users to remap extension commands.                                 |

---

## Roadmap

### Phase 1: Performance & Core Utility (Q1 2026)

_Focus: Making Tabby the most efficient way to handle many tabs._

- **Tab Hibernation (Auto & Manual):**
  - Add "Discard Tab" action to context menus.
  - Implement background logic to auto-discard tabs after X minutes of inactivity.
  - Visual indicators for discarded tabs in the Tab Manager.
- **Omnibar Search Enhancements:**
  - Integrate fuzzy search library (e.g., Fuse.js) for better matching.
  - Implement search filters (`t:` for tabs, `b:` for bookmarks, `h:` for history).
- **Duplicate Tab Cleanup:**
  - Add a "Close Duplicates" action to the Tab Manager.

### Phase 2: Organization & Safety (Q2 2026)

_Focus: Helping users organize their work and never lose a session._

- **Session Manager:**
  - Ability to "Save Current Window" or "Save All Windows".
  - A new "Sessions" view in the Tab Manager to restore saved sessions.
  - Automatic session snapshots for crash recovery.
- **Tab Sorting:**
  - Sort tabs by Title, URL, or Last Accessed time within the Tab Manager.
- **Enhanced Tab Grouping:**
  - Drag-and-drop to create groups.
  - Quick-rename and color selection for groups.

### Phase 3: Advanced Experience (Q3 2026)

_Focus: Premium features and deep customization._

- **Workspaces:**
  - Create isolated "Workspaces" that can be switched between, hiding/showing relevant windows.
- **Visual Tab Manager ("The Gallery"):**
  - Implement tab thumbnails using `chrome.tabs.captureVisibleTab`.
  - Grid layout option for the Tab Manager.
- **Custom Command Palette:**
  - Allow users to define custom shortcuts for all Tabby actions.
  - Add more "Browser Actions" to the Omnibar (e.g., "Clear Cache", "Manage Extensions").

---

## Technical Debt & Infrastructure

- **Refactor Tab Manager State:** Move towards a more robust state management for multi-selection and bulk operations.
- **Thumbnail Caching:** Implement efficient storage for tab thumbnails to avoid performance hits.
- **Internationalization:** Expand locale support beyond English.
