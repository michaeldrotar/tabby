# Tab Manager: Selection Foundation

**Date:** January 3, 2026  
**Model:** Claude Opus 4.5  
**Status:** In Progress  
**Predecessors:** None  
**Successors:** [Selection Visual Design](./2025-01-03-tab-manager-selection-visual-design.md)

## Executive Summary

This plan establishes the core selection system for the tab manager, enabling multi-selection across windows, groups, and tabs with intuitive keyboard and mouse controls.

**Deliverables:**

- Selection store with Set-based state for O(1) lookups
- Click handling (regular, Cmd+click, Shift+click range selection)
- Keyboard navigation (Space to toggle, Shift+arrows for range, Escape to clear)
- Pane-aware behavior (cross-pane clicks clear selection)
- Basic visual selected state (accent-colored background) - functional, not polished

**Exit Criteria:**

- User can select multiple items via keyboard or mouse
- Range selection works correctly
- Selection clears predictably on cross-pane clicks and Escape
- No regressions in existing tab manager functionality

---

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
- Fast access to common actions without opening menus

**This Plan Addresses:**

- The selection mechanism that enables bulk operations
- Mouse and keyboard interaction patterns
- Foundation for future action toolbar (separate plan)

---

## Solution Overview

### Selection System Architecture

**Location:** `pages/tab-manager/src/selection/`

- Not a generic package - specific to tab manager's browser entity hierarchy
- Follows YAGNI principle (only tab manager needs multi-selection currently)
- Can be extracted to `packages/shared` later if another feature needs it

**Store Design:**

The selection store uses Zustand with Set-based state for O(1) lookups. Key characteristics:

- **State:** `windowIds`, `groupIds`, `tabIds` as Sets, plus `mode` for keyboard interaction
- **Mutations:** Single-item (`setTab`, `addTab`, `removeTab`) and bulk (`setTabs`, `addTabs`, `removeTabs`) methods
- **Mixed selection:** `setAll(windows, groups, tabs)` method for setting mixed selections atomically (individual setters clear other types)
- **No query methods:** Zustand function references are stable, so components subscribe to Sets directly (`windowIds.has(id)`) for proper reactivity

### Key Architectural Decisions

1. **No anchor in store** - Anchor is interaction/layout state, managed in view layer with refs
2. **No range logic in store** - Store doesn't know visual order, view layer traverses DOM
3. **Declarative API** - Store receives "what to select", not "how user interacted"
4. **Pane-aware interactions** - Clicking different pane clears selection (predictable behavior)
5. **Selection is ephemeral** - Cleared on unmount, Escape, or clicking away
6. **Keyboard multi-select mode is keyboard-specific** - Entered only via Space bar; mouse Cmd+click does NOT enter this mode
7. **Empty selection (0 items) is a valid state** - Both mouse and keyboard support having nothing selected
8. **Mouse click exits keyboard multi-select mode** - Regular click signals intent to use mouse-style interaction
9. **Viewing window is a Split View concern, not a selection concept** - The `useViewingWindowId()` hook derives the viewing window from the selection store
10. **Deprecate `selectedWindowId` from WindowSlice** - Replaced by the selection system

### Interaction Modes

#### Mouse Interactions

**Functionality:**

- **Click (no modifier)**: Select clicked item only, set anchor, deselect all others
- **Cmd/Ctrl+Click**: Toggle individual item selection, update anchor
- **Shift+Click**: Select range from anchor to clicked item, anchor stays
- **Cmd/Ctrl+A**: Select all in current pane/view context
- **0 selected items**: Valid state - no accent-colored backgrounds, ready for interaction
- Mouse cursor acts as implicit "focus" - no visible focus indicator needed
- Using mouse does NOT enter keyboard multi-select mode, even with Cmd+click

**Design:**

- No focus ring displayed - cursor is the implicit focus
- **Accent-colored background** = selected items
- **No background** = unselected items

#### Keyboard Default Mode

Standard keyboard navigation mode, matching Finder-style behavior where focus and selection move together.

**Functionality:**

- **Arrow keys**: Move focus AND select single focused item (deselects others)
- **Space**: Enter keyboard multi-select mode (focus ring separates from selection)
- **Shift+Arrow**: Extend selection from anchor in arrow direction
- **Enter on focused item**: Activate/open focused item (switch to that tab)
- **Tab/arrow into new pane**: Focus+select first item in that pane, deselect previous pane
- **0 selected items**: Implicit focus remains on last item; arrow keys select relative to it

