# Tab Manager: Selection Visual Design

**Date:** January 3, 2026  
**Model:** Claude Opus 4.5  
**Status:** Not Started  
**Predecessors:** [Selection Foundation](./2025-01-03-tab-manager-selection-foundation.md)  
**Successors:** [Toolbar & Close Action](./2025-01-03-tab-manager-toolbar-close-action.md)

## Executive Summary

This plan implements the visual design layer for the selection system, transforming the functional selection states from Plan 1 into a polished, accessible, and delightful user experience.

**Deliverables:**

- Focus ring separation visual model (distinct focus vs selection states)
- Mode transition animations with spring physics
- Selection badge component with smart count display
- Optional mode indicators for discoverability
- Consistent styling across tabs, groups, and windows

**Exit Criteria:**

- Visual distinction between focus and selection is immediately clear
- Mode transitions feel natural and reinforce the mental model
- Animations respect `prefers-reduced-motion`
- Selection count badge accurately reflects selection state
- All visual states pass WCAG AA contrast requirements

---

## Problem Statement

**Current State (after Plan 1):**

- Basic blue background indicates selection
- Focus and selection are functionally working but visually undifferentiated
- No animation feedback when entering/exiting multi-select mode
- No visual count of selected items
- Mode state is not visually obvious to new users

**User Needs:**

- Clear visual feedback distinguishing "where I am" (focus) from "what I've selected"
- Intuitive understanding of current interaction mode
- Quick glance to see how many items are selected
- Smooth, non-jarring transitions that reinforce the mental model

**Success Metrics:**

- Users correctly identify focus vs selection state in usability testing
- Mode transitions feel "natural" (subjective, validated via user feedback)
- Selection count visible within 200ms of selection change
- Zero accessibility complaints about visual states

---

## Solution Overview

### Focus Ring Separation Model

The key visual innovation is separating focus (keyboard position) from selection (items to act on):

**Default Mode (Fused State):**

```
┌─────────────────────────────┐
│ 📄 Tab Name                 │  ← Blue background + subtle integrated border
│                             │     Focus and selection are ONE visual state
└─────────────────────────────┘
```

**Multi-Select Mode (Separated State):**

```
┌─────────────────────────────┐
│ 📄 Tab Name                 │  ← Blue background only (selected)
│                             │
└─────────────────────────────┘

┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐
  📄 Another Tab               ← Focus ring only (focused, not selected)
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘

┌─────────────────────────────┐
│ 📄 Third Tab              ╔═╗│  ← Blue background + focus ring (both)
│                           ╚═╝│
└─────────────────────────────┘
```

### Benefits of This Model

1. **No new UI elements** - No checkboxes to place, no layout shifts
2. **Consistent across item types** - Works for tabs, groups, and windows
3. **Solves favicon displacement** - No need to add checkbox beside icons
4. **Self-evident mode** - Visual state itself indicates the mode
5. **0 selected items is clear** - Focus ring visible, no backgrounds

### Color Palette

| State                  | Background      | Border                   | Description            |
| ---------------------- | --------------- | ------------------------ | ---------------------- |
| Unselected             | transparent     | none                     | Default state          |
| Selected               | `bg-primary/15` | none                     | Blue tinted background |
| Focused (default mode) | `bg-primary/15` | `ring-2 ring-primary/50` | Fused state            |
| Focused (multi-select) | transparent     | `ring-2 ring-primary`    | Focus ring only        |
| Selected + Focused     | `bg-primary/15` | `ring-2 ring-primary`    | Both states visible    |

### Mode Transition Animations

**Entering Multi-Select Mode (Space bar):**

- Focus ring "lifts off" from the blue background
- Animation: Ring scales from 0.95 → 1.0, opacity 0.5 → 1.0
- Duration: 150ms with spring easing
- The separation visually reinforces that focus is now independent

**Exiting Multi-Select Mode (Escape or mouse click):**

- Focus ring "merges back" into the item
- Animation: Ring scales 1.0 → 0.95, fades into background
- Duration: 100ms (faster exit feels snappier)
- Selection clears, returning to single-item focus

**Reduced Motion:**

- Check `prefers-reduced-motion: reduce`
- Skip animations entirely, instant state changes
- Focus ring still visible, just no transition animation

### Selection Badge Component

Displays in the toolbar (or standalone) showing selection count:

