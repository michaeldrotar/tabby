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

The selection store uses Zustand with Set-based state for O(1) lookups. Key characteristics:

- **State:** `windowIds`, `groupIds`, `tabIds` as Sets, plus `mode` for keyboard interaction
- **Mutations:** Single-item (`setTab`, `addTab`, `removeTab`) and bulk (`setTabs`, `addTabs`, `removeTabs`) methods
- **No query methods:** Zustand function references are stable, so components subscribe to Sets directly (`windowIds.has(id)`) for proper reactivity

See [Technical Architecture](#technical-architecture) section for full interface definition.

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
7. **Keyboard multi-select mode is keyboard-specific** - Entered only via Space bar; mouse Cmd+click does NOT enter this mode. Mouse and keyboard each follow their own interaction patterns.
8. **Empty selection (0 items) is a valid state** - Both mouse and keyboard support having nothing selected. Implicit focus is tracked so keyboard navigation resumes relative to last position.
9. **Mouse click exits keyboard multi-select mode** - Regular click signals intent to use mouse-style interaction; exits mode and selects clicked item.
10. **Viewing window is a Split View concern, not a selection concept** - The `useViewingWindowId()` hook derives the viewing window from the selection store (last item in `windowIds` by insertion order). This keeps the selection store generic while Split View handles its own presentation needs.
11. **Deprecate `selectedWindowId` from WindowSlice** - The existing `windowSlice.selectedWindowId` is replaced by the selection system. This simplifies the store and makes groups/tabs consistent (they never had "selected" state in the store).

### Interaction Modes

The selection system supports three distinct interaction contexts, each with its own behavior and visual design.

#### Mouse Interactions

**Functionality:**

- **Click (no modifier)**: Select clicked item only, set anchor, deselect all others
- **Cmd/Ctrl+Click**: Toggle individual item selection, update anchor
- **Shift+Click**: Select range from anchor to clicked item, anchor stays
- **Cmd/Ctrl+A**: Select all in current pane/view context
- **0 selected items**: Valid state - no blue backgrounds, ready for interaction
- Mouse cursor acts as implicit "focus" - no visible focus indicator needed
- Using mouse does NOT enter keyboard multi-select mode, even with Cmd+click

**Design:**

- No focus ring displayed - cursor is the implicit focus
- **Blue background** = selected items
- **No background** = unselected items
- Clean, minimal visual state

#### Keyboard Default Mode

This is the standard keyboard navigation mode, matching Finder-style behavior where focus and selection move together.

**Functionality:**

- **Arrow keys**: Move focus AND select single focused item (deselects others)
- **Space**: Enter keyboard multi-select mode (focus ring separates from selection)
- **Shift+Arrow**: Extend selection from anchor in arrow direction
- **Enter on focused item**: Activate/open focused item (switch to that tab)
- **Tab/arrow into new pane**: Focus+select first item in that pane, deselect previous pane
- **0 selected items**: Implicit focus remains on last item; arrow keys select relative to it

**Design:**

- Focus and selection are **fused** into a single visual state
- Blue background with integrated focus indicator (e.g., subtle border or ring)
- Arrow keys move this combined state as one unit
- User is always "looking at" what's selected
- If 0 items selected, no visual indicator (implicit focus is tracked internally)

#### Keyboard Multi-Select Mode

Entered via Space bar. Enables non-contiguous selection by separating focus from selection.

**Functionality:**

- **Arrow keys**: Move focus ring WITHOUT changing selection
- **Space**: Toggle selection (blue background) on focused item
- **Shift+Arrow**: Move focus AND extend selection from anchor
- **Escape**: Exit mode, clear all selection, keep focus on current item
- **0 selected items**: Stay in mode (focus ring remains visible as mode indicator)
- **Regular mouse click**: Exit mode, hide focus ring, select clicked item (return to mouse-style interaction)
- **Cmd/Ctrl+Click**: Toggle item selection, keep focus ring visible, stay in mode

**Design:**

- Focus and selection become **visually separated**
- **Blue background** = selected items (can be multiple, stays in place)
- **Focus ring/border** = current keyboard position (moves independently)
- The visual separation itself IS the mode indicator—no checkboxes needed
- When focus ring is on an unselected item, only the ring is visible (no background)
- When focus ring is on a selected item, both ring and background are visible
- Focus ring remains visible even when using mouse (indicates mode is active)

#### Empty Selection State

Empty selection (0 items) is fully supported across all interaction contexts:

- **Mouse with 0 selected**: No visual indicators, just ready for interaction
- **Keyboard default mode with 0 selected**: Implicit focus on last interacted item (not visible); arrow keys select relative to it
- **Keyboard multi-select mode with 0 selected**: Focus ring visible on current item, no blue backgrounds
- **Cmd+click last selected item**: Always deselects it, resulting in 0 selected
- **Split view pane switch**: Clicking/tabbing to other pane shows its contents; nothing auto-selected until user interacts

#### Mode Transition Animations

Design opportunity for delightful micro-interactions:

- **Entering multi-select (Space)**: Focus ring "lifts off" or "grows out" from the blue background with spring physics
- **Exiting (Escape)**: Focus ring "merges back" into the focused item, selection clears
- **Reduced motion**: Instant transition with no animation
- These micro-interactions reinforce the mental model of focus separating from selection

#### Benefits of Focus Ring Separation Model

- No new UI elements needed (no checkboxes to place, no layout shifts)
- Works consistently across tabs, groups, and windows
- Solves favicon/icon displacement concerns
- Mode is self-evident from visual state alone
- 0 selected items is visually clear (focus ring visible, no backgrounds)

#### Additional Mode Indicators (Optional)

For discoverability, these can supplement the visual model:

- Toolbar could show mode state or selection count
- Subtle text hint or icon when in multi-select mode
- These are not required for understanding but help new users

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
- Tabs pane on right shows "viewing" window's tabs/groups
- Familiar two-pane navigation with multi-selection support

**Split View: useViewingWindowId Hook**

The "viewing window" concept is specific to Split View (not relevant to Tree View). A hook derives it from the selection store:

```typescript
// pages/tab-manager/src/components/split-view/useViewingWindowId.ts
export const useViewingWindowId = (): number | null => {
  const windowIds = useSelectionStore((s) => s.windowIds)
  if (windowIds.size === 0) return null
  // Set maintains insertion order; last item is most recently added
  return Array.from(windowIds).at(-1) ?? null
}
```

- Returns `null` when no windows selected (empty state)
- Returns last selected window by insertion order
- Automatically updates when selection changes
- Fallback on deselect: removing the viewing window causes the next-last to become viewing

**Split View: Tabs Pane Header**

The tabs pane shows a header identifying which window is being viewed:

```
┌──────────────────────────────────────────┐
│ Window 3 - Active Tab Title Here...     │ ← Header (truncate if long)
├──────────────────────────────────────────┤
│ [Tab list for Window 3]                 │
│ ...                                     │
└──────────────────────────────────────────┘
```

- Format: `Window N - Active Tab Title` (truncate title if needed)
- Helps identify which window's tabs are displayed
- Especially useful when multiple windows are selected

**Split View: Viewing Behavior**

| Action                  | Selected Windows | Viewing       | Tabs Pane Shows |
| ----------------------- | ---------------- | ------------- | --------------- |
| Click W1                | [W1]             | W1            | W1's tabs       |
| Shift+click W5          | [W1,W2,W3,W4,W5] | W5            | W5's tabs       |
| Cmd+click W7            | [W1-W5, W7]      | W7            | W7's tabs       |
| Cmd+click W7 (deselect) | [W1-W5]          | W5 (fallback) | W5's tabs       |
| Deselect all            | []               | null          | Empty state     |

**Split View: Range Selection Order**

Since `Set` maintains insertion order and viewing = last in set:

- If anchor is W3 and Shift+click W5: `add([W4, W5])` → viewing = W5 ✓
- If anchor is W3 and Shift+click W1: `add([W2, W1])` → viewing = W1 ✓

Add items in visual order toward the click target so the clicked item becomes viewing.

**Split View: Empty Tabs Pane**

When no windows are selected:

- Show empty state message: "Select a window to view its tabs"
- No tabs or groups rendered
- User can still click in windows pane to select

**Tree View (Toggle):**

- Single unified list with collapsible windows
- All windows visible simultaneously
- Easier multi-window selection
- No viewing/split concept - all items in one pane

Toggle button in top-left of windows pane

---

## Checklist

### Phase 1: Selection Foundation (Core Mechanism)

- [x] Create selection state management in `pages/tab-manager/src/selection/`
  - [x] `SelectionStore.ts` - Zustand store with Set-based state and declarative API
  - [x] `useSelection.ts` - Hook for components to check selection state
  - [x] `useSelectionActions.ts` - Hook providing set/add/remove/clear methods
- [x] Create interaction layer for selection
  - [x] `useSelectionInteraction.ts` - Manages anchor refs and translates user actions to store operations
  - [x] Handle pane context (window pane vs tab pane in split view)
  - [x] Track anchor item with ref (not in store)
  - [x] Track current pane with ref for cross-pane click detection
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
  - [ ] **Designer review:** Refine visual appearance of selected state
  - [ ] **Designer review:** Distinguish focus ring from selection background in multi-select mode
- [x] Test basic selection works with keyboard navigation

### Phase 2: Selection Visual States (Designer-focused)

> **Note:** This phase is primarily design work. Engineering items are optional enhancements. Proceed to Phase 3 for core functionality.

- [ ] Implement focus ring separation visual model
  - [ ] Blue background for selected items
  - [ ] Distinct focus ring/border for keyboard focus position
  - [ ] Update `TabItem`, `TabGroup`, `WindowButton` styling
  - [ ] Default mode: combined focus+selection visual (fused state)
  - [ ] Multi-select mode: focus ring visually separated from selection background
- [ ] Implement mode transition animations (optional enhancement)
  - [ ] "Lift off" animation when entering multi-select mode (Space)
  - [ ] "Merge back" animation when exiting (Escape)
  - [ ] Respect `prefers-reduced-motion` (instant transitions)
  - [ ] Use spring physics for natural feel
- [ ] Add selection badge component (optional, depends on toolbar in Phase 4)
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
  - [ ] Optimize rendering of selection states and focus ring
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
  - [ ] Selection state: aria-selected on items, announce "selected" state
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
Header: "Window 3 - [active tab title]"
```

**Scenario VIEW-SPLIT-2: Shift+click range updates viewing to target**

```
Context: W1 selected and viewing
Action: Shift+click W5
Result: W1-W5 selected, tabs pane shows W5's tabs (click target)
State: selectionStore = { windowIds: [1,2,3,4,5] }, viewing = W5
Implementation: add([W2, W3, W4, W5]) - items added in visual order toward target
```

**Scenario VIEW-SPLIT-3: Shift+click backward range updates viewing to target**

```
Context: W5 selected and viewing
Action: Shift+click W2
Result: W2-W5 selected, tabs pane shows W2's tabs (click target)
State: selectionStore = { windowIds: [5,4,3,2] }, viewing = W2
Implementation: add([W4, W3, W2]) - items added in visual order toward target
```

**Scenario VIEW-SPLIT-4: Cmd+click adds window and updates viewing**

```
Context: W1 selected and viewing
Action: Cmd+click W5
Result: W1 and W5 selected, tabs pane shows W5's tabs
State: selectionStore = { windowIds: [1,5] }, viewing = W5
```

**Scenario VIEW-SPLIT-5: Cmd+click deselect non-viewing window**

```
Context: W1 and W5 selected, viewing W5
Action: Cmd+click W1 (deselect)
Result: Only W5 selected, tabs pane still shows W5
State: selectionStore = { windowIds: [5] }, viewing = W5
```

**Scenario VIEW-SPLIT-6: Cmd+click deselect viewing window (fallback)**

```
Context: W1 and W5 selected, viewing W5
Action: Cmd+click W5 (deselect viewing window)
Result: Only W1 selected, tabs pane shows W1 (fallback to first selected)
State: selectionStore = { windowIds: [1] }, viewing = W1
Rationale: Viewing falls back to first selected when viewing window is deselected
```

**Scenario VIEW-SPLIT-7: Deselect all windows (empty tabs pane)**

```
Context: W1 selected and viewing
Action: Cmd+click W1 (deselect only window)
Result: No windows selected, tabs pane shows empty state
State: selectionStore = { windowIds: [] }, viewing = null
Empty state: "Select a window to view its tabs"
```

**Scenario VIEW-SPLIT-8: Initial load - current window**

```
Context: Tab manager opens in split view
Action: (Initial load)
Result: Current window (where sidebar is open) is selected and viewing
State: selectionStore = { windowIds: [currentWindowId] }, viewing = currentWindow
Rationale: Matches current behavior, user sees their current context
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
Visual: Tab 3 has blue background (selected) + focus ring (focused)
State: selectionStore = { tabIds: [3] }, mode = 'multi-select', anchor = tab 3
```

**Scenario KEY-3: Multi-select mode - arrow keys move focus without changing selection**

```
Mode: Multi-select (tab 3 selected)
Action: Arrow down to tab 4, arrow down to tab 5
Result: Focus ring moves to tab 5, blue background stays on tab 3
Visual: Tab 3 = blue background only, Tab 5 = focus ring only
State: selectionStore = { tabIds: [3] }, focus = tab 5
```

**Scenario KEY-4: Multi-select mode - Space toggles selection**

```
Mode: Multi-select (tab 3 selected, focus on tab 5)
Action: Press Space
Result: Tab 5 gains blue background (selected), tab 3 still selected
Visual: Tab 3 = blue background, Tab 5 = blue background + focus ring
State: selectionStore = { tabIds: [3,5] }, anchor = tab 5
```

**Scenario KEY-5: Multi-select mode - Shift+Arrow extends selection**

```
Mode: Multi-select (tab 3 selected, anchor = tab 3)
Action: Shift+Down, Shift+Down
Result: Tabs 3-5 all gain blue backgrounds, focus ring on tab 5
Visual: Tabs 3-5 = blue background, Tab 5 also has focus ring
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
Visual: Focus ring visible on tab 3, no blue backgrounds anywhere
State: selectionStore = {}, mode = 'multi-select'
Rationale: Focus ring remaining visible indicates mode; user explicitly exits with Escape
```

**Scenario KEY-7b: Navigating with 0 selected items in multi-select mode**

```
Mode: Multi-select (0 items selected, focus on tab 3)
Action: Arrow down to tab 4, press Space
Result: Tab 4 becomes selected
Visual: Focus ring on tab 4, blue background on tab 4
State: selectionStore = { tabIds: [4] }, mode = 'multi-select'
```

**Scenario KEY-8: Cmd+A in different panes**

```
Context: Split view, window pane focused
Action: Cmd+A
Result: All windows selected
Context: Now tab pane focused
Action: Cmd+A
Result: Windows deselected, all tabs in current window selected
State: selectionStore = { tabIds: [all tabs in window] }, paneRef = 'tab'
```

### Empty Selection & Mode Transition Scenarios

**Scenario EMPTY-1: Mouse Cmd+click to empty selection**

```
Mode: N/A (mouse only, no keyboard mode active)
Context: Tab 3 selected via click
Action: Cmd+click tab 3
Result: Tab 3 deselected, 0 items selected, no visible focus ring
Visual: No blue backgrounds, no focus ring (mouse cursor is implicit focus)
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
Rationale: Improves on Finder behavior - doesn't jump to first/last item
```

**Scenario EMPTY-3: Keyboard navigation from empty selection (up arrow)**

```
Mode: Default (implicit)
Context: 0 items selected, tab 3 was last interacted with (implicit focus)
Action: Press Up arrow
Result: Tab 2 becomes selected+focused
Visual: Tab 2 has fused focus+selection state
State: selectionStore = { tabIds: [2] }, mode = 'default'
```

**Scenario EMPTY-4: Mouse click exits keyboard multi-select mode**

```
Mode: Multi-select (focus ring visible on tab 3, tabs 5 and 7 selected)
Action: Regular click on tab 10
Result: Exit multi-select mode, hide focus ring, select only tab 10
Visual: Tab 10 has blue background (no focus ring - back to mouse interaction)
State: selectionStore = { tabIds: [10] }, mode = 'default'
Rationale: Reaching for mouse indicates intent to use mouse-style interaction
```

**Scenario EMPTY-5: Cmd+click in keyboard multi-select mode**

```
Mode: Multi-select (focus ring on tab 3, tabs 3 and 5 selected)
Action: Cmd+click tab 7
Result: Stay in multi-select mode, toggle tab 7 selection, focus ring stays on tab 3
Visual: Focus ring on tab 3, blue backgrounds on tabs 3, 5, and 7
State: selectionStore = { tabIds: [3,5,7] }, mode = 'multi-select'
Rationale: Cmd+click is additive behavior, doesn't signal "switch to mouse mode"
```

**Scenario EMPTY-6: Keyboard after mouse multi-selection (no multi-select mode)**

```
Mode: N/A (mouse only - Cmd+clicked tabs 3 and 7)
Context: Tabs 3 and 7 selected via Cmd+click (no focus ring visible)
Action: Press Down arrow
Result: Selection moves to tab 4 (relative to anchor tab 7), tabs 3 and 7 deselected
Visual: Tab 4 has fused focus+selection state
State: selectionStore = { tabIds: [4] }, mode = 'default'
Rationale: Mouse Cmd+click does NOT enter keyboard multi-select mode; keyboard follows its own rules
```

**Scenario EMPTY-7: Tab into empty pane (split view)**

```
Mode: Default
Context: Window 1 selected+focused in window pane, tab pane showing Window 1's tabs (nothing selected)
Action: Press Tab to move focus to tab pane
Result: First tab in pane becomes selected+focused, window 1 deselected
Visual: First tab has fused focus+selection, window 1 has no background
State: selectionStore = { tabIds: [first_tab] }, paneRef = 'tab'
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

### Mixed Selection Scenarios

**Scenario MIXED-1: Select tabs and groups together (tree view)**

```
Action: Click tab 3, Shift+click group 1 (tree order: tab3, tab4, group1)
Result: Tab 3, tab 4, and group 1 selected
State: selectionStore = { tabIds: [3,4], groupIds: [1] }
Toolbar: Shows only actions common to tabs and groups (Close, Copy URLs)
```

**Scenario MIXED-2: Select window and tabs (tree view)**

```
Action: Click window 2, Shift+click tab 8 (window2 contains tabs 5-10)
Result: Window 2 and tabs 5-8 explicitly selected
State: selectionStore = { windowIds: [2], tabIds: [5,6,7,8] }
```

### Context Menu Scenarios

**Scenario MENU-1: Right-click selected item**

```
Context: Tabs 3-5 selected
Action: Right-click tab 4
Result: Context menu shows bulk actions, operates on all 3 selected tabs
State: Selection unchanged
```

**Scenario MENU-2: Right-click unselected item**

```
Context: Tabs 3-5 selected
Action: Right-click tab 8
Result: Clears selection, selects only tab 8, shows single-item context menu
State: selectionStore = { tabIds: [8] }
```

### View Mode Switch Scenarios

**Scenario VIEW-1: Switch from split to tree view**

```
Context: Split view, window 1 selected in window pane
Action: Toggle to tree view
Result: Window 1 still selected, shown in tree with all items visible
State: selectionStore unchanged, view mode changes
```

**Scenario VIEW-2: Select across windows in tree view**

```
Context: Tree view showing windows 1 and 2
Action: Click tab 5 (window 1), Shift+click tab 12 (window 2)
Result: Tabs 5-12 selected, crossing window boundaries
State: selectionStore = { tabIds: [5,6,7,8,9,10,11,12] }
Note: Would also select any groups between if they exist in tree order
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

**Scenario EDGE-4: Selection with no applicable actions**

```
Context: Mix of 2 windows, 3 groups, 5 tabs selected
Result: Toolbar shows only Close (works on all types)
State: All other actions disabled/hidden (no bulk rename, no bulk pin, etc.)
```

**Scenario EDGE-5: Rename group with multiple groups selected**

```
Context: Groups 1, 2, 3 selected
Result: Rename action disabled (only works with single group)
Action: User deselects 2 groups, only group 1 selected
Result: Rename action becomes enabled
```

**Scenario EDGE-6: Default mode - arrow key moves focus and selection together**

```
Mode: Default
Context: Tab 3 focused and selected
Action: Arrow down to tab 4
Result: Tab 4 becomes focused and selected, tab 3 deselected
State: selectionStore = { tabIds: [4] }, focus = tab 4, mode = 'default'
```

**Scenario EDGE-7: Multi-select mode - focus independent of selection**

```
Mode: Multi-select
Context: Tab 3 selected, focus on tab 5
Action: Press Space
Result: Tab 5 becomes selected (both 3 and 5 now selected)
State: selectionStore = { tabIds: [3,5] }, focus = tab 5, mode = 'multi-select'
```

**Scenario EDGE-8: Collapse selected group**

```
Context: Group 1 (with 5 tabs) is selected and expanded
Action: User collapses group 1 (click chevron or Left arrow)
Result: Group still selected, tabs now hidden
Visual: Group blue background, chevron points right, tabs not visible
State: selectionStore = { groupIds: [1] } (unchanged)
```

**Scenario EDGE-9: Move selected tabs to another window**

```
Context: Tabs 3-5 selected in window 1
Action: User executes "Move to Window 2" action
Result: Tabs moved to window 2, selection cleared (items changed context)
State: selectionStore = {} (cleared after action completes)
Rationale: Selection clears after successful action to avoid confusion
```

**Scenario EDGE-10: Group selected tabs**

```
Context: Tabs 3, 5, 7 selected (non-contiguous)
Action: User executes "Add to New Group"
Result: New group created with tabs 3, 5, 7, group is now selected
State: selectionStore = { groupIds: [newGroupId] }
Visual: New group highlighted with blue background
```

**Scenario EDGE-11: Ungroup selected group**

```
Context: Group 1 selected (with 5 tabs)
Action: User executes "Ungroup"
Result: Group removed, its 5 tabs are now selected individually
State: selectionStore = { tabIds: [1,2,3,4,5] } (group's tab IDs)
Rationale: Keeps selection context on affected items
```

**Scenario EDGE-12: Reload selected tabs during loading**

```
Context: Tabs 1-10 selected, user presses R to reload all
Action: While tabs are reloading, user clicks tab 15
Result: Previous selection clears, only tab 15 selected
State: selectionStore = { tabIds: [15] }
Note: No special handling for loading state - selection is independent
```

**Scenario EDGE-13: Drag and drop (future consideration)**

```
Context: Tabs 3-5 selected
Action: User drags tab 4 to different position
Result: All 3 selected tabs move together
Note: Out of scope for initial implementation, but selection should support it
```

**Scenario EDGE-14: Browser shortcut conflicts**

```
Context: Tab manager has focus, user wants to reload current page
Action: User presses Cmd+R
Result: Page reload (browser default), NOT "reload selected tabs"
Rationale: Browser shortcuts always take precedence
Note: Tab manager's R key (reload selected) only works without Cmd modifier
```

**Scenario EDGE-15: Select all in empty pane**

```
Context: Split view, no tabs in current window, tab pane focused
Action: User presses Cmd+A
Result: Nothing selected (no items to select)
State: selectionStore = {} (empty)
```

**Scenario EDGE-16: Visual states in two modes (focus ring separation)**

```
Mode: Default
Context: Tab 3 focused/selected
Visual: Tab 3 has fused focus+selection state (blue background with integrated focus indicator)
Action: Arrow down to tab 4
Result: Fused state moves to tab 4, tab 3 returns to normal

Mode: Multi-select
Context: Entered via Space bar, tab 3 selected
Visual: Tab 3 has blue background (selected) AND focus ring (focused)
Action: Arrow down to tab 4
Result: Focus ring moves to tab 4, blue background stays on tab 3
Visual: Tab 3 = blue background only, Tab 4 = focus ring only
Action: Press Space on tab 4
Result: Tab 4 gains blue background
Visual: Tab 3 = blue background, Tab 4 = blue background + focus ring
```

**Scenario EDGE-17: Performance with large selection**

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

  // Note: Query methods like `isWindowSelected(id)` are NOT in the store.
  // Zustand function references are stable, so `store.isWindowSelected(3)`
  // won't trigger re-renders when selection changes.
  // Instead, components subscribe to Sets directly:
  //   const windowIds = useSelectionStore(s => s.windowIds)
  //   const isSelected = windowIds.has(3)
  // This ensures proper reactivity.
}

// useSelectionInteraction.ts
// Manages anchor, mode, and translates user actions to store calls
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

  // Get actions (stable references, safe to destructure)
  const {
    clear,
    setWindow,
    setGroup,
    setTab,
    addWindow,
    addGroup,
    addTab,
    removeWindow,
    removeGroup,
    removeTab,
    enterMultiSelectMode,
    exitMultiSelectMode,
  } = useSelectionStore.getState()

  const handleClick = (
    item: { type; id },
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
      // Range selection from anchor to item
      const range = getItemsInRange(anchorRef.current, item, paneContext)
      // Handle overlapping ranges - Zustand batches these
      if (range.toRemove?.length) {
        if (range.toRemove[0].type === 'tab')
          removeTabs(range.toRemove.map((i) => i.id))
        else if (range.toRemove[0].type === 'group')
          removeGroups(range.toRemove.map((i) => i.id))
        else removeWindows(range.toRemove.map((i) => i.id))
      }
      if (range.toAdd?.length) {
        if (range.toAdd[0].type === 'tab') addTabs(range.toAdd.map((i) => i.id))
        else if (range.toAdd[0].type === 'group')
          addGroups(range.toAdd.map((i) => i.id))
        else addWindows(range.toAdd.map((i) => i.id))
      }
      // Anchor stays the same
    } else if (event.metaKey || event.ctrlKey) {
      // Toggle individual item - check selection via Sets directly
      const isSelected =
        item.type === 'window'
          ? windowIds.has(item.id)
          : item.type === 'group'
            ? groupIds.has(item.id)
            : tabIds.has(item.id)
      if (isSelected) {
        if (item.type === 'tab') removeTab(item.id)
        else if (item.type === 'group') removeGroup(item.id)
        else removeWindow(item.id)
      } else {
        if (item.type === 'tab') addTab(item.id)
        else if (item.type === 'group') addGroup(item.id)
        else addWindow(item.id)
      }
      anchorRef.current = item // Anchor moves on Cmd+click
    } else {
      // Regular click - clear and select only this item
      if (item.type === 'tab') setTab(item.id)
      else if (item.type === 'group') setGroup(item.id)
      else setWindow(item.id)
      anchorRef.current = item
      // Exit multi-select mode on regular click
      exitMultiSelectMode()
    }
  }

  const handleKeyboard = (
    item: { type; id },
    key: string,
    paneContext: 'window' | 'tab' | 'tree',
  ) => {
    if (key === ' ') {
      const isMultiSelect = mode === 'multi-select'

      if (!isMultiSelect) {
        // First Space press: enter multi-select mode and select current item
        enterMultiSelectMode()
        if (item.type === 'tab') setTab(item.id)
        else if (item.type === 'group') setGroup(item.id)
        else setWindow(item.id)
        anchorRef.current = item
      } else {
        // In multi-select mode: toggle like Cmd+click
        const isSelected =
          item.type === 'window'
            ? windowIds.has(item.id)
            : item.type === 'group'
              ? groupIds.has(item.id)
              : tabIds.has(item.id)
        if (isSelected) {
          if (item.type === 'tab') removeTab(item.id)
          else if (item.type === 'group') removeGroup(item.id)
          else removeWindow(item.id)
          // Note: Stay in multi-select mode even with 0 items (per Decision 7)
          // Focus ring remains visible as mode indicator
        } else {
          if (item.type === 'tab') addTab(item.id)
          else if (item.type === 'group') addGroup(item.id)
          else addWindow(item.id)
        }
        anchorRef.current = item
      }
    } else if (key === 'Escape') {
      clear()
      exitMultiSelectMode()
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
  // Subscribe to mode for reactivity
  const mode = useSelectionStore((s) => s.mode)

  // Get actions (stable references)
  const { setWindow, setGroup, setTab, clear, exitMultiSelectMode } =
    useSelectionStore.getState()

  const handleKeyDown = (e: KeyboardEvent) => {
    const activeElement = document.activeElement as HTMLElement
    const navItem = activeElement?.closest('[data-nav-type]') as HTMLElement
    const isMultiSelect = mode === 'multi-select'

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
          if (item.type === 'tab') setTab(item.id)
          else if (item.type === 'group') setGroup(item.id)
          else setWindow(item.id)
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
      clear()
      exitMultiSelectMode()
      return
    }

    // Action shortcuts (when items selected)
    // Note: Use getTotalCount() only in event handlers (non-reactive context)
    const selectionCount =
      useSelectionStore.getState().windowIds.size +
      useSelectionStore.getState().groupIds.size +
      useSelectionStore.getState().tabIds.size
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

- [ ] Selected items have clear blue background highlights
- [ ] Focus ring is visually distinct and separates from selection in multi-select mode
- [ ] The badge shows selection count (e.g., "3 tabs" or "1 window (15 tabs)")
- [ ] Before bulk closing 10+ items, I see a confirmation with the count
- [ ] Focus ring (border) is distinct from selection (blue background) in multi-select mode

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

15. **Viewing = last selected window (Split View only):** In split view, the tabs pane shows the most recently selected window. The `useViewingWindowId()` hook derives this from insertion order in the Set (last item). When Shift+clicking a range, items are added in visual order toward the click target so the target becomes the viewing window. Deselecting the viewing window falls back to next-last selected. This is not a core selection concept - it's a Split View presentation concern.

16. **Tabs pane header:** Shows "Window N - Active Tab Title" to clarify which window's tabs are displayed. Particularly helpful when multiple windows are selected. Truncate title if needed.

### Migration: Deprecating `selectedWindowId`

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

1. Implement selection store with `windowIds` Set
2. Create `useViewingWindowId()` hook in Split View that derives viewing from selection
3. Update Split View UI to use `useViewingWindowId()` instead of `selectedWindowId`
4. On initial load, select current window (same as current behavior)
5. Remove `selectedWindowId` and `selectWindow()` from `windowSlice`
6. Update tests

**Breaking Changes:**

- Components using `useBrowserStore().selectedWindowId` must migrate to selection system
- The concept of "selected window" becomes "selected windows" (plural)

### Implementation Order Rationale

The phases are ordered to:

1. Build foundation first (selection state, visual feedback)
2. Prove the pattern with one complete action (Close)
3. Add infrastructure (toolbar, menu)
4. Scale to all actions progressively
5. Polish and refine

Each phase builds on the previous, ensuring we can test and validate before adding complexity.
