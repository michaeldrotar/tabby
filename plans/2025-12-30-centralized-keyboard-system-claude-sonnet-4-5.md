# Centralized Keyboard System

**Date:** December 30, 2025  
**Model:** Claude Sonnet 4.5  
**Status:** Not Started

## Executive Summary

This plan implements a centralized keyboard shortcut system using React hooks. It replaces the current fragmented keyboard handling (352+ lines across 10+ files with DOM mutation observers) with a unified, testable, and maintainable system.

The new system uses a **hooks-based architecture** where each shortcut is a custom hook that manages its own dependencies. Shortcuts reach into independent stores (selection, clipboard, UI state) rather than stores knowing about shortcuts. The `useShortcuts` hook takes a shortcuts array and returns an `onKeyDown` handler that the user applies to their root element. Nesting works via natural React event bubbling - if an inner handler matches, it stops propagation; if not, the event bubbles to parent handlers. This provides optimal Zustand re-rendering, type safety, and clear separation of concerns.

**Key Benefits:**

- **Eliminates anti-patterns:** Removes DOM mutation observers
- **Simple API:** `const handleKeyDown = useShortcuts(shortcuts)`
- **Optimal re-rendering:** Each shortcut only re-renders when its dependencies change
- **Type safe:** TypeScript validates dependencies naturally
- **Testable:** Each shortcut hook testable in isolation
- **Maintainable:** Clear dependencies, no circular imports
- **Nestable:** Natural React event bubbling for scoped shortcuts
- **Zero overhead:** No providers, no context, just a hook

**MVP Scope:** ESC key handling across contexts (context menu, omnibar, rename input, page close)

## Problem Statement

### Current Issues

**For Users:**

- Unpredictable shortcuts: ESC behaves differently based on hidden UI state
- No shortcut discovery: Can't see what shortcuts are available
- Conflicts: Multiple handlers compete for same key
- Platform inconsistency: Mac vs Windows handled ad-hoc

**For Developers:**

- 352 lines in `useKeyboardNavigation.ts` alone
- Keyboard handlers in 10+ files with competing preventDefault/stopPropagation
- Anti-pattern: DOM mutation observers (`querySelector('[data-radix-menu-content]')`)
- Untestable without full component rendering
- Adding shortcuts requires touching multiple files

### User Needs

- **Predictable shortcuts:** Same key performs most-specific action for current context
- **Visual shortcuts:** See keyboard shortcuts on toolbar buttons and menu items
- **Conditional actions:** UI hides/disables actions that can't be performed now
- **Professional feel:** Matches expectations from VSCode, Figma, etc.

## Solution Architecture

### Hooks-Based System

```
┌─────────────────────────────────────────────────┐
│  Layer 3: UI Components (Dumb)                  │
│  - Receive label, keys, enabled, onClick        │
│  - Parent provides label via i18n               │
│  - No logic, just rendering                     │
└─────────────────────────────────────────────────┘
                      ↑
┌─────────────────────────────────────────────────┐
│  Layer 2: Shortcut Hooks (Smart, Memoized)      │
│  - Each shortcut is a custom hook               │
│  - Subscribes to specific store slices          │
│  - Returns: id, keys, enabled, execute          │
│  - Memoized to prevent unnecessary re-renders   │
│  - useShortcuts hook handles keydown events     │
└─────────────────────────────────────────────────┘
                      ↑
┌─────────────────────────────────────────────────┐
│  Layer 1: Independent Stores (Zustand)          │
│  - Tab Manager Store: selection, viewMode       │
│  - Clipboard Store: cut/copy state              │
│  - UI Store: contextMenuOpen, omnibarOpen       │
│  - Omnibar Store: selectedIndex, query          │
└─────────────────────────────────────────────────┘

Data Flow: Stores → Shortcut Hooks → useShortcuts → UI Components
Shortcuts reach INTO stores, stores don't know about shortcuts
Pages compose shortcuts and call useShortcuts(shortcuts)
```

### First-Match-Wins Principle

Shortcuts are ordered from most to least specific. The keyboard manager iterates in order and executes the **first** matching shortcut:

```typescript
// ESC key shortcuts (most specific first):
1. Close Context Menu    when: contextMenuOpen
2. Close Omnibar         when: omnibarOpen
3. Cancel Rename         when: renameInputActive
4. Clear Selection       when: hasSelection (tab manager)
5. Close Tab Manager     when: always enabled (tab manager page)
```

When user presses ESC:

- If context menu is open → Match #1, execute, stop
- Else if omnibar is open → Match #2, execute, stop
- Else if rename active → Match #3, execute, stop
- Else if has selection → Match #4, execute, stop
- Else if on tab manager page → Match #5, execute, stop
- Else → No match, event bubbles to parent provider (if nested)

**Why this works:**

- Positive conditions only (no fragile negatives like `!contextMenuOpen && !omnibarOpen`)
- Adding new contexts doesn't break existing shortcuts
- Clear priority order by list position
- Predictable behavior

### Hooks-Based Pattern

Each shortcut is a custom hook that manages its own dependencies:

```tsx
// Shortcut hook example
export const useCloseSelectedTabsShortcut = () => {
  const selectedTabIds = useTabManagerStore((state) => state.selectedTabIds)
  const clearSelection = useTabManagerStore((state) => state.clearSelection)

  return useMemo(
    () => ({
      id: 'close-selected-tabs',
      keys: { default: 'Delete' },
      enabled: selectedTabIds.size > 0,
      execute: async () => {
        await chrome.tabs.remove(Array.from(selectedTabIds))
        clearSelection()
      },
    }),
    [selectedTabIds, clearSelection],
  )
}

// Dumb UI component
const CloseButton = () => {
  const { t } = useTranslation()
  const shortcut = useCloseSelectedTabsShortcut()

  return (
    <ActionButton
      label={t('close')}
      keys={shortcut.keys}
      enabled={shortcut.enabled}
      onClick={shortcut.execute}
      icon={<X />}
    />
  )
}
```

Benefits:

- **Optimal re-rendering:** Component only re-renders when selectedTabIds changes
- **Memoization:** Shortcut object only recreated when dependencies change
- **Type safe:** TypeScript validates store usage
- **Clear dependencies:** Easy to see what each shortcut needs
- **i18n support:** Labels come from translation files, not hook code
- **No circular dependencies:** Shortcuts reach into stores, not vice versa
- **Testable:** Can test hooks in isolation with React Testing Library

## Technical Design

### 1. Independent Stores (Feature-Based)

