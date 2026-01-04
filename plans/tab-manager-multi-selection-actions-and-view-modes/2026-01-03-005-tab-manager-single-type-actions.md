# Tab Manager: Single-Type Actions

**Date:** January 3, 2026  
**Model:** Claude Opus 4.5  
**Status:** Not Started  
**Predecessors:** [Selection Foundation](./2025-01-03-tab-manager-selection-foundation.md), [Selection Visual Design](./2025-01-03-tab-manager-selection-visual-design.md), [Toolbar & Close Action](./2025-01-03-tab-manager-toolbar-close-action.md), [View Modes](./2025-01-03-tab-manager-view-modes.md)  
**Successors:** [Mixed Selection & Polish](./2025-01-03-tab-manager-mixed-selection-polish.md)

## Executive Summary

This plan implements all actions for homogeneous selections (tabs only, groups only, or windows only). It builds on the toolbar foundation from Plan 3, adding Pin, Mute, Reload, Copy URL, Move, Group, and all other actions to the toolbar and menu system.

**Key Deliverables:**

- All tab actions (Pin, Mute, Reload, Copy URL/Title, Cut/Copy/Paste, Move, Group)
- All group actions (Reload, Rename, Color, Ungroup, Merge, Copy URLs)
- All window actions (Focus, Minimize, Maximize, Mute All, Reload All, Copy All URLs)
- Toolbar responsiveness at different widths
- Selection-aware tooltips with shortcuts

## Problem Being Solved

With selection and toolbar infrastructure in place, users need the full suite of actions:

- **Tab users**: Pin tabs for quick access, mute noisy tabs, copy URLs for sharing
- **Group users**: Rename groups, change colors, merge related groups
- **Window users**: Focus windows, minimize distractions, bulk operations

Each action type operates on its specific item type, with consistent keyboard shortcuts and bulk support.

---

## Checklist

### Phase 1: Tab Actions (High Priority)

- [ ] Implement Pin/Unpin action
  - [ ] Create `usePinAction.ts` hook
  - [ ] Add `PinButton.tsx` to toolbar (icon: pin symbol)
  - [ ] Add to menu with shortcut (P)
  - [ ] Single tab: toggle pin state
  - [ ] Bulk tabs: pin all or unpin all (based on majority state)
  - [ ] Add keyboard shortcut handler (P key)
  - [ ] Chrome API: `chrome.tabs.update(id, { pinned: true/false })`
- [ ] Implement Mute/Unmute action
  - [ ] Create `useMuteAction.ts` hook
  - [ ] Add `MuteButton.tsx` to toolbar (icon: speaker/muted symbol)
  - [ ] Add to menu with shortcut (M)
  - [ ] Single tab: toggle mute state
  - [ ] Bulk tabs: mute all or unmute all (based on majority state)
  - [ ] Add keyboard shortcut handler (M key)
  - [ ] Chrome API: `chrome.tabs.update(id, { muted: true/false })`
- [ ] Implement Reload action
  - [ ] Create `useReloadAction.ts` hook
  - [ ] Add to menu with shortcut (R)
  - [ ] Single tab: `chrome.tabs.reload(id)`
  - [ ] Bulk tabs: reload all selected
  - [ ] Add keyboard shortcut handler
- [ ] Implement Copy URL action
  - [ ] Create `useCopyUrlAction.ts` hook
  - [ ] Add to menu with shortcut (C)
  - [ ] Single tab: copy URL to clipboard
  - [ ] Bulk tabs: copy URLs separated by newlines
  - [ ] Show toast notification: "Copied X URLs"
  - [ ] Add keyboard shortcut handler
- [ ] Implement Copy Title action
  - [ ] Add to menu with shortcut (Shift+C)
  - [ ] Single tab: copy title to clipboard
  - [ ] Bulk tabs: copy titles separated by newlines
  - [ ] Show toast: "Copied X titles"
  - [ ] Add keyboard shortcut handler
- [ ] Test all tab actions work correctly

### Phase 2: Tab Clipboard Actions (Cut/Copy/Paste)

- [ ] Create clipboard state management
  - [ ] Add `clipboardStore.ts` with cut/copy state
  - [ ] Track clipboard mode: 'cut' | 'copy' | null
  - [ ] Track clipboard items: tab IDs
  - [ ] Clear on new selection or after paste
