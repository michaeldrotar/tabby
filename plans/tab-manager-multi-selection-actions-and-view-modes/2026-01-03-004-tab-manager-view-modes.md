# Tab Manager: View Modes (Split & Tree)

**Date:** January 3, 2026  
**Model:** Claude Opus 4.5  
**Status:** Not Started  
**Predecessors:** [Selection Foundation](./2025-01-03-tab-manager-selection-foundation.md), [Selection Visual Design](./2025-01-03-tab-manager-selection-visual-design.md), [Toolbar & Close Action](./2025-01-03-tab-manager-toolbar-close-action.md)  
**Successors:** [Single-Type Actions](./2025-01-03-tab-manager-single-type-actions.md), [Mixed Selection & Polish](./2025-01-03-tab-manager-mixed-selection-polish.md)

## Executive Summary

This plan implements the view mode toggle between Split View (two-pane) and Tree View (unified list). Both views integrate with the selection foundation, allowing users to choose their preferred navigation model while maintaining full selection and action capabilities.

**Key Deliverables:**

- `TreeView.tsx` component with collapsible windows/groups
- `ViewModeToggle.tsx` button component
- View mode state persistence
- Updated keyboard navigation for tree view
- Expand/collapse keyboard shortcuts for both views

## Problem Being Solved

Different users have different mental models for organizing tabs:

- **Split View users** prefer the familiar two-pane model where windows are separate from their contents
- **Tree View users** want to see everything at once in a unified hierarchy
- **Power users** need cross-window selection which is easier in tree view

The view toggle gives users choice while maintaining consistent selection behavior.

## Solution Overview

### Split View (Default)

```
┌──────────┬────────────────────────────────┐
│ [≡]      │ Window 3 - Active Tab Title... │
├──────────┼────────────────────────────────┤
│ Window 1 │ ▼ Group: Work                  │
│ Window 2 │   Tab 1                        │
│ Window 3*│   Tab 2                        │
│ Window 4 │   Tab 3                        │
│          │ ▼ Group: Research              │
│          │   Tab 4                        │
│          │   Tab 5                        │
└──────────┴────────────────────────────────┘
   80-100px          Remaining width
```

- Windows list on left (80-100px)
- Tabs pane on right shows "viewing" window's tabs/groups
- Familiar two-pane navigation with multi-selection support
- Toggle button [≡] in top-left corner

**Tabs Pane Header:**

- Format: `Window N - Active Tab Title` (truncate title if needed)
- Helps identify which window's tabs are displayed
- Especially useful when multiple windows are selected

### Tree View (Toggle)

```
┌─────────────────────────────────────────────┐
│ [⊟]                                         │
├─────────────────────────────────────────────┤
│ ▼ Window 1                                  │
│   ▼ Group: Work                             │
│     Tab 1                                   │
│     Tab 2                                   │
│   Tab 3 (ungrouped)                         │
│ ▼ Window 2                                  │
│   Tab 4                                     │
│   Tab 5                                     │
│ ▶ Window 3 (collapsed)                      │
└─────────────────────────────────────────────┘
```

- Single unified list with collapsible windows
- All windows visible simultaneously
- Easier multi-window selection
- No viewing/split concept - all items in one pane
- Indentation shows hierarchy

### Toggle Behavior

| From         | To        | Selection                       | Focus |
| ------------ | --------- | ------------------------------- | ----- |
| Split → Tree | Preserved | Preserved                       |
| Tree → Split | Preserved | Tabs pane if tab/group selected |

Selection is **never lost** when switching views.

---

## Checklist

### Phase 1: View Mode State

- [ ] Create view mode state management
  - [ ] Add `viewMode: 'split' | 'tree'` to appropriate store
  - [ ] Option A: Add to existing `KeyboardState` store
  - [ ] Option B: Create new `ViewModeStore` if cleaner separation needed
