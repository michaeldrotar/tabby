# Tab Manager: Selection System & Contextual Actions

**Date:** December 30, 2025  
**Model:** Claude Sonnet 4.5  
**Status:** Not Started

## Executive Summary

This plan implements a comprehensive selection and action system for the tab manager that supports:

- **Multi-selection** across windows, groups, and tabs with intuitive keyboard and mouse controls
- **Semi-selection states** to show items within selected containers
- **Contextual actions toolbar** with adaptive display based on selection type
- **Progressive action implementation** starting with Close and building to full feature set
- **Two view modes:** Split view (windows + tabs) and Tree view (unified list) with toggle

The implementation prioritizes keyboard accessibility, clear visual feedback, and progressive enhancement. We start with the foundation (selection mechanism) and build complexity incrementally (visual states → first action → toolbar → menu → remaining actions).

## Problem Statement

**Current State:**

- Tab manager uses context menus (Shift+Enter) for actions, which:
  - Often overflow off-screen in narrow sidebars (280-360px)
  - Don't support multi-selection well
  - Require opening/closing for each action
  - Hide keyboard shortcuts from discovery

**User Needs:**

- Bulk operations on multiple tabs/groups/windows
- Keyboard-first workflow with discoverable shortcuts
- Clear visual feedback on what's selected
- Understanding what actions apply to current selection
- Fast access to common actions without opening menus

**Success Metrics:**

- User can select and act on 10+ tabs in < 5 seconds (vs 30+ seconds with individual context menus)
- 80% of actions accessible via toolbar without opening menu
- Zero off-screen clipping issues
- Keyboard shortcuts visible on every action

## Solution Overview

### Selection System

**Keyboard Selection:**

- Space: Toggle selection on focused item
- Shift+Up/Down: Range select from anchor point
- Cmd/Ctrl+Click: Toggle individual selection
- Shift+Click: Range select to clicked item
- Cmd/Ctrl+A: Select all (context-dependent)
- Cmd/Ctrl+X: Cut selection (for moving)
- Cmd/Ctrl+C: Copy selection (for duplicating)
- Cmd/Ctrl+V: Paste cut/copied items
- Escape: Clear selection

**Visual States:**

- ☑ Explicitly selected (blue highlight + checked checkbox)
- ◐ Semi-selected (gray highlight + indeterminate checkbox, items within selected containers)
- ☐ Not selected

**Smart Container Logic:**

- Selecting a window semi-selects all its tabs
- Explicitly selecting 2 tabs within selected window shows difference
- Deselecting window keeps explicitly selected tabs selected

### Adaptive Actions Toolbar

```
┌──────────────────────────────────────────┐
│ [🔍] [⚙️] │ [Pin] [Mute] [✕] [⋮]   [2]  │ ← 40px height
│   Fixed   │    Contextual         Badge  │
└──────────────────────────────────────────┘
```

**Fixed Actions:**

- Search (🔍): Opens existing tab search feature
- Settings (⚙️): Opens existing tab manager settings

_Note: These are buttons that open existing UI, not new features to implement_

**Contextual Actions:**

- Change based on selection type (tabs vs groups vs windows)
- Most common actions visible as icon buttons with tooltips
- Overflow to 3-dot menu at narrow widths
- Badge shows selection count

**3-Dot Menu:**

- Always contains ALL contextual actions (even ones visible in toolbar)
- Shows keyboard shortcuts next to each action
- Grouped by action type
- Scrollable if needed

### View Modes

**Split View (Default):**

- Windows list on left (80-100px)
- Selected window's tabs/groups on right
- Familiar two-pane navigation

**Tree View (Toggle):**

- Single unified list with collapsible windows
- All windows visible simultaneously
- Easier multi-window selection

Toggle button in top-left of windows pane

---

## Checklist

### Phase 1: Selection Foundation (Core Mechanism)

- [ ] Create selection state management in `packages/shared/lib/selection/`
  - [ ] `SelectionState.ts` - Zustand store for selected items
  - [ ] `SelectionTypes.ts` - Types for windows, groups, tabs selection
  - [ ] `selectionUtils.ts` - Helper functions for categorizing, analyzing containment
- [ ] Implement basic Space bar selection (simplest to start)
  - [ ] Add Space key handler in `useKeyboardNavigation.ts`
  - [ ] Toggle selection on focused item (window, group, or tab)
  - [ ] Update selection state
- [ ] Implement Escape key to clear selection
  - [ ] Add Escape key handler
  - [ ] Clear all selection when Escape pressed
  - [ ] Return focus to last focused item
- [ ] Add visual checkbox UI to all items
  - [ ] Update `WindowButton.tsx` to show checkbox
  - [ ] Update `TabGroup.tsx` to show checkbox
  - [ ] Update `TabItem.tsx` to show checkbox
  - [ ] Checkboxes hidden by default, visible on hover or when any item selected
- [ ] Test basic selection works with keyboard navigation

### Phase 2: Selection Visual States

- [ ] Implement explicit selection (☑) styling
  - [ ] Blue highlight background
  - [ ] Checked checkbox state
  - [ ] Update `TabItem`, `TabGroup`, `WindowButton` styling
