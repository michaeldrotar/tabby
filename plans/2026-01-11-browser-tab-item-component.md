# BrowserTabItem Component

**Created:** 2026-01-11  
**Status:** Planning  
**Component Location:** `packages/ui/BrowserTabItem.tsx`

## Overview

Create a dumb UI component that displays a browser tab. This component will be presentation-only, receiving all data via props without any Chrome API calls or business logic. It will eventually replace the current `TabItemRow` component.

## Component Design

### Name

`BrowserTabItem`

### Rationale

- Distinguishes from data type (`BrowserTab`)
- Clear visual role
- Follows pattern: data type + visual structure = component name

### Information Display

1. **Favicon** - Prominent visual anchor for quick recognition
2. **Tab title** - Clear typography, truncated with ellipsis
3. **Domain/URL** - Subtle secondary text
4. **Last accessed timestamp** - Relative time ("2m ago", "3h ago")

### States to Support

#### Interactive States

- Default (resting)
- Hover
- Focus (keyboard navigation)
- Selected/Active (current browser tab)
- Multi-selected (for bulk operations)
- Pressed/Active (during click)

#### Content States

- Loading (skeleton)
- Favicon missing/error (fallback)
- Pinned
- Discarded/Unloaded (grayed out)

#### Status Indicators

- Audio playing (speaker icon)
- Muted (muted icon)
- Duplicate tabs (same URL)
- Title attention patterns (e.g., "(3) Gmail")

---

## Implementation Plan

### Phase 1: Foundation & Core Display

#### ✅ Task 1.1: Create Base Component Structure

**File:** `packages/ui/lib/BrowserTabItem.tsx`

- [x] Create component file
- [x] Define TypeScript props interface
  - `tab: { id, title, url, favIcon }`
  - Optional display props (className, style)
- [x] Implement basic layout: favicon + title + domain
- [x] Export component and types from package

**Storybook:** `packages/storybook/stories/BrowserTabItem.stories.tsx`

- [x] Create story file
- [x] Add story with mock tab data (GitHub, Gmail, Docs examples)
- [x] Verify component renders in Storybook

#### ✅ Task 1.2: Visual States - Interactive

**File:** `packages/ui/lib/BrowserTabItem.tsx`

- [x] Add hover state styling (background on hover)
- [x] Add focus state with visible keyboard indicator (blue ring)
- [x] Add selected state (subtle left border + light background)
- [x] Add active state (bold left border + accent background)
- [x] Add pressed state (scale-down + opacity feedback)
- [x] Add `isSelected` prop
- [x] Add `isActive` prop (current browser tab)
- [x] States use left border accent for visual distinction
- [x] Removed isFocused prop (will be added when needed)

**Storybook:** `packages/storybook/stories/BrowserTabItem.stories.tsx`

- [x] Consolidated all stories into single file
- [x] Playground story with interactive controls
- [x] TransitionCycle story - automatically cycles through states every 2s
- [x] HoverState story - demonstrates programmatic hover trigger
- [x] AllStates story - static comparison view
- [x] InteractiveList story - realistic multi-tab selection
- [x] ContentVariations story - edge cases (long titles, domains, missing content)

**Integration:** `pages/tab-manager/src/TabItemPane.tsx`

- [x] Updated to use BrowserTabItem with new props
- [x] Passes isActive and isSelected appropriately

#### ✅ Task 1.3: Visual States - Content

**File:** `packages/ui/lib/BrowserTabItem.tsx`

- [x] Add loading skeleton variant
- [x] Add favicon error/fallback (generic icon)
- [x] Add pinned tab indicator (pin icon)
- [x] Add `isLoading` prop
- [x] Add `isPinned` prop
- [x] Add `isDiscarded` prop (grayed out styling)

**Storybook:** `packages/storybook/stories/BrowserTabItem.stories.tsx`

- [x] Add content state stories (loading, pinned, discarded)
- [x] Story showing loading skeleton
- [x] Story showing missing favicon
- [x] Story showing pinned tab
- [x] Story showing discarded tab

---

### Phase 2: Status Indicators & Metadata

#### ✅ Task 2.1: Audio States

**File:** `packages/ui/lib/BrowserTabItem.tsx`

- [x] Add audio playing indicator (speaker icon, positioned right)
- [x] Add muted indicator (muted icon)
- [x] Add `audio` prop (`'muted' | 'on' | 'off'`)
- [x] Import/use appropriate icons (Lucide: Volume2, VolumeOff)
- [x] Style for subtle but visible presence