**Key Principle:** Each feature has its own store. Shortcuts reach INTO these stores, stores don't know about shortcuts.

**UI State Store** - `/packages/shared/lib/shortcuts/UIStore.ts`

```typescript
import { create } from 'zustand'

/**
 * UI state for shortcut-related features.
 * Tracks which overlays/modals are open.
 */
type UIState = {
  contextMenuOpen: boolean
  omnibarOpen: boolean
  renameInputActive: boolean

  setContextMenuOpen: (open: boolean) => void
  setOmnibarOpen: (open: boolean) => void
  setRenameInputActive: (active: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  contextMenuOpen: false,
  omnibarOpen: false,
  renameInputActive: false,

  setContextMenuOpen: (open) => set({ contextMenuOpen: open }),
  setOmnibarOpen: (open) => set({ omnibarOpen: open }),
  setRenameInputActive: (active) => set({ renameInputActive: active }),
}))
```

**Tab Manager Store** - Already exists in `/pages/tab-manager/src/store/`

```typescript
// Example of what already exists
type TabManagerState = {
  selectedTabIds: Set<number>
  selectedGroupIds: Set<number>
  selectedWindowIds: Set<number>
  viewMode: 'list' | 'tree'
  currentWindowId: number | null

  selectTab: (id: number) => void
  clearSelection: () => void
  // ... other methods
}

export const useTabManagerStore = create<TabManagerState>(...)
```

**Clipboard Store** - `/packages/shared/lib/clipboard/ClipboardStore.ts`

```typescript
import { create } from 'zustand'

/**
 * Clipboard state for cut/copy/paste operations.
 */
type ClipboardState = {
  type: 'cut' | 'copy' | null
  tabIds: Set<number>
  groupIds: Set<number>
  windowIds: Set<number>

  setClipboard: (data: Partial<ClipboardState>) => void
  clear: () => void
}

export const useClipboardStore = create<ClipboardState>((set) => ({
  type: null,
  tabIds: new Set(),
  groupIds: new Set(),
  windowIds: new Set(),

  setClipboard: (data) => set((state) => ({ ...state, ...data })),
  clear: () =>
    set({
      type: null,
      tabIds: new Set(),
      groupIds: new Set(),
      windowIds: new Set(),
    }),
}))
```

**Omnibar Store** - Already exists in `/pages/omnibar-*/src/store/`

```typescript
// Example of what already exists
type OmnibarState = {
  selectedIndex: number
  query: string
  results: SearchResult[]

  setSelectedIndex: (index: number) => void
  // ... other methods
}

export const useOmnibarStore = create<OmnibarState>(...)
```

### 2. Shortcut Hooks

Each shortcut is a custom hook that subscribes to the specific store slices it needs.

**Type Definition** - `/packages/shared/lib/shortcuts/types.ts`

```typescript
/**
 * Shortcut object returned by hooks.
 * Note: Labels should come from UI layer via i18n, not from hooks.
 */
export type Shortcut = {
  id: string // Dasherized ID matching hook name (e.g., 'close-tabs' for useCloseTabsShortcut)
  keys: {
    default: string | string[] // e.g., 'Escape', ['Delete', 'Backspace'], 'Ctrl+W'
    mac?: string | string[] // Optional Mac override, e.g., 'Cmd+W'
    windows?: string | string[]
    linux?: string | string[]
  }
  enabled: boolean // Is this shortcut currently applicable?
  execute: () => void | Promise<void> // Action to perform
}
```

**ESC Key Shortcuts** - `/packages/shared/lib/shortcuts/hooks/escShortcuts.ts`

```typescript
import { useMemo } from 'react'
import { useUIStore } from '../UIStore'
import { useTabManagerStore } from '@tab-manager/store'
import type { Shortcut } from '../types'

/**
 * Close context menu with ESC.
 * Only enabled when context menu is open.
 */
export const useCloseContextMenuShortcut = (): Shortcut => {
  const contextMenuOpen = useUIStore((state) => state.contextMenuOpen)
  const setContextMenuOpen = useUIStore((state) => state.setContextMenuOpen)

  return useMemo(
    () => ({
      id: 'close-context-menu',
      keys: { default: 'Escape' },
      enabled: contextMenuOpen,
      execute: () => {
        setContextMenuOpen(false)
        // Radix UI handles actual close via state change
      },
    }),
    [contextMenuOpen, setContextMenuOpen],
  )
}

/**
 * Close omnibar with ESC.
 */
export const useCloseOmnibarShortcut = (): Shortcut => {
  const omnibarOpen = useUIStore((state) => state.omnibarOpen)
  const setOmnibarOpen = useUIStore((state) => state.setOmnibarOpen)

  return useMemo(
    () => ({
      id: 'close-omnibar',
      keys: { default: 'Escape' },
      enabled: omnibarOpen,
      execute: () => setOmnibarOpen(false),
    }),
    [omnibarOpen, setOmnibarOpen],
  )
}

/**
 * Cancel rename with ESC.
 */
export const useCancelRenameShortcut = (): Shortcut => {
  const renameInputActive = useUIStore((state) => state.renameInputActive)
  const setRenameInputActive = useUIStore((state) => state.setRenameInputActive)

  return useMemo(
    () => ({
      id: 'cancel-rename',
      keys: { default: 'Escape' },
      enabled: renameInputActive,
      execute: () => {
        setRenameInputActive(false)
        // Component listens for state change
      },
    }),
    [renameInputActive, setRenameInputActive],
  )
}

/**
 * Clear selection with ESC.
 */
export const useClearSelectionShortcut = (): Shortcut => {
  const selectedTabIds = useTabManagerStore((state) => state.selectedTabIds)
  const selectedGroupIds = useTabManagerStore((state) => state.selectedGroupIds)
  const clearSelection = useTabManagerStore((state) => state.clearSelection)

  const hasSelection = selectedTabIds.size > 0 || selectedGroupIds.size > 0

  return useMemo(
    () => ({
      id: 'clear-selection',
      keys: { default: 'Escape' },
      enabled: hasSelection,
      execute: () => clearSelection(),
    }),
    [hasSelection, clearSelection],
  )
}

/**
 * Close tab manager page with ESC.
 */
export const useCloseTabManagerShortcut = (): Shortcut => {
  return useMemo(
    () => ({
      id: 'close-tab-manager',
      keys: { default: 'Escape' },
      enabled: true, // Always available on tab manager page
      execute: () => window.close(),
    }),
    [],
  )
}
```

