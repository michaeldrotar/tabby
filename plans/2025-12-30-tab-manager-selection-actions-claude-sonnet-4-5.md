# Tab Manager: Selection System & Contextual Actions

**Date:** December 30, 2025  
**Model:** Claude Sonnet 4.5  
**Status:** Not Started

## Executive Summary

This plan implements a comprehensive selection and action system for the tab manager that supports:

- **Multi-selection** across windows, groups, and tabs with intuitive keyboard and mouse controls
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

### Selection System Architecture

**Location:** `pages/tab-manager/src/selection/`

- Not a generic package - specific to tab manager's browser entity hierarchy
- Follows YAGNI principle (only tab manager needs multi-selection currently)
- Can be extracted to `packages/shared` later if another feature needs it

**Store Design:**

```typescript
interface SelectionStore {
  // State: Sets for O(1) lookups
  windowIds: Set<number>
  groupIds: Set<number>
  tabIds: Set<number>

  // Mutations - single-ID methods (simple and clear)
  setWindow: (id: number) => void
  setGroup: (id: number) => void
  setTab: (id: number) => void
  setWindows: (ids: number[]) => void // For bulk operations like Select All
  setGroups: (ids: number[]) => void
  setTabs: (ids: number[]) => void

  addWindow: (id: number) => void
  addGroup: (id: number) => void
  addTab: (id: number) => void
  addWindows: (ids: number[]) => void // For range selections
  addGroups: (ids: number[]) => void
  addTabs: (ids: number[]) => void

  removeWindow: (id: number) => void
  removeGroup: (id: number) => void
  removeTab: (id: number) => void
  removeWindows: (ids: number[]) => void // For range deselections
  removeGroups: (ids: number[]) => void
  removeTabs: (ids: number[]) => void

  clear: () => void

  // Note: Zustand batches synchronous updates automatically

  // Queries
  getSelection: () => { windowIds; groupIds; tabIds }
  getTotalCount: () => number
  isWindowSelected: (id: number) => boolean
  isGroupSelected: (id: number) => boolean
  isTabSelected: (id: number) => boolean
}
```

**Key Architectural Decisions:**

1. **No anchor in store** - Anchor is interaction/layout state, managed in view layer with refs
2. **No range logic in store** - Store doesn't know visual order, view layer traverses DOM
3. **Declarative API** - Store receives "what to select", not "how user interacted"
4. **Pane-aware interactions** - Clicking different pane clears selection (predictable behavior)
5. **Selection is ephemeral** - Cleared on unmount, Escape, or clicking away
6. **Action availability based on selection** - Actions show/hide/disable based on what's selected:
   - Single-item operations (Rename, Focus Window) only enabled when exactly 1 item of correct type selected
   - Bulk operations (Close, Pin, Mute) enabled for any count
   - Mixed selections only show actions that work on all selected types
7. **Two-mode keyboard system** - Default mode (Finder-style) where arrow keys move focus+selection together; Space bar enters multi-select mode where focus and selection are independent

**Keyboard & Mouse Interactions:**

**Default Mode (Finder-style):**

- **Arrow keys**: Move focus AND select single focused item (deselects others)
- **Space**: Enter multi-select mode (show checkboxes, check current item, focus/selection become independent)
- **Click (no modifier)**: Select clicked item only, set anchor
- **Cmd/Ctrl+Click**: Toggle individual item, move anchor
- **Shift+Click**: Select range from anchor to clicked item, anchor stays
- **Cmd/Ctrl+A**: Select all in current pane/view context
- **Enter on focused item**: Activate/open focused item (separate from selection)

**Multi-Select Mode (entered via Space):**

- **Arrow keys**: Move focus (blue outline) WITHOUT changing selection
- **Space**: Toggle selection checkbox on focused item
- **Shift+Arrow**: Move focus AND extend selection from anchor (check/uncheck checkboxes in range)
- **Mouse interactions**: Same as default mode
- **Escape**: Exit multi-select mode, return to default mode, clear all selection
- **Auto-exit**: If user unchecks all items, automatically return to default mode