- [ ] Persist view mode preference
  - [ ] Save to `preferenceStorage` (localStorage-backed)
  - [ ] Load on tab manager initialization
  - [ ] Default to 'split' for new users
- [ ] Create `useViewMode` hook
  - [ ] Returns current mode and toggle function
  - [ ] Handles persistence automatically

### Phase 2: Tree View Layout

- [ ] Create `TreeView.tsx` component
  - [ ] Location: `packages/ui/lib/tab-manager/views/TreeView.tsx`
  - [ ] Accept windows data with nested groups and tabs
  - [ ] Render in tree order (window → groups → tabs)
- [ ] Implement collapsible windows
  - [ ] Chevron icon (▼ expanded, ▶ collapsed)
  - [ ] Click chevron to toggle
  - [ ] Track collapsed state per window ID
- [ ] Implement collapsible groups (within windows)
  - [ ] Same chevron pattern as windows
  - [ ] Track collapsed state per group ID
- [ ] Add proper indentation
  - [ ] Windows: 0 indent
  - [ ] Groups: 1 level (16px or 1rem)
  - [ ] Tabs in groups: 2 levels (32px or 2rem)
  - [ ] Ungrouped tabs: 1 level (same as groups)
- [ ] Style tree items
  - [ ] Reuse existing `WindowItem`, `TabGroupItem`, `TabItem` where possible
  - [ ] Ensure selection highlighting works (from Plan 2)
  - [ ] Ensure focus ring works (from Plan 2)
- [ ] Add keyboard navigation data attributes
  - [ ] `data-nav-type="window|group|tab"`
  - [ ] `data-nav-id="{id}"`
  - [ ] `data-tree-order="{index}"` for navigation ordering

### Phase 3: Split View Refactoring

- [ ] Ensure Split view works with selection system
  - [ ] Verify selection store integration
  - [ ] Test viewing window derivation (from Plan 1)
- [ ] Add tabs pane header
  - [ ] Show "Window N - Active Tab Title"
  - [ ] Truncate title with ellipsis if too long
  - [ ] Update when viewing window changes
- [ ] Add group expand/collapse in tabs pane
  - [ ] Chevron icons on groups
  - [ ] Click to toggle
  - [ ] Track collapsed state

### Phase 4: Toggle Button

- [ ] Create `ViewModeToggle.tsx` component
  - [ ] Position in top-left corner of container
  - [ ] Icon: [≡] for split view, [⊟] for tree view
  - [ ] Shows current mode's icon
- [ ] Add toggle interaction
  - [ ] Click to switch modes
  - [ ] Update view mode state
  - [ ] Trigger re-render with new layout
- [ ] Add tooltip
  - [ ] Split mode: "Switch to tree view"
  - [ ] Tree mode: "Switch to split view"
- [ ] Style toggle button
  - [ ] Match existing toolbar button styles
  - [ ] Clear focus indicator
  - [ ] Hover state

### Phase 5: Keyboard Navigation (Tree View)

- [ ] Update `useKeyboardNavigation` for tree mode
  - [ ] Detect current view mode
  - [ ] Use tree-specific navigation when in tree view
- [ ] Implement tree navigation
  - [ ] Up/Down: Navigate all items in tree order
  - [ ] Skip collapsed items' children
  - [ ] Wrap at top/bottom (optional, consider preference)
- [ ] Implement expand/collapse shortcuts
  - [ ] Left: Collapse focused window/group (if expanded)
  - [ ] Left: Move to parent if already collapsed or on tab
  - [ ] Right: Expand focused window/group (if collapsed)
  - [ ] Right: Move to first child if already expanded
- [ ] Implement bulk expand/collapse
  - [ ] Cmd+Left or Alt+Left: Collapse all windows and groups
  - [ ] Cmd+Right or Alt+Right: Expand all windows and groups
  - [ ] Note: Test Cmd modifier on Mac for conflicts
- [ ] Disable pane switching in tree mode
  - [ ] Left/Right should NOT switch panes
  - [ ] Tab key behavior: moves to toolbar, not between panes

