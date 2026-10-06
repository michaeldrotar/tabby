import { memo, useEffect } from 'react'
import { useSelectionStore } from './selection'

export const TabManagerDebugLogger = memo(() => {
  console.log('[TabManagerDebugLogger] rendered')

  const selectedWindowIds = useSelectionStore((s) => s.windowIds)
  const selectedGroupIds = useSelectionStore((s) => s.groupIds)
  const selectedTabIds = useSelectionStore((s) => s.tabIds)

  useEffect(() => {
    const windowIds = Array.from(selectedWindowIds)
    const groupIds = Array.from(selectedGroupIds)
    const tabIds = Array.from(selectedTabIds)
    console.log(
      '[Selection Debug]\n' +
        `  windows (${windowIds.length}): ${windowIds.join(', ')}\n` +
        `  groups (${groupIds.length}): ${groupIds.join(', ')}\n` +
        `  tabs (${tabIds.length}): ${tabIds.join(', ')}`,
    )
  }, [selectedWindowIds, selectedGroupIds, selectedTabIds])

  return null
})