**Design:**

- Focus and selection are **fused** into a single visual state
- Accent-colored background with integrated focus indicator
- Arrow keys move this combined state as one unit

#### Keyboard Multi-Select Mode

Entered via Space bar. Enables non-contiguous selection by separating focus from selection.

**Functionality:**

- **Arrow keys**: Move focus ring WITHOUT changing selection
- **Space**: Toggle selection (accent-colored background) on focused item
- **Shift+Arrow**: Move focus AND extend selection from anchor
- **Escape**: Exit mode, clear all selection, keep focus on current item
- **0 selected items**: Stay in mode (focus ring remains visible as mode indicator)
- **Regular mouse click**: Exit mode, hide focus ring, select clicked item
- **Cmd/Ctrl+Click**: Toggle item selection, keep focus ring visible, stay in mode

**Design:**

- Focus and selection become **visually separated**
- **Accent-colored background** = selected items
- **Focus ring/border** = current keyboard position (moves independently)
- The visual separation itself IS the mode indicator

#### Empty Selection State

Empty selection (0 items) is fully supported across all interaction contexts:

- **Mouse with 0 selected**: No visual indicators, just ready for interaction
- **Keyboard default mode with 0 selected**: Implicit focus on last interacted item (not visible); arrow keys select relative to it
- **Keyboard multi-select mode with 0 selected**: Focus ring visible on current item, no accent-colored backgrounds
- **Cmd+click last selected item**: Always deselects it, resulting in 0 selected
- **Split view pane switch**: Clicking/tabbing to other pane shows its contents; nothing auto-selected until user interacts

### Split View: Viewing Window

The "viewing window" concept is specific to Split View. A hook derives it from the selection store:

```typescript
// pages/tab-manager/src/components/split-view/useViewingWindowId.ts
export const useViewingWindowId = (): number | null => {
  const windowIds = useSelectionStore((s) => s.windowIds)
  if (windowIds.size === 0) return null
  // Set maintains insertion order; last item is most recently added
  return Array.from(windowIds).at(-1) ?? null
}
```

**Split View Behaviors:**

| Action                  | Selected Windows | Viewing       | Tabs Pane Shows |
| ----------------------- | ---------------- | ------------- | --------------- |
| Click W1                | [W1]             | W1            | W1's tabs       |
| Shift+click W5          | [W1,W2,W3,W4,W5] | W5            | W5's tabs       |
| Cmd+click W7            | [W1-W5, W7]      | W7            | W7's tabs       |
| Cmd+click W7 (deselect) | [W1-W5]          | W5 (fallback) | W5's tabs       |
| Deselect all            | []               | null          | Empty state     |

---

## Checklist

### Phase 1: Selection State Management

- [x] Create selection state management in `pages/tab-manager/src/selection/`
  - [x] `SelectionStore.ts` - Zustand store with Set-based state and declarative API
  - [x] `useSelection.ts` - Hook for components to check selection state
  - [x] `useSelectionActions.ts` - Hook providing set/add/remove/clear methods
- [x] Create interaction layer for selection
  - [x] `useSelectionInteraction.ts` - Manages anchor refs and translates user actions to store operations
  - [x] Handle pane context (window pane vs tab pane in split view)
  - [x] Track anchor item with ref (not in store)
  - [x] Track current pane with ref for cross-pane click detection

### Phase 2: Basic Keyboard Selection

- [x] Implement basic Space bar selection (simplest to start)
  - [x] Add Space key handler in `useKeyboardNavigation.ts`
  - [x] Call `selectionStore.add()` or `selectionStore.remove()` based on current state
  - [x] Move anchor to toggled item
- [x] Implement Escape key to clear selection
  - [x] Add Escape key handler
  - [x] Call `selectionStore.clear()`
  - [x] Select focused item (returning to default mode where focus=selection)
  - [x] Keep focus on current item
- [x] Wire selection state to UI components (functional, needs designer review)
  - [x] Update `WindowRailItem.tsx` with `selected` prop
  - [x] Update `TabGroupHeader.tsx` with `selected` prop
  - [x] Update `TabItemRow.tsx` with `selected` prop
- [x] Test basic selection works with keyboard navigation

### Phase 3: Click Handlers