- [ ] Implement Cut action
  - [ ] Add to menu with shortcut (Cmd/Ctrl+X)
  - [ ] Store cut items in clipboard state
  - [ ] Show visual indicator on cut items (faded/dashed outline)
  - [ ] Clear cut state after paste or new selection
- [ ] Implement Copy action (for duplication)
  - [ ] Add to menu with shortcut (Cmd/Ctrl+C)
  - [ ] Store copy items in clipboard state (distinct from cut)
  - [ ] No visual indicator (items stay in place)
- [ ] Implement Paste action
  - [ ] Add to menu with shortcut (Cmd/Ctrl+V)
  - [ ] If cut: move tabs to focused location
  - [ ] If copy: duplicate tabs at focused location
  - [ ] Show where paste will occur (before/after focused item)
  - [ ] Show toast: "Moved 3 tabs" or "Duplicated 3 tabs"
  - [ ] Clear clipboard state after paste
- [ ] Style cut items
  - [ ] Add `data-cut="true"` attribute to cut items
  - [ ] CSS: `opacity: 0.5` and dashed border
  - [ ] Remove style when clipboard clears
- [ ] Test clipboard actions work correctly

### Phase 3: Tab Movement Actions

- [ ] Implement Move to Window action
  - [ ] Create `useMoveToWindowAction.ts` hook
  - [ ] Add to menu with shortcut (W)
  - [ ] Create `WindowSelector.tsx` component
    - [ ] Show dropdown/popover with available windows
    - [ ] Format: "Window N - Active Tab Title"
    - [ ] Include "New Window" option
  - [ ] Single tab: move to selected window
  - [ ] Bulk tabs: move all to selected window
  - [ ] Chrome API: `chrome.tabs.move(ids, { windowId, index: -1 })`
  - [ ] Add keyboard shortcut handler
- [ ] Implement Add to Group action
  - [ ] Create `useAddToGroupAction.ts` hook
  - [ ] Add to menu with shortcut (G)
  - [ ] Create `GroupSelector.tsx` component
    - [ ] Show dropdown with existing groups in same window
    - [ ] Include "New Group" option with name/color inputs
    - [ ] Group format: colored dot + group name
  - [ ] Single tab: add to selected group
  - [ ] Bulk tabs: add all to selected/new group
  - [ ] Chrome API: `chrome.tabs.group({ tabIds, groupId })` or `chrome.tabs.group({ tabIds, createProperties })`
  - [ ] Add keyboard shortcut handler
- [ ] Implement Remove from Group action
  - [ ] Create `useRemoveFromGroupAction.ts` hook
  - [ ] Add to menu with shortcut (U)
  - [ ] Only show when selected tabs are in groups
  - [ ] Single tab: `chrome.tabs.ungroup(id)`
  - [ ] Bulk tabs: ungroup all selected
  - [ ] Add keyboard shortcut handler
- [ ] Implement Open in New Window action
  - [ ] Create `useOpenInNewWindowAction.ts` hook
  - [ ] Add to menu with shortcut (N)
  - [ ] Single tab: `chrome.windows.create({ tabId })`
  - [ ] Bulk tabs: create window with all selected tabs
  - [ ] Add keyboard shortcut handler
- [ ] Test movement actions preserve focus and selection

### Phase 4: Group Actions

- [ ] Implement Reload All Tabs action (group level)
  - [ ] Create `useGroupReloadAction.ts` hook
  - [ ] Add to menu with shortcut (R)
  - [ ] Get all tabs in group: `chrome.tabs.query({ groupId })`
  - [ ] Reload each: `chrome.tabs.reload(tabId)`
  - [ ] Bulk groups: reload all tabs in all selected groups
  - [ ] Show toast: "Reloading X tabs"
  - [ ] Add keyboard shortcut handler
- [ ] Implement Rename Group action
  - [ ] Create `useRenameGroupAction.ts` hook
  - [ ] Add to menu with shortcuts (Shift+R or F2)
  - [ ] Only enabled for single group selection
  - [ ] Create `RenameDialog.tsx` component
    - [ ] Pre-fill with current group name
    - [ ] Submit on Enter, cancel on Escape
  - [ ] Chrome API: `chrome.tabGroups.update(groupId, { title })`
  - [ ] Add keyboard shortcut handlers for both Shift+R and F2