**Visual States:**

- **Default Mode:**
  - Blue outline + blue background: Current focused/selected item
  - No checkboxes visible (unless hovering)
- **Multi-Select Mode:**
  - Blue outline: Keyboard focus (where you are)
  - Blue background + checked checkbox: Selected items
  - Unchecked checkbox: Not selected
  - All checkboxes visible

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

- [ ] Create selection state management in `pages/tab-manager/src/selection/`
  - [ ] `SelectionStore.ts` - Zustand store with Set-based state and declarative API
  - [ ] `useSelection.ts` - Hook for components to check selection state
  - [ ] `useSelectionActions.ts` - Hook providing set/add/remove/clear methods
- [ ] Create interaction layer for selection
  - [ ] `useSelectionInteraction.ts` - Manages anchor refs and translates user actions to store operations
  - [ ] Handle pane context (window pane vs tab pane in split view)
  - [ ] Track anchor item with ref (not in store)
  - [ ] Track current pane with ref for cross-pane click detection
- [ ] Implement basic Space bar selection (simplest to start)
  - [ ] Add Space key handler in `useKeyboardNavigation.ts`
  - [ ] Call `selectionStore.add()` or `selectionStore.remove()` based on current state
  - [ ] Move anchor to toggled item
- [ ] Implement Escape key to clear selection
  - [ ] Add Escape key handler
  - [ ] Call `selectionStore.clear()`
  - [ ] Clear anchor ref
  - [ ] Keep focus on current item
- [ ] Add visual checkbox UI to all items
  - [ ] Update `WindowButton.tsx` to show checkbox
  - [ ] Update `TabGroup.tsx` to show checkbox
  - [ ] Update `TabItem.tsx` to show checkbox
  - [ ] Checkboxes hidden by default, visible on hover or when any item selected
- [ ] Test basic selection works with keyboard navigation

### Phase 2: Selection Visual States

- [ ] Implement explicit selection (☑) styling
  - [ ] Blue background highlight
  - [ ] Checked checkbox state
  - [ ] Update `TabItem`, `TabGroup`, `WindowButton` styling
  - [ ] Ensure distinct from focus outline (focus = border, selection = background)
- [ ] Add selection badge component
  - [ ] Create `SelectionBadge.tsx` in `packages/ui/lib/tab-manager/`
  - [ ] Show count based on selection type
  - [ ] Smart display: "5 tabs" vs "2 groups (8 tabs)" vs "1 window (12 tabs)"
- [ ] Test visual feedback is clear and intuitive

### Phase 3: Advanced Selection Methods

- [ ] Implement click handlers on items
  - [ ] Add onClick handlers to `TabItemRow`, `TabGroupHeader`, `WindowButton`
  - [ ] Pass pane context to handlers
  - [ ] Regular click: `selectionStore.set()` with single item, set anchor, update pane ref
  - [ ] Cross-pane click: Clear selection first, then handle normally
- [ ] Implement Cmd/Ctrl+Click toggle selection
  - [ ] Check if item is selected
  - [ ] Call `selectionStore.add()` if not selected, `selectionStore.remove()` if selected
  - [ ] Move anchor to clicked item
  - [ ] Anchor updates on Cmd+Click (verified Mac behavior)
- [ ] Implement Shift+Click range selection
  - [ ] Only process if anchor exists and in same pane
  - [ ] If different pane, treat as regular click (clears other pane)
  - [ ] Traverse DOM to find items between anchor and clicked item
  - [ ] Calculate items to add and items to remove (for overlapping ranges)
  - [ ] Call `selectionStore.remove()` then `selectionStore.add()` for both operations
  - [ ] Zustand batches these into single render
  - [ ] Anchor stays on original anchor (does not move)