```
┌─────────────┐
│  3 tabs     │  ← Simple count
└─────────────┘

┌─────────────────────┐
│  2 groups (8 tabs)  │  ← Group count with contained tab count
└─────────────────────┘

┌──────────────────────┐
│  1 window (12 tabs)  │  ← Window count with contained tab count
└──────────────────────┘

┌───────────────────────────────┐
│  3 tabs, 1 group, 2 windows   │  ← Mixed selection (rare, verbose)
└───────────────────────────────┘
```

**Badge Logic:**

1. If only tabs: "N tabs"
2. If only groups: "N groups (M tabs)" where M = sum of tabs in groups
3. If only windows: "N windows (M tabs)" where M = sum of tabs in windows
4. If mixed: comma-separated list of non-zero counts

### Additional Mode Indicators (Optional)

For users who need extra clarity:

1. **Toolbar mode indicator**: Small icon or text showing "Multi-select" when active
2. **Keyboard hint**: "Press Escape to exit" shown briefly when entering mode
3. **Badge color change**: Badge could have subtle border/glow in multi-select mode

These are optional enhancements, not required for the core experience.

---

## Checklist

### Phase 1: Focus Ring Styling

- [ ] Define CSS custom properties for selection colors
  - [ ] `--selection-bg`: Background color for selected items
  - [ ] `--selection-ring`: Focus ring color
  - [ ] `--selection-ring-fused`: Fused state ring color (more subtle)
  - [ ] Add to `packages/tailwindcss-config` or tab-manager local styles
- [ ] Update `TabItemRow.tsx` with selection visual states
  - [ ] Add `selected` prop styling (blue background)
  - [ ] Add `focused` prop styling (focus ring)
  - [ ] Add `fusedFocusSelection` prop for default mode combined state
  - [ ] Ensure ring doesn't cause layout shift (use `ring-inset` or absolute positioning)
- [ ] Update `TabGroupHeader.tsx` with selection visual states
  - [ ] Same props as TabItemRow
  - [ ] Ensure collapse/expand chevron remains visible with selection
- [ ] Update `WindowButton.tsx` (or equivalent) with selection visual states
  - [ ] Same props as TabItemRow
  - [ ] Works in both split view rail and tree view
- [ ] Test visual consistency across all item types

### Phase 2: Mode State Integration

- [ ] Connect visual states to selection store mode
  - [ ] Subscribe to `mode` from `useSelectionStore`
  - [ ] Pass `isFused={mode === 'default'}` to item components
  - [ ] Pass `focused` based on keyboard focus tracking
- [ ] Implement focus tracking for visual state
  - [ ] Track which item has keyboard focus (ref or state)
  - [ ] Update focus visual when arrow keys navigate
  - [ ] Clear focus visual when mouse takes over
- [ ] Test mode-dependent visual behavior
  - [ ] Default mode: arrow keys move fused state
  - [ ] Multi-select mode: arrow keys move only focus ring

### Phase 3: Mode Transition Animations

- [ ] Create transition animation styles
  - [ ] Use CSS transitions or Framer Motion
  - [ ] Define `entering-multiselect` keyframes
  - [ ] Define `exiting-multiselect` keyframes
- [ ] Implement "lift off" animation when entering multi-select
  - [ ] Trigger on mode change from 'default' to 'multi-select'
  - [ ] Ring scales and brightens
  - [ ] Duration: 150ms, spring easing
- [ ] Implement "merge back" animation when exiting
  - [ ] Trigger on mode change from 'multi-select' to 'default'
  - [ ] Ring fades and shrinks into background
  - [ ] Duration: 100ms, ease-out
- [ ] Respect `prefers-reduced-motion`
  - [ ] Check media query in component or CSS
  - [ ] Skip animations when reduced motion preferred
  - [ ] Ensure instant state changes still work correctly
- [ ] Test animations feel natural and not distracting

### Phase 4: Selection Badge Component

- [ ] Create `SelectionBadge.tsx` in `packages/ui/lib/tab-manager/`
  - [ ] Subscribe to selection store counts
  - [ ] Calculate display text based on selection composition
  - [ ] Use `useMemo` to avoid recalculating on every render
- [ ] Implement smart count display logic
  - [ ] `getSelectionBadgeText(windowIds, groupIds, tabIds)` utility
  - [ ] Handle pure selections (tabs only, groups only, windows only)
  - [ ] Handle mixed selections with comma separation
  - [ ] Calculate contained tab counts for groups/windows
