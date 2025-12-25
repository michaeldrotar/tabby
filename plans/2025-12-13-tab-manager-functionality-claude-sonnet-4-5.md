# Tab Manager Functionality

**Date:** December 13, 2025  
**Model:** Claude Sonnet 4.5  
**Status:** Draft

## Checklist

### Core Interaction Model

- [ ] Implement mouse interaction (click selects mode)
- [ ] Implement optional mouse interaction (click activates mode)
- [ ] Implement baseline keyboard navigation (Up/Down/Left/Right)
- [ ] Implement keyboard selection (Space to toggle)
- [ ] Implement keyboard activation (Enter)

### Shortcut Policy

- [ ] Implement default modifier shortcuts mode
- [ ] Implement optional no-modifier shortcuts mode
- [ ] Add search activation shortcuts

### Context Menu Actions

- [ ] Define context menu for windows
- [ ] Define context menu for tab groups
- [ ] Define context menu for tabs
- [ ] Implement multi-selection context menu behavior

### Configuration Options

- [ ] Add setting for click behavior (select vs activate)
- [ ] Add setting for shortcut style (modifier vs no-modifier)
- [ ] Add setting for selection mode (single-window vs cross-window)

## Overview

This plan consolidates proposed tab-management behaviors across multiple outlines, with Tabby-specific constraints:

- Single-click behavior is configurable:
  - Default: **click selects** (does not activate)
  - Option: **click activates**
- Shortcut style is configurable:
  - Default: **modifier shortcuts** (so typing starts search)
  - Option: **no-modifier shortcuts** (power-user mode; search needs an explicit shortcut)
- Selection mode is configurable:
  - Default: changing windows clears selection
  - Option: allow selecting tabs and tab groups across multiple windows
- **Native browser functionality only** (no window naming/labeling; no “save session” features here).
- **No inline row actions**. Row space is reserved for **status icons** (audio, muted, discarded, etc). Actions live in **context menus** and **keyboard shortcuts**.

## Definitions

- **Focus**: the currently keyboard-focused row.
- **Selection**: one or more rows targeted for bulk actions.
- **Activation**: switching to a window/tab in the browser.

## Interaction model

### Mouse (default: click selects)

- Click: focus + select the clicked item (single-selection), **no activation**.
- Double-click: activate window/tab.
- Cmd/Ctrl+Click: toggle selection membership (multi-select).
- Shift+Click: range-select within the same list.
- Right-click:
  - If item not selected: select it, then open context menu.
  - If selection already exists: open context menu for the selection.

### Mouse (option: click activates)

- Click: activates window/tab.
- Cmd/Ctrl+Click: toggle selection without activating.
- Shift+Click: range-select without activating.

### Keyboard (baseline)

- Up/Down: move focus within current list.
- Left/Right: switch pane focus (window list ⇄ tab list) when both are present.
- Home/End: jump focus to first/last in list.
- Enter: activate focused window/tab; for a tab group, toggle expand/collapse.
- Space: toggle selection of focused row.
- Escape: clear selection; if none, clear search.
- Context menu key (where available) / Shift+F10: open context menu for focus/selection.

## Shortcut policy

### Default: modifier shortcuts (recommended)

- Typing letters starts search (omnibar-style filtering).
- Action shortcuts use Ctrl/Cmd (and sometimes Shift).

### Optional: no-modifier shortcuts

- Letter shortcuts are enabled when the list has focus.
- Search must be explicit (e.g., Ctrl/Cmd+F or `/`).
- This mode increases conflicts risk; only enable if the user opts in.

---

# Functionality matrix

Legend:

- **Context**: where the action applies (Window / Tab Group / Tab)
- **Selection**: whether it applies to single vs multiple selection
- **Mouse** assumes default “click selects” mode.
- **Keyboard** shows baseline keys.
- **Shortcut** lists suggested default shortcuts for **modifier mode**.