- [ ] Implement semi-selection (◐) detection logic
  - [ ] `getSemiSelectedItems()` - detect items within selected containers
  - [ ] Return list of semi-selected IDs based on selection hierarchy
- [ ] Apply semi-selection (◐) styling
  - [ ] Gray highlight background
  - [ ] Indeterminate checkbox state
  - [ ] Ensure visual distinction from explicit selection
- [ ] Add selection badge component
  - [ ] Create `SelectionBadge.tsx` in `packages/ui/lib/tab-manager/`
  - [ ] Show count based on selection type
  - [ ] Smart display: "5 tabs" vs "2 groups (8 tabs)" vs "1 window (12 tabs)"
- [ ] Test visual feedback is clear and intuitive

### Phase 3: Advanced Selection Methods

- [ ] Implement Shift+Up/Down range selection
  - [ ] Track anchor point (first selected item)
  - [ ] Select all items between anchor and current focus
  - [ ] Update keyboard handler in `useKeyboardNavigation.ts`
- [ ] Implement Cmd/Ctrl+Click toggle selection
  - [ ] Add click handler to items with Cmd/Ctrl modifier check
  - [ ] Toggle individual selection on click
- [ ] Implement Shift+Click range selection
  - [ ] Add click handler with Shift modifier check
  - [ ] Select from last selected to clicked item
- [ ] Add "Select All" shortcut (Cmd+A)
  - [ ] In tree view: Select all windows, groups, and tabs
  - [ ] In split view (windows pane focused): Select all windows
  - [ ] In split view (tabs pane focused): Select all tabs/groups in current window
  - [ ] Context-aware based on which pane/view has focus
- [ ] Test all selection methods work together correctly

### Phase 4: Toolbar Foundation & Close Action

- [ ] Create adaptive toolbar component
  - [ ] `AdaptiveToolbar.tsx` in `packages/ui/lib/tab-manager/`
  - [ ] Fixed section: Search + Settings buttons
  - [ ] Contextual section: Dynamic action buttons
  - [ ] Badge display: Selection count
  - [ ] Handle width breakpoints (280px, 320px, 360px)
- [ ] Add fixed action buttons
  - [ ] Search button with icon + tooltip
  - [ ] Settings button with icon + tooltip
- [ ] Implement Close action (first contextual action)
  - [ ] Create `CloseButton.tsx` with icon + tooltip
  - [ ] Show "Close" in tooltip with shortcut (Delete/Backspace)
  - [ ] Implement close logic for single tab/group/window
  - [ ] Implement bulk close for multiple items
  - [ ] Handle mixed selections (close all selected items)
- [ ] Add close confirmation for large selections
  - [ ] Create `ConfirmDialog.tsx` component
  - [ ] Show when closing 10+ tabs or 3+ windows
  - [ ] Display count: "Close 15 tabs?" with Confirm/Cancel
  - [ ] Allow "Don't ask again" preference
- [ ] Add keyboard shortcut for Close (Delete/Backspace keys)
  - [ ] Update keyboard handler to accept both Delete and Backspace
  - [ ] Trigger close on selected items
  - [ ] Show "Del" in UI for brevity
- [ ] Test Close works for all selection types
  - [ ] Single tab, group, window
  - [ ] Multiple tabs, groups, windows
  - [ ] Mixed selections
  - [ ] Semi-selected items (container logic)

### Phase 5: 3-Dot Menu Foundation

- [ ] Create 3-dot menu component
  - [ ] `ActionsMenu.tsx` in `packages/ui/lib/tab-manager/`
  - [ ] Use shadcn DropdownMenu component
  - [ ] Position below button, handle positioning near edges
- [ ] Implement contextual action filtering
  - [ ] `getContextualActions()` - filter actions by selection type
  - [ ] Handle pure selections (tabs only, groups only, windows only)
  - [ ] Handle mixed selections (show only common actions)
  - [ ] Handle container selections (show container actions)
- [ ] Add Close action to menu
  - [ ] Show "Close" with Del shortcut
  - [ ] Group under appropriate section (Tab/Group/Window Actions)
  - [ ] Trigger same close logic as toolbar button
- [ ] Add keyboard shortcut display to menu items
  - [ ] Show shortcuts right-aligned (e.g., "Close Tab X")
  - [ ] Use `Kbd` component for visual consistency
- [ ] Test menu opens/closes correctly
- [ ] Test menu shows correct actions based on selection

### Phase 6: View Toggle (Split vs Tree)

- [ ] Create view mode state
  - [ ] Add to `KeyboardState` or new view state store
  - [ ] Persist preference in localStorage
- [ ] Implement Tree view layout
  - [ ] Create `TreeView.tsx` component
  - [ ] Render windows as collapsible sections
  - [ ] Render groups and tabs nested with proper indentation
  - [ ] Add expand/collapse chevrons for windows and groups
- [ ] Implement Split view layout (existing, refactor as needed)
  - [ ] Ensure works with new selection system
  - [ ] Window list on left, tabs on right
- [ ] Create toggle button
  - [ ] Position in top-left corner of windows pane
  - [ ] Icon: [≡] for split view, [⊟] for tree view
  - [ ] Toggle between modes on click
  - [ ] Show tooltip: "Switch to tree view" / "Switch to split view"