- [ ] Style the badge component
  - [ ] Compact size for toolbar integration
  - [ ] Readable font size (not too small)
  - [ ] Subtle background to stand out without dominating
- [ ] Add badge to toolbar area (placeholder until Plan 3)
  - [ ] Position in designated badge area
  - [ ] Hide when selection count is 0
  - [ ] Animate count changes (optional)
- [ ] Test badge updates correctly with selection changes

### Phase 5: Polish & Edge Cases

- [ ] Handle rapid mode transitions
  - [ ] Debounce animation triggers if needed
  - [ ] Ensure no visual glitches with fast Space/Escape presses
- [ ] Handle focus during animations
  - [ ] Focus ring should remain functional during transition
  - [ ] No accessibility issues during animation
- [ ] Test with keyboard navigation
  - [ ] Focus ring moves smoothly with arrow keys
  - [ ] No flicker or double-render issues
- [ ] Test badge with large counts
  - [ ] Ensure text doesn't overflow
  - [ ] Consider "99+" for very large selections
- [ ] Visual QA across themes
  - [ ] Test in light mode
  - [ ] Test in dark mode
  - [ ] Ensure sufficient contrast in both

### Phase 6: Accessibility

- [ ] Verify color contrast ratios
  - [ ] Selection background vs text: ≥ 4.5:1 (WCAG AA)
  - [ ] Focus ring vs background: ≥ 3:1 (WCAG AA for UI components)
  - [ ] Use browser dev tools or contrast checker
- [ ] Test with forced colors mode (Windows High Contrast)
  - [ ] Focus ring should use system highlight color
  - [ ] Selection should be distinguishable
- [ ] Ensure focus ring is visible for keyboard users
  - [ ] Ring should be visible regardless of selection state
  - [ ] Ring should not disappear unexpectedly
- [ ] Test with screen magnification
  - [ ] Focus ring should scale appropriately
  - [ ] No clipping issues when zoomed
- [ ] Add ARIA attributes if needed
  - [ ] Badge should have `aria-live="polite"` for count changes
  - [ ] Selection state announced via existing `aria-selected`

### Phase 7: Testing

- [ ] Unit tests for SelectionBadge
  - [ ] Test badge text generation for various selection states
  - [ ] Test count calculation for nested items
- [ ] Visual regression tests (if available)
  - [ ] Capture snapshots of all visual states
  - [ ] Detect unintended style changes
- [ ] Manual testing checklist
  - [ ] Test default mode visual (fused state)
  - [ ] Test multi-select mode visual (separated states)
  - [ ] Test mode transition animation
  - [ ] Test with `prefers-reduced-motion`
  - [ ] Test badge with 1, 5, 50, 100+ items
  - [ ] Test in sidebar at 280px, 320px, 360px widths
  - [ ] Test in light and dark mode

### Phase 8: Documentation

- [ ] Document visual design decisions
  - [ ] Why focus ring separation vs checkboxes
  - [ ] Color palette rationale
  - [ ] Animation timing choices
- [ ] Add design tokens to style guide (if exists)
  - [ ] Selection colors
  - [ ] Animation durations
  - [ ] Border radius for focus ring
- [ ] Update component documentation
  - [ ] Props for selection visual states
  - [ ] Usage examples
- [ ] Write release notes section
  - [ ] Highlight visual improvements
  - [ ] Note accessibility enhancements

---

## Interaction Scenarios

### Visual State Scenarios

**Scenario VIS-1: Default mode navigation**

```
Mode: Default
Context: Tab 3 focused+selected (fused state)
Visual: Tab 3 has blue background with integrated subtle ring
Action: Press Down arrow
Result: Fused state moves to tab 4
Visual: Tab 3 = normal, Tab 4 = blue background with integrated ring
```

**Scenario VIS-2: Entering multi-select mode**

```
Mode: Default → Multi-select
Context: Tab 3 focused+selected
Action: Press Space bar
Result: Mode changes to multi-select
Animation: Focus ring "lifts off" from background (150ms spring)
Visual: Tab 3 has blue background + prominent focus ring (separated)
```

**Scenario VIS-3: Navigating in multi-select mode**

```
Mode: Multi-select
Context: Tab 3 selected+focused
Action: Press Down arrow twice to tab 5
Visual progression:
  - Tab 3: blue background + ring → blue background only
  - Tab 4: normal → ring only → normal
  - Tab 5: normal → ring only
Final: Tab 3 = blue, Tab 4 = normal, Tab 5 = ring only
```