**Storybook:** `packages/storybook/stories/BrowserTabItem.stories.tsx`

- [x] Add audio state stories
- [x] Story with toggle for audio playing
- [x] Story with toggle for muted
- [x] Story showing both states combined

#### ✅ Task 2.2: Tab Metadata Display

**File:** `packages/ui/lib/BrowserTabItem.tsx`

- [x] Add domain display (extract from URL, show as secondary text)
- [x] Add relative timestamp display ("2m ago", "3h ago")
- [x] Add `lastAccessed` prop (timestamp)
- [x] Implement time-ago formatting utility (uses existing `formatTimeAgo`)
- [x] Style metadata as subtle, secondary information

**Storybook:** `packages/storybook/stories/BrowserTabItem.stories.tsx`

- [x] Add metadata display stories
- [x] Story with various timestamp ranges (seconds, minutes, hours, days)
- [x] Story with different domain lengths
- [x] Story with/without metadata

#### ✅ Task 2.3: Duplicate & Special States

**File:** `packages/ui/lib/BrowserTabItem.tsx`

- [x] Add duplicate indicator (Layers icon, positioned with other status indicators)
- [x] Add attention-seeking title detection (regex for "(N)" patterns and "•" prefix)
- [x] Add `duplicate` prop
- [x] Auto-detect attention titles from title prop
- [x] Style indicators to avoid clutter

**Storybook:** `packages/storybook/stories/BrowserTabItem.stories.tsx`

- [x] Add special indicator stories
- [x] Story showing duplicate tabs
- [x] Story showing attention titles: "(3) Gmail", "• Slack"
- [x] Story combining multiple indicators

---

### Phase 3: Interactions & Animations

Phase 3 simplified: Task 3.1 (checkbox/multi-select) deferred; selection remains row-based.

#### ✅ Task 3.1: Multi-Selection Support

**File:** `packages/ui/lib/BrowserTabItem.tsx`

- [ ] Add checkbox or selection indicator (appears on hover or always visible)
- [ ] Add `isMultiSelected` prop
- [ ] Add `showCheckbox` prop (visibility control)
- [ ] Add `onSelectionChange` callback prop
- [ ] Style for clear multi-select state
- [ ] Add ARIA attributes: `aria-selected`, `role="option"`

**Storybook:** `packages/storybook/stories/BrowserTabItem.stories.tsx`

- [ ] Add multi-selection stories
- [ ] Story with list of multiple items
- [ ] Interactive selection (click to toggle)
- [ ] Show selected count

#### ✅ Task 3.2: Animation & Transitions

**File:** `packages/ui/lib/BrowserTabItem.tsx`

- [x] Add spring-based hover animation (scale or background)
- [x] Add focus ring animation (smooth appearance)
- [x] Add selection state transition
- [x] Add enter/exit animations (for list virtualization)
- [x] Implement `prefers-reduced-motion` check
- [x] Use CSS transitions or Framer Motion
- [x] Spring physics: cubic-bezier or spring config

**Storybook:** `packages/storybook/stories/BrowserTabItem.stories.tsx`

- [x] Story demonstrating state transitions (TransitionCycle)
- [x] Add more animation stories as needed
- [x] Toggle control for reduced motion
- [ ] Document animation timings and easing

#### ✅ Task 3.3: Action Affordances

**File:** `packages/ui/lib/BrowserTabItem.tsx`

- [x] Add close button (appears on hover, always visible on active tab)
- [x] Add `onClose` callback prop
- [x] Position actions on right side of row
- [x] Ensure 44x44px minimum touch target
- [x] Add keyboard shortcuts (Delete for close)
- [x] Prevent action button clicks from selecting row

**Storybook:** `packages/storybook/stories/BrowserTabItem.stories.tsx`

- [x] Add action affordance stories
- [x] Story with interactive close button
- [x] Story showing action button hover states

---

### Phase 4: Integration & Polish

#### ✅ Task 4.1: Accessibility Pass

**File:** `packages/ui/lib/BrowserTabItem.tsx`

- [ ] Add full ARIA labeling
  - `role="option"` or `role="listitem"`
  - `aria-label` with descriptive text
  - `aria-selected` for selection state
  - `aria-current` for active tab
- [ ] Ensure keyboard navigation
  - Tab to focus
  - Arrow keys to navigate (handled by parent)
  - Enter/Space to select
  - Delete to close