- [ ] Update keyboard navigation for tree view
  - [ ] Up/Down navigates all items in tree order
  - [ ] Left collapses focused window/group, Right expands
  - [ ] Cmd+Left collapses all windows/groups, Cmd+Right expands all
  - [ ] Works alongside UI chevron clicks
  - [ ] No Left/Right pane switching in tree mode
  - [ ] Note: Cmd+Left/Right may conflict with Mac text navigation; test and consider Alt+Left/Right as alternative
- [ ] Add expand/collapse keyboard shortcuts to split view
  - [ ] Left/Right collapse/expand focused group in tabs pane
  - [ ] Cmd+Left/Right collapse/expand all groups in current window
  - [ ] Consider Alt+Left/Right if Cmd modifier conflicts on Mac
- [ ] Test both views work with selection system
- [ ] Test toggle preserves selection state

### Phase 7: Tab Actions (High Priority)

- [ ] Implement Pin/Unpin action
  - [ ] Add to toolbar (icon: pin symbol)
  - [ ] Add to menu with shortcut (P)
  - [ ] Single tab: toggle pin state
  - [ ] Bulk tabs: pin all or unpin all (based on majority state)
  - [ ] Add keyboard shortcut handler (P key)
- [ ] Implement Mute/Unmute action
  - [ ] Add to toolbar (icon: mute/unmute symbol)
  - [ ] Add to menu with shortcut (M)
  - [ ] Single tab: toggle mute state
  - [ ] Bulk tabs: mute all or unmute all
  - [ ] Add keyboard shortcut handler (M key)
- [ ] Implement Reload action
  - [ ] Add to menu with shortcut (R)
  - [ ] Single tab: reload
  - [ ] Bulk tabs: reload all selected
  - [ ] Add keyboard shortcut handler
- [ ] Implement Copy URL action
  - [ ] Add to menu with shortcut (C)
  - [ ] Single tab: copy URL to clipboard
  - [ ] Bulk tabs: copy URLs separated by newlines
  - [ ] Show toast notification: "Copied X URLs"
  - [ ] Add keyboard shortcut handler
- [ ] Implement Copy Title action
  - [ ] Add to menu with shortcut (Shift+C)
  - [ ] Single tab: copy title to clipboard
  - [ ] Bulk tabs: copy titles separated by newlines
  - [ ] Add keyboard shortcut handler
- [ ] Implement Cut action (for moving)
  - [ ] Add to menu with shortcut (Cmd/Ctrl+X)
  - [ ] Store cut items in clipboard state
  - [ ] Show visual indicator on cut items (faded/dashed outline)
  - [ ] Clear cut state after paste or new selection
- [ ] Implement Paste action (for cut items)
  - [ ] Add to menu with shortcut (Cmd/Ctrl+V)
  - [ ] Move cut tabs/groups to focused location or window
  - [ ] Show where paste will occur (before/after focused item)
  - [ ] Clear cut state after paste
- [ ] Implement Copy/Paste for Duplicate
  - [ ] Cmd/Ctrl+C stores items for duplication (different from Cut)
  - [ ] Cmd/Ctrl+V duplicates copied tabs at focused location
  - [ ] Distinguish between cut (move) and copy (duplicate) clipboard states
  - [ ] Show toast: "Duplicated 3 tabs" after paste
- [ ] Test all tab actions work correctly

### Phase 8: Tab Movement Actions

- [ ] Implement Move to Window action
  - [ ] Add to menu with shortcut (W)
  - [ ] Show submenu or dialog with available windows
  - [ ] Single tab: move to selected window
  - [ ] Bulk tabs: move all to selected window
  - [ ] Create `WindowSelector.tsx` component if needed
  - [ ] Add keyboard shortcut handler
- [ ] Implement Add to Group action
  - [ ] Add to menu with shortcut (G)
  - [ ] Show submenu with existing groups + "New Group" option
  - [ ] Single tab: add to selected group
  - [ ] Bulk tabs: add all to selected/new group
  - [ ] Create `GroupSelector.tsx` component if needed
  - [ ] Add keyboard shortcut handler
- [ ] Implement Remove from Group action
  - [ ] Add to menu with shortcut (U)
  - [ ] Only show for tabs that are in groups
  - [ ] Single tab: remove from group
  - [ ] Bulk tabs: remove all from their groups
  - [ ] Add keyboard shortcut handler
- [ ] Implement Open in New Window action
  - [ ] Add to menu with shortcut (N)
  - [ ] Single tab: extract to new window
  - [ ] Bulk tabs: extract all to new window
  - [ ] Add keyboard shortcut handler
- [ ] Test movement actions preserve focus and selection

### Phase 9: Group Actions

- [ ] Implement Reload All Tabs action (group level)
  - [ ] Add to menu with shortcut (R)
  - [ ] Single group: reload all tabs in group
  - [ ] Bulk groups: reload all tabs in all selected groups
  - [ ] Consistent with tab-level R (reload) and window-level R (reload all)
  - [ ] Add keyboard shortcut handler
- [ ] Implement Rename Group action
  - [ ] Add to menu with shortcuts (Shift+R or F2)
  - [ ] Only enabled for single group selection
  - [ ] Show dialog (not inline edit) with current name pre-filled
  - [ ] Update group name via Chrome API
  - [ ] Add keyboard shortcut handlers for both Shift+R and F2
  - [ ] F2 follows standard file system rename convention
