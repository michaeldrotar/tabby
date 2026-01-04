# Tab Manager: Mixed Selection & Polish

**Date:** January 3, 2026  
**Model:** Claude Opus 4.5  
**Status:** Not Started  
**Predecessors:** [Selection Foundation](./2025-01-03-tab-manager-selection-foundation.md), [Selection Visual Design](./2025-01-03-tab-manager-selection-visual-design.md), [Toolbar & Close Action](./2025-01-03-tab-manager-toolbar-close-action.md), [View Modes](./2025-01-03-tab-manager-view-modes.md), [Single-Type Actions](./2025-01-03-tab-manager-single-type-actions.md)  
**Successors:** None (feature complete)

## Executive Summary

This final plan handles mixed selection behavior, keyboard shortcut conflicts, edge cases, accessibility audit, testing, and documentation. It's the polish layer that ensures the complete selection and action system works reliably and is ready for release.

**Key Deliverables:**

- Mixed selection action filtering (show only common actions)
- Keyboard shortcut conflict resolution
- Comprehensive accessibility audit
- Full test coverage
- Release documentation

## Problem Being Solved

With all individual actions implemented, we need to:

1. **Handle mixed selections** - When users select tabs AND groups, or windows AND tabs, which actions show?
2. **Avoid shortcut conflicts** - Our shortcuts must not interfere with Chrome's built-in shortcuts
3. **Ensure accessibility** - Screen readers, keyboard-only users, reduced motion preferences
4. **Catch edge cases** - Empty states, performance with large selections, rapid interactions
5. **Document everything** - Shortcuts reference, release notes, deprecation of old context menus

---

## Checklist

### Phase 1: Mixed Selection Action Filtering

- [ ] Implement `getCommonActions()` utility
  - [ ] Input: current selection (windowIds, groupIds, tabIds)
  - [ ] Output: array of actions available to ALL selected types
  - [ ] Close is always available (common to all)
  - [ ] Copy URLs is common to tabs, groups, windows
  - [ ] Pin is common to tabs and windows (pins all)
  - [ ] Mute is common to tabs and windows (mutes all)
- [ ] Create action availability matrix
  - [ ] Document which actions apply to which types
  - [ ] Tabs only: Cut, Copy (duplicate), Paste, Add to Group, Remove from Group
  - [ ] Groups only: Rename, Change Color, Ungroup, Merge
  - [ ] Windows only: Focus, Minimize, Maximize
  - [ ] All types: Close, Copy URLs
- [ ] Update toolbar rendering for mixed selections
  - [ ] Show intersection of actions for selected types
  - [ ] Disable/hide type-specific actions
  - [ ] Show "Mixed selection" in badge instead of type
- [ ] Update menu rendering for mixed selections
  - [ ] Group actions by type when mixed
  - [ ] Show disabled actions with "(requires single type)" hint
  - [ ] Keep Close at top (always available)
- [ ] Test mixed selection toolbar behavior
  - [ ] Tabs + Groups: Only Close, Copy URLs visible
  - [ ] Tabs + Windows: Close, Copy URLs, Pin, Mute visible
  - [ ] All three types: Only Close, Copy URLs visible

### Phase 2: Keyboard Shortcut Conflicts & Scope

- [ ] Audit all keyboard shortcuts for conflicts
  - [ ] Create spreadsheet of all shortcuts
  - [ ] Map Chrome defaults that MUST NOT be overridden
  - [ ] Identify any conflicts in our shortcuts
- [ ] Chrome shortcuts to avoid (NEVER override):
  - [ ] Cmd+T (New Tab)
  - [ ] Cmd+W (Close Tab)
  - [ ] Cmd+Shift+T (Reopen closed tab)
  - [ ] Cmd+R / F5 (Reload page)
  - [ ] Cmd+L (Focus address bar)
  - [ ] Cmd+D (Bookmark)
  - [ ] Cmd+F (Find in page)
  - [ ] Cmd+1-9 (Switch to tab by number)
  - [ ] Cmd+Option+Left/Right (Previous/Next tab)
  - [ ] Cmd+Shift+B (Toggle bookmarks bar)
  - [ ] Cmd+Y (History)
  - [ ] Cmd+Plus/Minus (Zoom)
