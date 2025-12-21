import { useCallback } from 'react'
import type { BrowserTabGroup } from '@extension/chrome'
import type { TabGroupColor } from '@extension/ui'

/**
 * Actions for managing tab groups via context menu.
 * All actions are async and handle errors gracefully.
 */
export const useTabGroupActions = (
  group: BrowserTabGroup,
  tabIds: number[],
) => {
  const groupId = group.id

  const toggleCollapse = useCallback(async () => {
    await chrome.tabGroups.update(groupId, { collapsed: !group.collapsed })
  }, [groupId, group.collapsed])

  const rename = useCallback(
    async (title: string) => {
      await chrome.tabGroups.update(groupId, { title })
    },
    [groupId],
  )

  const changeColor = useCallback(
    async (color: TabGroupColor) => {
      await chrome.tabGroups.update(groupId, { color })
    },
    [groupId],
  )

  const ungroup = useCallback(async () => {
    if (tabIds.length > 0) {
      // Chrome API requires at least one tab
      await chrome.tabs.ungroup(tabIds as [number, ...number[]])
    }
  }, [tabIds])

  const copyUrls = useCallback(async () => {
    const tabs = await chrome.tabs.query({ groupId })
    const urls = tabs
      .map((tab) => tab.url)
      .filter((url): url is string => !!url)
    await navigator.clipboard.writeText(urls.join('\n'))
  }, [groupId])

  const moveToNewWindow = useCallback(async () => {
    if (tabIds.length > 0) {
      // Move the first tab to a new window, then move the rest
      const [firstTabId, ...restTabIds] = tabIds
      const newWindow = await chrome.windows.create({ tabId: firstTabId })
      if (newWindow?.id && restTabIds.length > 0) {
        await chrome.tabs.move(restTabIds, {
          windowId: newWindow.id,
          index: -1,
        })
        // Re-create the group in the new window
        await chrome.tabs.group({
          tabIds: [firstTabId, ...restTabIds],
          createProperties: { windowId: newWindow.id },
        })
      }
    }
  }, [tabIds])

  const close = useCallback(async () => {
    if (tabIds.length > 0) {
      await chrome.tabs.remove(tabIds)
    }
  }, [tabIds])

  return {
    toggleCollapse,
    rename,
    changeColor,
    ungroup,
    copyUrls,
    moveToNewWindow,
    close,
  }
}