- [ ] Add visible focus indicator (3px minimum)
- [ ] Test with screen reader (VoiceOver on macOS)
- [ ] Verify color contrast (WCAG AA)

**Storybook:** `packages/storybook/stories/BrowserTabItem.stories.tsx`

- [ ] Add accessibility stories
- [ ] Story with keyboard navigation instructions
- [ ] Story showing focus indicators
- [ ] Document keyboard shortcuts

#### ✅ Task 4.2: Theme & Customization

**File:** `packages/ui/lib/BrowserTabItem.tsx`

- [ ] Ensure dark theme support
- [ ] Ensure light theme support
- [ ] Use CSS custom properties for colors
- [ ] Respect theme accent color
- [ ] Test all states in both themes
- [ ] Verify contrast ratios in both themes
- [ ] Add custom theme props if needed

**Storybook:** `packages/storybook/stories/BrowserTabItem.stories.tsx`

- [ ] Add theming stories
- [ ] Story with theme switcher
- [ ] Show all states in dark theme
- [ ] Show all states in light theme

#### ✅ Task 4.3: Performance & Optimization

**File:** `packages/ui/lib/BrowserTabItem.tsx`

- [ ] Wrap component in `React.memo()` with custom comparator
- [ ] Memoize expensive calculations (time-ago formatting)
- [ ] Add React Profiler annotations
- [ ] Document virtualization considerations
- [ ] Test rendering performance with many items
- [ ] Optimize re-renders (avoid inline functions in props)

**Storybook:** `packages/storybook/stories/BrowserTabItem.stories.tsx`

- [ ] Add performance stories
- [ ] Stress test story with 100+ items
- [ ] Story measuring render time
- [ ] Story demonstrating re-render optimization

---

### Phase 5: Migration & Cleanup

#### ✅ Task 5.1: Create Migration Guide

**File:** `packages/ui/lib/MIGRATION.md`

- [ ] Document prop mapping: `TabItemRow` → `BrowserTabItem`
- [ ] List breaking changes
- [ ] Provide code examples (before/after)
- [ ] Note any behavioral differences
- [ ] Create codemod script if beneficial

#### ✅ Task 5.2: Update Consumer Components

**Files:** Tab manager pages and components

- [ ] Find all usages of `TabItemRow`
- [ ] Replace with `BrowserTabItem`
- [ ] Update props to match new interface
- [ ] Update tests
- [ ] Verify Chrome API integration works
- [ ] Test in actual browser extension

#### ✅ Task 5.3: Deprecate & Remove

**Files:** `TabItemRow.tsx`, related files

- [ ] Mark `TabItemRow` as deprecated (add JSDoc comment)
- [ ] Update imports to point to new component
- [ ] Remove `TabItemRow` after migration verified
- [ ] Archive old Storybook stories
- [ ] Update package exports

---

## Design Principles (Reference)

From `design-ux.instructions.md`:

- ✅ **Delightful:** Spring animations, smooth transitions, thoughtful interactions
- ✅ **Bold:** Strong visual hierarchy, clear states, confident use of color
- ✅ **Polished:** Pixel-perfect alignment, attention to detail
- ✅ **Accessible:** Keyboard navigation, ARIA labels, WCAG AA contrast
- ✅ **Dumb component:** Props-only, no API calls, no business logic
- ✅ **Composable:** Can be used in lists, grids, or other layouts
- ✅ **Themable:** Respects dark/light modes and accent colors

## Definition of Done (Per Task)

- ✅ Component code implemented and passes type checking
- ✅ Storybook story created and demonstrates feature
- ✅ All states/variations shown in Storybook
- ✅ TypeScript types exported and documented
- ✅ Design instructions followed (animations, accessibility)
- ✅ Works in isolation without Chrome APIs (uses mock data)
- ✅ Manually tested in Storybook

## Future Considerations

- **BrowserTabTreeViewItem**: Tree view variant showing windows + tabs hierarchically
- **Virtualization**: Component designed to work with `react-window` or `@tanstack/react-virtual`
- **Drag & Drop**: Future enhancement for reordering tabs
- **Grouping**: Visual grouping of related tabs

---

## Notes

- Component is completely decoupled from Chrome APIs
- All data comes through props (facade pattern)
- Parent components handle data fetching and state management
- Storybook stories use mock data that mimics Chrome API shape