| Functionality                  | Context                       | Selection                | Mouse interaction             | Keyboard interaction        | Shortcut (default: modifier mode)    |
| ------------------------------ | ----------------------------- | ------------------------ | ----------------------------- | --------------------------- | ------------------------------------ |
| Start search/filter            | Global                        | N/A                      | Type to search (list focused) | Focus search / begin typing | Ctrl/Cmd+F (or `/`)                  |
| Move focus                     | Any list                      | N/A                      | —                             | Up/Down                     | —                                    |
| Switch pane focus              | Global                        | N/A                      | —                             | Left/Right                  | —                                    |
| Activate window                | Window                        | Single                   | Double-click window row       | Enter                       | Enter                                |
| Activate tab                   | Tab                           | Single                   | Double-click tab row          | Enter                       | Enter                                |
| Expand/collapse group          | Tab Group                     | Single                   | Click group header            | Enter or Space              | Enter or Space                       |
| Open context menu              | Window/Group/Tab              | Single or Multiple       | Right-click                   | Shift+F10 (or Menu key)     | Shift+F10                            |
| Toggle selection               | Window/Group/Tab              | Single or Multiple       | Cmd/Ctrl+Click                | Space                       | Space                                |
| Range select                   | Window/Group/Tab              | Multiple                 | Shift+Click                   | Shift+Up/Down               | Shift+Up/Down                        |
| Select all (current list)      | Tab list (and/or window list) | Multiple                 | —                             | Ctrl/Cmd+A                  | Ctrl/Cmd+A                           |
| Clear selection                | Global                        | N/A                      | Click empty area (optional)   | Escape                      | Escape                               |
| Close tab(s)                   | Tab                           | Single or Multiple       | Context menu                  | Close focused/selected      | Ctrl/Cmd+Shift+W                     |
| Close window                   | Window                        | Single                   | Context menu                  | Close focused window        | Ctrl/Cmd+Shift+Backspace (suggested) |
| Close tab group                | Tab Group                     | Single                   | Context menu                  | Close focused group         | (menu)                               |
| Close other tabs               | Tab                           | Single                   | Context menu                  | Run on focused tab          | (menu)                               |
| Close tabs to the right        | Tab                           | Single                   | Context menu                  | Run on focused tab          | (menu)                               |
| Pin/unpin tab(s)               | Tab                           | Single or Multiple       | Context menu                  | Toggle on selection         | Ctrl/Cmd+Shift+P                     |
| Mute/unmute tab(s)             | Tab                           | Single or Multiple       | Context menu                  | Toggle on selection         | Ctrl/Cmd+Shift+M                     |
| Duplicate tab(s)               | Tab                           | Single or Multiple       | Context menu                  | Duplicate selection         | Ctrl/Cmd+Shift+D                     |
| Reload tab(s)                  | Tab                           | Single or Multiple       | Context menu                  | Reload selection            | Ctrl/Cmd+Shift+R                     |
| Discard tab(s) (if supported)  | Tab                           | Single or Multiple       | Context menu                  | Discard selection           | Ctrl/Cmd+Shift+X                     |
| Copy URL(s)                    | Tab                           | Single or Multiple       | Context menu                  | Copy selection URLs         | Ctrl/Cmd+Shift+C                     |
| Add to group…                  | Tab                           | Single or Multiple       | Context menu (submenu)        | Choose group target         | (menu)                               |
| New group from selection       | Tab                           | Multiple only            | Context menu                  | Create group                | Ctrl/Cmd+Shift+G                     |
| Remove from group (ungroup)    | Tab                           | Single or Multiple       | Context menu                  | Ungroup selection           | Ctrl/Cmd+Shift+U                     |
| Rename group                   | Tab Group                     | Single                   | Context menu                  | Begin rename                | F2                                   |
| Change group color             | Tab Group                     | Single                   | Context menu (submenu)        | Choose color                | (menu)                               |
| Move tab(s) to window…         | Tab                           | Single or Multiple       | Context menu (submenu)        | Choose target window        | Ctrl/Cmd+Shift+M                     |
| Move tab(s) to new window      | Tab                           | Single or Multiple       | Context menu                  | Move selection              | Ctrl/Cmd+Shift+N                     |
| Move group to new window       | Tab Group                     | Single                   | Context menu                  | Move group                  | (menu)                               |
| Mute/unmute all tabs in window | Window                        | Single                   | Context menu                  | Toggle for window           | (menu)                               |
| Reload all tabs in window      | Window                        | Single                   | Context menu                  | Reload all                  | (menu)                               |
| Move selected tabs here        | Window                        | Multiple (tabs selected) | Context menu on target window | Move selection              | (menu)                               |

