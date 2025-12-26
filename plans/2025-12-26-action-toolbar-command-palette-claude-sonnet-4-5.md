# Tab Manager: Action Toolbar + Command Palette Implementation

**Date:** December 26, 2025  
**Model:** Claude Sonnet 4.5  
**Status:** Not Started

## Executive Summary

Replace the existing context menu system in the tab manager with a hybrid approach combining a minimal action toolbar and searchable command palette. This solves the fundamental constraint of limited sidebar width (280-360px) where context menus frequently overflow off-screen, clip sub-menus, and provide poor keyboard navigation.

The solution provides:

- **Action Toolbar:** Persistent 40px toolbar with 3-4 most common actions (pin, mute, close) plus command palette trigger
- **Command Palette:** Keyboard-first (Cmd/Ctrl+K) searchable interface for all actions, with context-aware filtering and multi-step workflows
- **Multi-Selection:** Full support for bulk operations across tabs, groups, and windows with visual feedback

Estimated effort: 26-37 hours over 6-7 days.

## Checklist

### Phase 1: Prerequisites & Setup

- [ ] Install `cmdk` package via pnpm
- [ ] Add shadcn components: command, dialog, button, badge, separator, popover, input
- [ ] Update `packages/ui/package.json` with new Radix UI dependencies
- [ ] Export new components from `packages/ui/index.ts`
- [ ] Verify all components build successfully

### Phase 2: State Management & Types

- [ ] Create `packages/shared/lib/selection/selectionState.ts` with selection types and Zustand store
- [ ] Create `packages/shared/lib/actions/actionTypes.ts` with all action IDs and interfaces
- [ ] Export new types from `packages/shared/index.ts`
- [ ] Add type tests to ensure type safety

### Phase 3: Core Components

- [ ] Create `packages/ui/lib/tab-manager/ActionToolbar.tsx` with icon buttons and tooltips
- [ ] Create `packages/ui/lib/tab-manager/TabCommandPalette.tsx` with Command component integration
- [ ] Create `packages/ui/lib/tab-manager/actions/actionRegistry.ts` with all action definitions
- [ ] Create `packages/ui/lib/tab-manager/actions/actionExecutor.ts` for Chrome API calls
- [ ] Export new components from `packages/ui/index.ts`

### Phase 4: Integration

- [ ] Update `pages/tab-manager/src/TabManager.tsx` to add toolbar and command palette
- [ ] Update `pages/tab-manager/src/TabItemPane.tsx` with selection UI (checkboxes/highlighting)
- [ ] Remove old context menu wrappers from tab items
- [ ] Add click handlers for multi-select (Cmd+click, Shift+click)
- [ ] Update `pages/tab-manager/src/hooks/useKeyboardNavigation.tsx` with new shortcuts

### Phase 5: Sub-Workflows

- [ ] Create `packages/ui/lib/tab-manager/ColorPicker.tsx` for group color selection
- [ ] Create `packages/ui/lib/tab-manager/WindowSelector.tsx` for move-to-window workflow
- [ ] Create `packages/ui/lib/tab-manager/RenameInput.tsx` for inline group renaming
- [ ] Integrate sub-workflows into command palette

### Phase 6: Polish & Accessibility

- [ ] Add keyboard shortcuts to all actions and document them
- [ ] Add ARIA labels and roles to all interactive elements
- [ ] Implement focus management (trap in dialog, restore on close)
- [ ] Test with screen reader (VoiceOver on macOS)
- [ ] Add animations (fade in/out for command palette)
- [ ] Add loading states for async actions
- [ ] Test at 280px and 360px+ widths
- [ ] Verify dark mode support

### Phase 7: Migration & Documentation

- [ ] Remove usage of `TabContextMenu`, `TabGroupContextMenu`, `WindowContextMenu` from TabManager
- [ ] Keep old context menu components in codebase temporarily (mark as deprecated)
- [ ] Update keyboard shortcuts documentation in README
- [ ] Update release notes in `product/releases/v[current]-*.md`
- [ ] Create GIF/video demo of new UX
- [ ] Test entire workflow end-to-end

## Problem Statement

Current context menus in the tab manager sidebar:

- Often overflow off-screen due to limited width (280-360px)
- Cannot properly display sub-menus (groups, windows, colors)
- Difficult to navigate with keyboard when clipped
- Don't support multi-selection elegantly
- Need scrolling which is problematic

## Solution Overview

**Hybrid Approach:**

1. **Minimal Action Toolbar** (35-40px height)
   - 3-4 most common actions as icon buttons
   - Selection count badge
   - "Actions" button to open command palette
