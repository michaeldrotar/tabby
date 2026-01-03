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
 * Hook that manages selection interactions.
 * Handles anchor tracking, pane context, and translates user actions to store operations.
 *
 * Anchor and pane refs are NOT stored in Zustand because they are interaction/layout state,
 * not selection state. They don't need to trigger re-renders and are only used during
 * user interactions.
 */
export const useSelectionInteraction = () => {
  const anchorRef = useRef<SelectionItemRef | null>(null)
  const paneRef = useRef<PaneContext | null>(null)

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
      }
      paneRef.current = paneContext

      if (event.shiftKey && anchorRef.current) {
        // Range selection - will be implemented in Phase 3
        // For now, treat as regular click
        selectSingleItem(state, item)
        anchorRef.current = item
      } else if (isCmdOrCtrl) {
        // Toggle individual item selection
        toggleItemSelection(state, item)
        anchorRef.current = item
        // Regular mouse click exits multi-select mode
        state.exitMultiSelectMode()
      } else {
        // Regular click - clear and select only this item
        selectSingleItem(state, item)
        anchorRef.current = item
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
        const isMultiSelect = state.isMultiSelectMode()

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
      const isMultiSelect = state.isMultiSelectMode()

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
  if (item.type === 'window') {
    if (state.isWindowSelected(item.id)) {
      state.removeWindow(item.id)
    } else {
      state.addWindow(item.id)
    }
  } else if (item.type === 'group') {
    if (state.isGroupSelected(item.id)) {
      state.removeGroup(item.id)
    } else {
      state.addGroup(item.id)
    }
  } else {
    if (state.isTabSelected(item.id)) {
      state.removeTab(item.id)
    } else {
      state.addTab(item.id)
    }
  }
}
