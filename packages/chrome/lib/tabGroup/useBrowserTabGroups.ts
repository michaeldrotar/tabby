import { useBrowserStore } from '../useBrowserStore.js'
import { useShallow } from 'zustand/shallow'
import type { BrowserTabGroup } from './BrowserTabGroup.js'

/**
 * Provides all browser tab groups.
 *
 * @example
 * const browserTabGroups = useBrowserTabGroups();
 * return browserTabGroups.map(group => <div key={group.id}>Group {group.title}</div>)
 */
export const useBrowserTabGroups = (): BrowserTabGroup[] => {
  return useBrowserStore(
    useShallow((state) => Object.values(state.tabGroupById)),
  )
}