2. **Command Palette** (Cmd/Ctrl+K)
   - Full-featured searchable action list
   - Context-aware (filters by selection type)
   - Handles all complex workflows (rename, color picker, multi-select)
   - Keyboard-first but mouse-friendly

## Phase 1: Prerequisites & Setup

### 1.1 Install shadcn Components

```bash
cd /Users/michael/projects/tabby
pnpm add cmdk
npx shadcn@latest add command dialog button badge separator popover input
```

**Components to add:**

- ✅ `Tooltip` (already exists)
- ✅ `ScrollArea` (already exists)
- ✅ `Kbd` (already exists)
- 🆕 `Command` (cmdk) - command palette core
- 🆕 `Dialog` - modal overlay
- 🆕 `Button` - toolbar buttons
- 🆕 `Badge` - selection indicator
- 🆕 `Separator` - visual dividers
- 🆕 `Popover` - optional for inline sub-actions
- 🆕 `Input` - for rename workflows

**Files to create in `packages/ui/lib/`:**

- `Button.tsx`
- `Badge.tsx`
- `Dialog.tsx`
- `Command.tsx`
- `Separator.tsx`
- `Popover.tsx`
- `Input.tsx`

### 1.2 Update Package Dependencies

Add to `packages/ui/package.json`:

```json
{
  "dependencies": {
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-popover": "^1.1.2",
    "@radix-ui/react-separator": "^1.1.0",
    "cmdk": "^1.0.0"
  }
}
```

### 1.3 Export New Components

Update `packages/ui/index.ts`:

```typescript
export * from './lib/Button'
export * from './lib/Badge'
export * from './lib/Dialog'
export * from './lib/Command'
export * from './lib/Separator'
export * from './lib/Popover'
export * from './lib/Input'
```

---

## Phase 2: State Management & Types

### 2.1 Selection State Enhancement