- [ ] Implement Shift+Up/Down range selection
  - [ ] Same logic as Shift+Click but with keyboard focus target
  - [ ] Traverse navigable items from anchor to focused item
  - [ ] Update selection with range
- [ ] Add "Select All" shortcut (Cmd+A)
  - [ ] In tree view: Select all windows, groups, and tabs visible in tree
  - [ ] In split view (windows pane focused): Select all windows
  - [ ] In split view (tabs pane focused): Select all tabs/groups in current window
  - [ ] Context-aware based on which pane/view has focus
  - [ ] Call `selectionStore.set()` with all relevant IDs
  - [ ] Set anchor to first item in selection
- [ ] Handle item removal (when tabs/groups/windows close)
  - [ ] Listen to Chrome events in tab manager
  - [ ] Call `selectionStore.remove()` for closed items
  - [ ] If anchor item was removed, clear anchor ref
  - [ ] Don't auto-select replacement (let user decide next action)
- [ ] Test all selection methods work together correctly
  - [ ] Test cross-pane behavior (clicking different pane clears selection)
  - [ ] Test Cmd+Click moves anchor (Mac behavior)
  - [ ] Test Shift+Click with overlapping ranges (items get removed/added correctly)

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
  - [ ] Check toolbar button colors
- [ ] Test with reduced motion preference
  - [ ] Disable animations if prefers-reduced-motion
  - [ ] Test selection changes still visible

### Phase 16: Testing & Bug Fixes

- [ ] Write unit tests for selection logic
  - [ ] Test selection state updates
  - [ ] Test containment detection for actions (window closes its tabs)
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

## Interaction Scenarios & Edge Cases

This section validates the selection design through concrete user scenarios.

### Basic Selection Scenarios

**Scenario 1: Simple range selection**

```
Action: Click tab 1, Shift+click tab 5
Result: Tabs 1-5 selected, anchor = tab 1
State: selectionStore = { tabIds: [1,2,3,4,5] }
```

**Scenario 2: Cmd+click moves anchor**

```
Action: Click tab 1, Shift+click tab 3, Cmd+click tab 8
Result: Tabs 1-3 and 8 selected, anchor = tab 8
State: selectionStore = { tabIds: [1,2,3,8] }
```

**Scenario 3: Overlapping range deselects**

```
Action: Click tab 4, Shift+click tab 6, Shift+click tab 2
Result: Tabs 2-4 selected (5-6 removed), anchor = tab 4
Explanation: New range (2-4) overlaps with old range (4-6), so 5-6 are removed
State: selectionStore = { tabIds: [2,3,4] }
```

**Scenario 4: Shift+click from Cmd+click anchor**

```
Action: Click tab 3, Shift+click tab 6, Cmd+click tab 8, Shift+click tab 10
Result: Tabs 3-6 and 8-10 selected, anchor = tab 8
Explanation: Last Cmd+click moved anchor to 8, so Shift+click extends from 8
State: selectionStore = { tabIds: [3,4,5,6,8,9,10] }
```

### Cross-Pane Scenarios (Split View)

**Scenario 5: Click different pane clears selection**

```
Action: Click window 1 (window pane), click tab 5 (tab pane)
Result: Only tab 5 selected, window 1 deselected
State: selectionStore = { tabIds: [5] }, paneRef = 'tab'
```

**Scenario 6: Shift+click in different pane acts as regular click**

```
Action: Click window 1 (window pane), Shift+click tab 5 (tab pane)
Result: Only tab 5 selected, no range (different panes)
State: selectionStore = { tabIds: [5] }, paneRef = 'tab', anchor = tab 5
```

**Scenario 7: Cmd+click in different pane clears previous pane**

```
Action: Click window 1 (window pane), Cmd+click tab 5 (tab pane)
Result: Only tab 5 selected (window 1 cleared)
State: selectionStore = { tabIds: [5] }, paneRef = 'tab'
```

### Keyboard Navigation Scenarios

**Scenario 8: Default mode - arrow keys move focus and selection together**