- [x] Implement click handlers on items
  - [x] Add onClick handlers to `TabItemRow`, `TabGroupHeader`, `WindowItemContainer`
  - [x] Pass pane context to handlers
  - [x] Regular click: `selectionStore.set()` with single item, set anchor, update pane ref
  - [x] Cross-pane click: Clear selection first, then handle normally
- [x] Implement Cmd/Ctrl+Click toggle selection
  - [x] Check if item is selected
  - [x] Call `selectionStore.add()` if not selected, `selectionStore.remove()` if selected
  - [x] Move anchor to clicked item
  - [x] Anchor updates on Cmd+Click (verified Mac behavior)
- [x] Implement Shift+Click range selection
  - [x] Only process if anchor exists and in same pane
  - [x] If different pane, treat as regular click (clears other pane)
  - [x] Traverse DOM to find items between anchor and clicked item
  - [x] Calculate items to add and items to remove (for overlapping ranges)
  - [x] Call `selectionStore.remove()` then `selectionStore.add()` for both operations
  - [x] Zustand batches these into single render
  - [x] Anchor stays on original anchor (does not move)

### Phase 4: Keyboard Range Selection

- [x] Implement Shift+Up/Down range selection
  - [x] Add `handleShiftArrow` method to `useSelectionInteraction`
  - [x] Same logic as Shift+Click but with keyboard focus target
  - [x] Traverse navigable items from anchor to focused item
  - [x] Update selection with range using `setAll`
- [x] Add "Select All" shortcut (Cmd+A)
  - [x] Add `selectAll` method to `useSelectionInteraction`
  - [x] In tree view: Select all windows, groups, and tabs visible in tree
  - [x] In split view (windows pane focused): Select all windows
  - [x] In split view (tabs pane focused): Select all tabs/groups in current window
  - [x] Context-aware based on which pane/view has focus
  - [x] Uses `setAll` with all relevant IDs
  - [x] Sets anchor to first item in selection

### Phase 5: Item Removal Handling

- [x] Handle item removal (when tabs/groups/windows close)
  - [x] Listen to Chrome events in tab manager
  - [x] Call `selectionStore.remove()` for closed items
  - [x] If anchor item was removed, clear anchor ref
  - [x] Don't auto-select replacement (let user decide next action)

### Phase 6: Integration Testing

- [ ] Test all selection methods work together correctly
  - [ ] Test cross-pane behavior (clicking different pane clears selection)
  - [ ] Test Cmd+Click moves anchor (Mac behavior)
  - [ ] Test Shift+Click with overlapping ranges (items get removed/added correctly)
  - [ ] Test keyboard navigation from empty selection state
  - [ ] Test mode transitions (mouse → keyboard, keyboard → mouse)

### Phase 7: Edge Cases & Polish

- [ ] Handle empty states
  - [ ] Test keyboard navigation when 0 items selected
  - [ ] Ensure implicit focus is tracked for arrow key navigation
- [ ] Handle rapid interactions
  - [ ] Prevent double-clicks from causing issues
  - [ ] Ensure selection state is consistent after rapid clicks
- [ ] Performance check
  - [ ] Test with 100+ tabs
  - [ ] Ensure no lag during selection operations

### Phase 8: Accessibility

- [ ] Add ARIA attributes to selectable items
  - [ ] `aria-selected` on items
  - [ ] Announce selection state changes to screen readers
- [ ] Test keyboard-only navigation
  - [ ] All selection features accessible without mouse
  - [ ] Focus indicators visible at all times
- [ ] Test with VoiceOver (macOS)
  - [ ] Selection state announced correctly
  - [ ] Mode changes announced

### Phase 9: Documentation & Release

- [ ] Update README.md with selection feature overview
- [ ] Document keyboard shortcuts for selection:
  - [ ] Space: Toggle selection / Enter multi-select mode
  - [ ] Escape: Clear selection, exit multi-select mode
  - [ ] Shift+Click: Range selection
  - [ ] Cmd/Ctrl+Click: Toggle individual item
  - [ ] Cmd/Ctrl+A: Select all in context
  - [ ] Arrow keys: Navigate (and select in default mode)
  - [ ] Shift+Arrow: Extend selection range
- [ ] Write release notes for selection foundation

---

## Interaction Scenarios

These scenarios validate the selection design and serve as test cases.

### Basic Selection Scenarios

**Scenario BASIC-1: Simple range selection**