**Delete/Close Shortcuts** - `/packages/shared/lib/shortcuts/hooks/closeShortcuts.ts`

```typescript
import { useMemo } from 'react'
import { useTabManagerStore } from '@tab-manager/store'
import type { Shortcut } from '../types'

/**
 * Close selected tabs with Delete/Backspace.
 */
export const useCloseSelectedTabsShortcut = (): Shortcut => {
  const selectedTabIds = useTabManagerStore((state) => state.selectedTabIds)
  const clearSelection = useTabManagerStore((state) => state.clearSelection)

  return useMemo(
    () => ({
      id: 'close-selected-tabs',
      keys: { default: ['Delete', 'Backspace'] }, // Support both keys
      enabled: selectedTabIds.size > 0,
      execute: async () => {
        await chrome.tabs.remove(Array.from(selectedTabIds))
        clearSelection()
      },
    }),
    [selectedTabIds, clearSelection],
  )
}

/**
 * Close selected groups (and their tabs) with Delete/Backspace.
 */
export const useCloseSelectedGroupsShortcut = (): Shortcut => {
  const selectedGroupIds = useTabManagerStore((state) => state.selectedGroupIds)
  const selectedTabIds = useTabManagerStore((state) => state.selectedTabIds)
  const clearSelection = useTabManagerStore((state) => state.clearSelection)

  // Only enabled if groups selected and NO tabs selected
  const enabled = selectedGroupIds.size > 0 && selectedTabIds.size === 0

  return useMemo(
    () => ({
      id: 'close-selected-groups',
      keys: { default: ['Delete', 'Backspace'] },
      enabled,
      execute: async () => {
        for (const groupId of selectedGroupIds) {
          const tabs = await chrome.tabs.query({ groupId })
          const tabIds = tabs
            .map((t) => t.id)
            .filter((id): id is number => id !== undefined)
          if (tabIds.length > 0) {
            await chrome.tabs.remove(tabIds)
          }
        }
        clearSelection()
      },
    }),
    [enabled, selectedGroupIds, clearSelection],
  )
}
```

**Clipboard Shortcuts** - `/packages/shared/lib/shortcuts/hooks/clipboardShortcuts.ts`

```typescript
import { useMemo } from 'react'
import { useTabManagerStore } from '@tab-manager/store'
import { useClipboardStore } from '@extension/shared/clipboard'
import type { Shortcut } from '../types'

/**
 * Copy selected tabs to clipboard.
 */
export const useCopyTabsShortcut = (): Shortcut => {
  const selectedTabIds = useTabManagerStore((state) => state.selectedTabIds)
  const setClipboard = useClipboardStore((state) => state.setClipboard)

  return useMemo(
    () => ({
      id: 'copy-tabs',
      keys: { default: 'Ctrl+C', mac: 'Cmd+C' },
      enabled: selectedTabIds.size > 0,
      execute: () => {
        setClipboard({
          type: 'copy',
          tabIds: new Set(selectedTabIds),
        })
      },
    }),
    [selectedTabIds, setClipboard],
  )
}

/**
 * Cut selected tabs to clipboard.
 */
export const useCutTabsShortcut = (): Shortcut => {
  const selectedTabIds = useTabManagerStore((state) => state.selectedTabIds)
  const setClipboard = useClipboardStore((state) => state.setClipboard)

  return useMemo(
    () => ({
      id: 'cut-tabs',
      keys: { default: 'Ctrl+X', mac: 'Cmd+X' },
      enabled: selectedTabIds.size > 0,
      execute: () => {
        setClipboard({
          type: 'cut',
          tabIds: new Set(selectedTabIds),
        })
      },
    }),
    [selectedTabIds, setClipboard],
  )
}

/**
 * Paste tabs from clipboard.
 */
export const usePasteTabsShortcut = (): Shortcut => {
  const currentWindowId = useTabManagerStore((state) => state.currentWindowId)
  const clipboardTabIds = useClipboardStore((state) => state.tabIds)
  const clipboardType = useClipboardStore((state) => state.type)
  const clearClipboard = useClipboardStore((state) => state.clear)

  const enabled = clipboardTabIds.size > 0 && currentWindowId !== null

  return useMemo(
    () => ({
      id: 'paste-tabs',
      keys: { default: 'Ctrl+V', mac: 'Cmd+V' },
      enabled,
      execute: async () => {
        // Move tabs to current window
        for (const tabId of clipboardTabIds) {
          await chrome.tabs.move(tabId, {
            windowId: currentWindowId!,
            index: -1, // Append to end
          })
        }

        // Clear clipboard if cut (move operation)
        if (clipboardType === 'cut') {
          clearClipboard()
        }
      },
    }),
    [enabled, clipboardTabIds, currentWindowId, clipboardType, clearClipboard],
  )
}
```

### 3. Keyboard Event Handler

**useShortcuts** - `/packages/shared/lib/shortcuts/useShortcuts.ts`