- [ ] Implement Change Color action
  - [ ] Add to menu with shortcut (Shift+C)
  - [ ] Single group: show color picker
  - [ ] Bulk groups: apply same color to all
  - [ ] Create `ColorPicker.tsx` if not exists
  - [ ] Show Chrome's tab group colors
  - [ ] Add keyboard shortcut handler
  - [ ] Shift+C avoids conflict with Cmd+C (Copy)
- [ ] Implement Ungroup action
  - [ ] Add to menu with shortcut (U)
  - [ ] Single group: ungroup all tabs
  - [ ] Bulk groups: ungroup all selected groups
  - [ ] Add keyboard shortcut handler
- [ ] Implement Merge Groups action
  - [ ] Add to menu with shortcut (M)
  - [ ] Only enabled for 2+ group selection
  - [ ] Merge all selected groups into first group
  - [ ] Prompt for merged group name/color
  - [ ] Add keyboard shortcut handler
- [ ] Implement Copy URLs (group level)
  - [ ] Add to menu
  - [ ] Copy all URLs from tabs in selected groups
  - [ ] Show count in toast: "Copied 15 URLs from 2 groups"
- [ ] Test group actions work correctly

### Phase 10: Window Actions

- [ ] Implement Focus/Activate Window action
  - [ ] Add to menu with shortcut (Enter)
  - [ ] Only enabled for single window
  - [ ] Bring window to front and focus it
  - [ ] Add keyboard shortcut handler (Enter key)
- [ ] Implement Minimize/Maximize actions
  - [ ] Add to menu with shortcuts (H for minimize, F for maximize)
  - [ ] Single window: minimize or maximize
  - [ ] Bulk windows: minimize/maximize all
  - [ ] Add keyboard shortcut handlers
- [ ] Implement Mute All Tabs action
  - [ ] Add to menu with shortcut (M)
  - [ ] Single window: mute all tabs in window
  - [ ] Bulk windows: mute all tabs in all windows
  - [ ] Add keyboard shortcut handler
- [ ] Implement Unmute All Tabs action
  - [ ] Add to menu with shortcut (Shift+M)
  - [ ] Mirror of mute action
  - [ ] Add keyboard shortcut handler
- [ ] Implement Reload All Tabs action
  - [ ] Add to menu with shortcut (R)
  - [ ] Single window: reload all tabs
  - [ ] Bulk windows: reload all tabs in all windows
  - [ ] Add confirmation for large counts
  - [ ] Add keyboard shortcut handler
- [ ] Implement Copy All URLs action
  - [ ] Add to menu with shortcut (C)
  - [ ] Copy URLs from all tabs in selected windows
  - [ ] Show count in toast
  - [ ] Add keyboard shortcut handler
- [ ] Implement Pin All Tabs action
  - [ ] Add to menu with shortcut (P)
  - [ ] Pin all tabs in selected windows
  - [ ] Add keyboard shortcut handler
- [ ] Test window actions work correctly

### Phase 11: Toolbar Responsiveness & Overflow

- [ ] Implement width breakpoint detection
  - [ ] Use ResizeObserver on toolbar container
  - [ ] Track current width in component state
  - [ ] Define breakpoint thresholds: 280px, 320px, 360px
- [ ] Implement action overflow logic
  - [ ] At 280px: Show only Close in toolbar, rest in menu
  - [ ] At 320px: Show Pin + Mute + Close in toolbar
  - [ ] At 360px+: Show Pin + Mute + Close + more if space allows
  - [ ] Always show 3-dot menu button
- [ ] Update toolbar rendering
  - [ ] Conditionally render action buttons based on width
  - [ ] Ensure 3-dot menu always contains all actions
  - [ ] Test smooth transitions when resizing
- [ ] Implement icon-only mode for narrow widths
  - [ ] Show only icons when < 300px
  - [ ] Show icon + label when >= 300px
  - [ ] Ensure tooltips work in icon-only mode
- [ ] Test toolbar at all widths (280px to 400px)

### Phase 12: Tooltips & Keyboard Hints

- [ ] Implement tooltip system for toolbar buttons
  - [ ] Use shadcn Tooltip component
  - [ ] Show on hover
  - [ ] Show on keyboard focus (Tab to toolbar, arrow keys to buttons)
  - [ ] Format: "Action Name (Shortcut)"
  - [ ] Example: "Pin Tab (P)" or "Mute Tab (M)"
- [ ] Add tooltips to all toolbar buttons
  - [ ] Search: "Search Tabs" (opens existing feature, no new shortcut)
  - [ ] Settings: "Tab Manager Settings" (opens existing feature)
  - [ ] Pin: "Pin Tab(s) (P)"
  - [ ] Mute: "Mute Tab(s) (M)"
  - [ ] Close: "Close Selection (Del)"
  - [ ] 3-dot menu: "More Actions"
- [ ] Update tooltip text based on selection
  - [ ] Single tab: "Pin Tab (P)"
  - [ ] Multiple tabs: "Pin 5 Tabs (P)"
  - [ ] Group: "Pin Group (P)" (pins all tabs in group)
  - [ ] Mixed: "Pin Selection (P)"
