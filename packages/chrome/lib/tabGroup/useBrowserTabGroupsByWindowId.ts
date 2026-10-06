import { useShallow } from 'zustand/shallow'
import { useBrowserStore } from '../useBrowserStore.js'
import type { BrowserWindowID } from '../window/BrowserWindowID.js'
import type { BrowserTabGroup } from './BrowserTabGroup.js'

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
