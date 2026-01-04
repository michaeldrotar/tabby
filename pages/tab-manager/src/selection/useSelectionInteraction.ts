import { useCallback, useRef } from 'react'
import { useSelectionStore } from './SelectionStore'
import type { SelectionMode } from './SelectionStore'

/**
 * Type of selectable item in the tab manager.
 */
export type SelectionItemType = 'window' | 'group' | 'tab'

/**
 * Pane context for split view.
 */
export type PaneContext = 'window' | 'tab' | 'tree'

/**
 * Reference to a selectable item.
 */
export type SelectionItemRef = {
  type: SelectionItemType
  id: number
}

/**
 * Snapshot of selection state for base selection tracking.
 */
type SelectionSnapshot = {
  windowIds: Set<number>
  groupIds: Set<number>
  tabIds: Set<number>
}

/**
 * Hook that manages selection interactions.
 * Handles anchor tracking, pane context, and translates user actions to store operations.
 *
 * Anchor and pane refs are NOT stored in Zustand because they are interaction/layout state,
 * not selection state. They don't need to trigger re-renders and are only used during
 * user interactions.
 *
 * Base selection tracking:
 * - baseSelectionRef stores the selection state before a shift-selection sequence begins
 * - When shift+click happens, the result is: baseSelection ∪ range(anchor, target)
 * - This allows shift+click to extend/contract the range while preserving earlier selections
 * - On Cmd+click or regular click, baseSelectionRef is updated to the new selection state
 */