- [ ] Add keyboard focus indicators
  - [ ] Blue ring around focused button in toolbar
  - [ ] Test Tab key cycles through toolbar buttons
  - [ ] Test arrow keys navigate within toolbar zone
- [ ] Test tooltips appear correctly and have correct text

### Phase 13: Keyboard Shortcut Conflicts & Refinement

- [ ] Audit all keyboard shortcuts for conflicts
  - [ ] Document all shortcuts in spreadsheet
  - [ ] Check for conflicts with Chrome defaults (list below)
  - [ ] Check for conflicts with system shortcuts
  - [ ] Resolve any overlaps
- [ ] Review Chrome standard shortcuts we must NOT override:
  - [ ] Cmd+T (New Tab), Cmd+W (Close Tab), Cmd+Shift+T (Reopen)
  - [ ] Cmd+R / F5 (Reload current page)
  - [ ] Cmd+L (Focus address bar)
  - [ ] Cmd+D (Bookmark)
  - [ ] Cmd+F (Find in page)
  - [ ] Cmd+1-9 (Switch to tab number)
  - [ ] Cmd+Option+Left/Right (Previous/Next tab)
  - [ ] Cmd+Shift+B (Toggle bookmarks bar)
  - [ ] Cmd+Y (History)
  - [ ] Cmd+Plus/Minus (Zoom)
  - [ ] Our shortcuts only work when tab manager has focus
- [ ] Implement shortcut scope/context
  - [ ] Shortcuts only work when tab manager has focus
  - [ ] Disable shortcuts when input fields focused
  - [ ] Disable shortcuts when dialogs open
- [ ] Add shortcut help dialog (optional)
  - [ ] Press ? key to show all shortcuts
  - [ ] Grouped by category (Selection, Tab Actions, Group Actions, etc.)
  - [ ] Searchable list
- [ ] Test all shortcuts work without conflicts

### Phase 14: Polish & Edge Cases

