# Tab Manager: Toolbar & Close Action

**Date:** January 3, 2026  
**Model:** Claude Opus 4.5  
**Status:** Not Started  
**Predecessors:** [Selection Foundation](./2025-01-03-tab-manager-selection-foundation.md), [Selection Visual Design](./2025-01-03-tab-manager-selection-visual-design.md)  
**Successors:** [View Modes](./2025-01-03-tab-manager-view-modes.md), [Single-Type Actions](./2025-01-03-tab-manager-single-type-actions.md), [Mixed Selection & Polish](./2025-01-03-tab-manager-mixed-selection-polish.md)

## Executive Summary

This plan implements the adaptive toolbar and the first contextual action (Close). It provides the foundation for all future actions by establishing the toolbar component architecture, the 3-dot menu pattern, and the action execution flow.

**Key Deliverables:**

- `AdaptiveToolbar.tsx` with fixed and contextual sections
- `ActionsMenu.tsx` (3-dot dropdown menu)
- `CloseButton.tsx` and close action implementation
- `ConfirmDialog.tsx` for bulk operation confirmations
- Delete/Backspace keyboard shortcut handling
- Width-responsive toolbar behavior

## Problem Being Solved

With the selection foundation in place, users need:

- A discoverable way to execute actions on selected items
- Keyboard shortcuts visible in the UI
- Access to actions without opening context menus
- Bulk operations with appropriate safeguards (confirmation dialogs)

The toolbar provides the primary action surface, with Close being the most important bulk action to implement first.

## Solution Overview

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

### Why Close First?

1. **Universal applicability** - Works on tabs, groups, and windows
2. **Bulk importance** - Most common reason to multi-select
3. **Confirmation pattern** - Establishes dialog pattern for destructive bulk operations
4. **Keyboard shortcut** - Delete/Backspace is intuitive and standard
5. **Foundation** - Proves the action execution flow for all future actions

---

## Checklist

### Phase 1: Toolbar Foundation & Close Action

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

### Phase 2: 3-Dot Menu Foundation

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
  - [ ] Show shortcuts right-aligned (e.g., "Close Tab ␈")
  - [ ] Use `Kbd` component for visual consistency
- [ ] Test menu opens/closes correctly
- [ ] Test menu shows correct actions based on selection

### Phase 3: Toolbar Polish

- [ ] Implement tooltip system for toolbar buttons
  - [ ] Use shadcn Tooltip component
  - [ ] Show on hover
  - [ ] Show on keyboard focus (Tab to toolbar, arrow keys to buttons)
  - [ ] Format: "Action Name (Shortcut)"
  - [ ] Example: "Close Selection (Del)"
- [ ] Update tooltip text based on selection
  - [ ] Single tab: "Close Tab (Del)"
  - [ ] Multiple tabs: "Close 5 Tabs (Del)"
  - [ ] Single group: "Close Group (Del)" (closes all tabs in group)
  - [ ] Multiple groups: "Close 3 Groups (Del)"
  - [ ] Single window: "Close Window (Del)"
  - [ ] Mixed: "Close Selection (Del)"
- [ ] Add keyboard focus indicators
  - [ ] Blue ring around focused button in toolbar
  - [ ] Test Tab key cycles through toolbar buttons
  - [ ] Test arrow keys navigate within toolbar zone
- [ ] Test tooltips appear correctly and have correct text

### Phase 4: Accessibility

- [ ] Add ARIA labels to toolbar components
  - [ ] Toolbar: role="toolbar", aria-label="Tab actions"
  - [ ] Buttons: aria-label with action description
  - [ ] Badge: aria-label announcing count
  - [ ] Menu: proper ARIA roles and labels
- [ ] Test with screen reader (VoiceOver)
  - [ ] Ensure action buttons are announced correctly
  - [ ] Ensure menu items are announced correctly
  - [ ] Ensure badge count is announced
- [ ] Test keyboard-only navigation
  - [ ] Tab to reach toolbar
  - [ ] Arrow keys to navigate between buttons
  - [ ] Enter/Space to activate buttons
  - [ ] Escape to close menu