export const useSelectionInteraction = () => {
  const anchorRef = useRef<SelectionItemRef | null>(null)
  const paneRef = useRef<PaneContext | null>(null)
  const baseSelectionRef = useRef<SelectionSnapshot | null>(null)

  /**
   * Handle mouse click on a selectable item.
   */
  const handleClick = useCallback(
    (
      item: SelectionItemRef,
      event: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean },
      paneContext: PaneContext,
    ) => {
      const state = useSelectionStore.getState()
      const isCmdOrCtrl = event.metaKey || event.ctrlKey

      // Cross-pane click clears selection
      if (paneRef.current !== null && paneRef.current !== paneContext) {
        state.clear()
        anchorRef.current = null
        baseSelectionRef.current = null
      }
      paneRef.current = paneContext

      if (event.shiftKey && anchorRef.current) {
        // Range selection: baseSelection ∪ range(anchor, target)
        // This allows extending/contracting the range while preserving earlier selections
        const rangeItems = getRangeFromDOM(anchorRef.current, item, paneContext)
        if (rangeItems.length > 0) {
          // Start from base selection (or empty if none)
          const base = baseSelectionRef.current ?? {
            windowIds: new Set<number>(),
            groupIds: new Set<number>(),
            tabIds: new Set<number>(),
          }

          // Compute new selection: base ∪ range
          const newWindowIds = new Set(base.windowIds)
          const newGroupIds = new Set(base.groupIds)
          const newTabIds = new Set(base.tabIds)

          for (const rangeItem of rangeItems) {
            if (rangeItem.type === 'window') {
              newWindowIds.add(rangeItem.id)
            } else if (rangeItem.type === 'group') {
              newGroupIds.add(rangeItem.id)
            } else {
              newTabIds.add(rangeItem.id)
            }
          }

          // Set the new selection (replaces previous shift-extended selection)
          // Must use setAll to set all three at once, otherwise each setter clears the others
          state.setAll(
            Array.from(newWindowIds),
            Array.from(newGroupIds),
            Array.from(newTabIds),
          )

          // Anchor stays on original anchor (does not move)
          // baseSelectionRef stays the same (we're still in the shift-selection sequence)
        } else {
          // No range found (different pane or no path), treat as regular click
          selectSingleItem(state, item)
          anchorRef.current = item
          // Capture new base selection after regular click
          baseSelectionRef.current = {
            windowIds: new Set(state.windowIds),
            groupIds: new Set(state.groupIds),
            tabIds: new Set(state.tabIds),
          }
        }
        state.exitMultiSelectMode()
      } else if (isCmdOrCtrl) {
        // Toggle individual item selection
        toggleItemSelection(state, item)
        anchorRef.current = item
        // Capture new base selection after Cmd+click
        // Need to re-read state after toggle
        const newState = useSelectionStore.getState()
        baseSelectionRef.current = {
          windowIds: new Set(newState.windowIds),
          groupIds: new Set(newState.groupIds),
          tabIds: new Set(newState.tabIds),
        }
        // Regular mouse click exits multi-select mode
        state.exitMultiSelectMode()
      } else {
        // Regular click - clear and select only this item
        selectSingleItem(state, item)
        anchorRef.current = item
        // Capture new base selection after regular click
        // Need to re-read state after selectSingleItem
        const newState = useSelectionStore.getState()
        baseSelectionRef.current = {
          windowIds: new Set(newState.windowIds),
          groupIds: new Set(newState.groupIds),
          tabIds: new Set(newState.tabIds),
        }
        // Regular click exits multi-select mode
        state.exitMultiSelectMode()
      }
    },
    [],
  )

  /**
   * Handle keyboard interaction on a selectable item.
   */
  const handleKeyboard = useCallback(
    (
      item: SelectionItemRef,
      key: string,
      paneContext: PaneContext,
      _event?: { shiftKey: boolean },
    ) => {
      const state = useSelectionStore.getState()

      if (key === ' ') {
        // Space bar handling
        // Check mode by accessing state directly (not via method)
        const isMultiSelect = state.mode === 'multi-select'

        if (!isMultiSelect) {
          // First Space press: enter multi-select mode, item already selected by arrow nav
          state.enterMultiSelectMode()
          // Ensure item is selected
          selectSingleItem(state, item)
          anchorRef.current = item
        } else {
          // In multi-select mode: toggle selection like Cmd+click
          toggleItemSelection(state, item)
          anchorRef.current = item
          // Stay in multi-select mode even with 0 items selected
        }
        paneRef.current = paneContext
      } else if (key === 'Escape') {
        // Clear selection, exit multi-select mode, and select the focused item
        // This returns to default mode where focus = selection
        state.clear()
        state.exitMultiSelectMode()
        selectSingleItem(state, item) // Select the currently focused item
        anchorRef.current = item
        // Keep pane context - user might continue navigating
      }
    },
    [],
  )

  /**
   * Handle arrow key navigation.
   * In default mode: select the navigated-to item (deselect others)
   * In multi-select mode: just move focus (don't change selection)
   */
  const handleArrowNavigation = useCallback(
    (item: SelectionItemRef, paneContext: PaneContext): boolean => {
      const state = useSelectionStore.getState()
      // Check mode by accessing state directly (not via method)
      const isMultiSelect = state.mode === 'multi-select'

      // Update pane context
      paneRef.current = paneContext

      if (!isMultiSelect) {
        // Default mode: arrow keys select single item
        selectSingleItem(state, item)
        anchorRef.current = item
        return true // Selection changed
      }

      // Multi-select mode: don't change selection, just return false
      return false // Selection unchanged, only focus moved
    },
    [],
  )

  /**
   * Get the current selection mode.
   */
  const getMode = useCallback((): SelectionMode => {
    return useSelectionStore.getState().mode
  }, [])

  /**
   * Get the current anchor item.
   */
  const getAnchor = useCallback((): SelectionItemRef | null => {
    return anchorRef.current
  }, [])

  /**
   * Get the current pane context.
   */
  const getPaneContext = useCallback((): PaneContext | null => {
    return paneRef.current
  }, [])

  return {
    handleClick,
    handleKeyboard,
    handleArrowNavigation,
    getMode,
    getAnchor,
    getPaneContext,
  }
}

/**
 * Select a single item, clearing all other selections.
 */
const selectSingleItem = (
  state: ReturnType<typeof useSelectionStore.getState>,
  item: SelectionItemRef,
) => {
  if (item.type === 'window') {
    state.setWindow(item.id)
  } else if (item.type === 'group') {
    state.setGroup(item.id)
  } else {
    state.setTab(item.id)
  }
}