```
Mode: Default (Finder-style)
Action: Arrow down from tab 2 to tab 3
Result: Focus moves to tab 3, ONLY tab 3 is selected (tab 2 deselected)
State: selectionStore = { tabIds: [3] }, mode = 'default'
```

**Scenario 9: Enter multi-select mode with Space**

```
Mode: Default
Action: Navigate to tab 3 (arrows), press Space
Result: Enter multi-select mode, checkboxes appear, tab 3 selected and checked
State: selectionStore = { tabIds: [3] }, mode = 'multi-select', anchor = tab 3
```

**Scenario 10: Multi-select mode - arrow keys move focus without changing selection**

```
Mode: Multi-select (tab 3 selected)
Action: Arrow down to tab 4, arrow down to tab 5
Result: Focus on tab 5, but only tab 3 remains selected (checkboxes visible, only tab 3 checked)
State: selectionStore = { tabIds: [3] }, focus = tab 5
```

**Scenario 11: Multi-select mode - Space toggles selection**

```
Mode: Multi-select (tab 3 selected, focus on tab 5)
Action: Press Space
Result: Tab 5 gets selected and checked, tab 3 still selected
State: selectionStore = { tabIds: [3,5] }, anchor = tab 5
```

**Scenario 12: Multi-select mode - Shift+Arrow extends selection**

```
Mode: Multi-select (tab 3 selected, anchor = tab 3)
Action: Shift+Down, Shift+Down
Result: Tabs 3-5 all selected and checked
State: selectionStore = { tabIds: [3,4,5] }, anchor = tab 3
```

**Scenario 13: Exit multi-select mode with Escape**

```
Mode: Multi-select (tabs 3, 5, 7 selected)
Action: Press Escape
Result: Return to default mode, all selection cleared, checkboxes hidden, focus remains
State: selectionStore = {}, mode = 'default'
```

**Scenario 14: Auto-exit multi-select when all unchecked**

```
Mode: Multi-select (only tab 3 selected)
Action: Navigate to tab 3, press Space (unchecks it)
Result: Automatically return to default mode, checkboxes hidden
State: selectionStore = {}, mode = 'default'
```

**Scenario 15: Cmd+A in different panes**

```
Context: Split view, window pane focused
Action: Cmd+A
Result: All windows selected
Context: Now tab pane focused
Action: Cmd+A
Result: Windows deselected, all tabs in current window selected
State: selectionStore = { tabIds: [all tabs in window] }, paneRef = 'tab'
```

### Item Removal Scenarios

**Scenario 16: Close selected tab, anchor removed**

```
Action: Click tab 5, tab 5 closes
Result: Selection cleared for tab 5, anchor cleared
State: selectionStore = { tabIds: [] }, anchorRef = null
```

**Scenario 17: Close non-anchor selected tab**

```
Action: Click tab 3, Cmd+click tabs 5 and 7, tab 5 closes
Result: Tabs 3 and 7 still selected, anchor still tab 3
State: selectionStore = { tabIds: [3,7] }, anchorRef = tab 3
```

### Mixed Selection Scenarios

**Scenario 18: Select tabs and groups together (tree view)**

```
Action: Click tab 3, Shift+click group 1 (tree order: tab3, tab4, group1)
Result: Tab 3, tab 4, and group 1 selected
State: selectionStore = { tabIds: [3,4], groupIds: [1] }
Toolbar: Shows only actions common to tabs and groups (Close, Copy URLs)
```

**Scenario 19: Select window and tabs (tree view)**

```
Action: Click window 2, Shift+click tab 8 (window2 contains tabs 5-10)
Result: Window 2 and tabs 5-8 explicitly selected
State: selectionStore = { windowIds: [2], tabIds: [5,6,7,8] }
```

### Context Menu Scenarios

**Scenario 20: Right-click selected item**