- [ ] Verify color contrast meets WCAG AA
  - [ ] Check button colors
  - [ ] Check tooltip colors

### Phase 5: Testing

- [ ] Write unit tests for toolbar logic
  - [ ] Test `getContextualActions()` with different selection types
  - [ ] Test width breakpoint calculations
  - [ ] Test badge text generation
- [ ] Write integration tests for Close action
  - [ ] Test close single tab
  - [ ] Test close multiple tabs
  - [ ] Test close group (closes all tabs in group)
  - [ ] Test close window (closes all tabs in window)
  - [ ] Test close mixed selection
  - [ ] Test confirmation dialog appears for large selections
  - [ ] Test "Don't ask again" preference
- [ ] Manual testing checklist
  - [ ] Test toolbar at 280px width
  - [ ] Test toolbar at 320px width
  - [ ] Test toolbar at 360px+ width
  - [ ] Test in dark mode
  - [ ] Test keyboard shortcuts work

### Phase 6: Documentation

- [ ] Document toolbar component props
- [ ] Document action execution flow
- [ ] Add JSDoc comments to key functions
- [ ] Update keyboard shortcuts reference
  - [ ] Del/Backspace: Close selected items

---

## Action Reference (This Plan)

### Close Action

| Context          | Shortcut | Toolbar  | Behavior                       | Confirmation      |
| ---------------- | -------- | -------- | ------------------------------ | ----------------- |
| Single tab       | Del/⌫    | ✕ button | `chrome.tabs.remove(id)`       | None              |
| Multiple tabs    | Del/⌫    | ✕ button | `chrome.tabs.remove([ids])`    | 10+ tabs          |
| Single group     | Del/⌫    | ✕ button | Close all tabs in group        | 10+ tabs in group |
| Multiple groups  | Del/⌫    | ✕ button | Close all tabs in groups       | 10+ tabs total    |
| Single window    | Del/⌫    | ✕ button | `chrome.windows.remove(id)`    | None (1 window)   |
| Multiple windows | Del/⌫    | ✕ button | `chrome.windows.remove()` each | 3+ windows        |
| Mixed selection  | Del/⌫    | ✕ button | Close all items                | 10+ items total   |

### Confirmation Thresholds

- **10+ tabs** (individual or within groups): "Close N tabs?"
- **3+ windows**: "Close N windows and their N tabs?"
- User preference: "Don't ask again for large closures"

---

## Interaction Scenarios

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

### Action Execution Scenarios

**Scenario ACTION-1: Close single tab via toolbar**

```
Context: Tab 3 selected
Action: Click ✕ button in toolbar
Result: Tab 3 closes, no confirmation shown
State: selectionStore = {} (cleared after close)
```

**Scenario ACTION-2: Close multiple tabs via keyboard**

```
Context: Tabs 3-7 selected (5 tabs)
Action: Press Delete key
Result: All 5 tabs close, no confirmation (under threshold)
State: selectionStore = {} (cleared after close)
```

**Scenario ACTION-3: Close many tabs with confirmation**

```
Context: 15 tabs selected
Action: Press Delete key
Result: Confirmation dialog: "Close 15 tabs?"
On confirm: All 15 tabs close
On cancel: Nothing happens, selection preserved
```

**Scenario ACTION-4: Close group via toolbar**

```
Context: Group 1 selected (containing 8 tabs)
Action: Click ✕ button in toolbar
Result: All 8 tabs in group close (group dissolves), no confirmation
State: selectionStore = {} (cleared after close)
```

**Scenario ACTION-5: Close window via keyboard**

```
Context: Window 2 selected (containing 20 tabs)
Action: Press Backspace key
Result: Window closes with all its tabs
State: selectionStore = {} (cleared after close)
Note: No confirmation for single window (user chose to close it)
```

**Scenario ACTION-6: Close mixed selection**