```
Action: Click tab 1, Shift+click tab 5
Result: Tabs 1-5 selected, anchor = tab 1
State: selectionStore = { tabIds: [1,2,3,4,5] }
```

**Scenario BASIC-2: Cmd+click moves anchor**

```
Action: Click tab 1, Shift+click tab 3, Cmd+click tab 8
Result: Tabs 1-3 and 8 selected, anchor = tab 8
State: selectionStore = { tabIds: [1,2,3,8] }
```

**Scenario BASIC-3: Overlapping range deselects**

```
Action: Click tab 4, Shift+click tab 6, Shift+click tab 2
Result: Tabs 2-4 selected (5-6 removed), anchor = tab 4
Explanation: New range (2-4) overlaps with old range (4-6), so 5-6 are removed
State: selectionStore = { tabIds: [2,3,4] }
```

**Scenario BASIC-4: Shift+click from Cmd+click anchor**

```
Action: Click tab 3, Shift+click tab 6, Cmd+click tab 8, Shift+click tab 10
Result: Tabs 3-6 and 8-10 selected, anchor = tab 8
Explanation: Last Cmd+click moved anchor to 8, so Shift+click extends from 8
State: selectionStore = { tabIds: [3,4,5,6,8,9,10] }
```

### Cross-Pane Scenarios (Split View)

**Scenario CROSS-1: Click different pane clears selection**

```
Action: Click window 1 (window pane), click tab 5 (tab pane)
Result: Only tab 5 selected, window 1 deselected
State: selectionStore = { tabIds: [5] }, paneRef = 'tab'
```

**Scenario CROSS-2: Shift+click in different pane acts as regular click**

```
Action: Click window 1 (window pane), Shift+click tab 5 (tab pane)
Result: Only tab 5 selected, no range (different panes)
State: selectionStore = { tabIds: [5] }, paneRef = 'tab', anchor = tab 5
```

**Scenario CROSS-3: Cmd+click in different pane clears previous pane**

```
Action: Click window 1 (window pane), Cmd+click tab 5 (tab pane)
Result: Only tab 5 selected (window 1 cleared)
State: selectionStore = { tabIds: [5] }, paneRef = 'tab'
```

### Split View Viewing Scenarios

**Scenario VIEW-SPLIT-1: Click window updates viewing**

```
Context: Split view, W1 selected and viewing
Action: Click W3
Result: W3 selected, tabs pane shows W3's tabs
State: selectionStore = { windowIds: [3] }, viewing = W3
```

**Scenario VIEW-SPLIT-2: Shift+click range updates viewing to target**

```
Context: W1 selected and viewing
Action: Shift+click W5
Result: W1-W5 selected, tabs pane shows W5's tabs (click target)
State: selectionStore = { windowIds: [1,2,3,4,5] }, viewing = W5
Implementation: add([W2, W3, W4, W5]) - items added in visual order toward target
```

**Scenario VIEW-SPLIT-3: Cmd+click deselect viewing window (fallback)**

```
Context: W1 and W5 selected, viewing W5
Action: Cmd+click W5 (deselect viewing window)
Result: Only W1 selected, tabs pane shows W1 (fallback to first selected)
State: selectionStore = { windowIds: [1] }, viewing = W1
```

**Scenario VIEW-SPLIT-4: Deselect all windows (empty tabs pane)**

```
Context: W1 selected and viewing
Action: Cmd+click W1 (deselect only window)
Result: No windows selected, tabs pane shows empty state
State: selectionStore = { windowIds: [] }, viewing = null
Empty state: "Select a window to view its tabs"
```

### Keyboard Navigation Scenarios

**Scenario KEY-1: Default mode - arrow keys move focus and selection together**

```
Mode: Default (Finder-style)
Action: Arrow down from tab 2 to tab 3
Result: Focus moves to tab 3, ONLY tab 3 is selected (tab 2 deselected)
State: selectionStore = { tabIds: [3] }, mode = 'default'
```

**Scenario KEY-2: Enter multi-select mode with Space**

```
Mode: Default
Action: Navigate to tab 3 (arrows), press Space
Result: Enter multi-select mode, focus ring visually separates from selection background
Visual: Tab 3 has accent-colored background (selected) + focus ring (focused)
State: selectionStore = { tabIds: [3] }, mode = 'multi-select', anchor = tab 3
```

**Scenario KEY-3: Multi-select mode - arrow keys move focus without changing selection**

