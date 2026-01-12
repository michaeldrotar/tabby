# BrowserTabListViewItem Component

**Created:** 2026-01-11  
**Status:** Planning  
**Component Location:** `packages/ui/lib/tab-manager/BrowserTabListViewItem.tsx`

## Overview

Create a dumb UI component that displays a browser tab in a list view. This component will be presentation-only, receiving all data via props without any Chrome API calls or business logic. It will eventually replace the current `TabItemRow` component.

## Component Design

### Name

`BrowserTabListViewItem`

### Rationale

- Distinguishes from data type (`BrowserTab`)
- Clear visual role ("ListView")
- Future-proof for `BrowserTabTreeViewItem` variant
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

**File:** `packages/ui/lib/tab-manager/BrowserTabListViewItem.tsx`

- [ ] Create component file
- [ ] Define TypeScript props interface
  - `tab: { id, title, url, favIconUrl }`
  - Optional display props (className, style)
- [ ] Implement basic layout: favicon + title + domain
- [ ] Export component and types from package

**Storybook:** `packages/storybook/stories/BrowserTabListViewItem/Default.stories.tsx`

- [ ] Create story file
- [ ] Add story with mock tab data (GitHub, Gmail, Docs examples)
- [ ] Verify component renders in Storybook

#### ✅ Task 1.2: Visual States - Interactive

**File:** `packages/ui/lib/tab-manager/BrowserTabListViewItem.tsx`

- [ ] Add hover state styling (background, shadow, or border)
- [ ] Add focus state with visible keyboard indicator
- [ ] Add selected/active state (distinct from hover)
- [ ] Add pressed state (brief feedback on click)
- [ ] Add `isSelected` prop
- [ ] Add `isFocused` prop (for keyboard nav)
- [ ] Add `isActive` prop (current browser tab)

**Storybook:** `packages/storybook/stories/BrowserTabListViewItem/InteractiveStates.stories.tsx`

- [ ] Story with controls to toggle hover/focus/selected/active
- [ ] Document each state's purpose
- [ ] Show all states in a single view for comparison

#### ✅ Task 1.3: Visual States - Content

**File:** `packages/ui/lib/tab-manager/BrowserTabListViewItem.tsx`

- [ ] Add loading skeleton variant
- [ ] Add favicon error/fallback (generic icon)
- [ ] Add pinned tab indicator (pin icon)
- [ ] Add `isLoading` prop
- [ ] Add `isPinned` prop
- [ ] Add `isDiscarded` prop (grayed out styling)

**Storybook:** `packages/storybook/stories/BrowserTabListViewItem/ContentStates.stories.tsx`

- [ ] Story showing loading skeleton
- [ ] Story showing missing favicon
- [ ] Story showing pinned tab
- [ ] Story showing discarded tab
- [ ] Variant selector to switch between states

---

### Phase 2: Status Indicators & Metadata

#### ✅ Task 2.1: Audio States

**File:** `packages/ui/lib/tab-manager/BrowserTabListViewItem.tsx`

- [ ] Add audio playing indicator (speaker icon, positioned right)
- [ ] Add muted indicator (muted icon)
- [ ] Add `isAudible` prop
- [ ] Add `isMuted` prop
- [ ] Import/use appropriate icons (Lucide or custom)
- [ ] Style for subtle but visible presence

**Storybook:** `packages/storybook/stories/BrowserTabListViewItem/AudioStates.stories.tsx`

- [ ] Story with toggle for audio playing
- [ ] Story with toggle for muted
- [ ] Story showing both states combined
- [ ] Multiple tabs showing different audio states

#### ✅ Task 2.2: Tab Metadata Display

**File:** `packages/ui/lib/tab-manager/BrowserTabListViewItem.tsx`

- [ ] Add domain display (extract from URL, show as secondary text)
- [ ] Add relative timestamp display ("2m ago", "3h ago")
- [ ] Add `lastAccessed` prop (timestamp)
- [ ] Implement time-ago formatting utility
- [ ] Style metadata as subtle, secondary information

**Storybook:** `packages/storybook/stories/BrowserTabListViewItem/MetadataVariations.stories.tsx`

- [ ] Story with various timestamp ranges (seconds, minutes, hours, days)
- [ ] Story with different domain lengths
- [ ] Story with/without metadata
- [ ] Test truncation of long domains

#### ✅ Task 2.3: Duplicate & Special States

**File:** `packages/ui/lib/tab-manager/BrowserTabListViewItem.tsx`

- [ ] Add duplicate indicator (badge or subtle visual cue)
- [ ] Add attention-seeking title detection (regex for "(N)" patterns)
- [ ] Add `isDuplicate` prop
- [ ] Add `hasAttentionTitle` prop (or detect from title)
- [ ] Style indicators to avoid clutter

**Storybook:** `packages/storybook/stories/BrowserTabListViewItem/SpecialIndicators.stories.tsx`

- [ ] Story showing duplicate tabs
- [ ] Story showing attention titles: "(3) Gmail", "• Slack"
- [ ] Story combining multiple indicators
- [ ] Document when to use each indicator

