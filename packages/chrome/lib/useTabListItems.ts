import { useBrowserTabsByWindowId } from './tab/useBrowserTabsByWindowId.js'
import { useBrowserTabGroupsByWindowId } from './tabGroup/useBrowserTabGroupsByWindowId.js'
import { useMemo } from 'react'
import type { BrowserTab } from './tab/BrowserTab.js'
import type { BrowserTabGroup } from './tabGroup/BrowserTabGroup.js'
import type { BrowserWindowID } from './window/BrowserWindowID.js'

export type TabListItem =
  | { type: 'tab'; tab: BrowserTab }
  | { type: 'group'; group: BrowserTabGroup; tabs: BrowserTab[] }

export const useTabListItems = (
  windowId: BrowserWindowID | undefined,
): TabListItem[] => {
  const tabs = useBrowserTabsByWindowId(windowId)
  const groups = useBrowserTabGroupsByWindowId(windowId)

  return useMemo(() => {
    if (!windowId) return []

    const items: TabListItem[] = []
    const processedGroupIds = new Set<number>()

    for (const tab of tabs) {
      if (tab.groupId === -1 || tab.groupId === undefined) {
        items.push({ type: 'tab', tab })
      } else {
        if (processedGroupIds.has(tab.groupId)) {
          continue
        }

        const group = groups.find((g) => g.id === tab.groupId)
        if (group) {
          const groupTabs = tabs.filter((t) => t.groupId === group.id)
          items.push({ type: 'group', group, tabs: groupTabs })
          processedGroupIds.add(group.id)
        } else {
          // Fallback if group not found
          items.push({ type: 'tab', tab })
        }
      }
    }

    return items
  }, [tabs, groups, windowId])
}