**File:** `packages/shared/lib/selection/selectionState.ts` (create if doesn't exist)

```typescript
export type SelectionType = 'tab' | 'group' | 'window'

export interface SelectionItem {
  type: SelectionType
  id: number
}

export interface SelectionState {
  items: SelectionItem[]
  add: (item: SelectionItem) => void
  remove: (id: number) => void
  toggle: (item: SelectionItem) => void
  clear: () => void
  has: (id: number) => boolean
  getByType: (type: SelectionType) => SelectionItem[]
  count: number
}
```

### 2.2 Action Types

**File:** `packages/shared/lib/actions/actionTypes.ts` (create)

```typescript
export type ActionId =
  // Tab actions
  | 'tab.pin'
  | 'tab.unpin'
  | 'tab.mute'
  | 'tab.unmute'
  | 'tab.reload'
  | 'tab.duplicate'
  | 'tab.close'
  | 'tab.closeOther'
  | 'tab.closeAfter'
  | 'tab.addToGroup'
  | 'tab.removeFromGroup'
  | 'tab.moveToWindow'
  | 'tab.copyUrl'
  | 'tab.copyTitle'
  // Group actions
  | 'group.expand'
  | 'group.collapse'
  | 'group.rename'
  | 'group.changeColor'
  | 'group.ungroup'
  | 'group.moveToWindow'
  | 'group.copyUrls'
  | 'group.close'
  // Window actions
  | 'window.focus'
  | 'window.muteAll'
  | 'window.unmuteAll'
  | 'window.reloadAll'
  | 'window.copyAllUrls'
  | 'window.close'

export interface Action {
  id: ActionId
  label: string
  description?: string
  icon: React.ComponentType
  shortcut?: string
  destructive?: boolean
  requiresInput?: boolean
  subActions?: Action[]
}

export interface ActionContext {
  selection: SelectionItem[]
  currentWindowId?: number
  availableGroups?: BrowserTabGroup[]
  availableWindows?: BrowserWindow[]
}
```

---

## Phase 3: Core Components

### 3.1 Action Toolbar

**File:** `packages/ui/lib/tab-manager/ActionToolbar.tsx` (create)

**Features:**

- Fixed height container (40px)
- Icon buttons with tooltips for primary actions:
  - Pin/Unpin
  - Mute/Unmute
  - Close
  - "Actions" (opens command palette)
- Badge showing selection count
- Keyboard shortcut hints in tooltips

**Props:**

```typescript
interface ActionToolbarProps {
  selection: SelectionItem[]
  onOpenCommandPalette: () => void
  onPin?: () => void
  onMute?: () => void
  onClose?: () => void
  // ... other quick actions
}
```

### 3.2 Command Palette

**File:** `packages/ui/lib/tab-manager/TabCommandPalette.tsx` (create)

**Features:**

- Dialog overlay with Command component
- Fuzzy search across all actions
- Context-aware filtering (only show valid actions for current selection)
- Grouped actions (Tab Actions / Group Actions / Window Actions)
- Recent actions history
- Keyboard navigation (arrow keys, Enter, Escape)
- Multi-step workflows:
  - Action → Sub-action (e.g., Move to → Window list)
  - Action → Input (e.g., Rename → Text field)
  - Action → Color picker (e.g., Change color → Color grid)

**Props:**

```typescript
interface TabCommandPaletteProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selection: SelectionItem[]
  context: ActionContext
  onExecuteAction: (actionId: ActionId, params?: any) => void
}
```

### 3.3 Action Registry

**File:** `packages/ui/lib/tab-manager/actions/actionRegistry.ts` (create)

**Purpose:**

- Centralized action definitions
- Validation logic (when action is available)
- Icon mappings
- Keyboard shortcuts

```typescript
export const ACTION_REGISTRY: Record<ActionId, Action> = {
  'tab.pin': {
    id: 'tab.pin',
    label: 'Pin Tab',
    icon: Pin,
    shortcut: 'P',
    isAvailable: (context) => {
      // Only for unpinned tabs
      return context.selection.every((s) => s.type === 'tab' && !s.data.pinned)
    },
  },
  // ... all other actions
}
```

### 3.4 Action Executor

**File:** `packages/ui/lib/tab-manager/actions/actionExecutor.ts` (create)

**Purpose:**

- Execute actions against Chrome API
- Handle bulk operations
- Error handling and feedback
- Undo/redo support (future)

```typescript
export class ActionExecutor {
  async execute(
    actionId: ActionId,
    selection: SelectionItem[],
    params?: any,
  ): Promise<void> {
    switch (actionId) {
      case 'tab.pin':
        await this.pinTabs(selection)
        break
      // ... other cases
    }
  }
}
```

---

## Phase 4: Integration

### 4.1 Update TabManager

**File:** `pages/tab-manager/src/TabManager.tsx`

**Changes:**

1. Add selection state management
2. Add command palette state (open/closed)
3. Add ActionToolbar to layout
4. Add TabCommandPalette overlay
5. Remove old context menu triggers

### 4.2 Update TabItemPane

**File:** `pages/tab-manager/src/TabItemPane.tsx`

**Changes:**

1. Add selection checkboxes/highlighting
2. Remove context menu wrappers
3. Add click handlers for multi-select (Cmd/Ctrl+click, Shift+click)
4. Visual feedback for selected items

### 4.3 Keyboard Navigation Enhancement

**File:** `pages/tab-manager/src/hooks/useKeyboardNavigation.tsx`

**Changes:**

1. Add Cmd/Ctrl+K to open command palette
2. Add shortcuts for quick actions (P for pin, M for mute, etc.)
3. Add multi-select keyboard shortcuts (Cmd+A, Shift+arrows)
4. Handle selection state updates

---

## Phase 5: Sub-Workflows

### 5.1 Color Picker Component

**File:** `packages/ui/lib/tab-manager/ColorPicker.tsx` (create)

**Purpose:**

- Inline color selection in command palette
- Grid of color swatches with labels
- Keyboard navigation (arrow keys)

### 5.2 Window Selector Component

**File:** `packages/ui/lib/tab-manager/WindowSelector.tsx` (create)

**Purpose:**

- List of available windows
- Show window metadata (tab count, incognito)
- Option to create new window

### 5.3 Rename Input Component

**File:** `packages/ui/lib/tab-manager/RenameInput.tsx` (create)

**Purpose:**

- Inline text input in command palette
- Pre-filled with current name
- Submit on Enter, cancel on Escape

---

## Phase 6: Polish & Accessibility

### 6.1 Keyboard Shortcuts

- Document all shortcuts
- Add shortcuts to tooltips and command palette
- Ensure no conflicts with browser shortcuts
- Test on Mac and Windows/Linux

### 6.2 Accessibility

- ARIA labels for all interactive elements
- Focus management (trap in dialog, restore on close)
- Screen reader announcements for actions
- High contrast mode support

### 6.3 Visual Polish

- Smooth animations (fade in/out, slide)
- Loading states for async actions
- Success/error feedback (toast notifications?)
- Dark mode support

### 6.4 Responsive Design

- Test at minimum width (280px)
- Test at maximum sidebar width (360px+)
- Ensure toolbar doesn't wrap
- Ensure command palette is centered and readable

---

## Phase 7: Migration & Deprecation

### 7.1 Feature Flag (Optional)

Add preference to switch between old and new UX:

```typescript
// packages/storage/lib/preferences.ts
export interface Preferences {
  // ... existing
  useCommandPalette: boolean // default: true
}
```

### 7.2 Deprecate Old Context Menus

1. Remove `TabContextMenu` component usage
2. Remove `TabGroupContextMenu` component usage
3. Remove `WindowContextMenu` component usage
4. Keep components in codebase for reference initially
5. Delete after 1-2 releases

### 7.3 Update Documentation

- README with keyboard shortcuts
- CHANGELOG entry
- User guide / release notes
- GIF/video demo

---

## Testing Checklist

### Unit Tests

- [ ] Selection state management
- [ ] Action availability logic
- [ ] Action executor methods
- [ ] Command palette filtering

### Integration Tests

- [ ] Multi-select with mouse (click, Cmd+click, Shift+click)
- [ ] Multi-select with keyboard (Shift+arrows)
- [ ] Execute action on single item
- [ ] Execute action on multiple items
- [ ] Execute action on mixed types (tabs + groups)
- [ ] Command palette search
- [ ] Command palette keyboard navigation

### E2E Tests

- [ ] Open command palette with Cmd+K
- [ ] Pin/unpin tabs via toolbar
- [ ] Mute/unmute tabs via toolbar
- [ ] Close tabs via toolbar
- [ ] Rename group via command palette
- [ ] Change group color via command palette
- [ ] Move tabs to different window
- [ ] Move tabs to new window
- [ ] Add tabs to group
- [ ] Remove tabs from group
- [ ] Handle errors gracefully

### Manual Testing

- [ ] Test at 280px width
- [ ] Test at 360px width
- [ ] Test with 1 tab selected
- [ ] Test with 50+ tabs selected
- [ ] Test with 1 window available
- [ ] Test with 20+ windows available
- [ ] Test all keyboard shortcuts
- [ ] Test screen reader compatibility
- [ ] Test on macOS
- [ ] Test on Windows
- [ ] Test on Linux
- [ ] Dark mode
- [ ] High contrast mode

---

## Success Metrics

1. **Performance:** Command palette opens in <100ms
2. **Usability:** Can execute any action within 3 keystrokes
3. **Accessibility:** 100% keyboard navigable
4. **Space:** Toolbar uses ≤40px vertical space
5. **Feedback:** User testing shows preference over context menus

---

## Future Enhancements

1. **Command History:** Recent actions at top of palette
2. **Custom Shortcuts:** User-configurable keyboard shortcuts
3. **Action Macros:** Chain multiple actions (e.g., "Pin and mute all")
4. **Undo/Redo:** Action history with Cmd+Z
5. **Action Suggestions:** ML-based action recommendations
6. **Bulk Edit Mode:** Toggle checkboxes for all items
7. **Saved Selections:** Save/load selection sets
8. **Export Actions:** Copy all URLs, export to JSON

---

## Timeline Estimate

| Phase               | Effort          | Duration     |
| ------------------- | --------------- | ------------ |
| 1. Prerequisites    | 2-3 hours       | Day 1        |
| 2. State Management | 2-3 hours       | Day 1        |
| 3. Core Components  | 8-10 hours      | Day 2-3      |
| 4. Integration      | 4-6 hours       | Day 3-4      |
| 5. Sub-Workflows    | 4-6 hours       | Day 4-5      |
| 6. Polish           | 4-6 hours       | Day 5-6      |
| 7. Migration        | 2-3 hours       | Day 6        |
| **Total**           | **26-37 hours** | **6-7 days** |

---

## Open Questions

1. Should we keep context menus as a fallback for right-click users?
2. Do we need undo/redo in v1 or can it wait?
3. Should command palette remember last position in list?
4. Do we want action previews (show what will happen before executing)?
5. Should we animate the selection changes (e.g., tabs moving to groups)?

---

## Dependencies

- React 19
- Radix UI primitives
- cmdk (command palette)
- lucide-react (icons)
- Tailwind CSS
- Chrome Extensions API

---

## Risk Assessment

| Risk                        | Likelihood | Impact | Mitigation                                           |
| --------------------------- | ---------- | ------ | ---------------------------------------------------- |
| Performance with 100+ tabs  | Medium     | High   | Virtualize lists, debounce search                    |
| Keyboard shortcut conflicts | High       | Medium | Document conflicts, make configurable                |
| User learning curve         | Medium     | Medium | Add onboarding tooltip, keep shortcuts visible       |
| Accessibility issues        | Low        | High   | Test with screen readers, follow ARIA best practices |
| Mobile sidebar width        | Low        | Medium | Test at minimum width, adjust layout if needed       |

---

## Notes

- This replaces context menus entirely, not just augments them
- Command palette should feel instant (like Spotlight/Raycast)
- Toolbar should never take focus away from content
- All actions must work with keyboard only
- Consider adding action confirmation for destructive operations (close many tabs)