```
Context: Tabs 3-5 selected
Action: Right-click tab 4
Result: Context menu shows bulk actions, operates on all 3 selected tabs
State: Selection unchanged
```

**Scenario 21: Right-click unselected item**

```
Context: Tabs 3-5 selected
Action: Right-click tab 8
Result: Clears selection, selects only tab 8, shows single-item context menu
State: selectionStore = { tabIds: [8] }
```

### View Mode Switch Scenarios

**Scenario 22: Switch from split to tree view**

```
Context: Split view, window 1 selected in window pane
Action: Toggle to tree view
Result: Window 1 still selected, shown in tree with all items visible
State: selectionStore unchanged, view mode changes
```

**Scenario 23: Select across windows in tree view**

```
Context: Tree view showing windows 1 and 2
Action: Click tab 5 (window 1), Shift+click tab 12 (window 2)
Result: Tabs 5-12 selected, crossing window boundaries
State: selectionStore = { tabIds: [5,6,7,8,9,10,11,12] }
Note: Would also select any groups between if they exist in tree order
```

### Edge Cases

**Scenario 24: Click already-selected item (no modifier)**

```
Context: Tabs 3-7 selected
Action: Click tab 5 (no modifier)
Result: All others deselected, only tab 5 selected
State: selectionStore = { tabIds: [5] }, anchor = tab 5
```

**Scenario 25: Cmd+click already-selected item**

```
Context: Tabs 3-7 selected
Action: Cmd+click tab 5
Result: Tab 5 deselected, tabs 3-4, 6-7 remain selected
State: selectionStore = { tabIds: [3,4,6,7] }, anchor = tab 5
```

**Scenario 26: Empty range selection**

```
Context: No selection, anchor = null
Action: Shift+click tab 5
Result: Treated as regular click (no anchor to range from)
State: selectionStore = { tabIds: [5] }, anchor = tab 5
```

**Scenario 27: Selection with no applicable actions**

```
Context: Mix of 2 windows, 3 groups, 5 tabs selected
Result: Toolbar shows only Close (works on all types)
State: All other actions disabled/hidden (no bulk rename, no bulk pin, etc.)
```

**Scenario 28: Rename group with multiple groups selected**

```
Context: Groups 1, 2, 3 selected
Result: Rename action disabled (only works with single group)
Action: User deselects 2 groups, only group 1 selected
Result: Rename action becomes enabled
```

**Scenario 29: Default mode - arrow key moves focus and selection together**

```
Mode: Default
Context: Tab 3 focused and selected
Action: Arrow down to tab 4
Result: Tab 4 becomes focused and selected, tab 3 deselected
State: selectionStore = { tabIds: [4] }, focus = tab 4, mode = 'default'
```

**Scenario 30: Multi-select mode - focus independent of selection**

```
Mode: Multi-select
Context: Tab 3 selected, focus on tab 5
Action: Press Space
Result: Tab 5 becomes selected (both 3 and 5 now selected)
State: selectionStore = { tabIds: [3,5] }, focus = tab 5, mode = 'multi-select'
```

**Scenario 31: Collapse selected group**

```
Context: Group 1 (with 5 tabs) is selected and expanded
Action: User collapses group 1 (click chevron or Left arrow)
Result: Group still selected, tabs now hidden
Visual: Group blue background, chevron points right, tabs not visible
State: selectionStore = { groupIds: [1] } (unchanged)
```

**Scenario 32: Move selected tabs to another window**

```
Context: Tabs 3-5 selected in window 1
Action: User executes "Move to Window 2" action
Result: Tabs moved to window 2, selection cleared (items changed context)
State: selectionStore = {} (cleared after action completes)
Rationale: Selection clears after successful action to avoid confusion
```

**Scenario 33: Group selected tabs**

```
Context: Tabs 3, 5, 7 selected (non-contiguous)
Action: User executes "Add to New Group"
Result: New group created with tabs 3, 5, 7, group is now selected
State: selectionStore = { groupIds: [newGroupId] }
Visual: New group highlighted with blue background
```