- [ ] Implement Change Color action
  - [ ] Create `useChangeColorAction.ts` hook
  - [ ] Add to menu with shortcut (Shift+C)
  - [ ] Create `ColorPicker.tsx` component
    - [ ] Show Chrome's tab group colors (grey, blue, red, yellow, green, pink, purple, cyan, orange)
    - [ ] Highlight current color
  - [ ] Single group: apply selected color
  - [ ] Bulk groups: apply same color to all
  - [ ] Chrome API: `chrome.tabGroups.update(groupId, { color })`
  - [ ] Add keyboard shortcut handler
- [ ] Implement Ungroup action
  - [ ] Create `useUngroupAction.ts` hook
  - [ ] Add to menu with shortcut (U)
  - [ ] Single group: ungroup all tabs in group
  - [ ] Bulk groups: ungroup all selected groups
  - [ ] Chrome API: `chrome.tabs.ungroup(tabIds)` for all tabs in group
  - [ ] After ungroup: select the ungrouped tabs
  - [ ] Add keyboard shortcut handler
- [ ] Implement Merge Groups action
  - [ ] Create `useMergeGroupsAction.ts` hook
  - [ ] Add to menu (no shortcut - rare action)
  - [ ] Only enabled for 2+ group selection
  - [ ] Create `MergeGroupDialog.tsx` component
    - [ ] Input for merged group name (default: first group's name)
    - [ ] Color picker for merged group color
  - [ ] Move all tabs from other groups into first group
  - [ ] Delete empty groups
  - [ ] Add keyboard shortcut handler
- [ ] Implement Copy URLs (group level)
  - [ ] Add to menu (no shortcut)
  - [ ] Get all tabs in selected groups
  - [ ] Copy all URLs separated by newlines
  - [ ] Show toast: "Copied X URLs from Y groups"
- [ ] Test group actions work correctly

### Phase 5: Window Actions

- [ ] Implement Focus/Activate Window action
  - [ ] Create `useFocusWindowAction.ts` hook
  - [ ] Add to menu with shortcut (Enter)
  - [ ] Only enabled for single window selection
  - [ ] Chrome API: `chrome.windows.update(id, { focused: true })`
  - [ ] Add keyboard shortcut handler (Enter key)
- [ ] Implement Minimize action
  - [ ] Create `useMinimizeWindowAction.ts` hook
  - [ ] Add to menu with shortcut (H)
  - [ ] Single window: minimize
  - [ ] Bulk windows: minimize all
  - [ ] Chrome API: `chrome.windows.update(id, { state: 'minimized' })`
  - [ ] Add keyboard shortcut handler
- [ ] Implement Maximize action
  - [ ] Create `useMaximizeWindowAction.ts` hook
  - [ ] Add to menu with shortcut (F)
  - [ ] Single window: maximize
  - [ ] Bulk windows: maximize all
  - [ ] Chrome API: `chrome.windows.update(id, { state: 'maximized' })`
  - [ ] Add keyboard shortcut handler
- [ ] Implement Mute All Tabs action (window level)
  - [ ] Create `useWindowMuteAction.ts` hook
  - [ ] Add to menu with shortcut (M)
  - [ ] Get all tabs: `chrome.tabs.query({ windowId })`
  - [ ] Mute each: `chrome.tabs.update(id, { muted: true })`
  - [ ] Add keyboard shortcut handler
- [ ] Implement Unmute All Tabs action
  - [ ] Add to menu with shortcut (Shift+M)
  - [ ] Mirror of mute action
  - [ ] Add keyboard shortcut handler
- [ ] Implement Reload All Tabs action (window level)
  - [ ] Create `useWindowReloadAction.ts` hook
  - [ ] Add to menu with shortcut (R)
  - [ ] Get all tabs and reload each
  - [ ] Add confirmation for 20+ tabs
  - [ ] Add keyboard shortcut handler
- [ ] Implement Copy All URLs action (window level)
  - [ ] Add to menu (no shortcut)
  - [ ] Copy URLs from all tabs in selected windows
  - [ ] Show toast: "Copied X URLs from Y windows"
- [ ] Implement Pin All Tabs action
  - [ ] Add to menu with shortcut (P)
  - [ ] Pin all tabs in selected windows
  - [ ] Add keyboard shortcut handler
- [ ] Test window actions work correctly

### Phase 6: Toolbar Responsiveness & Overflow

- [ ] Implement width breakpoint detection
  - [ ] Use `useResizeObserver` on toolbar container
  - [ ] Track current width in component state
  - [ ] Define breakpoint thresholds: 280px, 320px, 360px
- [ ] Implement action overflow logic
  - [ ] Create `getVisibleActions()` utility
  - [ ] At 280px: Show only Close in toolbar
  - [ ] At 320px: Show Pin + Mute + Close
  - [ ] At 360px+: Show Pin + Mute + Close + more
  - [ ] Always show 3-dot menu button
- [ ] Update toolbar rendering
  - [ ] Map visible actions to toolbar buttons
  - [ ] Ensure 3-dot menu always contains all actions
  - [ ] Test smooth transitions when resizing
- [ ] Implement icon-only mode for narrow widths
  - [ ] Show only icons when < 300px
  - [ ] Show icon + label when >= 300px (if space)
  - [ ] Ensure tooltips work in icon-only mode
- [ ] Test toolbar at all widths (280px to 400px)

### Phase 7: Tooltips & Keyboard Hints

- [ ] Enhance tooltip system
  - [ ] Use shadcn Tooltip with delay
  - [ ] Show on hover (300ms delay)
  - [ ] Show on keyboard focus immediately
  - [ ] Format: "Action Name (Shortcut)"
- [ ] Add tooltips to all toolbar buttons
  - [ ] Search: "Search Tabs"
  - [ ] Settings: "Tab Manager Settings"
  - [ ] Pin: "Pin Tab(s) (P)"
  - [ ] Mute: "Mute Tab(s) (M)"
  - [ ] Close: "Close Selection (Del)"
  - [ ] 3-dot menu: "More Actions"
- [ ] Update tooltip text based on selection
  - [ ] Create `getActionTooltip(action, selection)` utility
  - [ ] Single tab: "Pin Tab (P)"
  - [ ] Multiple tabs: "Pin 5 Tabs (P)"
  - [ ] Single group: "Pin Group (P)" (pins all tabs)
  - [ ] Single window: "Pin All Tabs (P)"
- [ ] Test tooltips appear correctly

### Phase 8: Accessibility

- [ ] Add ARIA labels to all action buttons
  - [ ] Dynamic labels based on selection
  - [ ] Include action + count: "Pin 3 tabs"
- [ ] Ensure keyboard shortcut announcements
  - [ ] Screen reader announces shortcut in tooltip
- [ ] Test with VoiceOver
  - [ ] Actions announced correctly
  - [ ] Menu items announced with shortcuts
- [ ] Verify focus management
  - [ ] After action, focus returns appropriately
  - [ ] Dialogs trap focus correctly

### Phase 9: Testing

- [ ] Write unit tests for action hooks
  - [ ] Test each action with single selection
  - [ ] Test each action with bulk selection
  - [ ] Test clipboard state management
- [ ] Write integration tests
  - [ ] Test Pin/Mute toggle behavior
  - [ ] Test Cut/Copy/Paste flow
  - [ ] Test Move to Window flow
  - [ ] Test Add to Group flow
- [ ] Manual testing checklist
  - [ ] Test all tab actions
  - [ ] Test all group actions
  - [ ] Test all window actions
  - [ ] Test toolbar at different widths
  - [ ] Test tooltips show correctly
  - [ ] Test in dark mode

### Phase 10: Documentation

- [ ] Document all actions with shortcuts
- [ ] Add JSDoc comments to action hooks
- [ ] Update keyboard shortcuts reference
- [ ] Create action quick reference card

---

## Action Reference

### Tab Actions

| Action             | Shortcut | Toolbar   | Bulk               | Implementation                       |
| ------------------ | -------- | --------- | ------------------ | ------------------------------------ |
| Pin/Unpin          | P        | ✅ High   | ✅ Toggle majority | `chrome.tabs.update(id, { pinned })` |
| Mute/Unmute        | M        | ✅ High   | ✅ Toggle majority | `chrome.tabs.update(id, { muted })`  |
| Reload             | R        | Menu only | ✅ All             | `chrome.tabs.reload(id)`             |
| Copy URL           | C        | Menu only | ✅ Join with \n    | Clipboard API                        |
| Copy Title         | Shift+C  | Menu only | ✅ Join with \n    | Clipboard API                        |
| Cut                | Cmd+X    | Menu only | ✅ All             | Internal clipboard state             |
| Copy               | Cmd+C    | Menu only | ✅ All             | Internal clipboard state             |
| Paste              | Cmd+V    | Menu only | N/A                | Move or duplicate                    |
| Move to Window     | W        | Menu only | ✅ All             | `chrome.tabs.move()`                 |
| Add to Group       | G        | Menu only | ✅ All             | `chrome.tabs.group()`                |
| Remove from Group  | U        | Menu only | ✅ All             | `chrome.tabs.ungroup()`              |
| Open in New Window | N        | Menu only | ✅ All             | `chrome.windows.create()`            |

### Group Actions

| Action          | Shortcut     | Toolbar   | Bulk      | Implementation                       |
| --------------- | ------------ | --------- | --------- | ------------------------------------ |
| Reload All Tabs | R            | Menu only | ✅ All    | `chrome.tabs.reload()` per tab       |
| Rename          | Shift+R / F2 | Menu only | ❌ Single | `chrome.tabGroups.update({ title })` |
| Change Color    | Shift+C      | Menu only | ✅ All    | `chrome.tabGroups.update({ color })` |
| Ungroup         | U            | Menu only | ✅ All    | `chrome.tabs.ungroup()` per tab      |
| Merge           | —            | Menu only | ✅ 2+     | Move tabs, delete empty groups       |
| Copy URLs       | —            | Menu only | ✅ All    | Clipboard API                        |

### Window Actions

| Action          | Shortcut | Toolbar   | Bulk      | Implementation                       |
| --------------- | -------- | --------- | --------- | ------------------------------------ |
| Focus/Activate  | Enter    | Menu only | ❌ Single | `chrome.windows.update({ focused })` |
| Minimize        | H        | Menu only | ✅ All    | `chrome.windows.update({ state })`   |
| Maximize        | F        | Menu only | ✅ All    | `chrome.windows.update({ state })`   |
| Mute All Tabs   | M        | Menu only | ✅ All    | `chrome.tabs.update()` per tab       |
| Unmute All Tabs | Shift+M  | Menu only | ✅ All    | `chrome.tabs.update()` per tab       |
| Reload All Tabs | R        | Menu only | ✅ All    | `chrome.tabs.reload()` per tab       |
| Copy All URLs   | —        | Menu only | ✅ All    | Clipboard API                        |
| Pin All Tabs    | P        | Menu only | ✅ All    | `chrome.tabs.update()` per tab       |

---

## Technical Architecture

### Action Hook Pattern

All actions follow a consistent hook pattern:

```typescript
// useAction pattern
interface ActionOptions {
  onComplete?: () => void
  onError?: (error: Error) => void
}

export const usePinAction = (options: ActionOptions = {}) => {
  const execute = async (selection: SelectionState) => {
    const { tabIds } = selection
    if (tabIds.size === 0) return

    try {
      // Determine toggle direction (majority state)
      const tabs = await chrome.tabs.query({})
      const selectedTabs = tabs.filter((t) => tabIds.has(t.id!))
      const pinnedCount = selectedTabs.filter((t) => t.pinned).length
      const shouldPin = pinnedCount < selectedTabs.length / 2

      // Apply action
      await Promise.all(
        Array.from(tabIds).map((id) =>
          chrome.tabs.update(id, { pinned: shouldPin }),
        ),
      )

      options.onComplete?.()
    } catch (error) {
      options.onError?.(error as Error)
    }
  }

  return { execute }
}
```

### Clipboard Store

```typescript
// clipboardStore.ts
interface ClipboardState {
  mode: 'cut' | 'copy' | null
  tabIds: number[]

  cut: (tabIds: number[]) => void
  copy: (tabIds: number[]) => void
  clear: () => void
}

export const useClipboardStore = create<ClipboardState>((set) => ({
  mode: null,
  tabIds: [],

  cut: (tabIds) => set({ mode: 'cut', tabIds }),
  copy: (tabIds) => set({ mode: 'copy', tabIds }),
  clear: () => set({ mode: null, tabIds: [] }),
}))
```

### Selector Components

```typescript
// WindowSelector.tsx
interface WindowSelectorProps {
  onSelect: (windowId: number | 'new') => void
  excludeWindowId?: number  // Current window to exclude
}

export const WindowSelector = ({ onSelect, excludeWindowId }: WindowSelectorProps) => {
  const [windows, setWindows] = useState<chrome.windows.Window[]>([])

  useEffect(() => {
    chrome.windows.getAll({ populate: true }).then(setWindows)
  }, [])

  const availableWindows = windows.filter(w => w.id !== excludeWindowId)

  return (
    <DropdownMenuContent>
      {availableWindows.map(window => (
        <DropdownMenuItem
          key={window.id}
          onClick={() => onSelect(window.id!)}
        >
          Window {window.id} - {getActiveTabTitle(window)}
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={() => onSelect('new')}>
        <Plus className="h-4 w-4 mr-2" />
        New Window
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}
```

### Toolbar Width Breakpoints

```typescript
// toolbarBreakpoints.ts
interface BreakpointConfig {
  maxWidth: number
  visibleActions: string[]
}

const BREAKPOINTS: BreakpointConfig[] = [
  { maxWidth: 280, visibleActions: ['close'] },
  { maxWidth: 320, visibleActions: ['pin', 'mute', 'close'] },
  { maxWidth: 360, visibleActions: ['pin', 'mute', 'reload', 'close'] },
  {
    maxWidth: Infinity,
    visibleActions: ['pin', 'mute', 'reload', 'copyUrl', 'close'],
  },
]

export const getVisibleActions = (width: number): string[] => {
  const config = BREAKPOINTS.find((bp) => width <= bp.maxWidth)
  return config?.visibleActions ?? []
}
```

---

## Design Decisions

### For This Plan

1. **Toggle based on majority** - When bulk selecting, Pin/Mute toggling checks majority state. If more are pinned than unpinned, action unpins all. Intuitive for users.

2. **Same shortcut, different context** - R means "reload" everywhere (tab, group, window). P means "pin" everywhere. Consistent mental model.

3. **Shift modifier for alternatives** - Shift+C = Copy Title (vs C = Copy URL), Shift+M = Unmute (vs M = Mute), Shift+R = Rename (vs R = Reload).

4. **F2 for rename** - Standard across operating systems. Also supports Shift+R for users who don't know F2.

5. **Clipboard state is internal** - Cut/Copy/Paste uses internal state, not system clipboard. This allows tab-specific semantics without conflicting with regular copy/paste.

6. **Cut visual indicator** - Faded + dashed border clearly shows which items will move on paste. Disappears when clipboard clears.

7. **Move clears selection** - After moving tabs to a new window, selection clears. The tabs now exist in a different context.

8. **Ungroup selects tabs** - After ungrouping, the previously grouped tabs become selected. User can immediately act on them.

9. **Dialogs over inline editing** - Rename uses a dialog, not inline editing. More accessible, works consistently in all view modes.

### Keyboard Shortcut Reference

| Shortcut | Tab Context        | Group Context   | Window Context  |
| -------- | ------------------ | --------------- | --------------- |
| P        | Pin/Unpin          | Pin all tabs    | Pin all tabs    |
| M        | Mute/Unmute        | Mute all tabs   | Mute all tabs   |
| Shift+M  | —                  | Unmute all      | Unmute all      |
| R        | Reload             | Reload all tabs | Reload all tabs |
| Shift+R  | —                  | Rename          | —               |
| F2       | —                  | Rename          | —               |
| C        | Copy URL           | Copy all URLs   | Copy all URLs   |
| Shift+C  | Copy Title         | Change Color    | —               |
| Cmd+X    | Cut                | —               | —               |
| Cmd+C    | Copy (duplicate)   | —               | —               |
| Cmd+V    | Paste              | —               | —               |
| W        | Move to Window     | Move to Window  | —               |
| G        | Add to Group       | —               | —               |
| U        | Remove from Group  | Ungroup         | —               |
| N        | Open in New Window | —               | —               |
| H        | —                  | —               | Minimize        |
| F        | —                  | —               | Maximize        |
| Enter    | —                  | —               | Focus           |

---

## Success Metrics

**Functionality:**

- All 30+ actions work correctly
- Bulk operations handle 100+ items
- Clipboard cut/copy/paste feels native

**Performance:**

- Action execution < 500ms for 50 items
- Toolbar re-renders smoothly on resize

**Usability:**

- Users discover shortcuts via tooltips
- Toggle behavior is intuitive (majority-based)
- Selection state correct after actions

---

## Dependencies

### Required from Previous Plans

- Selection store with windowIds, groupIds, tabIds
- AdaptiveToolbar component
- ActionsMenu component
- getContextualActions utility

### Provides for Plan 6

- Action hooks ready for mixed selection filtering
- Tooltip generation utilities
- Clipboard state for cross-type paste

---

## Out of Scope

- Mixed selection action filtering (Plan 6)
- Undo/redo for actions
- Custom shortcuts
- Drag-and-drop moves

---

## Notes

- Chrome API calls should be batched where possible (use Promise.all)
- Toast notifications should include action counts
- Test all actions in both split and tree view modes
- Error handling: show toast with "Retry" option on failure