/**
 * Toggle selection state of an item.
 */
const toggleItemSelection = (
  state: ReturnType<typeof useSelectionStore.getState>,
  item: SelectionItemRef,
) => {
  // Check selection by accessing Sets directly
  if (item.type === 'window') {
    if (state.windowIds.has(item.id)) {
      state.removeWindow(item.id)
    } else {
      state.addWindow(item.id)
    }
  } else if (item.type === 'group') {
    if (state.groupIds.has(item.id)) {
      state.removeGroup(item.id)
    } else {
      state.addGroup(item.id)
    }
  } else {
    if (state.tabIds.has(item.id)) {
      state.removeTab(item.id)
    } else {
      state.addTab(item.id)
    }
  }
}

/**
 * Get all visible selectable items in order from the DOM.
 * In the tab pane, this includes tabs and groups (groups are top-level, their tabs are nested).
 * In the window pane, this includes windows.
 */
const getVisibleItemsInOrder = (
  paneContext: PaneContext,
): SelectionItemRef[] => {
  const items: SelectionItemRef[] = []

  if (paneContext === 'window') {
    // Get all windows in visual order
    const windowElements = document.querySelectorAll(
      '[data-nav-type="window"][data-nav-id]',
    )
    windowElements.forEach((el) => {
      const id = el.getAttribute('data-nav-id')
      if (id) {
        items.push({ type: 'window', id: parseInt(id, 10) })
      }
    })
  } else if (paneContext === 'tab') {
    // Get tabs and groups in visual order by traversing the tab pane
    // Groups appear as [data-nav-type="group"], tabs as [data-nav-type="tab"]
    // Tabs inside collapsed groups are not visible
    const tabPane = document.querySelector('[data-tab-pane]')
    if (!tabPane) return items

    // Get all navigable items (groups and tabs) in DOM order
    const navigableElements = tabPane.querySelectorAll(
      '[data-nav-type="group"], [data-nav-type="tab"]',
    )

    navigableElements.forEach((el) => {
      const navType = el.getAttribute('data-nav-type')

      if (navType === 'group') {
        const groupId = el.getAttribute('data-group-id')
        if (groupId) {
          items.push({ type: 'group', id: parseInt(groupId, 10) })
        }
      } else if (navType === 'tab') {
        // Check if this tab is inside a collapsed group
        const parentGroup = el.closest('[data-nav-type="group"]')
        if (parentGroup) {
          // Tab is inside a group - only include if visible (not in collapsed group)
          // If the tab element is not visible (offsetParent is null), skip it
          if ((el as HTMLElement).offsetParent === null) {
            return // Skip tabs that are hidden (in collapsed groups)
          }
        }
        const tabId = el.getAttribute('data-tab-item')
        if (tabId) {
          items.push({ type: 'tab', id: parseInt(tabId, 10) })
        }
      }
    })
  }

  return items
}

/**
 * Get the range of items between anchor and target (inclusive).
 * Items are returned in the direction from anchor toward target.
 */
const getRangeFromDOM = (
  anchor: SelectionItemRef,
  target: SelectionItemRef,
  paneContext: PaneContext,
): SelectionItemRef[] => {
  const visibleItems = getVisibleItemsInOrder(paneContext)

  // Find anchor and target positions
  const anchorIndex = visibleItems.findIndex(
    (item) => item.type === anchor.type && item.id === anchor.id,
  )
  const targetIndex = visibleItems.findIndex(
    (item) => item.type === target.type && item.id === target.id,
  )

  if (anchorIndex === -1 || targetIndex === -1) {
    return [] // One or both items not found in visible items
  }

  // Get range in direction from anchor to target
  let range: SelectionItemRef[]
  if (anchorIndex <= targetIndex) {
    range = visibleItems.slice(anchorIndex, targetIndex + 1)
  } else {
    // Reverse so items are in direction from anchor toward target
    range = visibleItems.slice(targetIndex, anchorIndex + 1).reverse()
  }
  return range
}