**Scenario 34: Ungroup selected group**

```
Context: Group 1 selected (with 5 tabs)
Action: User executes "Ungroup"
Result: Group removed, its 5 tabs are now selected individually
State: selectionStore = { tabIds: [1,2,3,4,5] } (group's tab IDs)
Rationale: Keeps selection context on affected items
```

**Scenario 35: Reload selected tabs during loading**

```
Context: Tabs 1-10 selected, user presses R to reload all
Action: While tabs are reloading, user clicks tab 15
Result: Previous selection clears, only tab 15 selected
State: selectionStore = { tabIds: [15] }
Note: No special handling for loading state - selection is independent
```

**Scenario 36: Drag and drop (future consideration)**

```
Context: Tabs 3-5 selected
Action: User drags tab 4 to different position
Result: All 3 selected tabs move together
Note: Out of scope for initial implementation, but selection should support it
```

**Scenario 37: Browser shortcut conflicts**

```
Context: Tab manager has focus, user wants to reload current page
Action: User presses Cmd+R
Result: Page reload (browser default), NOT "reload selected tabs"
Rationale: Browser shortcuts always take precedence
Note: Tab manager's R key (reload selected) only works without Cmd modifier
```

**Scenario 38: Select all in empty pane**

```
Context: Split view, no tabs in current window, tab pane focused
Action: User presses Cmd+A
Result: Nothing selected (no items to select)
State: selectionStore = {} (empty)
```

**Scenario 39: Checkboxes visibility in two modes**

```
Mode: Default
Context: No selection
Action: User hovers over tab 5
Result: Checkbox appears on tab 5 (hover state)
Action: User moves mouse away
Result: Checkbox hides

Mode: Multi-select
Context: Entered via Space bar
Action: User navigates with arrow keys
Result: All checkboxes remain visible, checked items have blue background
```

**Scenario 40: Performance with large selection**

```
Context: 100+ tabs across multiple windows
Action: User selects all (Cmd+A in tree view)
Result: Selection completes in <100ms, no UI lag
State: selectionStore = { windowIds: [all], groupIds: [all], tabIds: [all] }
Implementation: Bulk operation with single render
```

---

## Technical Architecture

### Selection Store (`pages/tab-manager/src/selection/`)

### Selection Store (`pages/tab-manager/src/selection/`)