### Phase 6: Keyboard Navigation (Split View Enhancements)

- [ ] Add expand/collapse for groups in tabs pane
  - [ ] Left: Collapse focused group
  - [ ] Right: Expand focused group
  - [ ] Only applies when focus is on a group item
- [ ] Add bulk expand/collapse for split view
  - [ ] Cmd+Left or Alt+Left: Collapse all groups in current window
  - [ ] Cmd+Right or Alt+Right: Expand all groups in current window
- [ ] Preserve existing pane switching
  - [ ] Left/Right on tabs still switches to window pane
  - [ ] Only override when focused on a group

### Phase 7: Selection Integration

- [ ] Verify selection works in tree view
  - [ ] Click to select (single item)
  - [ ] Shift+click for range (tree order)
  - [ ] Cmd+click for toggle
  - [ ] Keyboard selection (Space, Shift+arrows)
- [ ] Verify cross-window selection in tree view
  - [ ] Can select tabs from different windows
  - [ ] Can select windows and tabs together
  - [ ] Selection count badge updates correctly
- [ ] Test selection preservation on toggle
  - [ ] Select items in split view → toggle → items still selected
  - [ ] Select items in tree view → toggle → items still selected
  - [ ] Focus moves appropriately after toggle

### Phase 8: Accessibility

- [ ] Add ARIA attributes to tree view
  - [ ] `role="tree"` on container
  - [ ] `role="treeitem"` on each item
  - [ ] `aria-expanded` on collapsible items
  - [ ] `aria-level` for depth (1 = window, 2 = group/tab, 3 = tab in group)
  - [ ] `aria-selected` for selected items
- [ ] Add ARIA to toggle button
  - [ ] `aria-label="Switch to tree view"` / `"Switch to split view"`
  - [ ] `aria-pressed` if using toggle pattern
- [ ] Test with screen reader
  - [ ] Tree structure announced correctly
  - [ ] Expand/collapse state announced
  - [ ] Selection state announced
- [ ] Verify focus management
  - [ ] Focus visible at all times
  - [ ] Focus trapped appropriately in tree

### Phase 9: Testing

- [ ] Write unit tests for view mode logic
  - [ ] Test state persistence
  - [ ] Test toggle behavior
  - [ ] Test tree ordering algorithm
- [ ] Write integration tests
  - [ ] Test selection preservation across toggle
  - [ ] Test keyboard navigation in tree view
  - [ ] Test expand/collapse behavior
- [ ] Manual testing checklist
  - [ ] Test split view with 1, 3, 10 windows
  - [ ] Test tree view with 1, 3, 10 windows
  - [ ] Test toggle with items selected
  - [ ] Test at 280px width
  - [ ] Test at 360px width
  - [ ] Test in dark mode
  - [ ] Test with many collapsed/expanded items

### Phase 10: Documentation

- [ ] Document view modes in user-facing help
- [ ] Add JSDoc comments to components
- [ ] Update keyboard shortcuts reference
  - [ ] Left/Right for expand/collapse
  - [ ] Cmd+Left/Right or Alt+Left/Right for bulk

---

## Interaction Scenarios

### View Mode Switch Scenarios

**Scenario VIEW-1: Switch from split to tree view**

```
Context: Split view, window 1 selected in window pane
Action: Toggle to tree view
Result: Window 1 still selected, shown in tree with all items visible
State: selectionStore unchanged, viewMode = 'tree'
```

**Scenario VIEW-2: Select across windows in tree view**

```
Context: Tree view showing windows 1 and 2
Action: Click tab 5 (window 1), Shift+click tab 12 (window 2)
Result: Tabs 5-12 selected, crossing window boundaries
State: selectionStore = { tabIds: [5,6,7,8,9,10,11,12] }
Note: Would also select any groups between if they exist in tree order
```

**Scenario VIEW-3: Toggle with mixed selection**