```
Context: Tab 3, Group 1 (5 tabs), Window 2 (10 tabs) selected
Action: Press Delete key
Result: Confirmation: "Close 1 tab, 1 group (5 tabs), 1 window (10 tabs)?"
On confirm: All items close
Total: 16 tabs closed
```

### Edge Cases

**Scenario EDGE-5: Rename group with multiple groups selected**

```
Context: Groups 1, 2, 3 selected
Result: Rename action disabled (only works with single group)
Action: User deselects 2 groups, only group 1 selected
Result: Rename action becomes enabled
Note: This scenario is documented here for menu filtering logic
```

**Scenario EDGE-8: Collapse selected group**

```
Context: Group 1 (with 5 tabs) is selected and expanded
Action: User collapses group 1 (click chevron or Left arrow)
Result: Group still selected, tabs now hidden
Visual: Group blue background, chevron points right, tabs not visible
State: selectionStore = { groupIds: [1] } (unchanged)
Note: Collapse doesn't affect selection or close capability
```

**Scenario EDGE-9: Move selected tabs to another window**

```
Context: Tabs 3-5 selected in window 1
Action: User executes "Move to Window 2" action
Result: Tabs moved to window 2, selection cleared (items changed context)
State: selectionStore = {} (cleared after action completes)
Rationale: Selection clears after successful action to avoid confusion
Note: Move action comes in Plan 5, but pattern applies to Close too
```

**Scenario EDGE-10: Group selected tabs**

```
Context: Tabs 3, 5, 7 selected (non-contiguous)
Action: User executes "Add to New Group"
Result: New group created with tabs 3, 5, 7, group is now selected
State: selectionStore = { groupIds: [newGroupId] }
Visual: New group highlighted with blue background
Note: Add to Group comes in Plan 5, but establishes selection-after-action pattern
```

**Scenario EDGE-11: Ungroup selected group**

```
Context: Group 1 selected (with 5 tabs)
Action: User executes "Ungroup"
Result: Group removed, its 5 tabs are now selected individually
State: selectionStore = { tabIds: [1,2,3,4,5] } (group's tab IDs)
Rationale: Keeps selection context on affected items
Note: Ungroup comes in Plan 5, but illustrates selection transformation
```

**Scenario EDGE-12: Reload selected tabs during loading**

```
Context: Tabs 1-10 selected, user presses R to reload all
Action: While tabs are reloading, user clicks tab 15
Result: Previous selection clears, only tab 15 selected
State: selectionStore = { tabIds: [15] }
Note: No special handling for loading state - selection is independent
```

**Scenario EDGE-CLOSE-1: Close last tab in window**

```
Context: Window 1 has only tab 3, tab 3 is selected
Action: Press Delete key
Result: Tab closes, window closes (Chrome behavior), selection clears
State: selectionStore = {} (cleared)
Note: Chrome automatically closes windows when last tab closes
```

**Scenario EDGE-CLOSE-2: Close while items load**

```
Context: Tabs 3-5 selected, user presses Delete
Action: Close initiated, then user quickly Cmd+clicks tab 8
Result: Close completes on 3-5, then tab 8 becomes selected
State: selectionStore = { tabIds: [8] }
Rationale: Action completion clears selection, new action creates new selection
```

---

## Technical Architecture

### Toolbar Component Structure

```
packages/ui/lib/tab-manager/
├── toolbar/
│   ├── AdaptiveToolbar.tsx    # Main toolbar container
│   ├── FixedActions.tsx       # Search + Settings buttons
│   ├── ContextualActions.tsx  # Dynamic action buttons
│   ├── ActionsMenu.tsx        # 3-dot dropdown menu
│   ├── ActionButton.tsx       # Individual action button
│   ├── SelectionBadge.tsx     # Count badge
│   └── index.ts               # Exports
├── actions/
│   ├── CloseButton.tsx        # Close action button
│   ├── useCloseAction.ts      # Close logic hook
│   ├── getContextualActions.ts # Action filtering
│   └── index.ts               # Exports
└── dialogs/
    ├── ConfirmDialog.tsx      # Confirmation dialog
    └── index.ts               # Exports
```