```typescript
import { useCallback, useEffect, useState } from 'react'
import { usePlatformInfo } from '@extension/chrome'
import type { Shortcut } from './types'

/**
 * Parse a React KeyboardEvent into a key string like 'Ctrl+K' or 'Escape'.
 */
const parseKey = (e: React.KeyboardEvent): string => {
  const parts: string[] = []

  // Order matters: Ctrl+Alt+Shift+Cmd+Key
  if (e.ctrlKey) parts.push('Ctrl')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey && e.key !== 'Shift') parts.push('Shift')
  if (e.metaKey) parts.push('Cmd')

  // Normalize key names
  let key = e.key
  if (key === ' ') key = 'Space'

  parts.push(key)
  return parts.join('+')
}

/**
 * Get the appropriate key binding for the current platform.
 */
const getKeyForPlatform = (
  shortcut: Shortcut,
  platform: 'mac' | 'windows' | 'linux',
): string | string[] => {
  return shortcut.keys[platform] ?? shortcut.keys.default
}

/**
 * Check if user is typing in an input field.
 */
const isTyping = (): boolean => {
  const activeElement = document.activeElement as HTMLElement
  return !!(
    activeElement &&
    (activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable)
  )
}

/**
 * Hook that handles keyboard shortcuts.
 * Returns an onKeyDown handler that matches shortcuts in priority order.
 * Supports nesting via natural React event bubbling - if this handler matches,
 * it stops propagation; if not, the event bubbles to parent handlers.
 * Pass shortcuts in priority order (most specific first).
 *
 * @param shortcuts - Array of shortcuts to handle (should be memoized)
 * @returns onKeyDown handler to attach to your root element
 *
 * @example
 * const TabManagerApp = () => {
 *   const shortcuts = useMemo(() => [
 *     useCloseContextMenuShortcut(),
 *     useCloseOmnibarShortcut(),
 *     // ...
 *   ], [...])
 *
 *   const handleKeyDown = useShortcuts(shortcuts)
 *
 *   return <div onKeyDown={handleKeyDown}>{content}</div>
 * }
 */
export const useShortcuts = (
  shortcuts: Shortcut[],
): ((e: React.KeyboardEvent) => void) => {
  // Platform detection (async, defaults to 'windows' until loaded)
  const [platform, setPlatform] = useState<'mac' | 'windows' | 'linux'>(
    'windows',
  )
  const platformInfo = usePlatformInfo()

  useEffect(() => {
    if (platformInfo.os === 'mac') setPlatform('mac')
    else if (platformInfo.os === 'win') setPlatform('windows')
    else setPlatform('linux')
  }, [platformInfo])

  return useCallback(
    (e: React.KeyboardEvent) => {
      // Don't intercept if user is typing
      if (isTyping()) return

      const pressedKey = parseKey(e)

      // Iterate shortcuts in order - FIRST MATCH WINS
      for (const shortcut of shortcuts) {
        // Skip if not enabled
        if (!shortcut.enabled) continue

        // Get platform-appropriate key binding
        const targetKeys = getKeyForPlatform(shortcut, platform)
        const keyList = Array.isArray(targetKeys) ? targetKeys : [targetKeys]

        // Does the pressed key match any of the target keys?
        const keyMatches = keyList.includes(pressedKey)

        if (!keyMatches) continue

        // MATCH FOUND! Execute and stop propagation
        if (import.meta.env.DEV) {
          console.log(`[Shortcuts] ${shortcut.id}`, {
            pressedKey,
            targetKey,
            shortcutId: shortcut.id,
          })
        }

        e.preventDefault()
        e.stopPropagation() // Stop bubbling to parent handlers

        // Execute action (may be async)
        Promise.resolve(shortcut.execute()).catch((error) => {
          console.error(`[Shortcuts] Error executing ${shortcut.id}:`, error)
        })

        return // Stop after first match
      }

      // No match found - let event bubble to parent handlers
    },
    [shortcuts, platform],
  )
}
```

**Tab Manager Example** - `/pages/tab-manager/src/App.tsx`

```typescript
import { useShortcuts } from '@extension/shared/keyboard'
import {
  useCloseContextMenuShortcut,
  useCloseOmnibarShortcut,
  useCancelRenameShortcut,
  useClearSelectionShortcut,
  useCloseTabManagerShortcut,
} from '@extension/shared/keyboard/shortcuts/escShortcuts'
import {
  useCloseSelectedTabsShortcut,
  useCloseSelectedGroupsShortcut,
} from '@extension/shared/keyboard/shortcuts/closeShortcuts'
import {
  useCopyTabsShortcut,
  useCutTabsShortcut,
  usePasteTabsShortcut,
} from '@extension/shared/keyboard/shortcuts/clipboardShortcuts'

/**
 * Tab Manager app component.
 * Composes all shortcuts and applies handler to root element.
 */
export const App = () => {
  // Global shortcuts (work across all pages with overlays)
  const closeContextMenu = useCloseContextMenuShortcut()
  const closeOmnibar = useCloseOmnibarShortcut()
  const cancelRename = useCancelRenameShortcut()

  // Tab Manager specific shortcuts
  const clearSelection = useClearSelectionShortcut()
  const closeTabManager = useCloseTabManagerShortcut()
  const closeTabs = useCloseSelectedTabsShortcut()
  const closeGroups = useCloseSelectedGroupsShortcut()
  const copyTabs = useCopyTabsShortcut()
  const cutTabs = useCutTabsShortcut()
  const pasteTabs = usePasteTabsShortcut()

  // Compose shortcuts in priority order (first-match-wins)
  const shortcuts = useMemo(
    () => [
      // Most specific first
      closeContextMenu,
      closeOmnibar,
      cancelRename,
      clearSelection,
      // Least specific
      closeTabManager,
      // Actions
      closeTabs,
      closeGroups,
      copyTabs,
      cutTabs,
      pasteTabs,
    ],
    [
      closeContextMenu,
      closeOmnibar,
      cancelRename,
      clearSelection,
      closeTabManager,
      closeTabs,
      closeGroups,
      copyTabs,
      cutTabs,
      pasteTabs,
    ],
  )

  const handleKeyDown = useShortcuts(shortcuts)

  return (
    <div onKeyDown={handleKeyDown} className="tab-manager-app">
      {/* App content */}
    </div>
  )
}
```

### 4. UI Components (Dumb)

**ActionButton** - `/packages/ui/lib/keyboard/ActionButton.tsx`

```typescript
import { Button } from '@extension/ui'
import { Kbd } from '@extension/ui'
import { useTranslation } from '@extension/i18n'
import type { Shortcut } from '@extension/shared/keyboard'

type ActionButtonProps = {
  shortcutId: string // Used for i18n lookup
  keys: Shortcut['keys']
  enabled: boolean
  onClick: () => void
  icon: React.ReactNode
  variant?: 'default' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  showShortcut?: boolean
}

/**
 * Dumb action button component.
 * Gets label from i18n based on shortcut ID.
 */
export const ActionButton = ({
  shortcutId,
  keys,
  enabled,
  onClick,
  icon,
  variant = 'ghost',
  size = 'md',
  showShortcut = true,
}: ActionButtonProps) => {
  const { t } = useTranslation()

  // Get label from i18n: shortcuts.close-tabs.label
  const label = t(`shortcuts.${shortcutId}.label`)

  // Get platform-specific key (simplified - could use platform hook)
  const shortcutKey = keys.mac ?? keys.default // TODO: Platform detection

  return (
    <Button
      variant={variant}
      size={size}
      onClick={onClick}
      disabled={!enabled}
      title={`${label}${showShortcut && shortcutKey ? ` (${shortcutKey})` : ''}`}
    >
      {icon}
      <span className="ml-2">{label}</span>
      {showShortcut && shortcutKey && (
        <Kbd className="ml-2">{shortcutKey}</Kbd>
      )}
    </Button>
  )
}

// Usage example:
// const shortcut = useCloseTabsShortcut()
// <ActionButton
//   shortcutId={shortcut.id}
//   keys={shortcut.keys}
//   enabled={shortcut.enabled}
//   onClick={shortcut.execute}
//   icon={<X />}
// />
```

