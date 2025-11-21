import { useBrowserStore } from '../useBrowserStore.js'
import type { BrowserTabGroup } from './BrowserTabGroup.js'
import type { BrowserTabGroupID } from './BrowserTabGroupID.js'

/**
 * Provides a browser tab group by its ID.
 *
 * @example
 * const browserTabGroup = useBrowserTabGroupById(props.id)
 * return <div>Group {browserTabGroup.title}</div>)
 */
export const useBrowserTabGroupById = (
  id: BrowserTabGroupID,
): BrowserTabGroup | undefined => {
  return useBrowserStore((state) => (id ? state.tabGroupById[id] : undefined))
}
