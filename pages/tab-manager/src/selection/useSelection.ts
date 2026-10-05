import { useMemo } from 'react'
import { useSelectionStore } from './SelectionStore'

/**
 * Hook for accessing selection state reactively.
 *
 * Returns the selection Sets and mode directly. Components should check
 * selection status using `windowIds.has(id)`, etc.
 *
 * Note: Query methods like `isWindowSelected(id)` are not used because
 * Zustand function references are stable - subscribing to them won't
 * trigger re-renders when selection changes. Subscribing to the Sets
 * directly ensures proper reactivity.
 */
export const useSelection = () => {
  const windowIds = useSelectionStore((s) => s.windowIds)
  const expandedWindowIds = useSelectionStore((s) => s.expandedWindowIds)
  const groupIds = useSelectionStore((s) => s.groupIds)
  const tabIds = useSelectionStore((s) => s.tabIds)
  const mode = useSelectionStore((s) => s.mode)

  return useMemo(
    () => ({
      windowIds,
      expandedWindowIds,
      groupIds,
      tabIds,
      mode,
      isMultiSelectMode: mode === 'multi-select',
      totalCount: windowIds.size + groupIds.size + tabIds.size,
    }),
    [windowIds, expandedWindowIds, groupIds, tabIds, mode],
  )
}