```
Context: Tree view, tabs 3, 7, 12 selected (from different windows)
Action: Toggle to split view
Result: Selection preserved, tabs pane shows first selected item's window
State: selectionStore unchanged, viewing = window containing tab 3
```

**Scenario VIEW-4: Collapse window in tree view**

```
Context: Tree view, window 1 expanded with tabs 1-5 visible
Action: Click collapse chevron on window 1
Result: Window 1 collapsed, tabs hidden
Visual: Window 1 shows ▶ chevron, tabs not rendered
State: Collapsed state for window 1 = true
Note: If tabs in window 1 were selected, they remain selected (just hidden)
```

**Scenario VIEW-5: Navigate in collapsed state**

```
Context: Tree view, window 1 collapsed, focus on window 1
Action: Press Down arrow
Result: Focus moves to window 2 (skipping window 1's hidden contents)
```

**Scenario VIEW-6: Expand with Right arrow**

```
Context: Tree view, window 1 collapsed, focus on window 1
Action: Press Right arrow
Result: Window 1 expands, focus stays on window 1
Visual: Window 1 shows ▼ chevron, children visible
```

**Scenario VIEW-7: Collapse with Left arrow**

```
Context: Tree view, focus on tab 3 inside group 1
Action: Press Left arrow
Result: Focus moves to group 1 (parent)
Action: Press Left arrow again
Result: Group 1 collapses
Action: Press Left arrow again
Result: Focus moves to window 1 (parent)
```

**Scenario VIEW-8: Cmd+A in tree view**

```
Context: Tree view with 3 windows, 10 groups, 50 tabs
Action: Press Cmd+A
Result: ALL items selected (windows, groups, tabs)
State: selectionStore = { windowIds: [all], groupIds: [all], tabIds: [all] }
Toolbar: Shows "53 items selected" badge, only Close action available (common to all)
```

### Split View Group Collapse

**Scenario SPLIT-GROUP-1: Collapse group in tabs pane**

```
Context: Split view, focus on "Work" group in tabs pane
Action: Press Left arrow
Result: "Work" group collapses, its tabs hidden
Visual: Group shows ▶ chevron
Note: Focus stays on group
```

**Scenario SPLIT-GROUP-2: Navigate from collapsed group**

```
Context: Split view, "Work" group collapsed, focus on group
Action: Press Down arrow
Result: Focus moves to next item (next group or ungrouped tab)
Skips: Hidden tabs inside collapsed group
```

---

## Technical Architecture

### View Mode State

```typescript
// Option A: Add to existing KeyboardState
interface KeyboardState {
  mode: 'default' | 'multi-select'
  viewMode: 'split' | 'tree' // NEW
  // ... other state
}

// Option B: Separate store (if cleaner)
// viewModeStore.ts
interface ViewModeState {
  mode: 'split' | 'tree'
  setMode: (mode: 'split' | 'tree') => void
  toggle: () => void
}

export const useViewModeStore = create<ViewModeState>()(
  persist(
    (set) => ({
      mode: 'split',
      setMode: (mode) => set({ mode }),
      toggle: () =>
        set((s) => ({
          mode: s.mode === 'split' ? 'tree' : 'split',
        })),
    }),
    { name: 'tab-manager-view-mode' },
  ),
)
```

### TreeView Component

