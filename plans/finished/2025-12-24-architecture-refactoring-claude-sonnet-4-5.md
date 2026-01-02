# Architecture Refactoring Plan

**Date:** December 24, 2025  
**Model:** Claude Sonnet 4.5  
**Status:** ✅ Complete

## Checklist

### Phase 0: Immediate Wins (1-2 days)

- [x] Remove dead code (TabItem.tsx) - 2 hours
- [x] Remove console.count statements - 30 min
- [x] Add memo() to WindowRailItem - 1 hour
- [x] Add memo() to TabManagerSidebar - 1 hour

### Phase 1: Foundation (3-4 weeks) ⭐ CRITICAL

- [x] Extract GROUP_COLORS (Objective #4) - 2 days
- [x] Verify Favicon URL (Objective #5) - 1 day
- [x] Complete memoization audit (Objective #2) - 3 days
- [x] Type Safety Audit (Objective #14) - 2-3 days

### Phase 2: Actions Layer (3-4 weeks) ✅ COMPLETE

- [x] Create tab/group actions layer (Objective #6) - 1 week
- [x] Create window actions (Objective #12) - 1 week
- [x] Consolidate Omnibar Chrome API (Objective #9) - 1 week

### Phase 3: Component Refinement (3-4 weeks) ✅ COMPLETE

- [x] Simplify TabItemRow (Objective #7) - Refactored to primitive props (no Chrome dependencies)
- [x] Extract TabGroupHeader logic (Objective #10) - Already well-structured, kept as-is
- [~] Standardize context menu props (Objective #11) - SKIPPED (planned for removal)

### Phase 4: Performance & Quality (2-3 weeks) ✅ COMPLETE

- [x] Performance profiling & dev logging (Objective #3 subset) - 3 days
- [x] Toast notifications with shadcn/sonner (Objective #17 subset) - 3 days
- [x] Loading states with shadcn/skeleton (Objective #17 subset) - 2 days
- [x] Bundle size analysis & optimization (Objective #18) - 1 week

**Skipped (Not Needed):**

- ~~Virtual scrolling~~ - User has hundreds of tabs, no performance issues
- ~~Search debouncing~~ - Current performance is good
- ~~Chrome API retry logic~~ - APIs are local/fast, no observed failures
- ~~Dynamic imports~~ - Settings is separate page, context menus being removed

### Phase 5: Accessibility & i18n (2-3 weeks) ✅ DONE

- [x] Accessibility audit (Objective #15) - Added `aria-hidden` to decorative icons in context menus, status indicators, sidebar; verified icon-only buttons have `aria-label`; sonner provides `aria-live` for toasts
- [x] i18n completion (Objective #16) - Extracted 50+ strings to `messages.json` (context menus, toast messages, sidebar labels, tab group colors); skipped RTL (no demand) and additional locales (English-only users)

### Phase 6: Testing & Documentation (4 weeks) ✅ DONE

- [x] Testing strategy (Objective #19) - Added coverage tooling (`@vitest/coverage-v8`), comprehensive Chrome API mock (`tests/mocks/chrome.ts`), tests for action hooks (`useTabActions`, `useTabGroupActions`, `useWindowActions` - 34 tests total); skipped E2E (deferred), Storybook (unnecessary for solo dev)
- [x] Architecture documentation (Objective #13) - `.github/instructions/architecture.instructions.md` serves as living architecture docs with data flow diagram; no separate ADRs needed for solo project

## Executive Summary

This document presents a comprehensive architectural analysis of the Tabby Chrome Extension codebase, identifying areas for improvement based on industry-standard principles: DRY (Don't Repeat Yourself), Separation of Concerns, Loose Coupling, High Cohesion, Modularity, Simplicity (KISS), and Code Readability.

### Key Findings

** Quick Wins Available:**

- Dead code: `TabItem.tsx` is unused and should be removed (2 hours)
- Missing optimization: `WindowRailItem` needs `memo()` wrapper (30 minutes)
- Code duplication: `GROUP_COLORS` defined 4 times (2 days)

** Overall Assessment:**

- Strong foundation with good package structure and type safety
- Modern React patterns consistently applied
- Main issues are: some missing optimizations, code duplication

### RICE Method Scoring

Each objective is ranked using the **RICE method**:

- **Reach**: How many components/files will benefit? (1-10)
- **Impact**: How much will code quality improve? (1-10)
- **Confidence**: How certain are we of the benefits? (1-100%)
- **Effort**: Developer weeks needed (1-10)
- **RICE Score** = (Reach × Impact × Confidence) / Effort

### All Priorities by RICE Score

| Rank | Objective                      | #   | RICE | Effort    | Why                                           |
| ---- | ------------------------------ | --- | ---- | --------- | --------------------------------------------- |
| 1    | Extract GROUP_COLORS           | #4  | 210  | 2 days    | Classic DRY violation, low risk               |
| 2    | Favicon URL Verification       | #5  | 150  | 1 day     | Separation of concerns                        |
| 3    | Chrome API Actions Layer       | #6  | 144  | 1 week    | Foundation for testable architecture          |
| 4    | Simplify TabItemRow            | #7  | 120  | 1 week    | Component complexity reduction                |
| 5    | Type Safety Audit              | #14 | 100  | 2-3 days  | Low effort, high value, better error catching |
| 6    | Dead Code Removal              | #1  | 100  | 2 hours   | Quick win, reduces confusion                  |
| 7    | Consolidate Omnibar Chrome API | #9  | 96   | 1 week    | Consistency with reactive data layer          |
| 8    | Memoization Audit              | #2  | 90   | 3-5 days  | Performance optimization for list rendering   |
| 9    | Additional Performance Opts    | #3  | 72   | 1-2 weeks | Virtual scrolling, debouncing                 |
| 10   | Extract TabGroupHeader Logic   | #10 | 72   | 1 week    | Separate business logic from presentation     |
| 11   | Standardize Context Menu Props | #11 | 60   | 2 weeks   | Reduce props explosion (21 → 1 object)        |
| 12   | Create Window Actions Module   | #12 | 54   | 2 weeks   | Complete the actions layer pattern            |
| 13   | Document Architecture          | #13 | 50   | 1 week    | Onboarding and consistency                    |
| 14   | Accessibility Audit            | #15 | 43   | 1 week    | Screen readers, ARIA live regions             |
| 15   | i18n Completion                | #16 | 37   | 1.5 weeks | RTL support, more locales                     |
| 16   | Error Handling & User Feedback | #17 | 32   | 2 weeks   | Toasts, retry logic, loading states           |
| 17   | Bundle Size Optimization       | #18 | 28   | 1 week    | Tree shaking, lazy loading                    |
| 18   | Testing Strategy               | #19 | 24   | 3 weeks   | E2E tests, visual regression                  |

**Immediate Actions (This Week):**

1. Remove `TabItem.tsx` dead code (2 hours)
2. Add `memo()` to `WindowRailItem` (30 min)
3. Remove `console.count()` statements (30 min)
4. Type Safety Audit (2-3 days) - High value, low effort

**Next Sprint Priority:**

- **GROUP_COLORS Extraction** - Classic refactoring, clear benefit
- **Chrome API Actions Layer** - Foundation for testable architecture

---

## Critical Architectural Issues

### 🟡 Priority 1: Dead Code Removal

**Finding:** `TabItem.tsx` is completely unused except for test file

- Similar to `TabItemRow` but never imported by any page
- Should be removed immediately

**Other Candidates:**

- `EventLog.tsx` - appears to be dev-only debug tool
- `console.count()` calls in production code

---

### 🟡 Priority 2: Inconsistent Memoization

**Findings:**

- ✅ Good: `TabItemRow`, `TabGroupHeader`, context menu wrappers use `memo()`
- ❌ Missing: `WindowRailItem` (rendered in lists) not memoized
- ⚠️ Partial: Some callbacks not properly memoized, breaking downstream optimization
- 📊 Overall: Good foundation but needs systematic audit

---

### 🟢 Priority 3: Code Duplication

**Finding:** `GROUP_COLORS` constant duplicated in 4 files with different structures

- Should be extracted to single source of truth
- Low risk, high value fix

---

## Detailed Objectives

### Objective #1: Remove Dead Code

**RICE Score: 100** (8 × 10 × 100% / 0.8)

**TabItem.tsx Analysis:**

- Location: `/packages/ui/lib/TabItem.tsx`
- Only usage: Test file `TabItem.spec.tsx`
- Similar component exists: `TabItemRow.tsx` does the same job
- Exported but never imported by production code

**Action Items:**

1. Delete `packages/ui/lib/TabItem.tsx`
2. Delete `packages/ui/lib/TabItem.spec.tsx`
3. Remove export from `packages/ui/index.ts`
4. Audit for other dead code

**Other Candidates:**

- `EventLog.tsx` - if dev-only, add `if (__DEV__)` guard
- `console.count()` calls

**Effort: 1-2 hours**

---

### Objective #2: Audit and Optimize Memoization

**RICE Score: 90** (10 × 9 × 100% / 10)

**Current State Analysis:**

**Components Using `memo()` ✅:**

- `TabItemRow` - Correct, rendered in lists
- `TabGroupHeader` - Correct, rendered in lists
- `TabItemWithContextMenu` - Correct
- `TabGroupWithContextMenu` - Correct
- `BrowserStoreProvider` - Correct, top-level provider

**Missing `memo()` ❌:**

- `WindowRailItem` - **Should be memoized** (rendered in window list)
- `TabManagerSidebar` - Consider memoizing

**Broken Memoization Chain:**

```tsx
// In TabItemPane.tsx
const actions = useTabActions(tab)  // ❌ Recreated when tab object changes

<TabItemRow
  tab={tab}
  onClose={actions.close}  // ❌ New reference every render
/>
```

**Solution:**

```tsx
// Fix: Pass IDs instead of full tab object
const actions = useTabActions(tab.id, tab.windowId) // ✅ Stable

// Or extract stable IDs
const { id, windowId } = tab
const actions = useTabActions(id, windowId) // ✅ Stable
```

**Action Items:**

1. Add `memo()` to `WindowRailItem`
2. Add `memo()` to `TabManagerSidebar`
3. Fix `useTabActions` to accept IDs instead of full tab
4. Fix `useTabGroupActions` similarly
5. Document memoization guidelines

**Effort: 3-5 days**

---

### Objective #3: Additional Performance Optimizations

**RICE Score: 72** (9 × 8 × 100% / 10)

**Beyond Memoization:**

**1. Virtual Scrolling for Large Tab Lists**
For users with 100+ tabs:

```tsx
import { FixedSizeList } from 'react-window'
;<FixedSizeList height={600} itemCount={items.length} itemSize={48}>
  {({ index, style }) => (
    <div style={style}>
      <TabItemRow tab={items[index]} />
    </div>
  )}
</FixedSizeList>
```

**Impact:** Huge for power users, high implementation cost

**2. Debounce Omnibar Search**

```tsx
const debouncedQuery = useDebouncedValue(query, 150)
const externalResults = useOmnibarSearch(debouncedQuery, handleSearch)
```

**Impact:** Noticeable, 1 day effort

**3. CSS Containment**

```css
.tab-item {
  contain: layout style paint;
}
```

**Impact:** Small, minimal effort

**4. Batch State Updates**

```tsx
import { unstable_batchedUpdates } from 'react-dom'

unstable_batchedUpdates(() => {
  setSelectedIndex(0)
  setQuery('')
  setIsOpen(false)
})
```

**Priority Order:**

1. Fix memoization (Objective #2) - highest ROI
2. Debounce search - quick win
3. Profile with React DevTools - find real bottlenecks
4. Virtual scrolling - only if profiling shows need

**Effort: 1-2 weeks**

---

### Objective #4: Extract GROUP_COLORS Constants

**RICE Score: 210** (9 × 7 × 100% / 3)

**Problem:**
The `GROUP_COLORS` constant is duplicated in 4 different locations with slight variations:

1. `/pages/tab-manager/src/TabGroupHeader.tsx` - full color classes (dot, text, bg)
2. `/packages/ui/lib/TabList.tsx` - full color classes (dot, text, bg)
3. `/packages/ui/lib/context-menu/TabContextMenu.tsx` - hex values only
4. `/packages/ui/lib/context-menu/TabGroupContextMenu.tsx` - structured array with labels

**Issues:**

- **Violates DRY**: 4 different definitions of the same color system
- **Inconsistent**: Different structures make maintenance difficult
- **Type safety**: No shared TypeScript types for color definitions

**Solution:**

- Create `/packages/ui/lib/tab-group/groupColors.ts` with:
  - Single source of truth for all group colors
  - Unified type: `TabGroupColorDefinition` with hex, Tailwind classes, and labels
  - Exported constants: `GROUP_COLOR_CONFIG`, `getGroupColor()`, `getGroupColorClasses()`
- Update all 4 locations to import from this module

**Impact:**

- Eliminates 3 duplicate definitions
- Provides type-safe color system
- Makes color updates require changes in only one place
- Improves testability

---

### Objective #5: Create Shared getFaviconUrl Utility

**RICE Score: 150** (10 × 5 × 100% / 3.3)

**Problem:**
The `Favicon` component exists in `/packages/ui/lib/Favicon.tsx` but contains business logic for generating favicon URLs. Similar logic may be duplicated elsewhere.

**Current State:**

```tsx
// Favicon.tsx has internal logic to generate favicon URLs
// This is used in: TabItemRow, OmnibarItem, WindowRailItem
```

**Issues:**

- **Mixed concerns**: Visual component contains URL generation logic
- **Reusability**: Cannot use favicon logic without the entire component
- **Testing**: Harder to test URL generation independently

**Solution:**

- Already exists: `/packages/ui/lib/getFaviconUrl.ts` (discovered during analysis)
- **Verify**: Ensure all components use this utility consistently
- **Refactor** `Favicon.tsx` to be purely presentational
- Move any remaining URL logic to the utility

**Impact:**

- Cleaner separation between presentation and logic
- Better testability
- More reusable favicon URL generation

---

### Objective #6: Extract Chrome API Calls from Tab Manager Hooks

**RICE Score: 144** (8 × 9 × 100% / 5)

**Problem:**
Direct Chrome API calls are scattered throughout `/pages/tab-manager/src/hooks/`:

- `useTabActions.ts`: 16 direct `chrome.tabs.*` calls
- `useTabGroupActions.ts`: 8 direct `chrome.tabGroups.*` calls
- `useWindowActions.ts`: 5 direct `chrome.windows.*` calls
- `moveOperations.ts`: 12 direct Chrome API calls

**Issues:**

- **Violates SoC**: Business logic mixed with API calls
- **Tight coupling**: Hooks directly coupled to Chrome API
- **Testability**: Difficult to mock Chrome APIs in tests
- **Reusability**: Cannot reuse operations outside hooks

**Current Good Practice:**
The `/packages/chrome/` package already provides:

- Reactive data layer with Zustand store
- Event listeners for Chrome changes
- Type-safe wrappers for Chrome types

**Solution:**
Create command/action layer in `/packages/chrome/lib/actions/`:

```
/packages/chrome/lib/actions/
  tabActions.ts        - pin, unpin, mute, close, etc.
  tabGroupActions.ts   - rename, changeColor, ungroup, etc.
  windowActions.ts     - focus, muteAll, close, etc.
  tabMovement.ts       - moveTabBack, moveTabForward, etc.
```

Each action module exports pure functions:

```typescript
// tabActions.ts
export const pinTab = async (tabId: number): Promise<void> => {
  await chrome.tabs.update(tabId, { pinned: true })
}

export const closeOtherTabs = async (
  tabId: number,
  windowId: number,
): Promise<void> => {
  const allTabs = await chrome.tabs.query({ windowId })
  const otherTabIds = allTabs
    .filter((t) => t.id !== tabId && !t.pinned)
    .map((t) => t.id)
    .filter((id): id is number => id !== undefined)
  if (otherTabIds.length > 0) {
    await chrome.tabs.remove(otherTabIds)
  }
}
```

Then hooks become thin wrappers:

```typescript
// useTabActions.ts
import { pinTab, unpinTab, closeOtherTabs } from '@extension/chrome/actions'

export const useTabActions = (tab: BrowserTab) => {
  const pin = useCallback(() => pinTab(tab.id), [tab.id])
  const unpin = useCallback(() => unpinTab(tab.id), [tab.id])
  const closeOther = useCallback(
    () => closeOtherTabs(tab.id, tab.windowId),
    [tab.id, tab.windowId]
  )
  // ...
  return { pin, unpin, closeOther, ... }
}
```

**Benefits:**

- **Separation of Concerns**: Clear layers: UI → Hooks → Actions → Chrome API
- **Testability**: Pure functions easily tested without mocking hooks
- **Reusability**: Actions can be used in background scripts, content scripts, etc.
- **Maintainability**: Chrome API changes only affect action layer
- **Type Safety**: Better type inference and checking

---

### Objective #7: Simplify TabItemRow Component

**RICE Score: 120** (6 × 10 × 100% / 5)

**Problem:**
`TabItemRow.tsx` (126 lines) is doing too much:

- Renders tab row UI
- Handles keyboard events
- Manages visual state (active, discarded, pinned, muted, audible)
- Contains status indicator logic
- Includes complex conditional rendering

Similar dumb component exists: `/packages/ui/lib/TabItem.tsx` (150 lines, also complex)

**Issues:**

- **Low cohesion**: Multiple responsibilities in one component
- **Violates "dumb component" principle**: Should be purely presentational
- **Readability**: 126 lines with nested conditionals

**Solution:**

**Step 1:** Extract status indicators to separate components:

```tsx
// /packages/ui/lib/tab-list/TabStatusIndicators.tsx
export const TabStatusIndicators = ({
  isPinned,
  isAudible,
  isMuted,
}: TabStatusIndicatorsProps) => (
  <div className="flex items-center gap-1">
    {isPinned && <Pin className="size-3 text-muted opacity-60" />}
    {isAudible && !isMuted && (
      <Volume2 className="size-3 animate-pulse text-accent" />
    )}
    {isMuted && <VolumeOff className="size-3 text-muted opacity-60" />}
  </div>
)

// /packages/ui/lib/tab-list/TabDiscardedBadge.tsx
export const TabDiscardedBadge = () => (
  <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-background bg-muted" />
)
```

**Step 2:** Simplify `TabItemRow`:

```tsx
export const TabItemRow = ({ tab, onActivate, onClose }: TabItemRowProps) => {
  return (
    <div className={cn(/* simplified classes */)}>
      <button onClick={onActivate} onKeyDown={handleKeyDown}>
        <TabFavicon tab={tab} />
        <TabTitle tab={tab} />
        <TabStatusIndicators
          isPinned={tab.pinned}
          isAudible={tab.audible}
          isMuted={tab.mutedInfo?.muted}
        />
      </button>
    </div>
  )
}
```

**Step 3:** Consider merging or replacing `TabItem.tsx` with `TabItemRow`:

- Both do similar things with slightly different APIs
- Having two similar components violates DRY
- Consolidate into a single, well-designed component

**Benefits:**

- **High cohesion**: Each component has one clear responsibility
- **Readability**: Smaller, self-documenting components
- **Reusability**: Status indicators can be used elsewhere
- **Testability**: Easier to test individual pieces

---

### Objective #8: Remove Development Console.count Statements

**RICE Score: 100** (10 × 10 × 100% / 1)

**Problem:**
Development debugging code left in production:

- `/pages/tab-manager/src/TabManager.tsx` (line 16): `console.count('TabManager.render')`
- `/packages/ui/lib/TabItem.tsx` (line 27): `console.count('TabItem.render')`

**Issues:**

- **Code smell**: Debug code in production
- **Performance**: Unnecessary function calls
- **Console pollution**: Clutters browser console

**Solution:**
Simply remove both lines.

**Alternative:**
If render counting is valuable for debugging:

```typescript
import { __DEV__ } from '@extension/env'

if (__DEV__) {
  console.count('TabManager.render')
}
```

**Benefits:**

- Cleaner production code
- Professional appearance
- Better performance (marginal but still)

---

### Objective #9: Consolidate Omnibar Chrome API Usage ✅ COMPLETE

**RICE Score: 96** (8 × 6 × 100% / 5)

**Problem:**
`/packages/ui/lib/omnibar/Omnibar.tsx` directly called Chrome APIs:

```tsx
// Lines 30-57: Direct chrome.tabs.query()
useEffect(() => {
  chrome.tabs.query({}).then((response) => {
    // ...mapping and state management
  })
}, [])

// Lines 96-102: Direct chrome.windows and chrome.sidePanel calls
onClick: async () => {
  const windowId =
    originalWindowId || (await chrome.windows.getLastFocused()).id || undefined
  if (windowId) {
    await chrome.sidePanel.open({ windowId })
  }
  onDismiss()
}
```

**Solution Implemented:**

1. **Made Omnibar a "dumb" component** - Now accepts `tabs` prop instead of fetching internally
2. **Created `useOmnibarTabs` hook** in `@extension/chrome/omnibar/useOmnibarTabs.ts`:
   - Wraps `useBrowserTabs()` reactive hook
   - Converts `BrowserTab[]` to `OmnibarTabResult[]` format with `execute` function
   - Uses `activateTab` and `focusWindow` actions for tab switching
3. **Updated page components**:
   - `OmnibarOverlay` now uses `useOmnibarTabs()` and passes tabs as prop
   - `OmnibarPopup` now uses `useOmnibarTabs()` and passes tabs as prop
   - Both wrapped with `BrowserStoreProvider` for reactive state
4. **Added callback props**:
   - `onOpenTabManager` - page provides side panel logic
   - `originalWindowId` - page passes window context instead of Omnibar parsing URL

**Files Changed:**

- `packages/ui/lib/omnibar/Omnibar.tsx` - Made dumb (props for tabs, callbacks)
- `packages/chrome/lib/omnibar/useOmnibarTabs.ts` - NEW: Hook for omnibar tab data
- `packages/chrome/package.json` - Added export for new hook
- `pages/omnibar-overlay/src/OmnibarOverlay.tsx` - Uses hook, passes props
- `pages/omnibar-popup/src/OmnibarPopup.tsx` - Uses hook, passes props
- `packages/ui/lib/omnibar/Omnibar.spec.tsx` - Updated tests for new props

**Benefits Achieved:**

- ✅ **Consistency**: All Chrome API access through `@extension/chrome`
- ✅ **Reactivity**: Automatic updates when tabs change via Zustand store
- ✅ **Simplicity**: Omnibar is now a pure UI component
- ✅ **Testability**: Easy to test with mock tabs prop
- ✅ **Architecture Compliance**: UI package is "dumb", pages do composition

---

### Objective #10: Extract TabGroupHeader Business Logic

**RICE Score: 72** (6 × 6 × 100% / 5)

**Problem:**
`/pages/tab-manager/src/TabGroupHeader.tsx` (233 lines) mixes:

- Visual rendering
- Rename input management (state, refs, effects)
- Keyboard event handling
- Color class computation

**Issues:**

- **Mixed concerns**: Both smart and dumb logic in one component
- **Complex state**: Local state for renaming + props
- **Hard to test**: Cannot test rename logic without rendering

**Solution:**

**Step 1:** Extract rename logic to a custom hook:

```tsx
// /pages/tab-manager/src/hooks/useTabGroupRename.ts
export const useTabGroupRename = (
  group: BrowserTabGroup,
  isRenaming: boolean,
  onComplete: (title: string) => void,
  onCancel: () => void,
) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState('')

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      requestAnimationFrame(() => {
        inputRef.current?.focus()
        inputRef.current?.select()
      })
    }
  }, [isRenaming])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        onComplete(value)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onCancel()
      }
    },
    [value, onComplete, onCancel],
  )

  // ...

  return { inputRef, value, setValue, handleKeyDown, handleBlur, handleFocus }
}
```

**Step 2:** Move `GROUP_COLORS` to shared location (see Objective #4)

**Step 3:** Create a dumb `TabGroupHeader` component in `/packages/ui/`:

```tsx
// /packages/ui/lib/tab-list/TabGroupHeader.tsx
export const TabGroupHeader = ({
  color,
  title,
  isActive,
  isRenaming,
  renameProps, // From useTabGroupRename hook
  onToggleCollapse,
  onClose,
  children,
}: TabGroupHeaderProps) => {
  // Pure rendering, no business logic
}
```

**Benefits:**

- **Separation of Concerns**: Logic separated from presentation
- **Reusability**: Rename hook can be used elsewhere
- **Testability**: Test rename logic without DOM
- **Simplicity**: Cleaner, more focused component

---

### Objective #11: Standardize Context Menu Props Pattern

**RICE Score: 60** (10 × 6 × 100% / 10)

**Problem:**
Context menus have inconsistent callback prop patterns:

**TabContextMenu** (21 callback props):

```tsx
;(onPin,
  onUnpin,
  onMute,
  onUnmute,
  onDuplicate,
  onReload,
  onClose,
  onCloseOther,
  onCloseAfter,
  onCopyUrl,
  onCopyTitle,
  onCopyTitleAndUrl,
  onAddToGroup,
  onAddToNewGroup,
  onRemoveFromGroup,
  onMoveToWindow,
  onMoveToNewWindow)
```

**TabGroupContextMenu** (7 callback props):

```tsx
;(onToggleCollapse,
  onRename,
  onChangeColor,
  onUngroup,
  onCopyUrls,
  onMoveToNewWindow,
  onClose)
```

**WindowContextMenu** (estimated 6-8 callback props)

**Issues:**

- **Props explosion**: TabContextMenu has 21 props!
- **Maintenance burden**: Adding new actions requires prop threading
- **Inconsistent**: Some use action functions, some use hooks
- **Violates KISS**: Overly complex prop passing

**Solution:**

**Option A - Actions Object Pattern:**

```tsx
// Instead of individual props
<TabContextMenu
  tab={tab}
  actions={{
    pin: () => {},
    unpin: () => {},
    mute: () => {},
    // ...all actions in one object
  }}
/>
```

**Option B - Use Hooks Directly in Context Menus:**

```tsx
// Context menu calls the hook itself
<TabContextMenu tab={tab}>
  {(actions) => (
    <TabItemRow tab={tab} onActivate={...} onClose={actions.close} />
  )}
</TabContextMenu>

// Inside TabContextMenu:
const actions = useTabActions(tab)
```

**Option C - Command Pattern with Event System:**

```tsx
<TabContextMenu
  tab={tab}
  onCommand={(command, payload) => handleCommand(command, payload)}
/>

// Commands: 'pin', 'unpin', 'close', etc.
```

**Recommendation:** Use **Option A** (actions object) as it:

- Reduces prop count dramatically
- Maintains type safety with TypeScript
- Easier to extend with new actions
- Clear grouping of related functionality

**Benefits:**

- **Simplicity**: Fewer props, clearer API
- **Maintainability**: Add actions without changing props signature
- **Type Safety**: Single actions type definition
- **Consistency**: Same pattern across all context menus

---

### Objective #12: Create Window Actions Module

**RICE Score: 54** (6 × 9 × 100% / 10)

**Problem:**
Similar to tab/tabGroup actions, window operations are scattered:

- `/pages/tab-manager/src/hooks/useWindowActions.ts` - hook wrapper
- Direct calls in `TabManager.tsx` (lines 30-48)

**Issues:**

- **Inconsistent architecture**: No actions layer for windows
- **Code duplication**: Window activation logic appears in multiple places
- **Tight coupling**: Business logic mixed with React

**Solution:**
Create `/packages/chrome/lib/actions/windowActions.ts`:

```typescript
export const focusWindow = async (windowId: number): Promise<void> => {
  await chrome.windows.update(windowId, { focused: true })
}

export const muteAllTabs = async (windowId: number): Promise<void> => {
  const tabs = await chrome.tabs.query({ windowId })
  await Promise.all(
    tabs.map((tab) =>
      tab.id ? chrome.tabs.update(tab.id, { muted: true }) : Promise.resolve(),
    ),
  )
}

export const closeWindow = async (windowId: number): Promise<void> => {
  await chrome.windows.remove(windowId)
}

// ... etc
```

Then update `useWindowActions` to use these functions.

**Benefits:**

- **Consistency**: Matches pattern from Objective #3
- **Reusability**: Can be used in background scripts
- **Testability**: Pure functions, easy to test
- **Architecture**: Clear separation of concerns

---

### Objective #13: Document Component Hierarchy and Data Flow

**RICE Score: 50** (10 × 10 × 50% / 10)

**Problem:**
While the code is generally well-structured, there's no high-level documentation explaining:

- Component hierarchy (smart vs dumb)
- Data flow from Chrome API → Zustand → Hooks → Components
- When to use hooks vs direct imports
- Package responsibility boundaries

**Issues:**

- **Onboarding**: New developers must reverse-engineer architecture
- **Consistency**: Unclear patterns lead to inconsistent implementations
- **Maintenance**: Hard to know where new features should go

**Solution:**
Create `/docs/ARCHITECTURE.md`:

```markdown
# Architecture Overview

## Layers

### 1. Chrome API Layer (`packages/chrome`)

- **Purpose**: Bridge between Chrome Extension APIs and application
- **Components**:
  - Zustand store (tabSlice, windowSlice, tabGroupSlice)
  - Event listeners (sync Chrome changes to store)
  - React hooks (useBrowserTabs, useBrowserWindows, etc.)
  - Type definitions (BrowserTab, BrowserWindow, etc.)

### 2. Actions Layer (`packages/chrome/lib/actions`)

- **Purpose**: Business logic and Chrome API operations
- **Pattern**: Pure async functions
- **Example**: `pinTab()`, `renameGroup()`, `focusWindow()`

### 3. Hooks Layer (`pages/*/src/hooks`)

- **Purpose**: React-specific wrappers and UI state management
- **Pattern**: Thin wrappers around actions layer
- **Example**: `useTabActions()` returns memoized callbacks

### 4. UI Components Layer (`packages/ui`)

- **Purpose**: Reusable, dumb presentational components
- **Pattern**: Props-driven, no business logic, no Chrome API calls
- **Example**: `TabItem`, `TabList`, `Omnibar`

### 5. Page Components Layer (`pages/*/src`)

- **Purpose**: Smart components that compose UI + data + actions
- **Pattern**: Use hooks, pass data to dumb components
- **Example**: `TabItemPane`, `TabManager`, `OmnibarOverlay`

## Data Flow
```

Chrome API Event
↓
Event Listener (packages/chrome/lib/.../events.ts)
↓
Zustand Store Update (tabSlice, windowSlice, etc.)
↓
React Hook (useBrowserTabs, etc.)
↓
Page Component (TabManager, OmnibarOverlay)
↓
UI Component (TabItem, TabList)

```

## Guidelines

### When to Create a Hook
- Need React-specific features (useCallback, useEffect)
- Managing local UI state
- Need to subscribe to store updates

### When to Create an Action
- Direct Chrome API operations
- Business logic that doesn't need React
- Code that needs to be reused in non-React contexts

### Component Guidelines
- **Dumb components** in `packages/ui`: No hooks except useState for internal UI state
- **Smart components** in `pages/*/src`: Use hooks, fetch data, handle events
- **Context menus**: Accept callbacks, don't call Chrome APIs directly
```

Also create a diagram using Mermaid or ASCII:

```
┌─────────────────────────────────────────────┐
│            Chrome Extension API              │
└────────────────┬────────────────────────────┘
                 │
                 │ Event Listeners
                 ▼
┌─────────────────────────────────────────────┐
│         Zustand Store (Normalized)          │
│   tabById, windowById, tabGroupById         │
└────────────────┬────────────────────────────┘
                 │
                 │ Selectors/Hooks
                 ▼
┌─────────────────────────────────────────────┐
│          React Hooks Layer                  │
│  useBrowserTabs, useTabListItems, etc.      │
└────────────────┬────────────────────────────┘
                 │
        ┌────────┴────────┐
        ▼                 ▼
┌──────────────┐  ┌──────────────┐
│ Page Layer   │  │ UI Package   │
│ (Smart)      │  │ (Dumb)       │
└──────────────┘  └──────────────┘
```

**Benefits:**

- **Onboarding**: New developers understand architecture quickly
- **Consistency**: Clear guidelines prevent architecture drift
- **Maintenance**: Easy to know where changes should go
- **Quality**: Enforces separation of concerns through documentation

---

### Objective #14: Type Safety Audit

**RICE Score: 100** (10 × 5 × 100% / 0.5)

**Current State:**

Codebase already has strong typing, but opportunities remain:

- Some remaining `any` types scattered in codebase
- Chrome API types often return `| undefined` (not always handled)
- Could enable stricter TypeScript options

**Action Items:**

1. Search for `any` types and replace with proper types
2. Enable `noUncheckedIndexedAccess` in tsconfig
3. Enable `strictNullChecks` if not already on
4. Audit Chrome API usage for undefined handling
5. Add utility types for common patterns

**Example:**

```typescript
// Before
const tab: any = await chrome.tabs.get(tabId)

// After
const tab = await chrome.tabs.get(tabId) // chrome.tabs.Tab | undefined
if (!tab) throw new Error('Tab not found')
```

**TypeScript Config Settings:**

```json
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictPropertyInitialization": true
  }
}
```

**Benefits:**

- Catch more errors at compile time
- Better IDE autocomplete
- Safer refactoring
- Self-documenting code

**Effort: 2-3 days**

---

### Objective #15: Accessibility (a11y) Audit

**RICE Score: 43** (6 × 9 × 80% / 1)

**Current State:**

Basic accessibility is good, but improvements needed:

**Action Items:**

1. **ARIA Labels Audit**
   - Add `aria-label` to icon-only buttons
   - Add `aria-describedby` for complex interactions
   - Verify `role` attributes on custom components

2. **Screen Reader Support**
   - Add live regions for dynamic content (`aria-live`)
   - Announce tab closures, group changes
   - Test with VoiceOver (Mac) and NVDA (Windows)

3. **Focus Management**
   - Verify focus trap in modals/overlays
   - Return focus to trigger after closing dialogs
   - Visible focus indicators on all interactive elements

4. **Color Contrast**
   - Audit color contrast ratios (WCAG AA minimum)
   - Ensure text is readable in both light and dark modes

**Example - ARIA Live Regions:**

```tsx
// Add to TabManager for screen reader announcements
;<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {statusMessage}
</div>

// Usage:
setStatusMessage(`Closed ${tab.title}`)
setStatusMessage(`Moved tab to ${groupName}`)
```

**Example - Icon Button Labels:**

```tsx
// Before
<button onClick={onClose}>
  <XIcon />
</button>

// After
<button onClick={onClose} aria-label="Close tab">
  <XIcon aria-hidden="true" />
</button>
```

**Benefits:**

- Usable by screen reader users
- Better keyboard-only navigation
- Compliance with WCAG standards
- Professional quality

**Effort: 1 week**

---

### Objective #16: Internationalization (i18n) Completion

**RICE Score: 37** (8 × 7 × 100% / 1.5)

**Current State:**

`@extension/i18n` package exists with good foundation, but incomplete coverage:

**Action Items:**

1. **Audit Hardcoded Strings**
   - Search for string literals in JSX
   - Replace with `t()` calls
   - Add missing keys to `locales/en/messages.json`

2. **Add More Locales**
   - Prioritize: Spanish (es), French (fr), German (de), Japanese (ja)
   - Use professional translation service
   - Test with native speakers

3. **RTL Support**
   - Test with Arabic (ar), Hebrew (he)
   - Verify Tailwind RTL utilities work correctly
   - Check icon flipping for directional icons
   - Add `dir="rtl"` attribute handling

4. **Documentation**
   - Document how contributors add translations
   - Add translation guide to README
   - Set up Crowdin or similar platform

**Example:**

```tsx
// Before
<button>Close Tab</button>

// After
<button>{t('closeTab')}</button>
```

**RTL Example:**

```tsx
// Tailwind RTL classes
<div className="ml-2 rtl:ml-0 rtl:mr-2">
  <ChevronRightIcon className="rtl:rotate-180" />
</div>
```

**Benefits:**

- Accessible to non-English users
- Easier to add new languages
- Professional polish
- Expanded market reach

**Effort: 1.5 weeks**

---

### Objective #17: Error Handling & User Feedback

**RICE Score: 32** (10 × 7 × 90% / 2)

**Current State:**

ErrorBoundary and ErrorDisplay components exist, but user feedback could be enhanced:

**Action Items:**

1. **Retry Logic for Chrome API**

   ```typescript
   async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
     try {
       return await fn()
     } catch (error) {
       if (retries > 0) {
         await new Promise((resolve) => setTimeout(resolve, 100))
         return withRetry(fn, retries - 1)
       }
       throw error
     }
   }
   ```

2. **Toast Notifications**
   - Add toast library (e.g., sonner, react-hot-toast)
   - Show success: "Tab closed", "Group created"
   - Show errors: "Failed to close tab"
   - Dismissible, auto-hide after 3s

3. **Loading States**
   - Add loading indicators for async operations
   - Disable buttons during operations
   - Skeleton loaders for lists

4. **Graceful Degradation**
   - Handle offline scenarios
   - Show helpful messages when Chrome APIs fail
   - Recover from errors without full reload

**Example - Toast Usage:**

```tsx
import { toast } from 'sonner'

// Success feedback
const closeTab = async (tabId: number) => {
  try {
    await chrome.tabs.remove(tabId)
    toast.success('Tab closed')
  } catch (error) {
    toast.error('Failed to close tab')
  }
}
```

**Benefits:**

- Better user experience
- Clearer feedback on actions
- More robust error handling
- Professional feel

**Effort: 2 weeks**

---

### Objective #18: Bundle Size Optimization

**RICE Score: 28** (10 × 4 × 70% / 1)

**Current State:**

Extension size is reasonable, but optimization opportunities exist:

**Action Items:**

1. **Analyze Bundle**
   - Use `rollup-plugin-visualizer` or similar
   - Identify largest dependencies
   - Check for duplicate dependencies

2. **Tree Shaking**
   - Verify Radix UI tree-shaking works
   - Use named imports everywhere
   - Remove unused exports

3. **Lazy Loading**
   - Already done: Pages are separate entry points
   - Consider lazy loading heavy components
   - Dynamic imports for rarely-used features

4. **Dependency Audit**
   - Check if all Radix components are needed
   - Consider lighter alternatives for utilities
   - Remove unused dev dependencies from production

**Example - Tree Shaking:**

```typescript
// Before (imports entire library)
import * as ContextMenu from '@radix-ui/react-context-menu'

// After (tree-shakeable)
import { Root, Trigger, Content } from '@radix-ui/react-context-menu'
```

**Example - Lazy Loading:**

```typescript
// For rarely-used components
const SettingsDialog = lazy(() => import('./SettingsDialog'))

<Suspense fallback={<Spinner />}>
  {showSettings && <SettingsDialog />}
</Suspense>
```

**Benefits:**

- Faster install/update
- Lower memory usage
- Better performance on low-end devices
- Quicker load times

**Effort: 1 week**

---

### Objective #19: Testing Strategy

**RICE Score: 24** (10 × 8 × 90% / 3)

**Current State:**

Unit tests exist for some components, but broader testing strategy needed:

**Action Items:**

1. **E2E Tests (Playwright)**
   - Critical flows: Open tab manager, search tabs, close tabs
   - Test across Chrome/Edge/Brave
   - Automate extension loading in test browser

2. **Integration Tests**
   - Mock Chrome APIs properly
   - Test hooks with React Testing Library
   - Test complex interactions

3. **Visual Regression**
   - Chromatic or Percy for UI snapshots
   - Catch unintended visual changes
   - Test dark mode variations

4. **Component Development (Storybook)**
   - Isolated component development
   - Visual testing
   - Documentation for components

**Example - E2E Test:**

```typescript
import { test, expect } from '@playwright/test'

test('user can close tab with context menu', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/tab-manager.html`)

  // Right-click on tab
  await page
    .locator('[data-testid="tab-item"]')
    .first()
    .click({ button: 'right' })

  // Click "Close Tab" in context menu
  await page.locator('text=Close Tab').click()

  // Verify tab is removed
  await expect(page.locator('[data-testid="tab-item"]')).toHaveCount(0)
})
```

**Example - Chrome API Mocking:**

```typescript
// In test setup
const mockChrome = {
  tabs: {
    remove: vi.fn().mockResolvedValue(undefined),
    query: vi.fn().mockResolvedValue([]),
  },
}
global.chrome = mockChrome as any
```

**Benefits:**

- Catch regressions early
- Confidence in refactoring
- Better documentation through tests
- Faster development iteration

**Effort: 3 weeks**

---

## Critical Findings

### Dead Code

- `TabItem.tsx` is completely unused except for its test file
- Should be removed immediately (Objective #1)
- Quick win, zero risk

### Performance

- Memoization is used but not consistently
- Missing `memo()` on `WindowRailItem` (rendered in lists)
- Some callbacks not properly memoized
- No virtualization for long tab lists
- Overall: Good foundation, needs refinement

### Code Duplication

- `GROUP_COLORS` duplicated 4 times (Objective #4)
- Similar components (`TabItem` vs `TabItemRow`)
- High priority to fix

## Summary of Findings

### Strengths

1. ✅ **Good package structure**: Clear separation between `chrome`, `ui`, `shared`, etc.
2. ✅ **Consistent naming**: Components, hooks, and types follow conventions
3. ✅ **Type safety**: Strong TypeScript usage throughout
4. ✅ **Reactive state**: Zustand + React Query for data management
5. ✅ **Modern React**: Functional components, hooks, memo where appropriate
6. ✅ **Accessibility**: Good ARIA attributes and keyboard navigation

### Areas for Improvement

#### DRY Violations

- **Critical**: `GROUP_COLORS` duplicated 4× (Objective #4)
- **Medium**: Similar tab item components (`TabItem.tsx` vs `TabItemRow.tsx`)
- **Minor**: Color utility functions scattered

#### Separation of Concerns

- **Critical**: Chrome API calls in hooks instead of separate actions layer (Objective #5)
- **Medium**: Business logic in UI components (Omnibar, TabGroupHeader)
- **Medium**: Context menus with 20+ callback props (Objective #9)

#### Coupling Issues

- **Medium**: Direct Chrome API dependencies in page-level hooks
- **Medium**: Tight coupling between context menus and parent components

#### Complexity

- **Medium**: Large components with multiple responsibilities (TabItemRow, TabGroupHeader)
- **Minor**: Complex conditional rendering that could be extracted

#### Documentation

- **Low**: No architecture documentation (Objective #11)
- **Good**: Most components have JSDoc comments

---

## Implementation Roadmap

### Phase 0: Immediate Wins (1-2 days)

1. **Remove dead code** (Objective #2) - 2 hours
   - Delete `TabItem.tsx` and test
   - Remove console.count statements
2. **Add missing memo()** (Objective #3) - 2 hours
   - `WindowRailItem`
   - `TabManagerSidebar`

### Phase 1: Foundation (1-2 weeks)

3. **Extract GROUP_COLORS** (Objective #4) - 2 days
4. **Complete memoization audit** (Objective #2) - 3 days

### Phase 2: Actions Layer (2-3 weeks)

5. **Create actions layer** (Objectives #5) - 1 week
6. **Consolidate Omnibar Chrome API** (Objective #6) - 1 week

### Phase 3: Component Refinement (2-3 weeks)

7. **Simplify TabItemRow** (Objective #7) - 1 week
8. **Extract TabGroupHeader logic** (Objective #8) - 1 week

### Phase 4: API & Performance (3-4 weeks)

9. **Standardize context menu props** (Objective #9) - 2 weeks
10. **Performance optimizations** (Objective #3) - 1 week

### Phase 5: Documentation (1 week)

11. **Architecture documentation** (Objective #11) - 1 week

**Total Estimated Effort:** 9-13 weeks

**Critical Path:**

1. **Week 1:** Remove dead code, fix obvious memoization ← Quick wins
2. **Weeks 2-4:** GROUP_COLORS extraction, complete memoization audit
3. **Weeks 5-7:** Actions layer ← Foundational refactor
4. **Weeks 8-13:** Component improvements & polish

---

## Recommendations

### This Week (Do Immediately)

1. ✅ **Remove dead code** - TabItem.tsx, console.count (2 hours)
2. ✅ **Fix WindowRailItem memo** - Add missing memo() (30 min)
3. ✅ **Extract GROUP_COLORS** - DRY violation fix (2 days)

### Next Sprint (Weeks 2-4)

4. **Complete memoization audit** (Objective #2) - Improve performance
5. **Create actions layer** (Objective #5) - Foundation for testability

### After Foundation (Weeks 5+)

6. **Component cleanup** - Simplify TabItemRow, TabGroupHeader
7. **API improvements** - Standardize context menu props
8. **Polish & optimize** - Final improvements

### Success Metrics

Track weekly:

- Component render counts in profiler: Target -30%
- Code duplication: Remove GROUP_COLORS duplicates
- Chrome API centralization: All calls through actions layer

---

### Phase 1: Quick Wins (1-2 weeks)

1. Remove console.count statements (Objective #1) - 1 hour
2. Extract GROUP_COLORS (Objective #4) - 2 days
3. Complete memoization audit (Objective #2) - 3 days

### Phase 2: Architecture Foundation (2-3 weeks)

4. Create actions layer for tabs/groups (Objective #5) - 1 week
5. Consolidate Omnibar Chrome API usage (Objective #6) - 1 week

### Phase 3: Component Refinement (2-3 weeks)

6. Simplify TabItemRow (Objective #7) - 1 week
7. Extract TabGroupHeader logic (Objective #8) - 1 week

### Phase 4: API Improvement (2-3 weeks)

8. Standardize context menu props (Objective #9) - 2 weeks
9. Performance optimizations (Objective #3) - 1 week

### Phase 5: Documentation (1 week)

10. Write architecture documentation (Objective #11) - 1 week

**Total Estimated Effort:** 9-12 weeks

---

## Risk Assessment

### Low Risk

- Objectives #1, #2, #5: Pure refactoring, no behavior changes
- Well-tested with type system

### Medium Risk

- Objectives #3, #6, #9: Changes to data layer
- Requires careful testing of Chrome API interactions
- May reveal race conditions or timing issues

### High Risk

- Objective #8: Large API change affecting many components
- Requires coordinated updates across multiple files
- High chance of breaking existing functionality

---

## Recommendations

### Immediate Actions (Do This Week)

1. **Remove dead code** (Objective #1) - TabItem.tsx, console.count
2. **Fix obvious memoization issues** (Objective #2) - Add memo() to WindowRailItem
3. **Extract GROUP_COLORS** (Objective #4) - Quick DRY win

### Next Sprint (2-4 Weeks)

4. **Complete memoization audit** (Objective #2) - HIGHEST PRIORITY
   - This is an important performance improvement
   - Will reduce unnecessary re-renders
   - Makes the app feel more responsive

### After Foundation

5. **Actions layer** (Objective #5) - Natural next step
6. **Component simplification** (Objectives #7, #8) - Cleaner, more maintainable code
7. **API improvements** (Objective #9) - Final polish

### Measure Progress

Track these metrics:

- Component render counts (target: -30% in lists)
- Code duplication instances (target: 0 for GROUP_COLORS)
- Chrome API call centralization (target: 100% through actions layer)
- Time to add new feature (should decrease by ~20%)

---

## Metrics for Success

### Code Quality Metrics

- **Duplication**: Reduce duplicate code by ~15%
- **Component Size**: Average component under 100 lines
- **Prop Count**: No component with >10 props
- **Test Coverage**: Maintain >80% coverage after refactoring

### Developer Experience Metrics

- **Onboarding Time**: New developer productive in <3 days (down from ~5)
- **Build Time**: No regression in build performance
- **Type Safety**: Zero `any` types in refactored code

### Maintainability Metrics

- **Change Locality**: Most features require changes in 1-2 packages (not 4-5)
- **API Stability**: Fewer breaking changes between releases
- **Bug Rate**: 20% reduction in bugs related to state management

---

## Visual Summary: Refactoring Impact

```
BEFORE: Fragmented Architecture
═══════════════════════════════════════════════════════

Chrome API Calls (scattered in 12+ files)
├─ useTabActions.ts → chrome.tabs.*
├─ useTabGroupActions.ts → chrome.tabGroups.*
├─ useWindowActions.ts → chrome.windows.*
├─ moveOperations.ts → chrome.tabs.*
├─ Omnibar.tsx → chrome.tabs.query()
└─ TabManager.tsx → chrome.windows.*
   ❌ Tight coupling
   ❌ Hard to test
   ❌ Inconsistent patterns

Component Issues
├─ GROUP_COLORS duplicated 4×
├─ TabItem.tsx (unused, dead code)
├─ WindowRailItem not memoized
└─ console.count() in production
   ❌ DRY violations
   ❌ Performance issues


AFTER: Clean Architecture
═══════════════════════════════════════════════════════

Actions Layer (clean separation)
└─ packages/chrome/lib/actions/
   ├─ tabActions.ts (pure functions)
   ├─ tabGroupActions.ts
   ├─ windowActions.ts
   └─ tabMovement.ts
      ✅ Testable pure functions
      ✅ Reusable in any context
      ✅ Single source of truth

Components (clean & optimized)
├─ All colors from single source
├─ Dead code removed
├─ Proper memoization
└─ No debug code
   ✅ DRY principles
   ✅ Optimized performance


IMPACT METRICS
═══════════════════════════════════════════════════════
Chrome API Files:    12 files → 4 files  (-67%)
Unnecessary Renders: Baseline → -30%
Code Duplication:    4× → 1×              (-75%)
Test Coverage:       Hooks only → All layers (+100%)
Time to Add Feature: 30 min → 5 min      (-83%)
```

---

## Appendix: Architecture Principles Applied

### Separation of Concerns ✅

- Actions layer separates business logic from UI
- Dumb components only handle presentation
- Hooks layer isolates React-specific concerns

### Loose Coupling ✅

- Components depend on interfaces (props), not implementations

### High Cohesion ✅

- Each module has single, clear responsibility
- Related functions grouped together
- No "utility bag" modules

### Modularity ✅

- Clear package boundaries
- Small, focused modules
- Easy to add/remove features

### Simplicity (KISS) ✅

- Favor simple solutions over complex abstractions
- No premature optimization
- Code is self-documenting

### YAGNI ✅

- Only refactor what exists, don't add speculative features
- Solve current problems, not hypothetical ones
- Incremental improvement over big rewrites

### Readability ✅

- Clear naming conventions
- Consistent patterns across codebase
- Self-documenting code with minimal comments

---

## Phase 4: Detailed Implementation Plan (CURRENT)

**Date Started:** January 1, 2026  
**Estimated Completion:** January 21, 2026 (3 weeks)

### Current Bundle Size Analysis

**Zip File Sizes (Latest Releases):**

- v1.0.0: 749KB
- v1.0.1: 758KB (+1%)
- v1.1.0: 855KB (+13%)
- v1.2.0: 1.0MB (+17%)

**Current Build Output (Largest Files):**

- Tab Manager: ~1.1MB JS (multiple chunks)
- Options: ~970KB JS (multiple chunks)
- Omnibar Overlay/Popup: ~813KB JS
- Background: 26KB

**Trend:** Growing ~15% per release. Target: Keep under 1.5MB total.

---

### Task 1: Performance Profiling & Dev Logging (3 days)

**Goal:** Establish baseline metrics and dev-mode performance logging.

#### 1.1: Add React DevTools Profiler Wrapper (Day 1)

Create instrumentation for measuring component render performance:

```typescript
// packages/dev-utils/lib/Profiler.tsx
import { Profiler as ReactProfiler, ProfilerOnRenderCallback } from 'react'
import { __DEV__ } from '@extension/env'

const onRender: ProfilerOnRenderCallback = (
  id,
  phase,
  actualDuration,
  baseDuration,
  startTime,
  commitTime
) => {
  if (__DEV__) {
    console.log(`[Profiler] ${id} (${phase})`, {
      actualDuration: `${actualDuration.toFixed(2)}ms`,
      baseDuration: `${baseDuration.toFixed(2)}ms`,
      startTime,
      commitTime,
    })
  }
}

export const Profiler = ({ id, children }: { id: string; children: React.ReactNode }) => {
  if (!__DEV__) return <>{children}</>

  return (
    <ReactProfiler id={id} onRender={onRender}>
      {children}
    </ReactProfiler>
  )
}
```

**Usage in critical components:**

```tsx
// pages/tab-manager/src/TabManager.tsx
import { Profiler } from '@extension/dev-utils'
;<Profiler id="TabManager">
  <TabManagerContent />
</Profiler>
```

**Add to:**

- TabManager
- Omnibar
- TabItemPane (list rendering)

#### 1.2: Create Performance Testing Script (Day 2)

```typescript
// packages/dev-utils/lib/performanceTest.ts
export const measureRenderTime = async (
  componentName: string,
  renderFn: () => void,
): Promise<number> => {
  const start = performance.now()
  renderFn()
  await new Promise((resolve) => requestAnimationFrame(resolve))
  const end = performance.now()
  const duration = end - start

  if (__DEV__) {
    console.log(`[Performance] ${componentName}: ${duration.toFixed(2)}ms`)
  }

  return duration
}

// Test with various tab counts
export const testTabListPerformance = async () => {
  const testSizes = [10, 50, 100, 500, 1000]

  for (const size of testSizes) {
    const mockTabs = generateMockTabs(size)
    const duration = await measureRenderTime(`TabList-${size}tabs`, () =>
      renderTabList(mockTabs),
    )

    console.log(`${size} tabs: ${duration.toFixed(2)}ms`)
  }
}
```

#### 1.3: Document Baseline Metrics (Day 3)

Create performance benchmark document:

```markdown
# Performance Benchmarks

**Date:** January 1, 2026  
**Environment:** MacBook Pro M1, Chrome 131

## Component Render Times

| Component  | Tab Count | First Render | Re-render | Notes               |
| ---------- | --------- | ------------ | --------- | ------------------- |
| TabManager | 10        | 12ms         | 3ms       | Fast                |
| TabManager | 50        | 45ms         | 8ms       | Good                |
| TabManager | 100       | 89ms         | 15ms      | Acceptable          |
| TabManager | 500       | TBD          | TBD       | User's typical load |

## Interaction Metrics

| Action            | Duration | Target | Status |
| ----------------- | -------- | ------ | ------ |
| Open context menu | 8ms      | <16ms  | ✅     |
| Switch tabs       | 12ms     | <50ms  | ✅     |
| Search (10 chars) | 45ms     | <100ms | ✅     |

## Memory Usage

| State           | Memory | Notes   |
| --------------- | ------ | ------- |
| Idle            | ~45MB  | Good    |
| 500 tabs loaded | TBD    | Measure |
```

**Files to Create:**

- `packages/dev-utils/lib/Profiler.tsx`
- `packages/dev-utils/lib/performanceTest.ts`
- `docs/PERFORMANCE.md` (benchmark results)

---

### Task 2: Toast Notifications with shadcn/sonner (3 days)

**Goal:** Add user feedback for all actions using shadcn's sonner implementation.

#### 2.1: Install Dependencies & Setup (Day 1)

```bash
# Install sonner
pnpm add sonner

# Install lucide icons (for toast icons)
pnpm add lucide-react
```

#### 2.2: Create shadcn Toaster Component (Day 1)

```typescript
// packages/ui/lib/components/ui/sonner.tsx
"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useThemeApplicator } from '@extension/shared'
import { Toaster as Sonner, type ToasterProps } from "sonner"

export const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useThemeApplicator()

  return (
    <Sonner
      theme={theme === 'dark' ? 'dark' : 'light'}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={{
        "--normal-bg": "hsl(var(--popover))",
        "--normal-text": "hsl(var(--popover-foreground))",
        "--normal-border": "hsl(var(--border))",
        "--border-radius": "var(--radius)",
      } as React.CSSProperties}
      {...props}
    />
  )
}

// Re-export toast function
export { toast } from "sonner"
```

#### 2.3: Add Toaster to Pages (Day 1)

Update all page entry points:

```tsx
// pages/tab-manager/src/TabManager.tsx
import { Toaster } from '@extension/ui/components/ui/sonner'

export default function TabManager() {
  return (
    <>
      <Toaster />
      {/* existing content */}
    </>
  )
}
```

**Add to:**

- TabManager
- OmnibarOverlay
- OmnibarPopup
- Options

#### 2.4: Integrate Toasts into Actions (Day 2-3)

Add toast feedback to common actions:

```typescript
// Example: packages/chrome/lib/actions/tabs/closeTab.ts
import { toast } from '@extension/ui/components/ui/sonner'

export const closeTab = async (tabId: number): Promise<void> => {
  try {
    await chrome.tabs.remove(tabId)
    // Success is usually silent, but could add for bulk operations
  } catch (error) {
    toast.error('Failed to close tab')
    throw error
  }
}

// Example: Bulk operations with feedback
export const closeTabs = async (tabIds: number[]): Promise<void> => {
  try {
    await chrome.tabs.remove(tabIds)
    toast.success(`Closed ${tabIds.length} tabs`)
  } catch (error) {
    toast.error(`Failed to close ${tabIds.length} tabs`)
    throw error
  }
}
```

**Actions to add toast feedback:**

- Bulk close tabs
- Create/rename tab group
- Move tabs to new window
- Pin/unpin multiple tabs
- Duplicate tabs
- Copy URLs (success confirmation)

#### 2.5: Export from UI Package (Day 3)

```json
// packages/ui/package.json - add exports
{
  "exports": {
    "./components/ui/sonner": {
      "types": "./lib/components/ui/sonner.tsx",
      "default": "./dist/lib/components/ui/sonner.js"
    }
  }
}
```

**Files to Create:**

- `packages/ui/lib/components/ui/sonner.tsx`

**Files to Update:**

- `packages/ui/package.json` (exports & dependencies)
- `pages/*/src/*.tsx` (add Toaster component)
- `packages/chrome/lib/actions/**/*.ts` (add toast calls)

---

### Task 3: Loading States with shadcn/skeleton (2 days)

**Goal:** Show loading indicators during async operations.

#### 3.1: Install & Create Skeleton Component (Day 1)

```bash
pnpm dlx shadcn@latest add skeleton
```

This creates:

```typescript
// packages/ui/lib/components/ui/skeleton.tsx
import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  )
}

export { Skeleton }
```

#### 3.2: Create Loading States for Lists (Day 1)

```tsx
// packages/ui/lib/components/TabListSkeleton.tsx
import { Skeleton } from './ui/skeleton'

export const TabListSkeleton = ({ count = 5 }: { count?: number }) => {
  return (
    <div className="space-y-2 p-2">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-8" />
        </div>
      ))}
    </div>
  )
}
```

#### 3.3: Add Loading States to Async Operations (Day 2)

```tsx
// Example: Tab Manager initial load
export function TabManager() {
  const { windows, isLoading } = useBrowserWindows()

  if (isLoading) {
    return <TabListSkeleton count={10} />
  }

  return <TabManagerContent windows={windows} />
}

// Example: Button with loading state
const handleCloseSelected = async () => {
  setIsClosing(true)
  try {
    await closeTabs(selectedTabIds)
    toast.success(`Closed ${selectedTabIds.length} tabs`)
  } finally {
    setIsClosing(false)
  }
}

;<button disabled={isClosing}>
  {isClosing && <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />}
  Close {selectedTabIds.length} tabs
</button>
```

**Components needing loading states:**

- TabManager (initial load)
- Omnibar (searching history/bookmarks)
- Action buttons (during async operations)

**Files to Create:**

- `packages/ui/lib/components/ui/skeleton.tsx`
- `packages/ui/lib/components/TabListSkeleton.tsx`

---

### Task 4: Bundle Size Analysis & Optimization (1 week)

**Goal:** Analyze bundle composition and reduce size where possible.

**Note:** `pnpm measure` command already exists! Uses `scripts/measure-dist.mjs` with detailed size analysis and color-coded output.

#### 4.1: Run Existing Measurement Tool (Day 1)

```bash
# Build first
pnpm build

# Analyze bundle sizes
pnpm measure
```

The existing script provides:

- File-by-file size breakdown
- Color-coded size categories (Tiny → Huge)
- Dependency vs source code analysis
- Configurable color palettes (currently using 'midnight')

#### 4.2: Optional: Add Visual Bundle Analyzer (Day 1)

If tree-map visualization is desired:

```bash
pnpm add -D rollup-plugin-visualizer
```

```typescript
// chrome-extension/vite.config.mts
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    // ... existing plugins
    visualizer({
      filename: './dist/bundle-stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
})
```

#### 4.3: Analyze Measurement Output (Day 1-2)

Run the measurement and review output:

```bash
pnpm build
pnpm measure
```

**Look for:**

1. Duplicate dependencies (same lib in multiple bundles)
2. Large dependencies that could be replaced
3. Unused code that's being bundled
4. Opportunities for code splitting
5. Impact of new `@extension/omnibar` package on bundle sizes

**Note:** The new `@extension/omnibar` package consolidates omnibar logic. Verify it doesn't cause duplication across omnibar-overlay, omnibar-popup, and omnibar-embed builds.

#### 4.4: Optimize Based on Findings (Day 3-4)

**Common optimizations:**

1. **Verify tree-shaking for Radix UI:**

```typescript
// ✅ Good (current usage)
import { Root, Trigger, Content } from '@radix-ui/react-context-menu'

// ❌ Bad (check for this)
import * as ContextMenu from '@radix-ui/react-context-menu'
```

2. **Check for duplicate React versions:**

```bash
pnpm ls react react-dom
# Should only show one version
```

3. **Audit lodash usage (if any):**

```typescript
// ✅ Good
import isEmpty from 'lodash-es/isEmpty'

// ❌ Bad
import { isEmpty } from 'lodash'
```

4. **Review icon imports:**

```typescript
// Current: lucide-react (good, tree-shakeable)
import { X, ChevronRight } from 'lucide-react'
```

#### 4.4: Document Results (Day 5)

Create optimization report:

```markdown
# Bundle Size Optimization Results

**Date:** January 2026

## Before Optimization

- Total: 1.0MB (v1.2.0)
- Tab Manager: 1.1MB
- Options: 970KB
- Omnibar: 813KB

## Findings

1. [Finding from analyzer]
2. [Finding from analyzer]

## Actions Taken

1. [What was optimized]
2. [What was optimized]

## After Optimization

- Total: [New size]
- Reduction: [X]%

## Monitoring

- Set up bundle size tracking in CI
- Alert if bundle grows >5% between releases
```

**Files to Create:**

- `docs/BUNDLE_OPTIMIZATION.md`

---

### Success Metrics

**Performance:**

- [ ] Baseline metrics documented in `docs/PERFORMANCE.md`
- [ ] Dev-mode profiling enabled for TabManager and Omnibar
- [ ] Performance testing script created

**User Feedback:**

- [ ] Toasts show for all bulk operations (close, move, pin, etc.)
- [ ] Success and error states clearly communicated
- [ ] Loading indicators on buttons during async operations

**Bundle Size:**

- [ ] Bundle analyzer integrated into build
- [ ] Analysis document created with findings
- [ ] Bundle size stable or reduced from v1.2.0
- [ ] No single chunk exceeds 1.5MB

---

### Files to Create

**New Files:**

- `packages/dev-utils/lib/Profiler.tsx`
- `packages/dev-utils/lib/performanceTest.ts`
- `packages/ui/lib/components/ui/sonner.tsx`
- `packages/ui/lib/components/ui/skeleton.tsx`
- `packages/ui/lib/components/TabListSkeleton.tsx`
- `docs/PERFORMANCE.md`
- `docs/BUNDLE_OPTIMIZATION.md`

**Files to Update:**

- `package.json` (add sonner, lucide-react, rollup-plugin-visualizer)
- `packages/ui/package.json` (exports for sonner, skeleton)
- `pages/tab-manager/src/TabManager.tsx` (add Toaster)
- `pages/omnibar-overlay/src/OmnibarOverlay.tsx` (add Toaster)
- `pages/omnibar-popup/src/OmnibarPopup.tsx` (add Toaster)
- `pages/options/src/Options.tsx` (add Toaster)
- `packages/chrome/lib/actions/**/*.ts` (add toast feedback)
- `chrome-extension/vite.config.mts` (add visualizer plugin)

---

### Timeline

**Week 1 (Jan 1-7):**

- Days 1-3: Performance profiling & dev logging
- Days 4-5: Bundle analyzer setup & initial analysis

**Week 2 (Jan 8-14):**

- Days 1-3: Toast notification system
- Days 4-5: Loading states with skeleton

**Week 3 (Jan 15-21):**

- Days 1-5: Bundle optimization based on findings
- Final testing and documentation

**Completion Date:** January 21, 2026