- [ ] Implement shortcut scope/context
  - [ ] Shortcuts only active when tab manager has focus
  - [ ] Check `document.activeElement` is within tab manager
  - [ ] Disable shortcuts when input fields focused
  - [ ] Disable shortcuts when dialogs/modals open
- [ ] Create `useShortcutScope` hook
  - [ ] Track whether shortcuts should be active
  - [ ] Expose `isShortcutActive` boolean
  - [ ] Handle focus in/out of tab manager
- [ ] Add shortcut help dialog (? key)
  - [ ] Create `ShortcutsHelpDialog.tsx` component
  - [ ] Group shortcuts by category
  - [ ] Selection shortcuts (Space, Shift+arrows, Cmd+A, Escape)
  - [ ] Tab action shortcuts (P, M, R, C, etc.)
  - [ ] Group action shortcuts (Shift+R, Shift+C, U, etc.)
  - [ ] Window action shortcuts (Enter, H, F, etc.)
  - [ ] Navigation shortcuts (arrows, Tab)
  - [ ] Make dialog searchable
- [ ] Test all shortcuts work without conflicts

### Phase 3: Polish & Edge Cases

- [ ] Handle empty states
  - [ ] No tabs in window: Show "No tabs" message in tabs pane
  - [ ] No windows: Should never happen, but show graceful error
  - [ ] No selection: Toolbar shows "Select items to see actions"
  - [ ] Empty search results: Show "No matching items"
- [ ] Handle performance with large selections
  - [ ] Test with 100+ tabs selected
  - [ ] Profile render performance
  - [ ] Optimize selection state updates if needed
  - [ ] Use `useMemo` for expensive computations
  - [ ] Debounce selection updates if causing lag
- [ ] Handle rapid interactions
  - [ ] Debounce double-clicks (prevent duplicate actions)
  - [ ] Throttle keyboard shortcuts (prevent repeat-key spam)
  - [ ] Queue multiple actions properly
  - [ ] Show "Action in progress" state if needed
- [ ] Add loading states for async actions
  - [ ] Show spinner on toolbar during bulk operations
  - [ ] Disable toolbar buttons while action in progress
  - [ ] Show progress indicator for 50+ items (optional)
- [ ] Add error handling
  - [ ] Catch Chrome API errors
  - [ ] Show error toast with message
  - [ ] Include "Retry" button on error toasts
  - [ ] Log errors for debugging (console + optional telemetry)
- [ ] Test remaining edge cases
  - [ ] EDGE-13: Drag and drop with selection (future-proof state)
  - [ ] EDGE-14: Browser shortcut conflicts (verify no override)
  - [ ] EDGE-15: Select all in empty pane (no crash)
  - [ ] EDGE-17: Performance with 100+ tabs (< 100ms)

### Phase 4: Accessibility Audit

- [ ] Add ARIA labels to all interactive elements
  - [ ] Selection items: `aria-selected="true/false"`
  - [ ] Toolbar buttons: `aria-label="Pin 3 tabs"`
  - [ ] Menu items: proper `role="menuitem"`
  - [ ] Badge: `aria-live="polite"` for selection count updates
- [ ] Implement focus management
  - [ ] Focus trap in dialogs and menus
  - [ ] Return focus after dialog close
  - [ ] Maintain focus after actions (next item or toolbar)
- [ ] Test with screen reader (VoiceOver on macOS)
  - [ ] Selection state announced on change
  - [ ] Action buttons announce name + shortcut
  - [ ] Menu navigation works correctly
  - [ ] Confirmation dialogs are accessible
- [ ] Test keyboard-only navigation
  - [ ] All features accessible without mouse
  - [ ] Focus indicators visible at all times
  - [ ] No focus traps in main UI
  - [ ] Tab order is logical
- [ ] Verify color contrast (WCAG AA)
  - [ ] Selection highlight vs background: 4.5:1 minimum
  - [ ] Focus ring vs background: 3:1 minimum
  - [ ] Toolbar button text/icons: 4.5:1 minimum
  - [ ] Test in both light and dark modes