**ActionMenuItem** - `/packages/ui/lib/keyboard/ActionMenuItem.tsx`

```typescript
import { DropdownMenuItem } from '@extension/ui'
import { Kbd } from '@extension/ui'
import { useTranslation } from '@extension/i18n'
import type { Shortcut } from '@extension/shared/keyboard'

type ActionMenuItemProps = {
  shortcutId: string // Used for i18n lookup
  keys: Shortcut['keys']
  enabled: boolean
  onSelect: () => void
  icon?: React.ReactNode
}

/**
 * Dumb menu item component.
 * Gets label from i18n based on shortcut ID.
 */
export const ActionMenuItem = ({
  shortcutId,
  keys,
  enabled,
  onSelect,
  icon,
}: ActionMenuItemProps) => {
  const { t } = useTranslation()

  // Get label from i18n: shortcuts.close-tabs.label
  const label = t(`shortcuts.${shortcutId}.label`)
  const shortcutKey = keys.mac ?? keys.default // TODO: Platform detection

  return (
    <DropdownMenuItem
      onSelect={onSelect}
      disabled={!enabled}
    >
      {icon && <span className="mr-2">{icon}</span>}
      <span className="flex-1">{label}</span>
      {shortcutKey && (
        <Kbd className="ml-4 text-muted-foreground">{shortcutKey}</Kbd>
      )}
    </DropdownMenuItem>
  )
}

// Usage example:
// const shortcut = useDuplicateTabsShortcut()
// <ActionMenuItem
//   shortcutId={shortcut.id}
//   keys={shortcut.keys}
//   enabled={shortcut.enabled}
//   onSelect={shortcut.execute}
//   icon={<Copy />}
// />
```

## Implementation Plan

### Phase 0: Setup & Foundation (2-3 hours)

Create package structure and base types:

- [ ] Create `/packages/shared/lib/shortcuts/` directory
- [ ] Create `types.ts` with `Shortcut` type definition (no label field)
- [ ] Create `UIStore.ts` with Zustand store
- [ ] Create `useShortcuts.ts` hook for keyboard event handling
- [ ] Create `hooks/` directory for shortcut hooks
- [ ] Export from `/packages/shared/index.mts`
- [ ] Add unit test file `useShortcuts.test.ts` (empty for now)

### Phase 1: MVP - ESC Key Handling (4-6 hours)

Implement minimal viable product with ESC key across contexts:

- [ ] Create `/packages/shared/lib/clipboard/ClipboardStore.ts`
- [ ] Implement ESC shortcut hooks in `hooks/escShortcuts.ts`:
  - [ ] `useCloseContextMenuShortcut` (id: 'close-context-menu')
  - [ ] `useCloseOmnibarShortcut` (id: 'close-omnibar')
  - [ ] `useCancelRenameShortcut` (id: 'cancel-rename')
  - [ ] `useClearSelectionShortcut` (id: 'clear-selection')
  - [ ] `useCloseTabManagerShortcut` (id: 'close-tab-manager')
  - [ ] All hooks return memoized shortcuts with useMemo
- [ ] Implement `useShortcuts` hook:
  - [ ] Accept shortcuts array parameter
  - [ ] Use `usePlatformInfo` for platform detection
  - [ ] Create handleKeyDown callback with useCallback
  - [ ] Parse React keyboard events to key strings
  - [ ] Iterate shortcuts in order
  - [ ] Execute first enabled match
  - [ ] stopPropagation on match (prevents parent handlers)
  - [ ] Dev logging for debugging
  - [ ] Return handler function
- [ ] Update `TabManager` to use new system:
  - [ ] Load all shortcut hooks in App component
  - [ ] Compose shortcuts array with useMemo
  - [ ] Call `useShortcuts(shortcuts)` to get handler
  - [ ] Apply handler to root div: `<div onKeyDown={handleKeyDown}>...</div>`
  - [ ] Remove old ESC key handler from `useKeyboardNavigation`
- [ ] Update context menu components:
  - [ ] Call `setContextMenuOpen(true/false)` on open/close
  - [ ] Remove old ESC key handlers
- [ ] Update omnibar components:
  - [ ] Call `setOmnibarOpen(true/false)` when showing/hiding
  - [ ] Remove old ESC key handlers
- [ ] Test ESC key behavior:
  - [ ] Context menu open → ESC closes menu only
  - [ ] Omnibar open → ESC closes omnibar only
  - [ ] Selection active → ESC clears selection only
  - [ ] Nothing open → ESC closes tab manager

### Phase 2: Testing Infrastructure (2-3 hours)

Build test infrastructure and validate system:

