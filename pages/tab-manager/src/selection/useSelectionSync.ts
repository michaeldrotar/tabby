import { useBrowserStore } from '@extension/chrome/useBrowserStore'
import { useEffect, useRef } from 'react'
import { useSelectionStore } from './SelectionStore'
import {
  clearAnchorIfRemoved,
  remapTabSelectionInteraction,
} from './useSelectionInteraction'

type TabIdentity = { id: number; renderKey?: number }

export const findTabIdReplacements = (
  previousTabs: readonly TabIdentity[],
  currentTabs: readonly TabIdentity[],
): Map<number, number> => {
  const currentIds = new Set(currentTabs.map((tab) => tab.id))
  const currentIdsByRenderKey = new Map(
    currentTabs.map((tab) => [tab.renderKey ?? tab.id, tab.id]),
  )
  const replacements = new Map<number, number>()

  for (const previousTab of previousTabs) {
    if (currentIds.has(previousTab.id)) continue
    const replacementId = currentIdsByRenderKey.get(
      previousTab.renderKey ?? previousTab.id,
    )
    if (replacementId !== undefined && replacementId !== previousTab.id) {
      replacements.set(previousTab.id, replacementId)
    }
  }

  return replacements
}

export const remapSelectedTabIds = (
  selectedIds: ReadonlySet<number>,
  replacements: ReadonlyMap<number, number>,
): Set<number> => {
  const remappedIds = new Set(selectedIds)
  for (const [previousId, currentId] of replacements) {
    if (remappedIds.delete(previousId)) remappedIds.add(currentId)
  }
  return remappedIds
}

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
  const prevTabsById = useRef<Record<number, TabIdentity>>({})

  useEffect(() => {
    // Subscribe to browser store changes
    const unsubscribe = useBrowserStore.subscribe((state) => {
      let selectionState = useSelectionStore.getState()

      // Get current browser entity IDs
      const currentWindowIds = new Set(
        Object.keys(state.windowById).map(Number),
      )
      const currentGroupIds = new Set(
        Object.keys(state.tabGroupById).map(Number),
      )
      const currentTabIds = new Set(Object.keys(state.tabById).map(Number))
      const currentTabs = Object.values(state.tabById)
      const replacements = findTabIdReplacements(
        Object.values(prevTabsById.current),
        currentTabs,
      )

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

      const selectedReplacementExists = [...replacements.keys()].some((id) =>
        selectionState.tabIds.has(id),
      )
      if (replacements.size > 0) {
        remapTabSelectionInteraction(replacements)
      }
      if (selectedReplacementExists) {
        useSelectionStore.setState({
          tabIds: remapSelectedTabIds(selectionState.tabIds, replacements),
        })
        selectionState = useSelectionStore.getState()
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

      const removedUnreplacedTabIds = removedTabIds.filter(
        (id) => !replacements.has(id),
      )
      if (removedUnreplacedTabIds.length > 0) {
        const selectedRemoved = removedUnreplacedTabIds.filter((id) =>
          selectionState.tabIds.has(id),
        )
        if (selectedRemoved.length > 0) {
          selectionState.removeTabs(selectedRemoved)
        }
        // Clear anchor if any removed tab was the anchor
        for (const id of removedUnreplacedTabIds) {
          clearAnchorIfRemoved({ type: 'tab', id })
        }
      }

      // Update previous IDs for next comparison
      prevWindowIds.current = currentWindowIds
      prevGroupIds.current = currentGroupIds
      prevTabIds.current = currentTabIds
      prevTabsById.current = state.tabById
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
    prevTabsById.current = initialState.tabById

    return unsubscribe
  }, [])
}