- [ ] Handle empty states
  - [ ] No tabs in window
  - [ ] No windows open (shouldn't happen but handle gracefully)
  - [ ] No selection: Show message "Select items to see actions"
- [ ] Handle performance with large selections
  - [ ] Test with 100+ tabs selected
  - [ ] Optimize rendering of checkboxes
  - [ ] Debounce selection updates if needed
- [ ] Handle rapid interactions
  - [ ] Prevent double-clicks from causing issues
  - [ ] Debounce keyboard shortcuts
  - [ ] Queue multiple actions properly
- [ ] Add loading states for async actions
  - [ ] Show spinner for bulk operations
  - [ ] Disable toolbar while action in progress
  - [ ] Show progress for very large operations (optional)
- [ ] Add error handling
  - [ ] Handle Chrome API errors gracefully
  - [ ] Show error toasts with retry option
  - [ ] Log errors for debugging
- [ ] Test edge cases
  - [ ] Closing last tab in window
  - [ ] Moving all tabs from window
  - [ ] Ungrouping while tabs are selected
  - [ ] Selection state after items are closed

### Phase 15: Accessibility Audit

- [ ] Add ARIA labels to all interactive elements
  - [ ] Checkboxes: "Select tab [title]"
  - [ ] Toolbar buttons: Proper role and labels
  - [ ] Menu items: Proper roles
- [ ] Test with screen reader (VoiceOver on macOS)
  - [ ] Ensure selection state is announced
  - [ ] Ensure actions are announced correctly
  - [ ] Ensure menu navigation works
- [ ] Test keyboard-only navigation
  - [ ] All features accessible without mouse
  - [ ] Focus indicators visible at all times
  - [ ] Focus trap works in dialogs/menus
- [ ] Verify color contrast meets WCAG AA
  - [ ] Check selection highlight colors
  - [ ] Check semi-selection colors
  - [ ] Check toolbar button colors
- [ ] Test with reduced motion preference
  - [ ] Disable animations if prefers-reduced-motion
  - [ ] Test selection changes still visible

### Phase 16: Testing & Bug Fixes

- [ ] Write unit tests for selection logic
  - [ ] Test selection state updates
  - [ ] Test containment detection
  - [ ] Test semi-selection calculation
- [ ] Write integration tests for actions
  - [ ] Test each action with single selection
  - [ ] Test each action with bulk selection
  - [ ] Test mixed selection scenarios
- [ ] Manual testing checklist
  - [ ] Test in split view mode
  - [ ] Test in tree view mode
  - [ ] Test at 280px width
  - [ ] Test at 360px width
  - [ ] Test with dark mode
  - [ ] Test with many windows (10+)
  - [ ] Test with many tabs (100+)
- [ ] Fix any bugs found during testing
- [ ] Performance profiling
  - [ ] Check render performance with large lists
  - [ ] Optimize if needed

### Phase 17: Documentation & Release

- [ ] Update README.md
  - [ ] Document new selection features
  - [ ] Document keyboard shortcuts
  - [ ] Add screenshots of toolbar and selection states
- [ ] Create keyboard shortcuts reference
  - [ ] Add to tab manager settings or help dialog
  - [ ] Printable/shareable format
- [ ] Write release notes
  - [ ] Update `product/releases/v[current]-*.md`
  - [ ] Highlight major features: Multi-selection, Bulk actions, New toolbar
  - [ ] Include GIFs/videos demonstrating features
- [ ] Remove old context menu code
  - [ ] Mark `TabContextMenu`, `TabGroupContextMenu`, `WindowContextMenu` as deprecated
  - [ ] Remove usage from TabManager after confirming new system works
  - [ ] Keep components in codebase temporarily for rollback if needed
- [ ] Final QA pass
  - [ ] Test on fresh Chrome profile
  - [ ] Test with various sidebar widths
  - [ ] Verify no console errors
  - [ ] Verify no regressions in existing features

---

## Action Reference

### Complete Action List

This table summarizes all actions across tabs, groups, and windows with their implementation details.

#### Tab Actions

| Action             | Shortcut   | Toolbar Priority | Bulk Support | Mixed Selection      | Implementation Notes                           |
| ------------------ | ---------- | ---------------- | ------------ | -------------------- | ---------------------------------------------- |
| Pin/Unpin          | P          | High             | ✅ Yes       | ✅ Acts on tabs only | Toggle pin state via chrome.tabs.update        |
| Mute/Unmute        | M          | High             | ✅ Yes       | ✅ Acts on tabs only | Toggle muted state via chrome.tabs.update      |
| Close              | Del/⌫      | Highest          | ✅ Yes       | ✅ All items         | chrome.tabs.remove(), confirmation for 10+     |
| Reload             | R          | Medium           | ✅ Yes       | ✅ Acts on tabs only | chrome.tabs.reload()                           |
| Copy URL           | C          | Medium           | ✅ Yes       | ✅ Acts on tabs only | Join URLs with \n, write to clipboard          |
| Copy Title         | Shift+C    | Low              | ✅ Yes       | ✅ Acts on tabs only | Join titles with \n, write to clipboard        |
| Cut                | Cmd/Ctrl+X | Medium           | ✅ Yes       | ⚠️ Pure tabs only    | Store in clipboard state for paste (move)      |
| Copy (Duplicate)   | Cmd/Ctrl+C | Low              | ✅ Yes       | ⚠️ Pure tabs only    | Store in clipboard state for paste (duplicate) |
| Paste              | Cmd/Ctrl+V | Medium           | N/A          | N/A                  | Move or duplicate tabs to focused location     |
| Move to Window     | W          | Medium           | ✅ Yes       | ⚠️ Pure tabs only    | Show window selector, chrome.tabs.move()       |
| Add to Group       | G          | Medium           | ✅ Yes       | ❌ N/A               | Show group selector, chrome.tabs.group()       |
| Remove from Group  | U          | Low              | ✅ Yes       | ❌ N/A               | chrome.tabs.ungroup()                          |
| Open in New Window | N          | Low              | ✅ Yes       | ⚠️ Pure tabs only    | chrome.windows.create() with tab IDs           |

#### Group Actions

| Action              | Shortcut              | Toolbar Priority | Bulk Support      | Mixed Selection        | Implementation Notes                                    |
| ------------------- | --------------------- | ---------------- | ----------------- | ---------------------- | ------------------------------------------------------- |
| Reload All Tabs     | R                     | Medium           | ✅ Yes            | ✅ Acts on groups only | Reload all tabs in selected groups                      |
| Rename              | Shift+R or F2         | Medium           | ❌ Single only    | ❌ N/A                 | Dialog with name input, chrome.tabGroups.update()       |
| Change Color        | Shift+C               | Medium           | ✅ Yes            | ❌ N/A                 | Show color picker, apply to all selected groups         |
| Expand/Collapse     | Left/Right or Chevron | UI + Keyboard    | ✅ Yes            | ❌ N/A                 | Left=collapse, Right=expand, chrome.tabGroups.update()  |
| Expand/Collapse All | Cmd+Left/Right        | Keyboard only    | N/A               | N/A                    | Collapse/expand all groups in current context           |
| Ungroup             | U                     | Medium           | ✅ Yes            | ❌ N/A                 | chrome.tabs.ungroup() for all tabs in groups            |
| Close               | Del/⌫                 | Highest          | ✅ Yes            | ✅ All items           | Close all tabs in selected groups                       |
| Move to Window      | W                     | Low              | ✅ Yes            | ⚠️ Pure groups only    | Move all tabs in groups to target window                |
| Copy URLs           | (None)                | Low              | ✅ Yes            | ✅ Acts on groups only | Copy URLs of all tabs in selected groups (menu only)    |
| Merge Groups        | (None)                | Low              | ✅ Bulk only (2+) | ❌ N/A                 | Merge selected groups into first, prompt for name/color |

#### Window Actions

| Action          | Shortcut | Toolbar Priority | Bulk Support   | Mixed Selection | Implementation Notes                                 |
| --------------- | -------- | ---------------- | -------------- | --------------- | ---------------------------------------------------- |
| Focus/Activate  | Enter    | High             | ❌ Single only | ❌ N/A          | chrome.windows.update({ focused: true })             |
| Close           | Del/⌫    | Highest          | ✅ Yes         | ✅ All items    | chrome.windows.remove()                              |
| Minimize        | H        | Low              | ✅ Yes         | ❌ N/A          | chrome.windows.update({ state: 'minimized' })        |
| Maximize        | F        | Low              | ✅ Yes         | ❌ N/A          | chrome.windows.update({ state: 'maximized' })        |
| Mute All Tabs   | M        | Medium           | ✅ Yes         | ⚠️ Windows only | Mute all tabs in selected windows                    |
| Unmute All Tabs | Shift+M  | Medium           | ✅ Yes         | ⚠️ Windows only | Unmute all tabs in selected windows                  |
| Reload All Tabs | R        | Low              | ✅ Yes         | ⚠️ Windows only | Reload all tabs in selected windows, confirm if many |
| Copy All URLs   | (None)   | Low              | ✅ Yes         | ⚠️ Windows only | Copy URLs from all tabs in selected windows (menu)   |
| Pin All Tabs    | P        | Low              | ✅ Yes         | ⚠️ Windows only | Pin all tabs in selected windows                     |

---

## Technical Architecture

### Selection State (`packages/shared/lib/selection/`)

```typescript
// SelectionTypes.ts
export type SelectionItemType = 'window' | 'group' | 'tab'

export interface SelectionItem {
  type: SelectionItemType
  id: number
  windowId: number // For groups and tabs
  groupId?: number // For tabs in groups
}

export interface SelectionState {
  items: SelectionItem[]
  anchorItem: SelectionItem | null // For range selection
}

// SelectionState.ts (Zustand store)
export interface SelectionStore {
  selection: SelectionState

  // Actions
  toggleSelection: (item: SelectionItem) => void
  setSelection: (items: SelectionItem[]) => void
  addToSelection: (item: SelectionItem) => void
  removeFromSelection: (id: number) => void
  clearSelection: () => void
  selectRange: (from: SelectionItem, to: SelectionItem) => void

  // Queries
  isSelected: (id: number) => boolean
  getSelectionCount: () => number
  hasSelection: () => boolean
}

// selectionUtils.ts
export function categorizeSelection(items: SelectionItem[]) {
  const windows = items.filter((i) => i.type === 'window')
  const groups = items.filter((i) => i.type === 'group')
  const tabs = items.filter((i) => i.type === 'tab')
  return { windows, groups, tabs }
}

export function getSemiSelectedItems(
  selection: SelectionItem[],
  allWindows: BrowserWindow[],
): number[] {
  // Returns IDs of items that are within selected containers
  const semiSelected: number[] = []

  const selectedWindowIds = selection
    .filter((s) => s.type === 'window')
    .map((s) => s.id)

  const selectedGroupIds = selection
    .filter((s) => s.type === 'group')
    .map((s) => s.id)

  // For each selected window, all its groups and tabs are semi-selected
  // Unless they're explicitly selected
  // Implementation details...

  return semiSelected
}

export function getTotalTabCount(selection: SelectionItem[]): number {
  // Calculate total tabs affected by selection
  // Accounts for windows and groups containing tabs
}
```

### Toolbar Component (`packages/ui/lib/tab-manager/`)

```typescript
// AdaptiveToolbar.tsx
interface AdaptiveToolbarProps {
  selection: SelectionItem[]
  onAction: (actionId: string) => void
}

export const AdaptiveToolbar = ({ selection, onAction }: AdaptiveToolbarProps) => {
  const [width, setWidth] = useState(360)
  const containerRef = useRef<HTMLDivElement>(null)

  useResizeObserver(containerRef, (entry) => {
    setWidth(entry.contentRect.width)
  })

  const contextualActions = getContextualActions(selection)
  const visibleActions = getVisibleActions(contextualActions, width)
  const badgeText = getBadgeText(selection)

  return (
    <div ref={containerRef} className="toolbar">
      {/* Fixed section */}
      <SearchButton />
      <SettingsButton />

      <Separator orientation="vertical" />

      {/* Contextual section */}
      {visibleActions.map(action => (
        <ActionButton key={action.id} action={action} onClick={() => onAction(action.id)} />
      ))}

      <ActionsMenu actions={contextualActions} onSelect={onAction} />

      {/* Badge */}
      {selection.length > 0 && <Badge>{badgeText}</Badge>}
    </div>
  )
}
```

### Keyboard Navigation Updates

```typescript
// useKeyboardNavigation.ts
export const useKeyboardNavigation = (
  onSelectWindow?: (windowId: number) => void,
  onActivateWindow?: (windowId: number) => void,
) => {
  const { selection, toggleSelection, selectRange, clearSelection } =
    useSelectionStore()

  const handleKeyDown = (e: KeyboardEvent) => {
    const activeElement = document.activeElement as HTMLElement

    // Space bar: Toggle selection
    if (e.key === ' ') {
      e.preventDefault()
      const navItem = activeElement?.closest('[data-nav-type]') as HTMLElement
      if (navItem) {
        const item = getSelectionItemFromElement(navItem)
        toggleSelection(item)
      }
      return
    }

    // Shift+Up/Down: Range selection
    if (e.shiftKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault()
      // Get current and target items, call selectRange
      return
    }

    // Action shortcuts (when items selected)
    if (selection.items.length > 0) {
      if (e.key === 'x' || e.key === 'X') {
        onCloseSelection()
        return
      }
      if (e.key === 'p' || e.key === 'P') {
        onPinSelection()
        return
      }
      // ... other shortcuts
    }

    // Existing navigation logic
    // ...
  }

  // ... rest of hook
}
```

---

## User Stories

### Story 1: Bulk Tab Management

**As a** researcher with 50+ tabs  
**I want to** select and close multiple outdated tabs at once  
**So that** I can clean up my workspace in seconds instead of minutes

**Acceptance Criteria:**

- [ ] I can select 10 tabs using Shift+Click or Shift+arrows
- [ ] I see a visual confirmation that all 10 are selected
- [ ] I press Delete key and they all close
- [ ] The operation takes < 5 seconds total

**Why this matters:** Current workflow requires right-click → close on each tab individually, taking 30+ seconds. Bulk selection + single action = 10x faster.

### Story 2: Keyboard Discovery

**As a** keyboard-first developer  
**I want to** see keyboard shortcuts for actions without searching documentation  
**So that** I can learn shortcuts organically while using the tool

**Acceptance Criteria:**

- [ ] When I hover over a toolbar action, I see its shortcut in the tooltip
- [ ] When I open the 3-dot menu, all shortcuts are visible next to actions
- [ ] Shortcuts work immediately after seeing them
- [ ] No action requires memorizing hidden shortcuts

**Why this matters:** Keyboard users abandon tools with poor shortcut discoverability. Making shortcuts visible = higher adoption and faster workflows.

### Story 3: Clear Selection Feedback

**As a** general user  
**I want to** understand what I've selected and what will be affected  
**So that** I don't accidentally close the wrong tabs

**Acceptance Criteria:**

- [ ] Selected items have clear blue highlights and checkboxes
- [ ] When I select a window, I see all its tabs are semi-selected (gray)
- [ ] The badge shows "1 window (15 tabs)" so I know the impact
- [ ] Before bulk closing, I see a confirmation with the count

**Why this matters:** Users fear bulk operations due to potential mistakes. Clear visual feedback + confirmation = confidence to use powerful features.

---

## Success Metrics

**Performance:**

- Selection + action on 10 tabs: < 5 seconds (vs 30+ seconds with individual context menus)
- Toolbar renders without flicker at all widths
- No performance degradation with 100+ tabs selected

**Usability:**

- 80% of actions accessible via toolbar (not requiring menu open)
- All keyboard shortcuts visible without documentation
- Zero off-screen clipping issues at any sidebar width

**Adoption:**

- 50% of users try multi-select within first week
- 30% of users perform bulk close within first week
- Average bulk operation: 5+ items at once

---

## Out of Scope (Future Enhancements)

- Undo/redo for closed items (rely on Chrome's recently closed)
- Custom keyboard shortcut mapping
- Saved selection sets or "smart groups"
- Drag-and-drop for bulk moves
- Persistent selection across sidebar close/open
- Selection history or "select similar"

---

## Open Questions

None at this time. Design is well-defined and ready for implementation.

---

## Notes

### Design Decisions

1. **Space bar for selection:** Chosen over Cmd+Click as primary method because it's keyboard-friendly and doesn't conflict with existing patterns.

2. **Semi-selection state:** Critical for showing container relationships. Without it, users can't tell if individual tabs are selected or just their parent window.

3. **Close action first:** Close is the most common bulk action, applies to all item types, and requires confirmation logic - perfect foundation for the action system.

4. **3-dot menu always has all actions:** Consistency is more important than reducing duplication. Users should always know where to find actions.

5. **Icon buttons with tooltips:** Balance between saving space and maintaining discoverability. Icons are compact, tooltips show names and shortcuts.

6. **View toggle:** Different users have different mental models. Split view = familiar, tree view = power users. Let them choose.

7. **Delete/Backspace for close:** X is too easy to accidentally hit for such a destructive action. Delete is more deliberate and aligns with file deletion patterns.

8. **R key consistency:** R always means "reload" (tabs, groups, windows). Rename uses Shift+R since it's less common and avoids conflict with Chrome's Cmd/Ctrl+R (reload current tab).

9. **Cut/Copy/Paste for tab manipulation:** Familiar paradigm from file systems. Cut = move, Copy+Paste = duplicate. More discoverable than custom shortcuts.

10. **Select All is context-aware:** Tree view = everything, Split view = current pane scope. Matches user's mental model of what's visible/focused.

11. **Avoid Chrome shortcut conflicts:** Never repurpose standard Chrome shortcuts (Cmd/Ctrl+R = reload, Cmd/Ctrl+T = new tab, etc.). Use modifiers (Shift) or different keys to prevent unexpected behavior.

12. **F2 for rename:** Standard across file systems (Windows Explorer, macOS Finder, VS Code). Shift+R as alternative maintains R=reload consistency.

13. **Escape to clear selection:** Standard cancellation key across all UIs. Returns user to neutral state without closing sidebar.

### Implementation Order Rationale

The phases are ordered to:

1. Build foundation first (selection state, visual feedback)
2. Prove the pattern with one complete action (Close)
3. Add infrastructure (toolbar, menu)
4. Scale to all actions progressively
5. Polish and refine

Each phase builds on the previous, ensuring we can test and validate before adding complexity.