```
Mode: Multi-select (tab 3 selected)
Action: Arrow down to tab 4, arrow down to tab 5
Result: Focus ring moves to tab 5, accent-colored background stays on tab 3
Visual: Tab 3 = accent-colored background only, Tab 5 = focus ring only
State: selectionStore = { tabIds: [3] }, focus = tab 5
```

**Scenario KEY-4: Multi-select mode - Space toggles selection**

```
Mode: Multi-select (tab 3 selected, focus on tab 5)
Action: Press Space
Result: Tab 5 gains accent-colored background (selected), tab 3 still selected
Visual: Tab 3 = accent-colored background, Tab 5 = accent-colored background + focus ring
State: selectionStore = { tabIds: [3,5] }, anchor = tab 5
```

**Scenario KEY-5: Multi-select mode - Shift+Arrow extends selection**

```
Mode: Multi-select (tab 3 selected, anchor = tab 3)
Action: Shift+Down, Shift+Down
Result: Tabs 3-5 all gain accent-colored backgrounds, focus ring on tab 5
Visual: Tabs 3-5 = accent-colored background, Tab 5 also has focus ring
State: selectionStore = { tabIds: [3,4,5] }, anchor = tab 3
```

**Scenario KEY-6: Exit multi-select mode with Escape**

```
Mode: Multi-select (tabs 3, 5, 7 selected, focus on tab 7)
Action: Press Escape
Result: Return to default mode, selection cleared, focus ring merges back into fused state on tab 7
Visual: Tab 7 has fused focus+selection state (default mode appearance)
State: selectionStore = {}, mode = 'default'
```

**Scenario KEY-7: Multi-select mode with 0 selected items (no auto-exit)**

```
Mode: Multi-select (only tab 3 selected)
Action: Navigate to tab 3, press Space (deselects it)
Result: Stay in multi-select mode with 0 items selected
Visual: Focus ring visible on tab 3, no accent-colored backgrounds anywhere
State: selectionStore = {}, mode = 'multi-select'
```

### Empty Selection & Mode Transition Scenarios

**Scenario EMPTY-1: Mouse Cmd+click to empty selection**

```
Mode: N/A (mouse only, no keyboard mode active)
Context: Tab 3 selected via click
Action: Cmd+click tab 3
Result: Tab 3 deselected, 0 items selected, no visible focus ring
Visual: No accent-colored backgrounds, no focus ring (mouse cursor is implicit focus)
State: selectionStore = {}, anchor = tab 3 (implicit)
```

**Scenario EMPTY-2: Keyboard navigation from empty selection (down arrow)**

```
Mode: Default (implicit, after mouse interaction)
Context: 0 items selected, tab 3 was last interacted with (implicit focus)
Action: Press Down arrow
Result: Tab 4 becomes selected+focused (relative to implicit focus on tab 3)
Visual: Tab 4 has fused focus+selection state
State: selectionStore = { tabIds: [4] }, mode = 'default'
```

**Scenario EMPTY-3: Mouse click exits keyboard multi-select mode**

```
Mode: Multi-select (focus ring visible on tab 3, tabs 5 and 7 selected)
Action: Regular click on tab 10
Result: Exit multi-select mode, hide focus ring, select only tab 10
Visual: Tab 10 has accent-colored background (no focus ring - back to mouse interaction)
State: selectionStore = { tabIds: [10] }, mode = 'default'
```

**Scenario EMPTY-4: Cmd+click in keyboard multi-select mode**

```
Mode: Multi-select (focus ring on tab 3, tabs 3 and 5 selected)
Action: Cmd+click tab 7
Result: Stay in multi-select mode, toggle tab 7 selection, focus ring stays on tab 3
Visual: Focus ring on tab 3, accent-colored backgrounds on tabs 3, 5, and 7
State: selectionStore = { tabIds: [3,5,7] }, mode = 'multi-select'
```

**Scenario EMPTY-5: Keyboard after mouse multi-selection (no multi-select mode)**

```
Mode: N/A (mouse only - Cmd+clicked tabs 3 and 7)
Context: Tabs 3 and 7 selected via Cmd+click (no focus ring visible)
Action: Press Down arrow
Result: Selection moves to tab 4 (relative to anchor tab 7), tabs 3 and 7 deselected
Visual: Tab 4 has fused focus+selection state
State: selectionStore = { tabIds: [4] }, mode = 'default'
```