---

### Phase 3: Interactions & Animations

#### ✅ Task 3.1: Multi-Selection Support

**File:** `packages/ui/lib/tab-manager/BrowserTabListViewItem.tsx`

- [ ] Add checkbox or selection indicator (appears on hover or always visible)
- [ ] Add `isMultiSelected` prop
- [ ] Add `showCheckbox` prop (visibility control)
- [ ] Add `onSelectionChange` callback prop
- [ ] Style for clear multi-select state
- [ ] Add ARIA attributes: `aria-selected`, `role="option"`

**Storybook:** `packages/storybook/stories/BrowserTabListViewItem/MultiSelection.stories.tsx`

- [ ] Story with list of multiple items
- [ ] Interactive selection (click to toggle)
- [ ] Show selected count
- [ ] Demonstrate keyboard selection patterns

#### ✅ Task 3.2: Animation & Transitions

**File:** `packages/ui/lib/tab-manager/BrowserTabListViewItem.tsx`

- [ ] Add spring-based hover animation (scale or background)
- [ ] Add focus ring animation (smooth appearance)
- [ ] Add selection state transition
- [ ] Add enter/exit animations (for list virtualization)
- [ ] Implement `prefers-reduced-motion` check
- [ ] Use CSS transitions or Framer Motion
- [ ] Spring physics: cubic-bezier or spring config

**Storybook:** `packages/storybook/stories/BrowserTabListViewItem/Animations.stories.tsx`

- [ ] Story demonstrating all animations
- [ ] Toggle control for reduced motion
- [ ] Slow-motion mode for inspection
- [ ] Document animation timings and easing

#### ✅ Task 3.3: Action Affordances

**File:** `packages/ui/lib/tab-manager/BrowserTabListViewItem.tsx`

- [ ] Add close button (appears on hover)
- [ ] Add pin/unpin button (appears on hover)
- [ ] Add `onClose` callback prop
- [ ] Add `onPin` callback prop
- [ ] Position actions on right side of row
- [ ] Ensure 44x44px minimum touch target
- [ ] Add keyboard shortcuts (Delete for close, Ctrl+D for pin)
- [ ] Prevent action button clicks from selecting row

**Storybook:** `packages/storybook/stories/BrowserTabListViewItem/Actions.stories.tsx`

- [ ] Story with interactive close button
- [ ] Story with interactive pin/unpin
- [ ] Story showing action button hover states
- [ ] Log callback events to Actions panel
- [ ] Test touch target sizes

---

### Phase 4: Integration & Polish

#### ✅ Task 4.1: Accessibility Pass

**File:** `packages/ui/lib/tab-manager/BrowserTabListViewItem.tsx`

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

**Storybook:** `packages/storybook/stories/BrowserTabListViewItem/Accessibility.stories.tsx`

- [ ] Story with keyboard navigation instructions
- [ ] Story showing focus indicators
- [ ] Story with ARIA attributes visible
- [ ] Add accessibility testing notes
- [ ] Document keyboard shortcuts

#### ✅ Task 4.2: Theme & Customization

**File:** `packages/ui/lib/tab-manager/BrowserTabListViewItem.tsx`

- [ ] Ensure dark theme support
- [ ] Ensure light theme support
- [ ] Use CSS custom properties for colors
- [ ] Respect theme accent color
- [ ] Test all states in both themes
- [ ] Verify contrast ratios in both themes
- [ ] Add custom theme props if needed

**Storybook:** `packages/storybook/stories/BrowserTabListViewItem/Theming.stories.tsx`

- [ ] Story with theme switcher
- [ ] Show all states in dark theme
- [ ] Show all states in light theme
- [ ] Custom accent color examples
- [ ] Document theme variables used

#### ✅ Task 4.3: Performance & Optimization

**File:** `packages/ui/lib/tab-manager/BrowserTabListViewItem.tsx`

- [ ] Wrap component in `React.memo()` with custom comparator
- [ ] Memoize expensive calculations (time-ago formatting)
- [ ] Add React Profiler annotations
- [ ] Document virtualization considerations
- [ ] Test rendering performance with many items
- [ ] Optimize re-renders (avoid inline functions in props)

**Storybook:** `packages/storybook/stories/BrowserTabListViewItem/Performance.stories.tsx`

- [ ] Stress test story with 100+ items
- [ ] Story measuring render time
- [ ] Story demonstrating re-render optimization
- [ ] Add performance notes and recommendations

---

### Phase 5: Migration & Cleanup

#### ✅ Task 5.1: Create Migration Guide

**File:** `packages/ui/lib/tab-manager/MIGRATION.md`

- [ ] Document prop mapping: `TabItemRow` → `BrowserTabListViewItem`
- [ ] List breaking changes
- [ ] Provide code examples (before/after)
- [ ] Note any behavioral differences
- [ ] Create codemod script if beneficial

#### ✅ Task 5.2: Update Consumer Components

**Files:** Tab manager pages and components

- [ ] Find all usages of `TabItemRow`
- [ ] Replace with `BrowserTabListViewItem`
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
