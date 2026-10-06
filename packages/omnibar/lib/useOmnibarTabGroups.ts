import { useBrowserTabs } from '@extension/chrome/tab/useBrowserTabs'
import { useBrowserTabGroups } from '@extension/chrome/tabGroup/useBrowserTabGroups'
import { useBrowserWindows } from '@extension/chrome/window/useBrowserWindows'
import { useMemo } from 'react'
import { activateTabGroup } from './activateTabGroup'
import type { OmnibarSearchResult } from '@extension/ui/omnibar/OmnibarSearchResult'

/**
 * Converts the reactive browser group store into one omnibar result per open group.
 */
export const useOmnibarTabGroups = (): OmnibarSearchResult[] => {
  const browserTabs = useBrowserTabs()
  const browserTabGroups = useBrowserTabGroups()
  const browserWindows = useBrowserWindows()

  return useMemo(() => {
    const tabCountByGroupId = new Map<number, number>()
    for (const tab of browserTabs) {
      if (tab.groupId === undefined || tab.groupId === -1) continue
      tabCountByGroupId.set(
        tab.groupId,
        (tabCountByGroupId.get(tab.groupId) ?? 0) + 1,
      )
    }

    const windowLabelById = new Map<number, string>()
    browserWindows.forEach((window, index) => {
      windowLabelById.set(
        window.id,
        window.focused ? 'Current window' : `Window ${index + 1}`,
      )
    })

    return browserTabGroups.map((group) => ({
      id: `tab-group:${group.id}`,
      type: 'tab-group',
      title: group.title?.trim() || 'Untitled group',
      windowId: group.windowId,
      groupColor: group.color,
      groupTabCount: tabCountByGroupId.get(group.id) ?? 0,
      groupWindowLabel:
        windowLabelById.get(group.windowId) ?? `Window ${group.windowId}`,
      groupCollapsed: group.collapsed,
      execute: async () => activateTabGroup(group.id),
    }))
  }, [browserTabs, browserTabGroups, browserWindows])
}