**Scenario VIS-4: Selecting in multi-select mode**

```
Mode: Multi-select
Context: Tab 3 selected, focus on tab 5 (unselected)
Visual: Tab 3 = blue, Tab 5 = ring only
Action: Press Space to toggle tab 5
Result: Tab 5 becomes selected
Visual: Tab 3 = blue, Tab 5 = blue + ring
```

**Scenario VIS-5: Exiting multi-select mode**

```
Mode: Multi-select → Default
Context: Tabs 3, 5 selected, focus on tab 5
Action: Press Escape
Result: Selection clears, focus remains on tab 5, mode = default
Animation: Focus ring "merges" into fused state (100ms ease-out)
Visual: Tab 3 = normal, Tab 5 = fused state (blue + integrated ring)
```

**Scenario VIS-6: Mouse click while in multi-select mode**

```
Mode: Multi-select
Context: Tabs 3, 5 selected, focus ring on tab 5
Action: Click tab 8 (regular click, no modifier)
Result: Exit multi-select mode, select only tab 8
Animation: Focus ring disappears (mouse has implicit focus)
Visual: Tab 3 = normal, Tab 5 = normal, Tab 8 = blue (no ring - mouse mode)
```

**Scenario VIS-7: Reduced motion preference**

```
System: prefers-reduced-motion: reduce
Mode: Default → Multi-select
Action: Press Space bar
Result: Mode changes instantly, no animation
Visual: Focus ring immediately appears as separated state
```

### Badge Scenarios

**Scenario BADGE-1: Single tab selected**

```
Selection: 1 tab
Badge: "1 tab"
```

**Scenario BADGE-2: Multiple tabs selected**

```
Selection: 5 tabs
Badge: "5 tabs"
```

**Scenario BADGE-3: Single group selected**

```
Selection: 1 group containing 4 tabs
Badge: "1 group (4 tabs)"
```

**Scenario BADGE-4: Multiple groups selected**

```
Selection: 3 groups containing total of 12 tabs
Badge: "3 groups (12 tabs)"
```

**Scenario BADGE-5: Single window selected**

```
Selection: 1 window containing 8 tabs
Badge: "1 window (8 tabs)"
```

**Scenario BADGE-6: Mixed selection**

```
Selection: 2 tabs + 1 group (3 tabs) + 1 window (5 tabs)
Badge: "2 tabs, 1 group, 1 window"
Note: Detailed count would be too long, show summary
```

**Scenario BADGE-7: Empty selection**

```
Selection: nothing
Badge: (hidden or "0 selected")
```

---

## Technical Architecture

### Focus Tracking

Focus tracking is needed to know which item should show the focus ring:

```typescript
// pages/tab-manager/src/selection/useFocusTracking.ts
export const useFocusTracking = () => {
  const [focusedItem, setFocusedItem] = useState<{
    type: 'window' | 'group' | 'tab'
    id: number
  } | null>(null)

  // Update focused item when keyboard navigates
  const setFocus = useCallback((item: { type; id } | null) => {
    setFocusedItem(item)
  }, [])

  // Clear focus when mouse takes over
  const clearFocus = useCallback(() => {
    setFocusedItem(null)
  }, [])

  return { focusedItem, setFocus, clearFocus }
}
```

### Selection Badge Utility

```typescript
// packages/ui/lib/tab-manager/utils/getSelectionBadgeText.ts
interface SelectionCounts {
  windowIds: Set<number>
  groupIds: Set<number>
  tabIds: Set<number>
}

export const getSelectionBadgeText = (
  counts: SelectionCounts,
  getTabCountForGroup: (groupId: number) => number,
  getTabCountForWindow: (windowId: number) => number,
): string => {
  const { windowIds, groupIds, tabIds } = counts
  const windowCount = windowIds.size
  const groupCount = groupIds.size
  const tabCount = tabIds.size

  // Pure selections
  if (windowCount > 0 && groupCount === 0 && tabCount === 0) {
    const totalTabs = Array.from(windowIds).reduce(
      (sum, id) => sum + getTabCountForWindow(id),
      0,
    )
    return windowCount === 1
      ? `1 window (${totalTabs} tabs)`
      : `${windowCount} windows (${totalTabs} tabs)`
  }

  if (groupCount > 0 && windowCount === 0 && tabCount === 0) {
    const totalTabs = Array.from(groupIds).reduce(
      (sum, id) => sum + getTabCountForGroup(id),
      0,
    )
    return groupCount === 1
      ? `1 group (${totalTabs} tabs)`
      : `${groupCount} groups (${totalTabs} tabs)`
  }

  if (tabCount > 0 && windowCount === 0 && groupCount === 0) {
    return tabCount === 1 ? '1 tab' : `${tabCount} tabs`
  }

  // Mixed selection - show summary
  const parts: string[] = []
  if (tabCount > 0) parts.push(`${tabCount} tab${tabCount > 1 ? 's' : ''}`)
  if (groupCount > 0)
    parts.push(`${groupCount} group${groupCount > 1 ? 's' : ''}`)
  if (windowCount > 0)
    parts.push(`${windowCount} window${windowCount > 1 ? 's' : ''}`)
  return parts.join(', ')
}
```

