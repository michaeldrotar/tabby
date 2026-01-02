import { focusWindow } from '@extension/chrome/actions/windows/focusWindow'
import { useBrowserTabsByWindowId } from '@extension/chrome/tab/useBrowserTabsByWindowId'
import { useCurrentBrowserWindow } from '@extension/chrome/window/useCurrentBrowserWindow'
import { useSelectedWindowId } from '@extension/chrome/window/useSelectedWindowId'
import { useSetSelectedWindowId } from '@extension/chrome/window/useSetSelectedWindowId'
import { Profiler } from '@extension/dev-utils/Profiler'
import { TabManagerShell } from '@extension/ui/tab-manager/ui/TabManagerShell'
import { useCallback, useEffect, useState } from 'react'
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation'
import { SearchPopup } from './SearchPopup'
import { TabItemPane } from './TabItemPane'
import { TabManagerSidebarContainer } from './TabManagerSidebarContainer'
import type { BrowserWindow } from '@extension/chrome/window/BrowserWindow'

const TabManager = () => {
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
      await focusWindow(windowId)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentBrowserWindow?.id, activeTab?.id]) // Only run when these change (e.g. mount or window switch)

  useEffect(() => {
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Check after keyup - if context menu was open, Radix already closed it
        const contextMenu = document.querySelector('[data-radix-menu-content]')
        if (contextMenu) {
          return
        }

        if (isSearchOpen) {
          setIsSearchOpen(false)
        } else {
          window.close()
        }
      }
    }
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keyup', handleKeyUp)
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
    <Profiler id="TabManager">
      <SearchPopup isOpen={isSearchOpen} onClose={closeSearch} />
      <TabManagerShell
        sidebar={
          <Profiler id="TabManager.TabManagerSidebarContainer">
            <TabManagerSidebarContainer
              selectedWindowId={selectedWindowId || undefined}
              onSelectWindow={onSelectWindowCallback}
              onOpenSearch={openSearch}
              onOpenSettings={openSettings}
              onOpenTarget={openTarget}
            />
          </Profiler>
        }
      >
        {selectedWindowId && (
          <Profiler id="TabManager.TabItemPane">
            <TabItemPane browserWindowId={selectedWindowId} />
          </Profiler>
        )}
      </TabManagerShell>
    </Profiler>
  )
}

export default TabManager