- [ ] Test reduced motion preference
  - [ ] Detect `prefers-reduced-motion`
  - [ ] Disable selection animations
  - [ ] Disable focus ring transitions
  - [ ] Ensure state changes still visible (instant vs animated)

### Phase 5: Testing & Bug Fixes

- [ ] Write unit tests for mixed selection logic
  - [ ] Test `getCommonActions()` with various combinations
  - [ ] Test `getSelectionSummary()` badge text
  - [ ] Test shortcut scope detection
- [ ] Write integration tests for full flows
  - [ ] Select tabs → Pin → Verify pinned
  - [ ] Select groups → Merge → Verify merged
  - [ ] Mixed selection → Close → Verify all closed
  - [ ] Cut → Navigate → Paste → Verify moved
- [ ] Manual testing checklist
  - [ ] Test in split view mode
  - [ ] Test in tree view mode
  - [ ] Test at 280px width (minimum)
  - [ ] Test at 360px width (standard)
  - [ ] Test with dark mode
  - [ ] Test with 10+ windows
  - [ ] Test with 100+ tabs
  - [ ] Test mixed selections
  - [ ] Test all keyboard shortcuts
  - [ ] Test with VoiceOver
- [ ] Fix bugs found during testing
- [ ] Performance profiling
  - [ ] Profile selection state updates
  - [ ] Profile toolbar re-renders
  - [ ] Profile large bulk operations
  - [ ] Optimize hot paths if needed

### Phase 6: Documentation & Release

- [ ] Update README.md
  - [ ] Document multi-selection feature
  - [ ] Document keyboard shortcuts
  - [ ] Add screenshots of toolbar states
  - [ ] Add GIFs of selection in action
- [ ] Create keyboard shortcuts reference
  - [ ] Add to tab manager help/settings
  - [ ] Printable one-page reference
  - [ ] Shareable image for social
- [ ] Write release notes
  - [ ] Create `product/releases/v1.X.0-selection-actions.md`
  - [ ] Highlight: Multi-selection, Bulk actions, New toolbar
  - [ ] Include before/after workflow comparison
  - [ ] Add demo video/GIFs
- [ ] Deprecate old context menu code
  - [ ] Add `@deprecated` JSDoc to `TabContextMenu.tsx`
  - [ ] Add `@deprecated` JSDoc to `TabGroupContextMenu.tsx`
  - [ ] Add `@deprecated` JSDoc to `WindowContextMenu.tsx`
  - [ ] Remove from component tree
  - [ ] Keep files for potential rollback (delete in future release)
- [ ] Final QA pass
  - [ ] Test on fresh Chrome profile
  - [ ] Test at various sidebar widths
  - [ ] Verify no console errors
  - [ ] Verify no regressions
  - [ ] Test upgrade path from previous version

---

## Mixed Selection Scenarios

These scenarios validate the toolbar behavior when multiple item types are selected.

**Scenario MIXED-1: Select tabs and groups together (tree view)**

```
Action: Click tab 3, Shift+click group 1 (tree order: tab3, tab4, group1)
Result: Tab 3, tab 4, and group 1 selected
State: selectionStore = { tabIds: [3,4], groupIds: [1] }
Toolbar: Shows only actions common to tabs and groups (Close, Copy URLs)
Badge: "2 tabs, 1 group"
```

**Scenario MIXED-2: Select window and tabs (tree view)**

```
Action: Click window 2, Shift+click tab 8 (window2 contains tabs 5-10)
Result: Window 2 and tabs 5-8 explicitly selected
State: selectionStore = { windowIds: [2], tabIds: [5,6,7,8] }
Toolbar: Close, Copy URLs, Pin, Mute (common to tabs + windows)
Badge: "1 window, 4 tabs"
```

**Scenario MIXED-3: Select all three types**

```
Action: Cmd+click window 1, group 2, tab 5
Result: All three items selected
State: selectionStore = { windowIds: [1], groupIds: [2], tabIds: [5] }
Toolbar: Only Close, Copy URLs visible
Badge: "1 window, 1 group, 1 tab"
Menu: Actions grouped by type, unavailable ones disabled
```

---

## Edge Cases

**Scenario EDGE-13: Drag and drop (future consideration)**

