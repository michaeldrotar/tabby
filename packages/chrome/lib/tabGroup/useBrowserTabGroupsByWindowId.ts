import { useBrowserStore } from '../useBrowserStore.js'
import { useShallow } from 'zustand/shallow'
import type { BrowserTabGroup } from './BrowserTabGroup.js'
import type { BrowserWindowID } from '../window/BrowserWindowID.js'

/**
 * Provides all browser tab groups for a specific window.
 */
export const useBrowserTabGroupsByWindowId = (
  windowId?: BrowserWindowID,
): BrowserTabGroup[] => {
  return useBrowserStore(
    useShallow((state) => {
      if (!windowId) return []
      return Object.values(state.tabGroupById).filter(
        (group) => group.windowId === windowId,
      )
    }),
  )
}
