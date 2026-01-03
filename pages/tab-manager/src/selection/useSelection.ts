import { useSelectionStore } from './SelectionStore'

/**
 * Hook for checking if specific items are selected.
 * Returns stable references for selection check functions.
 */
export const useSelection = () => {
  const isWindowSelected = useSelectionStore((s) => s.isWindowSelected)
  const isGroupSelected = useSelectionStore((s) => s.isGroupSelected)
  const isTabSelected = useSelectionStore((s) => s.isTabSelected)
  const isMultiSelectMode = useSelectionStore((s) => s.isMultiSelectMode)
  const getTotalCount = useSelectionStore((s) => s.getTotalCount)

  return {
    isWindowSelected,
    isGroupSelected,
    isTabSelected,
    isMultiSelectMode,
    getTotalCount,
  }
}