```typescript
// SelectionStore.ts (Zustand store)
interface SelectionStore {
  // State: Sets for O(1) lookups
  windowIds: Set<number>
  groupIds: Set<number>
  tabIds: Set<number>
  mode: 'default' | 'multi-select' // Track interaction mode

  // Mutations - single-ID methods (simple and clear)
  setWindow: (id: number) => void
  setGroup: (id: number) => void
  setTab: (id: number) => void
  setWindows: (ids: number[]) => void // For bulk operations like Select All
  setGroups: (ids: number[]) => void
  setTabs: (ids: number[]) => void

  addWindow: (id: number) => void
  addGroup: (id: number) => void
  addTab: (id: number) => void
  addWindows: (ids: number[]) => void // For range selections
  addGroups: (ids: number[]) => void
  addTabs: (ids: number[]) => void

  removeWindow: (id: number) => void
  removeGroup: (id: number) => void
  removeTab: (id: number) => void
  removeWindows: (ids: number[]) => void // For range deselections
  removeGroups: (ids: number[]) => void
  removeTabs: (ids: number[]) => void

  clear: () => void
  enterMultiSelectMode: () => void
  exitMultiSelectMode: () => void

  // Queries
  getSelection: () => {
    windowIds: Set<number>
    groupIds: Set<number>
    tabIds: Set<number>
  }
  getTotalCount: () => number
  isWindowSelected: (id: number) => boolean
  isGroupSelected: (id: number) => boolean
  isTabSelected: (id: number) => boolean
  isMultiSelectMode: () => boolean
}

// useSelectionInteraction.ts
// Manages anchor, mode, and translates user actions to store calls
export const useSelectionInteraction = () => {
  const anchorRef = useRef<{
    type: 'window' | 'group' | 'tab'
    id: number
  } | null>(null)
  const paneRef = useRef<'window' | 'tab' | 'tree' | null>(null)
  const selectionStore = useSelectionStore()

  const handleClick = (
    item: { type; id },
    event: MouseEvent,
    paneContext: 'window' | 'tab' | 'tree',
  ) => {
    // Cross-pane click clears selection
    if (paneRef.current !== paneContext && paneRef.current !== null) {
      selectionStore.clear()
      anchorRef.current = null
    }
    paneRef.current = paneContext

    if (event.shiftKey && anchorRef.current) {
      // Range selection from anchor to item
      const range = getItemsInRange(anchorRef.current, item, paneContext)
      // Handle overlapping ranges - Zustand batches these
      if (range.toRemove?.length) {
        if (range.toRemove[0].type === 'tab')
          selectionStore.removeTabs(range.toRemove.map((i) => i.id))
        else if (range.toRemove[0].type === 'group')
          selectionStore.removeGroups(range.toRemove.map((i) => i.id))
        else selectionStore.removeWindows(range.toRemove.map((i) => i.id))
      }
      if (range.toAdd?.length) {
        if (range.toAdd[0].type === 'tab')
          selectionStore.addTabs(range.toAdd.map((i) => i.id))
        else if (range.toAdd[0].type === 'group')
          selectionStore.addGroups(range.toAdd.map((i) => i.id))
        else selectionStore.addWindows(range.toAdd.map((i) => i.id))
      }
      // Anchor stays the same
    } else if (event.metaKey || event.ctrlKey) {
      // Toggle individual item
      const isSelected = selectionStore[`is${capitalize(item.type)}Selected`](
        item.id,
      )
      if (isSelected) {
        if (item.type === 'tab') selectionStore.removeTab(item.id)
        else if (item.type === 'group') selectionStore.removeGroup(item.id)
        else selectionStore.removeWindow(item.id)
      } else {
        if (item.type === 'tab') selectionStore.addTab(item.id)
        else if (item.type === 'group') selectionStore.addGroup(item.id)
        else selectionStore.addWindow(item.id)
      }
      anchorRef.current = item // Anchor moves on Cmd+click
    } else {
      // Regular click - clear and select only this item
      if (item.type === 'tab') selectionStore.setTab(item.id)
      else if (item.type === 'group') selectionStore.setGroup(item.id)
      else selectionStore.setWindow(item.id)
      anchorRef.current = item
      // Exit multi-select mode on regular click
      selectionStore.exitMultiSelectMode()
    }
  }

  const handleKeyboard = (
    item: { type; id },
    key: string,
    paneContext: 'window' | 'tab' | 'tree',
  ) => {
    if (key === ' ') {
      const isMultiSelect = selectionStore.isMultiSelectMode()

      if (!isMultiSelect) {
        // First Space press: enter multi-select mode and select current item
        selectionStore.enterMultiSelectMode()
        if (item.type === 'tab') selectionStore.setTab(item.id)
        else if (item.type === 'group') selectionStore.setGroup(item.id)
        else selectionStore.setWindow(item.id)
        anchorRef.current = item
      } else {
        // In multi-select mode: toggle like Cmd+click
        const isSelected = selectionStore[`is${capitalize(item.type)}Selected`](
          item.id,
        )
        if (isSelected) {
          if (item.type === 'tab') selectionStore.removeTab(item.id)
          else if (item.type === 'group') selectionStore.removeGroup(item.id)
          else selectionStore.removeWindow(item.id)

          // Auto-exit if nothing selected
          if (selectionStore.getTotalCount() === 0) {
            selectionStore.exitMultiSelectMode()
          }
        } else {
          if (item.type === 'tab') selectionStore.addTab(item.id)
          else if (item.type === 'group') selectionStore.addGroup(item.id)
          else selectionStore.addWindow(item.id)
        }
        anchorRef.current = item
      }
    } else if (key === 'Escape') {
      selectionStore.clear()
      selectionStore.exitMultiSelectMode()
      anchorRef.current = null
    }
  }

  return { handleClick, handleKeyboard, anchorRef, paneRef }
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
  const selectionStore = useSelectionStore()

  const handleKeyDown = (e: KeyboardEvent) => {
    const activeElement = document.activeElement as HTMLElement
    const navItem = activeElement?.closest('[data-nav-type]') as HTMLElement
    const isMultiSelect = selectionStore.isMultiSelectMode()

    // Arrow keys: behavior depends on mode
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      if (isMultiSelect && e.shiftKey) {
        // Multi-select mode + Shift: Range selection
        e.preventDefault()
        // Get items in range, extend selection
        return
      } else if (!isMultiSelect && !e.shiftKey) {
        // Default mode: Move focus AND select single item
        e.preventDefault()
        const nextItem = getNextNavigableItem(navItem, e.key === 'ArrowDown')
        if (nextItem) {
          const item = getSelectionItemFromElement(nextItem)
          // Select ONLY this item
          if (item.type === 'tab') selectionStore.setTab(item.id)
          else if (item.type === 'group') selectionStore.setGroup(item.id)
          else selectionStore.setWindow(item.id)
          nextItem.focus()
        }
        return
      }
      // Multi-select mode without Shift: just move focus (default browser)
    }

    // Space bar: Enter multi-select mode or toggle selection
    if (e.key === ' ') {
      e.preventDefault()
      if (navItem) {
        const item = getSelectionItemFromElement(navItem)
        // Handled by useSelectionInteraction.handleKeyboard
        handleKeyboardSelection(item, ' ')
      }
      return
    }

    // Escape: Exit multi-select mode and clear selection
    if (e.key === 'Escape') {
      selectionStore.clear()
      selectionStore.exitMultiSelectMode()
      return
    }

    // Action shortcuts (when items selected)
    const selectionCount = selectionStore.getTotalCount()
    if (selectionCount > 0) {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        onCloseSelection()
        return
      }
      if (e.key === 'p' || e.key === 'P') {
        onPinSelection()
        return
      }
      // ... other shortcuts
    }

    // Existing navigation logic for Left/Right pane switching, etc.
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

- [ ] Selected items have clear blue background highlights and checkboxes
- [ ] The badge shows selection count (e.g., "3 tabs" or "1 window (15 tabs)")
- [ ] Before bulk closing 10+ items, I see a confirmation with the count
- [ ] Focus outline (blue border) is distinct from selection (blue background)

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

1. **Two-mode keyboard system:** Default mode (Finder-style) where arrow keys move focus and select single item together; Space bar enters multi-select mode where focus and selection become independent. This gives simple navigation for common case while enabling powerful multi-selection when needed.

2. **Single-ID API methods:** Use simple methods like `addTab(id)`, `removeWindow(id)` instead of bulk object methods like `add({ tabIds: [id] })`. Clearer, better autocomplete, more readable. Zustand batches synchronous updates automatically, so `removeTab(1); removeTab(2); removeTab(3)` renders once.

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

13. **Escape to clear selection:** Standard cancellation key across all UIs. Returns user to neutral state without closing sidebar. Also exits multi-select mode.

14. **No semi-selection:** Simplified design - only show explicit selection. Users learn containment (closing window closes tabs) through experience. Reduces visual and implementation complexity.

### Implementation Order Rationale

The phases are ordered to:

1. Build foundation first (selection state, visual feedback)
2. Prove the pattern with one complete action (Close)
3. Add infrastructure (toolbar, menu)
4. Scale to all actions progressively
5. Polish and refine

Each phase builds on the previous, ensuring we can test and validate before adding complexity.