### CSS Animation Classes

```css
/* packages/ui/lib/tab-manager/selection-animations.css */

/* Focus ring base styles */
.selection-focus-ring {
  @apply ring-2 ring-primary ring-offset-0;
  transition:
    opacity 100ms ease-out,
    transform 100ms ease-out;
}

/* Fused state (default mode) */
.selection-fused {
  @apply bg-primary/15 ring-2 ring-primary/50;
}

/* Separated states (multi-select mode) */
.selection-selected {
  @apply bg-primary/15;
}

.selection-focused {
  @apply ring-2 ring-primary;
}

/* Animation: entering multi-select mode */
@keyframes focus-ring-lift {
  from {
    transform: scale(0.98);
    opacity: 0.5;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.focus-ring-entering {
  animation: focus-ring-lift 150ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Animation: exiting multi-select mode */
@keyframes focus-ring-merge {
  from {
    transform: scale(1);
    opacity: 1;
  }
  to {
    transform: scale(0.98);
    opacity: 0.5;
  }
}

.focus-ring-exiting {
  animation: focus-ring-merge 100ms ease-out;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .focus-ring-entering,
  .focus-ring-exiting {
    animation: none;
  }
}
```

---

## Design Decisions

1. **Focus ring separation over checkboxes** - Checkboxes would require layout changes, displace favicons, and add visual clutter. The focus ring model is more elegant and consistent with native OS behaviors.

2. **Spring physics for enter, ease-out for exit** - Entering a mode should feel "expansive" (spring), while exiting should feel "snappy" (ease-out). This follows the principle that activation is more important than deactivation.

3. **150ms enter, 100ms exit** - Slightly longer enter animation draws attention to the mode change. Faster exit feels responsive and doesn't delay returning to normal interaction.

4. **Badge shows contained counts** - When selecting groups/windows, users want to know how many tabs will be affected. "1 window (12 tabs)" is more informative than just "1 window".

5. **Mixed selection shows type counts only** - Calculating contained tabs for mixed selections is complex and potentially confusing. A simple count of each type is clearer.

6. **Hide badge when empty** - No selection = no badge. Showing "0 selected" adds noise without value.

---

## Keyboard Shortcuts

This plan does not introduce new keyboard shortcuts. All shortcuts are inherited from Plan 1 (Selection Foundation):

| Shortcut   | Action                                | Visual Effect                                       |
| ---------- | ------------------------------------- | --------------------------------------------------- |
| Space      | Enter multi-select / toggle selection | Focus ring separates (animation)                    |
| Escape     | Clear selection, exit mode            | Focus ring merges back (animation)                  |
| Arrow keys | Navigate                              | Focus ring moves (default: fused, multi: separated) |

---

## Integration Notes

### Dependencies on Plan 1

- Requires `useSelectionStore` with `mode` state
- Requires selection state (`windowIds`, `groupIds`, `tabIds`)
- Requires `enterMultiSelectMode()` and `exitMultiSelectMode()` actions

### Provides to Plan 3

- `SelectionBadge` component for toolbar integration
- Visual states that work with toolbar button tooltips
- Animation system that can be extended for action feedback

### CSS/Styling Integration

- Add new CSS classes to existing component stylesheets
- May require updates to `packages/tailwindcss-config` for custom colors
- Animations use CSS keyframes (no external library required)

---

## Out of Scope

- Drag-and-drop visual feedback (future plan)
- Cut/paste visual indicators (Plan 3+)
- Loading state animations (Plan 3+)
- Toolbar component itself (Plan 3)