```
Context: Tabs 3-5 selected
Action: User drags tab 4 to different position
Result: All 3 selected tabs move together
Note: Out of scope for initial implementation, but selection state supports it
Future: Selection should be preserved during drag operations
```

**Scenario EDGE-14: Browser shortcut conflicts**

```
Context: Tab manager has focus, user wants to reload current page
Action: User presses Cmd+R
Result: Page reload (browser default), NOT "reload selected tabs"
Rationale: Browser shortcuts always take precedence
Implementation: Tab manager's R key (reload selected) only works without Cmd
Verification: Test that Cmd+R, Cmd+T, Cmd+W all work as expected
```

**Scenario EDGE-15: Select all in empty pane**

```
Context: Split view, no tabs in current window, tab pane focused
Action: User presses Cmd+A
Result: Nothing selected (no items to select), no error
State: selectionStore = {} (empty)
UI: No change, possibly show toast "No items to select"
```

**Scenario EDGE-17: Performance with large selection**

```
Context: 100+ tabs across multiple windows
Action: User selects all (Cmd+A in tree view)
Result: Selection completes in <100ms, no UI lag
State: selectionStore = { windowIds: [all], groupIds: [all], tabIds: [all] }
Implementation:
- Use Set for O(1) lookups
- Batch state updates
- Single render cycle
- Memoize expensive computations
```

---

## Technical Architecture

### Action Availability Matrix

```typescript
// actionAvailability.ts
type SelectionType = 'tab' | 'group' | 'window'
type ActionId =
  | 'close'
  | 'pin'
  | 'mute'
  | 'reload'
  | 'copyUrl'
  | 'rename'
  | 'changeColor'
  | 'ungroup'
  | 'merge'
  | 'focus'
  | 'minimize'
  | 'maximize'
  | 'cut'
  | 'copy'
  | 'paste'
  | 'addToGroup'
  | 'removeFromGroup'
  | 'moveToWindow'

const ACTION_AVAILABILITY: Record<ActionId, SelectionType[]> = {
  // Universal
  close: ['tab', 'group', 'window'],
  copyUrl: ['tab', 'group', 'window'],

  // Tab + Window (operates on tabs)
  pin: ['tab', 'window'],
  mute: ['tab', 'window'],
  reload: ['tab', 'group', 'window'],

  // Tab only
  cut: ['tab'],
  copy: ['tab'],
  paste: ['tab'],
  addToGroup: ['tab'],
  removeFromGroup: ['tab'],
  moveToWindow: ['tab'],

  // Group only
  rename: ['group'],
  changeColor: ['group'],
  ungroup: ['group'],
  merge: ['group'],

  // Window only
  focus: ['window'],
  minimize: ['window'],
  maximize: ['window'],
}

export const getCommonActions = (selection: SelectionState): ActionId[] => {
  const types: SelectionType[] = []
  if (selection.tabIds.size > 0) types.push('tab')
  if (selection.groupIds.size > 0) types.push('group')
  if (selection.windowIds.size > 0) types.push('window')

  if (types.length === 0) return []

  return Object.entries(ACTION_AVAILABILITY)
    .filter(([_, availableTypes]) =>
      types.every((t) => availableTypes.includes(t)),
    )
    .map(([actionId]) => actionId as ActionId)
}
```

### Shortcut Scope Hook

```typescript
// useShortcutScope.ts
export const useShortcutScope = () => {
  const [isActive, setIsActive] = useState(false)
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const checkFocus = () => {
      const active = document.activeElement

      // Shortcuts disabled in inputs/textareas
      if (active?.tagName === 'INPUT' || active?.tagName === 'TEXTAREA') {
        setIsActive(false)
        return
      }

      // Shortcuts disabled in dialogs
      if (active?.closest('[role="dialog"]')) {
        setIsActive(false)
        return
      }

      // Shortcuts active if focus is within tab manager
      const isInTabManager = containerRef.current?.contains(active) ?? false
      setIsActive(isInTabManager)
    }

    document.addEventListener('focusin', checkFocus)
    document.addEventListener('focusout', checkFocus)

    return () => {
      document.removeEventListener('focusin', checkFocus)
      document.removeEventListener('focusout', checkFocus)
    }
  }, [])

  return { isActive, containerRef }
}
```

