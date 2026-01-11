import { useBrowserStore } from '@extension/chrome'
import { useEffect, useRef } from 'react'
import { useSelectionStore } from './SelectionStore'
import { clearAnchorIfRemoved } from './useSelectionInteraction'

/**
 * Hook that syncs selection state with browser store changes.
 * When items are removed from the browser (tabs closed, windows closed, groups deleted),
 * this hook removes them from the selection store.
 *
 * Should be called once at the app root level (e.g., TabManager component).
 */
export const useSelectionSync = (): void => {
  // Track previous IDs to detect removals
  const prevWindowIds = useRef<Set<number>>(new Set())
  const prevGroupIds = useRef<Set<number>>(new Set())
  const prevTabIds = useRef<Set<number>>(new Set())

  useEffect(() => {
    // Subscribe to browser store changes
    const unsubscribe = useBrowserStore.subscribe((state) => {
      const selectionState = useSelectionStore.getState()

      // Get current browser entity IDs
      const currentWindowIds = new Set(
        Object.keys(state.windowById).map(Number),
      )
      const currentGroupIds = new Set(
        Object.keys(state.tabGroupById).map(Number),
      )
      const currentTabIds = new Set(Object.keys(state.tabById).map(Number))

      // Find removed windows
      const removedWindowIds: number[] = []
      for (const id of prevWindowIds.current) {
        if (!currentWindowIds.has(id)) {
          removedWindowIds.push(id)
        }
      }

      // Find removed groups
      const removedGroupIds: number[] = []
      for (const id of prevGroupIds.current) {
        if (!currentGroupIds.has(id)) {
          removedGroupIds.push(id)
        }
      }

      // Find removed tabs
      const removedTabIds: number[] = []
      for (const id of prevTabIds.current) {
        if (!currentTabIds.has(id)) {
          removedTabIds.push(id)
        }
      }

      // Remove from selection store if they were selected
      if (removedWindowIds.length > 0) {
        const selectedRemoved = removedWindowIds.filter((id) =>
          selectionState.windowIds.has(id),
        )
        if (selectedRemoved.length > 0) {
          selectionState.removeWindows(selectedRemoved)
        }
        // Clear anchor if any removed window was the anchor
        for (const id of removedWindowIds) {
          clearAnchorIfRemoved({ type: 'window', id })
        }
      }

      if (removedGroupIds.length > 0) {
        const selectedRemoved = removedGroupIds.filter((id) =>
          selectionState.groupIds.has(id),
        )
        if (selectedRemoved.length > 0) {
          selectionState.removeGroups(selectedRemoved)
        }
        // Clear anchor if any removed group was the anchor
        for (const id of removedGroupIds) {
          clearAnchorIfRemoved({ type: 'group', id })
        }
      }

      if (removedTabIds.length > 0) {
        const selectedRemoved = removedTabIds.filter((id) =>
          selectionState.tabIds.has(id),
        )
        if (selectedRemoved.length > 0) {
          selectionState.removeTabs(selectedRemoved)
        }
        // Clear anchor if any removed tab was the anchor
        for (const id of removedTabIds) {
          clearAnchorIfRemoved({ type: 'tab', id })
        }
      }

      // Update previous IDs for next comparison
      prevWindowIds.current = currentWindowIds
      prevGroupIds.current = currentGroupIds
      prevTabIds.current = currentTabIds
    })

    // Initialize previous IDs on mount
    const initialState = useBrowserStore.getState()
    prevWindowIds.current = new Set(
      Object.keys(initialState.windowById).map(Number),
    )
    prevGroupIds.current = new Set(
      Object.keys(initialState.tabGroupById).map(Number),
    )
    prevTabIds.current = new Set(Object.keys(initialState.tabById).map(Number))

    return unsubscribe
  }, [])
}