### Item Removal Scenarios

**Scenario REMOVE-1: Close selected tab, anchor removed**

```
Action: Click tab 5, tab 5 closes
Result: Selection cleared for tab 5, anchor cleared
State: selectionStore = { tabIds: [] }, anchorRef = null
```

**Scenario REMOVE-2: Close non-anchor selected tab**

```
Action: Click tab 3, Cmd+click tabs 5 and 7, tab 5 closes
Result: Tabs 3 and 7 still selected, anchor still tab 3
State: selectionStore = { tabIds: [3,7] }, anchorRef = tab 3
```

### Edge Cases

**Scenario EDGE-1: Click already-selected item (no modifier)**

```
Context: Tabs 3-7 selected
Action: Click tab 5 (no modifier)
Result: All others deselected, only tab 5 selected
State: selectionStore = { tabIds: [5] }, anchor = tab 5
```

**Scenario EDGE-2: Cmd+click already-selected item**

```
Context: Tabs 3-7 selected
Action: Cmd+click tab 5
Result: Tab 5 deselected, tabs 3-4, 6-7 remain selected
State: selectionStore = { tabIds: [3,4,6,7] }, anchor = tab 5
```

**Scenario EDGE-3: Empty range selection**

```
Context: No selection, anchor = null
Action: Shift+click tab 5
Result: Treated as regular click (no anchor to range from)
State: selectionStore = { tabIds: [5] }, anchor = tab 5
```

**Scenario EDGE-4: Select all in empty pane**

```
Context: Split view, no tabs in current window, tab pane focused
Action: User presses Cmd+A
Result: Nothing selected (no items to select)
State: selectionStore = {} (empty)
```

---

## Technical Architecture

### Selection Store

```typescript
// pages/tab-manager/src/selection/SelectionStore.ts
interface SelectionStore {
  // State: Sets for O(1) lookups
  windowIds: Set<number>
  groupIds: Set<number>
  tabIds: Set<number>
  mode: 'default' | 'multi-select'

  // Single-item mutations
  setWindow: (id: number) => void
  setGroup: (id: number) => void
  setTab: (id: number) => void

  addWindow: (id: number) => void
  addGroup: (id: number) => void
  addTab: (id: number) => void

  removeWindow: (id: number) => void
  removeGroup: (id: number) => void
  removeTab: (id: number) => void

  // Bulk mutations (for range selections, Select All)
  setWindows: (ids: number[]) => void
  setGroups: (ids: number[]) => void
  setTabs: (ids: number[]) => void
  setAll: (windows: number[], groups: number[], tabs: number[]) => void

  addWindows: (ids: number[]) => void
  addGroups: (ids: number[]) => void
  addTabs: (ids: number[]) => void

  removeWindows: (ids: number[]) => void
  removeGroups: (ids: number[]) => void
  removeTabs: (ids: number[]) => void

  // Mode and clear
  clear: () => void
  enterMultiSelectMode: () => void
  exitMultiSelectMode: () => void
}
```

### Selection Interaction Hook

```typescript
// pages/tab-manager/src/selection/useSelectionInteraction.ts
export const useSelectionInteraction = () => {
  const anchorRef = useRef<{
    type: 'window' | 'group' | 'tab'
    id: number
  } | null>(null)
  const paneRef = useRef<'window' | 'tab' | 'tree' | null>(null)

  // Subscribe to state values directly for reactivity
  const mode = useSelectionStore((s) => s.mode)
  const windowIds = useSelectionStore((s) => s.windowIds)
  const groupIds = useSelectionStore((s) => s.groupIds)
  const tabIds = useSelectionStore((s) => s.tabIds)

  const handleClick = (
    item: { type: 'window' | 'group' | 'tab'; id: number },
    event: MouseEvent,
    paneContext: 'window' | 'tab' | 'tree',
  ) => {
    // Cross-pane click clears selection
    if (paneRef.current !== paneContext && paneRef.current !== null) {
      clear()
      anchorRef.current = null
    }
    paneRef.current = paneContext

    if (event.shiftKey && anchorRef.current) {
      // Range selection logic
      // ...
    } else if (event.metaKey || event.ctrlKey) {
      // Toggle individual item
      // ...
      anchorRef.current = item // Anchor moves on Cmd+click
    } else {
      // Regular click - clear and select only this item
      // ...
      anchorRef.current = item
      exitMultiSelectMode()
    }
  }

  const handleKeyboard = (
    item: { type: 'window' | 'group' | 'tab'; id: number },
    key: string,
    paneContext: 'window' | 'tab' | 'tree',
  ) => {
    if (key === ' ') {
      // Space bar logic - enter mode or toggle selection
      // ...
    } else if (key === 'Escape') {
      clear()
      exitMultiSelectMode()
      anchorRef.current = null
    }
  }

  return { handleClick, handleKeyboard, anchorRef, paneRef }
}
```

