import { useKeyboardNavigation } from './hooks/useKeyboardNavigation'
import { SearchPopup } from './SearchPopup'
import { TabItemPane } from './TabItemPane'
import { TabManagerSidebarContainer } from './TabManagerSidebarContainer'
import {
  useCurrentBrowserWindow,
  useSelectedWindowId,
  useSetSelectedWindowId,
  useBrowserTabsByWindowId,
} from '@extension/chrome'
import { preferenceStorage } from '@extension/storage'
import { TabManagerShell } from '@extension/ui'
import { useCallback, useEffect, useState } from 'react'
import type { BrowserWindow } from '@extension/chrome'

const TabManager = () => {
  console.count('TabManager.render')

  const currentBrowserWindow = useCurrentBrowserWindow()
  const selectedWindowId = useSelectedWindowId()
  const setSelectedWindowId = useSetSelectedWindowId()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  const onSelectWindow = useCallback(
    (windowId: number) => {
      setSelectedWindowId(windowId)
    },
    [setSelectedWindowId],
  )

  const onActivateWindow = useCallback(
    async (windowId: number) => {
      await chrome.windows.update(windowId, { focused: true })
      setSelectedWindowId(windowId)

      // Notify other windows that this window has been activated via Tab Manager
      chrome.runtime
        .sendMessage({ type: 'TAB_MANAGER_WINDOW_ACTIVATED', windowId })
        .catch(() => {
          // Ignore errors if no one is listening
        })

      try {
        await chrome.sidePanel.open({ windowId })
      } catch (e) {
        console.debug('Failed to open side panel', e)
      }
    },
    [setSelectedWindowId],
  )

  useKeyboardNavigation(onSelectWindow, onActivateWindow)

  // For target action
  const tabs = useBrowserTabsByWindowId(currentBrowserWindow?.id)
  const activeTab = tabs.find((t) => t.active)

  // Listen for window activation messages from other windows
  useEffect(() => {
    const handleFocusChanged = (windowId: number) => {
      if (windowId === currentBrowserWindow?.id) {
        setSelectedWindowId(windowId)
        // Scroll to the active window and tab
        setTimeout(() => {
          const windowButton = document.querySelector(
            `[data-nav-type="window"][data-nav-id="${windowId}"]`,
          )
          const activeTabId = activeTab?.id
          const tabItem = activeTabId
            ? document.querySelector(
                `[data-nav-type="tab"][data-tab-item="${activeTabId}"]`,
              )
            : null

          if (windowButton) {
            windowButton.scrollIntoView({
              block: 'nearest',
              behavior: 'instant',
            })
          }
          if (tabItem) {
            tabItem.scrollIntoView({ block: 'nearest', behavior: 'instant' })
          }
        }, 50)
      }
    }
    chrome.windows.onFocusChanged.addListener(handleFocusChanged)
    return () =>
      chrome.windows.onFocusChanged.removeListener(handleFocusChanged)
  }, [currentBrowserWindow?.id, activeTab?.id, setSelectedWindowId])

  // Initial scroll to active window/tab
  useEffect(() => {
    if (!currentBrowserWindow?.id || !activeTab?.id) {
      return
    }

    // If we haven't selected a window yet (or it's different), select the current one
    if (selectedWindowId !== currentBrowserWindow.id) {
      setSelectedWindowId(currentBrowserWindow.id)
    }

    // Use a small timeout to ensure DOM is ready
    const timer = setTimeout(() => {
      const windowButton = document.querySelector(
        `[data-nav-type="window"][data-nav-id="${currentBrowserWindow.id}"]`,
      )
      const tabItem = document.querySelector(
        `[data-nav-type="tab"][data-tab-item="${activeTab.id}"]`,
      )

      if (windowButton) {
        windowButton.scrollIntoView({ block: 'center', behavior: 'instant' })
      }
      if (tabItem) {
        tabItem.scrollIntoView({ block: 'center', behavior: 'instant' })
      }
    }, 50)

    return () => clearTimeout(timer)
  }, [currentBrowserWindow?.id, activeTab?.id]) // Only run when these change (e.g. mount or window switch)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSearchOpen) {
          setIsSearchOpen(false)
        } else {
          window.close()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSearchOpen])

  const onSelectWindowCallback = useCallback(
    (window: BrowserWindow) => {
      setSelectedWindowId(window.id)
    },
    [setSelectedWindowId],
  )

  const openSearch = useCallback(() => {
    setIsSearchOpen(true)
  }, [])

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false)
  }, [])

  const openSettings = useCallback(() => {
    chrome.runtime.openOptionsPage()
  }, [])

  const toggleTheme = useCallback(() => {
    preferenceStorage.toggleTheme()
  }, [])

  const openTarget = useCallback(() => {
    const targetWindowId = currentBrowserWindow?.id || -1
    const targetTabId = activeTab?.id || -1

    if (targetWindowId !== -1) {
      setSelectedWindowId(targetWindowId)
    }

    // Small timeout to allow React to render the new window's tabs if we switched windows
    requestAnimationFrame(() => {
      const windowButton = document.querySelector(
        `[data-nav-type="window"][data-nav-id="${targetWindowId}"]`,
      )
      const tabItem = document.querySelector(
        `[data-nav-type="tab"][data-tab-item="${targetTabId}"]`,
      )

      if (windowButton) {
        windowButton.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
      if (tabItem) {
        tabItem.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    })
  }, [currentBrowserWindow, activeTab, setSelectedWindowId])

  return (
    <>
      <SearchPopup isOpen={isSearchOpen} onClose={closeSearch} />
      <TabManagerShell
        sidebar={
          <TabManagerSidebarContainer
            selectedWindowId={selectedWindowId || undefined}
            onSelectWindow={onSelectWindowCallback}
            onOpenSearch={openSearch}
            onOpenSettings={openSettings}
            onToggleTheme={toggleTheme}
            onOpenTarget={openTarget}
          />
        }
      >
        {selectedWindowId && <TabItemPane browserWindowId={selectedWindowId} />}
      </TabManagerShell>
    </>
  )
}

export default TabManager
