import { useMemo } from 'react'
import { useSelectionStore } from './SelectionStore'

/**
 * Hook that provides all selection mutation actions.
 * Returns a stable reference to avoid re-renders.
 */
export const useSelectionActions = () => {
  const setWindow = useSelectionStore((s) => s.setWindow)
  const setGroup = useSelectionStore((s) => s.setGroup)
  const setTab = useSelectionStore((s) => s.setTab)
  const setWindows = useSelectionStore((s) => s.setWindows)
  const setGroups = useSelectionStore((s) => s.setGroups)
  const setTabs = useSelectionStore((s) => s.setTabs)

  const addWindow = useSelectionStore((s) => s.addWindow)
  const addGroup = useSelectionStore((s) => s.addGroup)
  const addTab = useSelectionStore((s) => s.addTab)
  const addWindows = useSelectionStore((s) => s.addWindows)
  const addGroups = useSelectionStore((s) => s.addGroups)
  const addTabs = useSelectionStore((s) => s.addTabs)

  const removeWindow = useSelectionStore((s) => s.removeWindow)
  const removeGroup = useSelectionStore((s) => s.removeGroup)
  const removeTab = useSelectionStore((s) => s.removeTab)
  const removeWindows = useSelectionStore((s) => s.removeWindows)
  const removeGroups = useSelectionStore((s) => s.removeGroups)
  const removeTabs = useSelectionStore((s) => s.removeTabs)

  const clear = useSelectionStore((s) => s.clear)
  const enterMultiSelectMode = useSelectionStore((s) => s.enterMultiSelectMode)
  const exitMultiSelectMode = useSelectionStore((s) => s.exitMultiSelectMode)

  return useMemo(
    () => ({
      setWindow,
      setGroup,
      setTab,
      setWindows,
      setGroups,
      setTabs,
      addWindow,
      addGroup,
      addTab,
      addWindows,
      addGroups,
      addTabs,
      removeWindow,
      removeGroup,
      removeTab,
      removeWindows,
      removeGroups,
      removeTabs,
      clear,
      enterMultiSelectMode,
      exitMultiSelectMode,
    }),
    [
      setWindow,
      setGroup,
      setTab,
      setWindows,
      setGroups,
      setTabs,
      addWindow,
      addGroup,
      addTab,
      addWindows,
      addGroups,
      addTabs,
      removeWindow,
      removeGroup,
      removeTab,
      removeWindows,
      removeGroups,
      removeTabs,
      clear,
      enterMultiSelectMode,
      exitMultiSelectMode,
    ],
  )
}
