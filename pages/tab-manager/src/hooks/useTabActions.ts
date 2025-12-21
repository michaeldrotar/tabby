import { useCallback } from 'react'
import type { BrowserTab } from '@extension/chrome'

/**
 * Actions for managing individual tabs via context menu.
 * All actions are async and handle errors gracefully.
 */
export const useTabActions = (tab: BrowserTab) => {
  const tabId = tab.id

  const pin = useCallback(async () => {
    await chrome.tabs.update(tabId, { pinned: true })
  }, [tabId])

  const unpin = useCallback(async () => {
    await chrome.tabs.update(tabId, { pinned: false })
  }, [tabId])

  const mute = useCallback(async () => {
    await chrome.tabs.update(tabId, { muted: true })
  }, [tabId])

  const unmute = useCallback(async () => {
    await chrome.tabs.update(tabId, { muted: false })
  }, [tabId])

  const duplicate = useCallback(async () => {
    await chrome.tabs.duplicate(tabId)
  }, [tabId])

  const reload = useCallback(async () => {
    await chrome.tabs.reload(tabId)
  }, [tabId])

  const close = useCallback(async () => {
    await chrome.tabs.remove(tabId)
  }, [tabId])

  const closeOther = useCallback(async () => {
    const allTabs = await chrome.tabs.query({ windowId: tab.windowId })
    const otherTabIds = allTabs
      .filter((t) => t.id !== tabId && !t.pinned)
      .map((t) => t.id)
      .filter((id): id is number => id !== undefined)
    if (otherTabIds.length > 0) {
      await chrome.tabs.remove(otherTabIds)
    }
  }, [tabId, tab.windowId])

  const closeAfter = useCallback(async () => {
    const allTabs = await chrome.tabs.query({ windowId: tab.windowId })
    const currentIndex = allTabs.findIndex((t) => t.id === tabId)
    const afterTabIds = allTabs
      .slice(currentIndex + 1)
      .filter((t) => !t.pinned)
      .map((t) => t.id)
      .filter((id): id is number => id !== undefined)
    if (afterTabIds.length > 0) {
      await chrome.tabs.remove(afterTabIds)
    }
  }, [tabId, tab.windowId])

  const copyUrl = useCallback(async () => {
    if (tab.url) {
      await navigator.clipboard.writeText(tab.url)
    }
  }, [tab.url])

  const copyTitle = useCallback(async () => {
    if (tab.title) {
      await navigator.clipboard.writeText(tab.title)
    }
  }, [tab.title])

  const copyTitleAndUrl = useCallback(async () => {
    const text = `${tab.title ?? ''}\n${tab.url ?? ''}`
    await navigator.clipboard.writeText(text.trim())
  }, [tab.title, tab.url])

  const addToGroup = useCallback(
    async (groupId: number) => {
      await chrome.tabs.group({ tabIds: tabId, groupId })
    },
    [tabId],
  )

  const addToNewGroup = useCallback(async () => {
    await chrome.tabs.group({ tabIds: tabId })
  }, [tabId])

  const removeFromGroup = useCallback(async () => {
    await chrome.tabs.ungroup(tabId)
  }, [tabId])

  const moveToWindow = useCallback(
    async (windowId: number) => {
      await chrome.tabs.move(tabId, { windowId, index: -1 })
    },
    [tabId],
  )

  const moveToNewWindow = useCallback(async () => {
    await chrome.windows.create({ tabId })
  }, [tabId])

  return {
    pin,
    unpin,
    mute,
    unmute,
    duplicate,
    reload,
    close,
    closeOther,
    closeAfter,
    copyUrl,
    copyTitle,
    copyTitleAndUrl,
    addToGroup,
    addToNewGroup,
    removeFromGroup,
    moveToWindow,
    moveToNewWindow,
  }
}