### AdaptiveToolbar Component

```typescript
// AdaptiveToolbar.tsx
interface AdaptiveToolbarProps {
  selection: SelectionState
  onAction: (actionId: string) => void
}

export const AdaptiveToolbar = ({ selection, onAction }: AdaptiveToolbarProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(360)

  useResizeObserver(containerRef, (entry) => {
    setWidth(entry.contentRect.width)
  })

  const contextualActions = getContextualActions(selection)
  const visibleActions = getVisibleActions(contextualActions, width)
  const badgeText = getSelectionBadgeText(selection) // From Plan 2

  return (
    <div
      ref={containerRef}
      className="toolbar flex items-center h-10 px-2 gap-1"
      role="toolbar"
      aria-label="Tab actions"
    >
      {/* Fixed section */}
      <FixedActions />

      <Separator orientation="vertical" className="h-6" />

      {/* Contextual section */}
      <ContextualActions
        actions={visibleActions}
        selection={selection}
        onAction={onAction}
      />

      <ActionsMenu
        actions={contextualActions}
        selection={selection}
        onSelect={onAction}
      />

      {/* Badge */}
      {selection.totalCount > 0 && (
        <SelectionBadge count={selection.totalCount} text={badgeText} />
      )}
    </div>
  )
}
```

### getContextualActions Implementation

```typescript
// getContextualActions.ts
interface Action {
  id: string
  label: string
  icon: React.ComponentType
  shortcut?: string
  priority: 'highest' | 'high' | 'medium' | 'low'
  appliesTo: ('tab' | 'group' | 'window')[]
  requiresSingle?: boolean
  requiresBulk?: boolean
}

const ALL_ACTIONS: Action[] = [
  {
    id: 'close',
    label: 'Close',
    icon: XIcon,
    shortcut: 'Del',
    priority: 'highest',
    appliesTo: ['tab', 'group', 'window'],
  },
  // ... other actions added in future plans
]

export const getContextualActions = (selection: SelectionState): Action[] => {
  const { tabIds, groupIds, windowIds } = selection
  const hasSelection =
    tabIds.size > 0 || groupIds.size > 0 || windowIds.size > 0

  if (!hasSelection) {
    return [] // No actions when nothing selected
  }

  // Determine selection types present
  const hasTabs = tabIds.size > 0
  const hasGroups = groupIds.size > 0
  const hasWindows = windowIds.size > 0

  // Filter actions that apply to all selected types
  return ALL_ACTIONS.filter((action) => {
    // Check if action applies to all selected item types
    if (hasTabs && !action.appliesTo.includes('tab')) return false
    if (hasGroups && !action.appliesTo.includes('group')) return false
    if (hasWindows && !action.appliesTo.includes('window')) return false

    // Check single/bulk requirements
    const totalCount = tabIds.size + groupIds.size + windowIds.size
    if (action.requiresSingle && totalCount !== 1) return false
    if (action.requiresBulk && totalCount < 2) return false

    return true
  })
}

export const getVisibleActions = (
  actions: Action[],
  width: number,
): Action[] => {
  // Determine how many actions to show based on width
  // 280px: 1 action (Close only)
  // 320px: 3 actions (Pin, Mute, Close)
  // 360px+: All high priority actions

  const maxVisible = width < 300 ? 1 : width < 340 ? 3 : 5

  // Sort by priority, take top N
  const priorityOrder = { highest: 0, high: 1, medium: 2, low: 3 }
  const sorted = [...actions].sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
  )

  return sorted.slice(0, maxVisible)
}
```

### useCloseAction Hook