```typescript
// TreeView.tsx
interface TreeViewProps {
  windows: WindowData[]
  collapsedWindows: Set<number>
  collapsedGroups: Set<number>
  onToggleWindow: (windowId: number) => void
  onToggleGroup: (groupId: number) => void
}

export const TreeView = ({
  windows,
  collapsedWindows,
  collapsedGroups,
  onToggleWindow,
  onToggleGroup,
}: TreeViewProps) => {
  // Build flat tree for navigation ordering
  const treeItems = useMemo(() =>
    buildTreeItems(windows, collapsedWindows, collapsedGroups),
    [windows, collapsedWindows, collapsedGroups]
  )

  return (
    <div role="tree" className="tree-view">
      {windows.map((window, windowIndex) => (
        <TreeWindowItem
          key={window.id}
          window={window}
          treeIndex={getTreeIndex(windowIndex, treeItems)}
          isCollapsed={collapsedWindows.has(window.id)}
          onToggle={() => onToggleWindow(window.id)}
        >
          {!collapsedWindows.has(window.id) && (
            <>
              {window.groups.map((group, groupIndex) => (
                <TreeGroupItem
                  key={group.id}
                  group={group}
                  treeIndex={getTreeIndex(...)}
                  isCollapsed={collapsedGroups.has(group.id)}
                  onToggle={() => onToggleGroup(group.id)}
                >
                  {!collapsedGroups.has(group.id) &&
                    group.tabs.map((tab, tabIndex) => (
                      <TreeTabItem
                        key={tab.id}
                        tab={tab}
                        treeIndex={getTreeIndex(...)}
                        indentLevel={2}
                      />
                    ))
                  }
                </TreeGroupItem>
              ))}
              {window.ungroupedTabs.map((tab, tabIndex) => (
                <TreeTabItem
                  key={tab.id}
                  tab={tab}
                  treeIndex={getTreeIndex(...)}
                  indentLevel={1}
                />
              ))}
            </>
          )}
        </TreeWindowItem>
      ))}
    </div>
  )
}

// Build navigation order
const buildTreeItems = (
  windows: WindowData[],
  collapsedWindows: Set<number>,
  collapsedGroups: Set<number>
): TreeItem[] => {
  const items: TreeItem[] = []

  for (const window of windows) {
    items.push({ type: 'window', id: window.id })

    if (collapsedWindows.has(window.id)) continue

    for (const group of window.groups) {
      items.push({ type: 'group', id: group.id })

      if (collapsedGroups.has(group.id)) continue

      for (const tab of group.tabs) {
        items.push({ type: 'tab', id: tab.id })
      }
    }

    for (const tab of window.ungroupedTabs) {
      items.push({ type: 'tab', id: tab.id })
    }
  }

  return items
}
```

### Keyboard Navigation Updates

```typescript
// In useKeyboardNavigation.ts

const handleKeyDown = (e: KeyboardEvent) => {
  const viewMode = useViewModeStore.getState().mode

  if (viewMode === 'tree') {
    return handleTreeNavigation(e)
  } else {
    return handleSplitNavigation(e)
  }
}

const handleTreeNavigation = (e: KeyboardEvent) => {
  const treeItems = getTreeItems() // From context or computed
  const focusedIndex = getCurrentFocusedIndex(treeItems)

  if (e.key === 'ArrowUp') {
    e.preventDefault()
    const prevIndex = Math.max(0, focusedIndex - 1)
    focusTreeItem(treeItems[prevIndex])
    return
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault()
    const nextIndex = Math.min(treeItems.length - 1, focusedIndex + 1)
    focusTreeItem(treeItems[nextIndex])
    return
  }

  if (e.key === 'ArrowLeft') {
    e.preventDefault()
    const item = treeItems[focusedIndex]

    if (item.type === 'window' || item.type === 'group') {
      if (isExpanded(item)) {
        collapse(item)
      } else {
        // Move to parent (if any)
        const parent = getParent(item, treeItems)
        if (parent) focusTreeItem(parent)
      }
    } else {
      // Tab: move to parent group or window
      const parent = getParent(item, treeItems)
      if (parent) focusTreeItem(parent)
    }
    return
  }

  if (e.key === 'ArrowRight') {
    e.preventDefault()
    const item = treeItems[focusedIndex]

    if (item.type === 'window' || item.type === 'group') {
      if (isCollapsed(item)) {
        expand(item)
      } else {
        // Move to first child
        const firstChild = getFirstChild(item, treeItems)
        if (firstChild) focusTreeItem(firstChild)
      }
    }
    // Tab: Right does nothing (no children)
    return
  }

  // Cmd/Alt + Left/Right for bulk collapse/expand
  if ((e.metaKey || e.altKey) && e.key === 'ArrowLeft') {
    e.preventDefault()
    collapseAll()
    return
  }

  if ((e.metaKey || e.altKey) && e.key === 'ArrowRight') {
    e.preventDefault()
    expandAll()
    return
  }
}
```