Notes:

- Avoid relying on browser-reserved shortcuts (e.g., Ctrl/Cmd+W, Ctrl/Cmd+N) for the Tab Manager surface; show them only as “browser shortcuts” if helpful.
- Mixed-type selection (tabs + groups + windows) is out-of-scope; selection is assumed to be within the active list.

---

# Context menus (order + grouping + shortcuts)

Conventions:

- If multiple items are selected, the context menu applies to the **selection**.
- Menu shows shortcuts in the right-hand column.
- Items can be hidden when not applicable (e.g., “Remove from group” when ungrouped).

## Tab context menu (single tab)

Navigation

- Go to Tab (Enter)

---

Create

- Duplicate Tab (Ctrl/Cmd+Shift+D)
- Move to New Window (Ctrl/Cmd+Shift+N)

---

State

- Pin / Unpin (Ctrl/Cmd+Shift+P)
- Mute / Unmute (Ctrl/Cmd+Shift+M)
- Reload (Ctrl/Cmd+Shift+R)
- Discard (Ctrl/Cmd+Shift+X) (only if supported)

---

Grouping

- Add to Group >
  - New Group
  - (Existing groups)
- Remove from Group (Ctrl/Cmd+Shift+U) (only if grouped)

---

Move

- Move to Window > (Ctrl/Cmd+Shift+M)
  - (Existing windows)

---

Copy

- Copy URL (Ctrl/Cmd+Shift+C)
- Copy Title
- Copy Title + URL

---

Close

- Close Tab (Ctrl/Cmd+Shift+W)
- Close Other Tabs
- Close Tabs to the Right

## Tab context menu (multiple tabs selected)

Create

- Duplicate Tabs (Ctrl/Cmd+Shift+D)
- Move Tabs to New Window (Ctrl/Cmd+Shift+N)

---

State

- Pin / Unpin Tabs (Ctrl/Cmd+Shift+P)
- Mute / Unmute Tabs (Ctrl/Cmd+Shift+M)
- Reload Tabs (Ctrl/Cmd+Shift+R)
- Discard Tabs (Ctrl/Cmd+Shift+X) (only if supported)

---

Grouping

- New Group from Selection (Ctrl/Cmd+Shift+G)
- Add to Group >
  - (Existing groups)
- Remove from Group (Ctrl/Cmd+Shift+U) (only if applicable)

---

Move

- Move Tabs to Window > (Ctrl/Cmd+Shift+M)
  - (Existing windows)

---

Copy

- Copy URLs (Ctrl/Cmd+Shift+C)

---

Close

- Close Tabs (Ctrl/Cmd+Shift+W)

## Tab group context menu (single group)

View

- Expand / Collapse (Enter or Space)

---

Edit

- Rename Group (F2)
- Change Color >
  - (Supported chrome.tabGroups colors)

---

Structure

- Ungroup Tabs (Ctrl/Cmd+Shift+U)
- Move Group to New Window

---

Copy

- Copy URLs in Group (Ctrl/Cmd+Shift+C)

---

Close

- Close Group

## Window context menu (single window)

Navigation

- Focus Window (Enter)

---

Window actions

- Mute / Unmute All Tabs
- Reload All Tabs

---

Move selection

- Move Selected Tabs Here (only shown when tabs are selected)

---

Close

- Close Window

---

# Optional: no-modifier shortcuts (if user enables)

Only active when Tab Manager list has focus.

- `P`: Pin/unpin selected tabs
- `M`: Mute/unmute selected tabs
- `D`: Duplicate selected tabs
- `R`: Reload selected tabs
- `X`: Discard selected tabs (if supported)
- `G`: New group from selection / add to group (context-driven)
- `/`: Focus search

(These are intentionally not normative; the default remains modifier-mode to preserve type-to-search.)