```typescript
// useCloseAction.ts
interface CloseActionOptions {
  onComplete?: () => void
  skipConfirmation?: boolean
}

export const useCloseAction = (options: CloseActionOptions = {}) => {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pendingClose, setPendingClose] = useState<SelectionState | null>(null)
  const { preference } = useStorage(preferenceStorage)

  const executeClose = async (selection: SelectionState) => {
    const { tabIds, groupIds, windowIds } = selection

    try {
      // Close windows first (also closes their tabs)
      if (windowIds.size > 0) {
        await Promise.all(
          Array.from(windowIds).map((id) => chrome.windows.remove(id)),
        )
      }

      // Close groups by closing their tabs
      if (groupIds.size > 0) {
        const groupTabIds = await getTabsInGroups(Array.from(groupIds))
        await chrome.tabs.remove(groupTabIds)
      }

      // Close individual tabs
      if (tabIds.size > 0) {
        await chrome.tabs.remove(Array.from(tabIds))
      }

      // Clear selection after successful close
      useSelectionStore.getState().clear()
      options.onComplete?.()
    } catch (error) {
      console.error('Failed to close items:', error)
      // Show error toast
    }
  }

  const confirmClose = () => {
    if (pendingClose) {
      executeClose(pendingClose)
      setPendingClose(null)
    }
    setIsConfirmOpen(false)
  }

  const close = async (selection: SelectionState) => {
    // Calculate total tabs to be closed
    const tabCount = await getTotalTabCount(selection)
    const windowCount = selection.windowIds.size

    // Check if confirmation needed
    const needsConfirm =
      !options.skipConfirmation &&
      !preference.skipCloseConfirmation &&
      (tabCount >= 10 || windowCount >= 3)

    if (needsConfirm) {
      setPendingClose(selection)
      setIsConfirmOpen(true)
    } else {
      executeClose(selection)
    }
  }

  return {
    close,
    isConfirmOpen,
    confirmClose,
    cancelClose: () => {
      setPendingClose(null)
      setIsConfirmOpen(false)
    },
    pendingClose,
  }
}

// Helper to get total tab count including tabs in groups and windows
const getTotalTabCount = async (selection: SelectionState): Promise<number> => {
  let count = selection.tabIds.size

  // Add tabs in selected groups
  for (const groupId of selection.groupIds) {
    const tabs = await chrome.tabs.query({ groupId })
    count += tabs.length
  }

  // Add tabs in selected windows
  for (const windowId of selection.windowIds) {
    const tabs = await chrome.tabs.query({ windowId })
    count += tabs.length
  }

  return count
}
```

### ConfirmDialog Component

```typescript
// ConfirmDialog.tsx
interface ConfirmDialogProps {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
  selection: SelectionState
  onDontAskAgain?: () => void
}

export const ConfirmDialog = ({
  open,
  onConfirm,
  onCancel,
  selection,
  onDontAskAgain
}: ConfirmDialogProps) => {
  const [dontAsk, setDontAsk] = useState(false)

  const message = getConfirmMessage(selection)

  const handleConfirm = () => {
    if (dontAsk && onDontAskAgain) {
      onDontAskAgain()
    }
    onConfirm()
  }

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Close Items</AlertDialogTitle>
          <AlertDialogDescription>
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex items-center gap-2 py-2">
          <Checkbox
            id="dont-ask"
            checked={dontAsk}
            onCheckedChange={setDontAsk}
          />
          <Label htmlFor="dont-ask">Don't ask again for large closures</Label>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const getConfirmMessage = (selection: SelectionState): string => {
  const parts: string[] = []

  if (selection.tabIds.size > 0) {
    parts.push(`${selection.tabIds.size} tab${selection.tabIds.size > 1 ? 's' : ''}`)
  }
  if (selection.groupIds.size > 0) {
    parts.push(`${selection.groupIds.size} group${selection.groupIds.size > 1 ? 's' : ''}`)
  }
  if (selection.windowIds.size > 0) {
    parts.push(`${selection.windowIds.size} window${selection.windowIds.size > 1 ? 's' : ''}`)
  }

  return `Are you sure you want to close ${parts.join(', ')}?`
}
```

### Keyboard Handler Updates