### Selection Summary Badge

```typescript
// getSelectionSummary.ts
export const getSelectionSummary = (selection: SelectionState): string => {
  const { windowIds, groupIds, tabIds } = selection
  const parts: string[] = []

  if (windowIds.size > 0) {
    parts.push(`${windowIds.size} window${windowIds.size > 1 ? 's' : ''}`)
  }
  if (groupIds.size > 0) {
    parts.push(`${groupIds.size} group${groupIds.size > 1 ? 's' : ''}`)
  }
  if (tabIds.size > 0) {
    parts.push(`${tabIds.size} tab${tabIds.size > 1 ? 's' : ''}`)
  }

  if (parts.length === 0) return ''
  if (parts.length === 1) return parts[0]

  // "2 tabs, 1 group" or "1 window, 2 groups, 5 tabs"
  return parts.join(', ')
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

### Story 2: Keyboard Discovery

**As a** keyboard-first developer  
**I want to** see keyboard shortcuts for actions without searching documentation  
**So that** I can learn shortcuts organically while using the tool

**Acceptance Criteria:**

- [ ] When I hover over a toolbar action, I see its shortcut in tooltip
- [ ] When I open the 3-dot menu, all shortcuts are visible
- [ ] Shortcuts work immediately after seeing them
- [ ] Press ? to see all shortcuts

### Story 3: Clear Selection Feedback

**As a** general user  
**I want to** understand what I've selected and what will be affected  
**So that** I don't accidentally close the wrong tabs

**Acceptance Criteria:**

- [ ] Selected items have clear blue background
- [ ] Focus ring is distinct from selection in multi-select mode
- [ ] Badge shows selection count (e.g., "3 tabs" or "1 window, 2 tabs")
- [ ] Confirmation dialog before bulk close (10+ items)

---

## Success Metrics

**Performance:**

- Selection + action on 10 tabs: < 5 seconds
- Large selection (100+ items): < 100ms
- Toolbar renders without flicker at all widths

**Usability:**

- 80% of actions accessible via toolbar
- All keyboard shortcuts visible without documentation
- Zero off-screen clipping issues

**Accessibility:**

- WCAG AA color contrast compliance
- Full keyboard navigation
- Screen reader compatible

**Adoption:**

- 50% of users try multi-select within first week
- 30% of users perform bulk close within first week
- Average bulk operation: 5+ items

---

## Design Decisions

### For This Plan

1. **Mixed selection shows intersection** - Only actions common to ALL selected types are shown. Simpler than showing grouped/disabled actions.

2. **Badge shows all types** - "2 tabs, 1 group" is clearer than "3 items (mixed)" - user knows exactly what's selected.

3. **? key for shortcuts help** - Universal convention (GitHub, VS Code, etc.). Easy to discover.

4. **Shortcut scope by focus** - Shortcuts only work when tab manager has focus. Prevents conflicts with browser shortcuts.

5. **Deprecate, don't delete** - Old context menus marked deprecated but kept in codebase. Safe rollback path.

### From Previous Plans

3. **Close action first:** Close is the most common bulk action, applies to all item types.

4. **3-dot menu always has all actions:** Consistency > space saving.

5. **Delete/Backspace for close:** More deliberate than X.

6. **R key consistency:** R = reload everywhere.

7. **Avoid Chrome shortcut conflicts:** Never override Cmd+R, Cmd+T, etc.

---

## Out of Scope

- Undo/redo for closed items (use Chrome's recently closed)
- Custom keyboard shortcut mapping
- Drag-and-drop for bulk moves
- Persistent selection across sidebar close/open

---

## Notes

### Implementation Order Rationale

This plan is intentionally last because:

1. Mixed selection logic requires all actions to exist
2. Accessibility audit requires complete UI
3. Testing requires all features implemented
4. Documentation requires final feature set

### Rollback Plan

If issues discovered after release:

1. Old context menus still in codebase (deprecated)
2. Can re-enable via feature flag
3. Selection store can be disabled independently
4. Toolbar can fall back to menu-only mode

### Post-Release Improvements

Track for future releases:

- Undo/redo stack
- Selection history
- Drag-and-drop with selection
- Custom shortcuts
- "Select similar" feature