### ViewModeToggle Component

```typescript
// ViewModeToggle.tsx
import { Rows3, TreeDeciduous } from 'lucide-react'

export const ViewModeToggle = () => {
  const { mode, toggle } = useViewModeStore()

  const Icon = mode === 'split' ? Rows3 : TreeDeciduous
  const tooltip = mode === 'split'
    ? 'Switch to tree view'
    : 'Switch to split view'

  return (
    <Tooltip content={tooltip}>
      <Button
        variant="ghost"
        size="icon"
        onClick={toggle}
        aria-label={tooltip}
        className="h-8 w-8"
      >
        <Icon className="h-4 w-4" />
      </Button>
    </Tooltip>
  )
}
```

---

## Design Decisions

### For This Plan

1. **Split view as default** - Familiar to most users from file managers. Tree view is power-user feature.

2. **Selection preserved on toggle** - Never lose work. If you select items in one view, they stay selected in the other.

3. **Left/Right for expand/collapse** - Matches native tree behavior (VS Code, file explorers, macOS Finder).

4. **Cmd+Left/Right for bulk** - Consistent with text editing (jump to line start/end). Consider Alt as fallback for Mac conflicts.

5. **No viewing window in tree** - Tree shows all windows simultaneously, so there's no need for a "viewing" concept.

6. **Collapsed items stay selected** - If you collapse a window with selected tabs inside, those tabs remain selected. This allows bulk operations on collapsed hierarchies.

7. **Indentation levels** - Standard 16px per level. Window=0, Group/UngroupedTab=16px, Tab in group=32px.

8. **Toggle icon convention** - [≡] (hamburger/list) for split view suggests "stacked lists", [⊟] (tree) for tree view shows hierarchy.

### Keyboard Shortcut Summary

| Shortcut  | Split View                             | Tree View                  |
| --------- | -------------------------------------- | -------------------------- |
| Up/Down   | Navigate within pane                   | Navigate all items         |
| Left      | Switch to window pane / Collapse group | Collapse / Go to parent    |
| Right     | Switch to tabs pane / Expand group     | Expand / Go to first child |
| Cmd+Left  | Collapse all groups                    | Collapse all               |
| Cmd+Right | Expand all groups                      | Expand all                 |

---

## Success Metrics

**Functionality:**

- Toggle works without losing selection
- Tree navigation feels native (like VS Code explorer)
- Expand/collapse responds instantly

**Performance:**

- Toggle < 50ms even with 100+ tabs
- Tree render < 16ms (60fps)

**Usability:**

- Users discover toggle button within first session
- Power users adopt tree view for multi-window workflows

---

## Dependencies

### Required from Previous Plans

- Selection store (`windowIds`, `groupIds`, `tabIds`)
- Selection visual design (highlighting, focus ring)
- Toolbar integration

### Provides for Future Plans

- View mode context for action scoping
- Tree order for range selection
- Collapse state for visibility filtering

---

## Out of Scope

- Custom tree ordering (e.g., alphabetical)
- Drag-and-drop reordering in tree
- Saved expand/collapse state (resets on reload)
- Nested windows (Chrome doesn't support this)

---

## Notes

- Test Cmd+Left/Right on Mac carefully - may conflict with text navigation in inputs
- Consider Alt+Left/Right as alternative if conflicts arise
- Tree view may need virtualization for 1000+ tabs (future optimization)
- Collapse state is ephemeral (not persisted) - consider persisting if users request