```typescript
// In useKeyboardNavigation.ts, add close shortcut handling

const handleKeyDown = (e: KeyboardEvent) => {
  // ... existing navigation logic from Plan 1 ...

  // Close shortcut: Delete or Backspace
  if (e.key === 'Delete' || e.key === 'Backspace') {
    const selection = useSelectionStore.getState()
    const hasSelection =
      selection.windowIds.size > 0 ||
      selection.groupIds.size > 0 ||
      selection.tabIds.size > 0

    if (hasSelection) {
      e.preventDefault()
      // Trigger close action
      onCloseSelection()
    }
    return
  }

  // ... rest of handler ...
}
```

---

## Design Decisions

### For This Plan

1. **Close is highest priority action** - Always visible in toolbar, even at narrowest width (280px). Most used bulk action.

2. **Delete/Backspace for close** - Standard keyboard pattern from file systems. Both keys work for accessibility (some keyboards have one or the other more accessible).

3. **Confirmation thresholds** - 10+ tabs or 3+ windows triggers confirmation. Low enough to prevent accidents, high enough to not annoy power users.

4. **"Don't ask again" option** - Respects power user preference while protecting new users. Stored in `preferenceStorage`.

5. **3-dot menu always has all actions** - Consistency over brevity. Users always know where to find actions. Toolbar buttons are shortcuts, not exclusives.

6. **Menu shows shortcuts** - Primary discoverability mechanism for keyboard shortcuts. Users learn shortcuts organically.

7. **Selection clears after close** - Clean slate after destructive action. Avoids confusion about what's still selected.

8. **Close groups = close all their tabs** - Intuitive behavior. Group is a container, closing it closes contents.

### Tooltip Wording

- Single item: "Close Tab (Del)", "Close Group (Del)", "Close Window (Del)"
- Multiple same type: "Close 5 Tabs (Del)", "Close 3 Groups (Del)"
- Mixed selection: "Close Selection (Del)"
- The shortcut always shows "Del" for brevity (Backspace also works but isn't shown)

---

## Width Breakpoints

| Width  | Visible Actions            | Menu Contains |
| ------ | -------------------------- | ------------- |
| 280px  | Close only                 | All actions   |
| 320px  | Pin, Mute, Close           | All actions   |
| 360px+ | Pin, Mute, Close, + 2 more | All actions   |

_Note: Pin and Mute are implemented in Plan 5, but toolbar reserves space for them_

For this plan, at all widths:

- Close button visible
- 3-dot menu visible
- Badge visible (if selection)

---

## Success Metrics

**Functionality:**

- Close action works on all item types
- Confirmation appears at correct thresholds
- Keyboard shortcuts work reliably

**Performance:**

- Toolbar renders < 16ms at all widths
- Close 100 tabs < 500ms

**Usability:**

- Close shortcut discoverable via tooltip and menu
- Confirmation message clearly states what will close
- "Don't ask again" respected across sessions

---

## Dependencies

### Required from Plan 1 (Selection Foundation)

- `useSelectionStore` with `windowIds`, `groupIds`, `tabIds` Sets
- `clear()` action to reset selection after close
- Selection state available as props

### Required from Plan 2 (Selection Visual Design)

- `getSelectionBadgeText()` utility for badge display
- Badge component styling

### Provides for Future Plans

- `AdaptiveToolbar.tsx` - scaffold for all actions
- `ActionsMenu.tsx` - dropdown menu infrastructure
- `getContextualActions()` - action filtering logic
- `ConfirmDialog.tsx` - reusable for other destructive actions
- Keyboard shortcut handling pattern

---

## Out of Scope

- Pin/Mute/Reload actions (Plan 5)
- Move/Group actions (Plan 5)
- View mode toggle (Plan 4)
- Undo for closed tabs (rely on Chrome's "Recently Closed")

---

## Notes

- Toolbar height is fixed at 40px to match existing UI
- Use `useResizeObserver` from `@radix-ui/react-use-rect` or custom implementation
- Chrome API calls should be wrapped in try/catch with error toasts
- Test closing last tab in a window (Chrome closes the window automatically)