### Viewing Window Hook (Split View)

```typescript
// pages/tab-manager/src/components/split-view/useViewingWindowId.ts
export const useViewingWindowId = (): number | null => {
  const windowIds = useSelectionStore((s) => s.windowIds)
  if (windowIds.size === 0) return null
  return Array.from(windowIds).at(-1) ?? null
}
```

---

## Migration: Deprecating `selectedWindowId`

The existing `windowSlice.selectedWindowId` in `packages/chrome/lib/windowSlice.ts` should be phased out:

**Current State:**

- `windowSlice` has `selectedWindowId: number | null` and `selectWindow(id)` method
- This is used to track which window's tabs to show in split view
- Groups and tabs never had this pattern (inconsistent)

**New State:**

- Selection system handles `windowIds: Set<number>` with multi-selection
- Viewing window is derived by Split View using `useViewingWindowId()` hook
- Hook returns last item in `windowIds` Set (by insertion order), or `null` if empty

**Migration Steps:**

1. ✅ Implement selection store with `windowIds` Set
2. [ ] Create `useViewingWindowId()` hook in Split View that derives viewing from selection
3. [ ] Update Split View UI to use `useViewingWindowId()` instead of `selectedWindowId`
4. [ ] On initial load, select current window (same as current behavior)
5. [ ] Remove `selectedWindowId` and `selectWindow()` from `windowSlice`
6. [ ] Update tests

---

## Implementation Notes

### `setAll` Method (Phase 3 Bug Fix)

The individual bulk setters (`setWindows`, `setGroups`, `setTabs`) each clear the other item types. This was intentional for "select only windows" scenarios, but breaks mixed selections.

**Problem:**

```typescript
state.setWindows([]) // → windows=[], groups=[], tabs=[]
state.setGroups([g1]) // → windows=[], groups=[g1], tabs=[]
state.setTabs([t1, t2]) // → windows=[], groups=[], tabs=[t1,t2] ← groups wiped!
```

**Solution:**
Added `setAll(windows, groups, tabs)` method that sets all three atomically:

```typescript
state.setAll(
  Array.from(newWindowIds),
  Array.from(newGroupIds),
  Array.from(newTabIds),
)
```

This is used for range selection (Shift+click, Shift+arrow) and Select All (Cmd+A).

---

## Design Decisions (for this plan)

1. **Two-mode keyboard system:** Default mode (Finder-style) where arrow keys move focus and select single item together; Space bar enters multi-select mode where focus and selection become independent.

2. **Single-ID API methods:** Use simple methods like `addTab(id)`, `removeWindow(id)` instead of bulk object methods. Clearer, better autocomplete, more readable. Zustand batches synchronous updates automatically.

3. **Escape to clear selection:** Standard cancellation key. Returns user to neutral state without closing sidebar. Also exits multi-select mode.

4. **No semi-selection:** Simplified design - only show explicit selection. Users learn containment (closing window closes tabs) through experience.

5. **Viewing = last selected window (Split View only):** The tabs pane shows the most recently selected window. Deselecting the viewing window falls back to next-last selected.

---

## Out of Scope (handled in later plans)

- Refined visual design for selection states (→ Selection Visual Design plan)
- Mode transition animations (→ Selection Visual Design plan)
- Selection badge showing count (→ Toolbar plan)
- Actions toolbar and 3-dot menu (→ Toolbar plan)
- Close action and other actions (→ Actions plans)
- View mode toggle (Split vs Tree) (→ View Modes plan)

---

## Success Metrics

- User can select multiple items via mouse (click, Cmd+click, Shift+click)
- User can select multiple items via keyboard (Space, Shift+arrows)
- Cross-pane clicks clear selection predictably
- Range selection handles overlapping ranges correctly
- No performance degradation with 100+ tabs
- Selection state is accessible to screen readers