- [ ] Write unit tests for shortcut hooks:
  - [ ] Test hooks return correct `enabled` based on store state
  - [ ] Test `execute` functions call correct store methods
  - [ ] Test hooks are properly memoized (don't recreate unless deps change)
  - [ ] Test with React Testing Library's `renderHook`
- [ ] Write unit tests for platform-specific keys:
  - [ ] Mock `usePlatformInfo` return value
  - [ ] Verify correct key selected (mac vs default)
  - [ ] Test fallback to default when platform override missing
- [ ] Write unit tests for key parsing:
  - [ ] Simple keys: 'Escape', 'Delete', 'A'
  - [ ] Modifier combos: 'Ctrl+K', 'Cmd+Shift+P'
  - [ ] Edge cases: 'Space', modifiers alone
- [ ] Write integration tests for first-match-wins:
  - [ ] Multiple shortcuts with same key, different enabled states
  - [ ] Verify first enabled shortcut executes
  - [ ] Verify subsequent shortcuts don't execute
- [ ] Write tests for useShortcuts:
  - [ ] Test shortcuts parameter is used correctly
  - [ ] Test handler creation and return value
  - [ ] Test event handling and first-match-wins
  - [ ] Test platform detection
  - [ ] Test nested handlers (inner handler executes first)
  - [ ] Test bubbling when inner handler has no match
  - [ ] Test stopPropagation prevents parent execution
  - [ ] Test multiple keys per shortcut (array support)
- [ ] Manual testing across contexts:
  - [ ] Open context menu, verify ESC closes only menu
  - [ ] Then ESC again, verify closes tab manager
  - [ ] Open omnibar, verify ESC closes omnibar
  - [ ] Then ESC again, verify closes tab manager

### Phase 3: UI Components (3-4 hours)

Build dumb UI components that receive shortcut props:

- [ ] Create `/packages/ui/lib/shortcuts/` directory
- [ ] Implement `ActionButton` component:
  - [ ] Accept label, keys, enabled, onClick props
  - [ ] Label provided by parent (e.g., `label={t('close')}`)
  - [ ] Display shortcut key in tooltip/inline
  - [ ] Disable button when not enabled
  - [ ] Execute onClick callback
- [ ] Implement `ActionMenuItem` component:
  - [ ] Accept label, keys, enabled, onSelect props
  - [ ] Label provided by parent
  - [ ] Display shortcut key right-aligned
  - [ ] Disable when not enabled
  - [ ] Execute onSelect callback
- [ ] Add platform-aware key display helper
- [ ] Export components from `/packages/ui/index.mts`
- [ ] Create example usage in tab manager toolbar

### Phase 4: Delete/Close Shortcuts (2-3 hours)

Implement selection-aware deletion:

- [ ] Create delete shortcut hooks in `hooks/closeShortcuts.ts`:
  - [ ] `useCloseSelectedTabsShortcut` (id: 'close-selected-tabs') - when tabs selected
  - [ ] `useCloseSelectedGroupsShortcut` (id: 'close-selected-groups') - when groups selected (no tabs)
  - [ ] Both hooks properly memoized with useMemo
- [ ] Add close shortcuts to TabManagerShortcutsProvider
- [ ] Test deletion works:
  - [ ] Select tabs → Delete closes tabs
  - [ ] Select groups → Delete closes groups
  - [ ] Mixed selection → Delete closes appropriate items

### Phase 5: Clipboard Shortcuts (2-3 hours)

Implement cut/copy/paste:

- [ ] Create clipboard shortcut hooks in `hooks/clipboardShortcuts.ts`:
  - [ ] `useCopyTabsShortcut` (id: 'copy-tabs') - Cmd+C
  - [ ] `useCutTabsShortcut` (id: 'cut-tabs') - Cmd+X
  - [ ] `usePasteTabsShortcut` (id: 'paste-tabs') - Cmd+V
  - [ ] All hooks properly memoized with useMemo
- [ ] Add clipboard shortcuts to TabManagerShortcutsProvider
- [ ] Test clipboard operations:
  - [ ] Copy tabs → clipboard populated
  - [ ] Cut tabs → clipboard populated with 'cut' type
  - [ ] Paste tabs → tabs moved to current window
  - [ ] Paste after cut → clipboard cleared

### Phase 6: Integration & Cleanup (2-3 hours)

Replace old keyboard handling and clean up:

- [ ] Remove `useKeyboardNavigation` Delete/Backspace handlers
- [ ] Update omnibar pages:
  - [ ] `omnibar-overlay`: Create provider component, wrap app
  - [ ] `omnibar-popup`: Create provider component, wrap app
- [ ] Remove DOM mutation observers from codebase:
  - [ ] Grep for `MutationObserver`
  - [ ] Grep for `querySelector('[data-radix-menu-content]')`
  - [ ] Remove all instances
- [ ] Update any remaining ESC handlers:
  - [ ] Search for `e.key === 'Escape'`
  - [ ] Convert to use UI store instead
- [ ] Test full system integration:
  - [ ] All ESC contexts work correctly
  - [ ] All Delete/Backspace actions work
  - [ ] All clipboard shortcuts work
  - [ ] No regressions in existing functionality
  - [ ] Verify shortcuts don't re-render unnecessarily (check memoization)
  - [ ] Test nested handlers work correctly

### Phase 7: Documentation (1-2 hours)

Document the system for future developers:

- [ ] Create `/packages/shared/lib/shortcuts/README.md`:
  - [ ] Architecture overview (hooks + useShortcuts pattern)
  - [ ] How to create a new shortcut hook (memoization pattern)
  - [ ] How to use useShortcuts hook
  - [ ] How to use ActionButton/ActionMenuItem with labels
  - [ ] First-match-wins explanation
  - [ ] Platform-specific keys guide
  - [ ] Store independence principle
  - [ ] Memoization best practices
  - [ ] Nested handlers via natural React event bubbling
- [ ] Add JSDoc comments to all public APIs
- [ ] Add examples of common patterns
- [ ] Update main project docs to reference shortcut system

## Testing Strategy

### Unit Tests (Vitest)

**Test shortcut hooks with React Testing Library:**

```typescript
// useCloseSelectedTabsShortcut.test.ts
import { renderHook, act } from '@testing-library/react'
import { useCloseSelectedTabsShortcut } from './closeShortcuts'
import { useTabManagerStore } from '@tab-manager/store'

describe('useCloseSelectedTabsShortcut', () => {
  beforeEach(() => {
    useTabManagerStore.getState().clearSelection()
  })

  it('is disabled when no tabs selected', () => {
    const { result } = renderHook(() => useCloseSelectedTabsShortcut())

    expect(result.current.enabled).toBe(false)
    expect(result.current.id).toBe('close-selected-tabs')
  })

  it('is enabled when tabs selected', () => {
    act(() => {
      useTabManagerStore.getState().selectTab(123)
    })

    const { result } = renderHook(() => useCloseSelectedTabsShortcut())

    expect(result.current.enabled).toBe(true)
  })

  it('calls chrome.tabs.remove when executed', async () => {
    const mockRemove = vi.fn().mockResolvedValue(undefined)
    global.chrome = { tabs: { remove: mockRemove } } as any

    act(() => {
      useTabManagerStore.getState().selectTab(123)
    })

    const { result } = renderHook(() => useCloseSelectedTabsShortcut())

    await act(async () => {
      await result.current.execute()
    })

    expect(mockRemove).toHaveBeenCalledWith([123])
  })

  it('memoizes shortcut object', () => {
    const { result, rerender } = renderHook(() =>
      useCloseSelectedTabsShortcut(),
    )
    const firstResult = result.current

    // Rerender without changing dependencies
    rerender()

    // Should be same object reference (memoized)
    expect(result.current).toBe(firstResult)
  })

  it('re-renders when selection changes', () => {
    const { result, rerender } = renderHook(() =>
      useCloseSelectedTabsShortcut(),
    )
    const firstResult = result.current

    expect(result.current.enabled).toBe(false)

    act(() => {
      useTabManagerStore.getState().selectTab(123)
    })
    rerender()

    expect(result.current.enabled).toBe(true)
    // New object due to dependency change
    expect(result.current).not.toBe(firstResult)
  })
})
```

**Test useShortcuts integration:**

```typescript
// useShortcuts.test.ts
import { render, fireEvent, act } from '@testing-library/react'
import { useShortcuts } from './useShortcuts'
import { useUIStore } from './UIStore'
import { useCloseContextMenuShortcut } from './hooks/escShortcuts'
import { renderHook } from '@testing-library/react'

describe('useShortcuts', () => {
  it('executes first enabled shortcut', () => {
    // Create shortcuts
    const { result: closeMenuResult } = renderHook(() =>
      useCloseContextMenuShortcut(),
    )

    // Component that uses shortcuts
    const TestComponent = () => {
      const handleKeyDown = useShortcuts([closeMenuResult.current])
      return <div data-testid="content" onKeyDown={handleKeyDown}>Content</div>
    }

    const { container } = render(<TestComponent />)

    // Enable context menu
    act(() => useUIStore.getState().setContextMenuOpen(true))

    // Press ESC
    const div = container.querySelector('[data-testid="content"]') as HTMLElement
    fireEvent.keyDown(div, { key: 'Escape' })

    // Context menu should be closed
    expect(useUIStore.getState().contextMenuOpen).toBe(false)
  })

  it('skips disabled shortcuts', () => {
    const { result: closeMenuResult } = renderHook(() =>
      useCloseContextMenuShortcut(),
    )

    const TestComponent = () => {
      const handleKeyDown = useShortcuts([closeMenuResult.current])
      return <div onKeyDown={handleKeyDown}>Content</div>
    }

    const { container } = render(<TestComponent />)

    // Context menu is NOT open (shortcut disabled)
    act(() => useUIStore.getState().setContextMenuOpen(false))

    const div = container.firstChild as HTMLElement
    fireEvent.keyDown(div, { key: 'Escape' })

    // Nothing should happen (disabled shortcut skipped)
    expect(useUIStore.getState().contextMenuOpen).toBe(false)
  })

  it('handles multiple keys for same shortcut', () => {
    const mockRemove = vi.fn().mockResolvedValue(undefined)
    global.chrome = { tabs: { remove: mockRemove } } as any

    act(() => {
      useTabManagerStore.getState().selectTab(123)
    })

    const testShortcut = {
      id: 'test',
      keys: { default: ['Delete', 'Backspace'] },
      enabled: true,
      execute: async () => {
        await chrome.tabs.remove([123])
      },
    }

    const TestComponent = () => {
      const handleKeyDown = useShortcuts([testShortcut])
      return <div onKeyDown={handleKeyDown}>Content</div>
    }

    const { container } = render(<TestComponent />)
    const div = container.firstChild as HTMLElement

    // Press Delete
    fireEvent.keyDown(div, { key: 'Delete' })
    expect(mockRemove).toHaveBeenCalledWith([123])

    mockRemove.mockClear()

    // Press Backspace (should also work)
    fireEvent.keyDown(div, { key: 'Backspace' })
    expect(mockRemove).toHaveBeenCalledWith([123])
  })

  it('does not intercept when typing in input', () => {
    const mockExecute = vi.fn()
    const testShortcut = {
      id: 'test',
      keys: { default: 'Escape' },
      enabled: true,
      execute: mockExecute,
    }

    const TestComponent = () => {
      const handleKeyDown = useShortcuts([testShortcut])
      return (
        <div onKeyDown={handleKeyDown}>
          <input type="text" data-testid="input" />
        </div>
      )
    }

    const { container } = render(<TestComponent />)

    const input = container.querySelector('input')!
    input.focus()

    // Press ESC while typing in input
    fireEvent.keyDown(input, { key: 'Escape' })

    // Shortcut should NOT execute (user is typing)
    expect(mockExecute).not.toHaveBeenCalled()
  })

  it('supports nested handlers with proper bubbling', () => {
    const outerExecute = vi.fn()
    const innerExecute = vi.fn()

    const outerShortcut = {
      id: 'outer',
      keys: { default: 'Escape' },
      enabled: true,
      execute: outerExecute,
    }

    const innerShortcut = {
      id: 'inner',
      keys: { default: 'Escape' },
      enabled: true,
      execute: innerExecute,
    }

    const Outer = () => {
      const handleKeyDown = useShortcuts([outerShortcut])
      return (
        <div data-testid="outer" onKeyDown={handleKeyDown}>
          <Inner />
        </div>
      )
    }

    const Inner = () => {
      const handleKeyDown = useShortcuts([innerShortcut])
      return (
        <div data-testid="inner" onKeyDown={handleKeyDown}>
          Inner content
        </div>
      )
    }

    const { container } = render(<Outer />)
    const innerDiv = container.querySelector('[data-testid="inner"]')!

    // Press ESC in inner handler
    fireEvent.keyDown(innerDiv, { key: 'Escape', bubbles: true })

    // Only inner shortcut should execute (stopPropagation prevents bubbling)
    expect(innerExecute).toHaveBeenCalledTimes(1)
    expect(outerExecute).not.toHaveBeenCalled()
  })

  it('bubbles to parent when inner handler has no match', () => {
    const outerExecute = vi.fn()

    const outerShortcut = {
      id: 'outer',
      keys: { default: 'Escape' },
      enabled: true,
      execute: outerExecute,
    }

    const innerShortcut = {
      id: 'inner',
      keys: { default: 'Delete' }, // Different key
      enabled: true,
      execute: vi.fn(),
    }

    const Outer = () => {
      const handleKeyDown = useShortcuts([outerShortcut])
      return (
        <div data-testid="outer" onKeyDown={handleKeyDown}>
          <Inner />
        </div>
      )
    }

    const Inner = () => {
      const handleKeyDown = useShortcuts([innerShortcut])
      return (
        <div data-testid="inner" onKeyDown={handleKeyDown}>
          Inner content
        </div>
      )
    }

    const { container } = render(<Outer />)
    const innerDiv = container.querySelector('[data-testid="inner"]')!

    // Press ESC (inner handler has no ESC shortcut)
    fireEvent.keyDown(innerDiv, { key: 'Escape', bubbles: true })

    // Should bubble to outer handler and execute there
    expect(outerExecute).toHaveBeenCalledTimes(1)
  })
})
```

**Test platform detection:**

```typescript
// platform.test.ts
import { renderHook } from '@testing-library/react'
import { ShortcutManager } from './ShortcutManager'
import { usePlatformInfo } from '@extension/chrome'

vi.mock('@extension/chrome')

describe('Platform Detection', () => {
  it('uses mac keys on mac platform', () => {
    vi.mocked(usePlatformInfo).mockReturnValue({ os: 'mac' })

    const { result } = renderHook(() => useCopyTabsShortcut())

    // Should use Cmd+C, not Ctrl+C
    expect(result.current.keys.mac).toBe('Cmd+C')
  })

  it('defaults to windows keys until platform loads', () => {
    vi.mocked(usePlatformInfo).mockReturnValue({ os: null })

    // Should use 'default' keys initially
  })

  it('falls back to default when no platform override', () => {
    const shortcut = {
      id: 'test',
      keys: { default: 'Ctrl+W' }, // No mac override
      enabled: true,
      execute: () => {},
    }

    const key = getKeyForPlatform(shortcut, 'mac')

    expect(key).toBe('Ctrl+W')
  })
})
```

### Manual Testing Checklist

- [ ] **ESC key hierarchy:**
  - [ ] Context menu open → ESC closes menu only
  - [ ] Omnibar open → ESC closes omnibar only
  - [ ] Rename active → ESC cancels rename
  - [ ] Selection active → ESC clears selection
  - [ ] Nothing open → ESC closes tab manager
- [ ] **Delete/Backspace:** Both keys close selected tabs/groups
- [ ] **Clipboard:** Cmd+C, Cmd+X, Cmd+V work correctly
- [ ] **Platform-specific:** Test Cmd (Mac) vs Ctrl (Windows/Linux)
- [ ] **Input fields:** Typing in inputs doesn't trigger shortcuts
- [ ] **No regressions:** Existing shortcuts still work

## Future Enhancements (Post-MVP)

These are explicitly out of scope for MVP but documented for future reference:

### Additional Tab Manager Shortcuts

Once MVP is validated, add remaining shortcuts from tab manager selection plan:

- [ ] Selection shortcuts (Space, Shift+Up/Down, Cmd+Click, Cmd+A)
- [ ] Navigation shortcuts (Up/Down/Left/Right, Home/End)
- [ ] Tab actions (Pin, Mute, Reload, Duplicate, Copy URL)
- [ ] Group actions (Rename, Change Color, Ungroup)
- [ ] Window actions (Focus, Minimize, Maximize)

### Omnibar Shortcuts

Add omnibar-specific shortcuts:

- [ ] Navigation (Up/Down through results)
- [ ] Selection (Enter to activate)
- [ ] Filtering (Tab to cycle filters)
- [ ] Quick actions (Cmd+Shift+O for options, etc.)

### Options Page Shortcuts

Add shortcuts for settings/options page:

- [ ] Search settings (Cmd+F)
- [ ] Reset section (Cmd+R)
- [ ] Save changes (Cmd+S)
- [ ] Cancel changes (ESC)

## Accessibility Considerations

### ARIA Best Practices

Based on W3C ARIA Authoring Practices Guide:

**Keyboard Navigation:**

- [ ] Follow standard keyboard patterns (ESC closes, Tab moves focus)
- [ ] Don't trap focus (ESC always provides escape hatch)
- [ ] Support standard shortcuts (Cmd+A, Cmd+C, Cmd+V, etc.)

**Screen Readers:**

- [ ] Announce shortcut results (e.g., "Tab closed" when Delete pressed)
- [ ] Use `aria-keyshortcuts` attribute on interactive elements
- [ ] Provide text alternatives for icon-only buttons
- [ ] Don't rely solely on keyboard shortcuts (provide mouse access)

**Visual Indicators:**

- [ ] Show focus clearly (focus ring on focused element)
- [ ] Show shortcuts in tooltips (keyboard users can read)
- [ ] Use semantic HTML (button, not div with onClick)

### Implementation Todos

- [ ] Add `aria-keyshortcuts` to ActionButton:
  ```tsx
  <Button aria-keyshortcuts={shortcutKey} ...>
  ```
- [ ] Add ARIA live region for action announcements:
  ```tsx
  <div role="status" aria-live="polite" aria-atomic="true">
    {lastActionMessage}
  </div>
  ```
- [ ] Test with screen reader (VoiceOver on Mac, NVDA on Windows)

## Success Metrics

### Quantitative

- **Handler consolidation:** 10+ separate handlers → 1 `useShortcuts` hook per page
- **Anti-patterns removed:** 0 DOM mutation observers (currently 1+)
- **Test coverage:** 80%+ for shortcuts system
- **Runtime performance:** <1ms per keypress (simple array iteration)

### Qualitative

- **Developer experience:** Each shortcut is a focused hook with clear dependencies
- **Maintainability:** First-match-wins is easier to reason about than negative conditions
- **Testability:** Hooks testable in isolation without full component rendering
- **Discoverability:** Actions show their shortcuts automatically via ActionButton/MenuItem
- **Predictability:** Clear priority order, explicit enabled conditions

## Risks & Mitigations

### Risk: MVP Scope Creep

**Mitigation:** Strict MVP scope (ESC + Delete only). Document future shortcuts but don't implement during MVP.

### Risk: Platform Differences

**Mitigation:** Test on both Mac and Windows during MVP. Use platform detection from day 1.

### Risk: Breaking Existing Functionality

**Mitigation:** Manual testing checklist covers all existing shortcuts. Can iterate quickly to fix issues.

## Open Questions

### Should ActionButton hide or disable when not enabled?

**Options:** Hide completely, disable with opacity, show normally
**Recommendation:** Disable with opacity for MVP (stable layout), evaluate with real usage

### How to handle confirmation dialogs?

**Recommendation:** Let actions handle confirmation internally for MVP, extract pattern if needed later

## Definition of Done

MVP is complete when:

- [ ] All Phase 1 tasks completed (ESC shortcuts working)
- [ ] All Phase 2 unit tests passing (hooks + useShortcuts)
- [ ] Manual testing checklist verified
- [ ] No console errors or warnings
- [ ] No regressions in existing shortcuts
- [ ] Code reviewed and merged

## References

- VSCode keyboard handling: https://code.visualstudio.com/api/references/commands
- W3C ARIA keyboard patterns: https://www.w3.org/WAI/ARIA/apg/patterns/
- Chrome extension keyboard: https://developer.chrome.com/docs/extensions/reference/commands/
- Tab Manager Selection Plan: `/plans/2025-12-30-tab-manager-selection-actions-claude-sonnet-4-5.md`
- Architecture Refactor Plan: `/plans/2025-12-24-architecture-refactoring-claude-sonnet-4-5.md`
