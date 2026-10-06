import { focusWindow } from '@extension/chrome/actions/windows/focusWindow'
import { useBrowserTabsByWindowId } from '@extension/chrome/tab/useBrowserTabsByWindowId'
import { useBrowserStoreState } from '@extension/chrome/useBrowserStoreState'
import { useBrowserWindows } from '@extension/chrome/window/useBrowserWindows'
import { useCurrentBrowserWindow } from '@extension/chrome/window/useCurrentBrowserWindow'
import { useSelectedWindowId } from '@extension/chrome/window/useSelectedWindowId'
import { useSetSelectedWindowId } from '@extension/chrome/window/useSetSelectedWindowId'
import { getWindowSwitchSlotEntries } from '@extension/chrome/window/windowSwitchSlots'
import { Profiler } from '@extension/shared/Profiler'
import { Skeleton } from '@extension/ui/components/Skeleton'
import { TabListSkeleton } from '@extension/ui/components/TabListSkeleton'
import { TabManagerShell } from '@extension/ui/tab-manager/ui/TabManagerShell'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ActionBar } from './action-bar'
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation'
import {
  useSelectionInteraction,
  useSelectionStore,
  useSelectionSync,
} from './selection'
import { ModeTransitionEffect } from './selection/ModeTransitionEffect'
import { TabItemPane } from './TabItemPane'
import { TabManagerDebugLogger } from './TabManagerDebugLogger'
import { TabManagerSidebarContainer } from './TabManagerSidebarContainer'
import type { BrowserWindow } from '@extension/chrome/window/BrowserWindow'

/** Skeleton for the sidebar while loading */
const SidebarSkeleton = () => (
  <div className="flex h-full flex-col gap-2 p-2">
    {/* Window rail skeletons */}
    {Array.from({ length: 3 }).map((_, i) => (
      <Skeleton key={i} className="h-10 w-10 rounded-lg" />
    ))}
  </div>
)

const TabManager = () => {
  const storeState = useBrowserStoreState()
  const currentBrowserWindow = useCurrentBrowserWindow()
  const browserWindows = useBrowserWindows()
  const selectedWindowId = useSelectedWindowId()
  const setSelectedWindowId = useSetSelectedWindowId()
  const [renamingGroupId, setRenamingGroupId] = useState<number | undefined>()
  const [openMenuRequest, setOpenMenuRequest] = useState(0)
  const selectionMode = useSelectionStore((s) => s.mode)
  const selectionInteraction = useSelectionInteraction()
  const initializedSelectionRef = useRef(false)

  const windowSwitchSlots = useMemo(
    () =>
      getWindowSwitchSlotEntries(
        browserWindows,
        Boolean(currentBrowserWindow?.incognito),
      ),
    [browserWindows, currentBrowserWindow?.incognito],
  )

  // Sync selection state with browser store (removes closed tabs/windows from selection)
  useSelectionSync()

  const onSelectWindow = useCallback(
    (windowId: number) => {
      setSelectedWindowId(windowId)
    },
    [setSelectedWindowId],
  )

  const requestActionMenuOpen = useCallback(() => {
    setOpenMenuRequest((request) => request + 1)
  }, [])

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

  const onFocusWindowSlot = useCallback(
    (slotIndex: number) => {
      const targetWindow = windowSwitchSlots[slotIndex]?.window
      if (!targetWindow) return false

      void focusWindow(targetWindow.id).catch((error) => {
        console.warn('Could not focus numbered window', error)
      })
      return true
    },
    [windowSwitchSlots],
  )

  useKeyboardNavigation(onSelectWindow, onActivateWindow, onFocusWindowSlot)

  // For target action
  const tabs = useBrowserTabsByWindowId(currentBrowserWindow?.id)
  const activeTab = tabs.find((t) => t.active)

  // Seed the selection once on the first loaded view. A selected window resolves
  // to its active tab, so it stays harmless for batch actions until explicitly
  // expanded with a range or modifier gesture.
  useEffect(() => {
    if (
      storeState !== 'loaded' ||
      currentBrowserWindow?.id === undefined ||
      !activeTab?.id ||
      initializedSelectionRef.current
    ) {
      return
    }

    initializedSelectionRef.current = true
    const state = useSelectionStore.getState()
    const hasSelection =
      state.windowIds.size > 0 ||
      state.groupIds.size > 0 ||
      state.tabIds.size > 0
    if (!hasSelection) {
      selectionInteraction.handleArrowNavigation(
        { type: 'window', id: currentBrowserWindow.id },
        'window',
        { forceSingleSelect: true },
      )
      setSelectedWindowId(currentBrowserWindow.id)
    }
  }, [
    activeTab?.id,
    currentBrowserWindow?.id,
    selectionInteraction,
    setSelectedWindowId,
    storeState,
  ])

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

  const onSelectWindowCallback = useCallback(
    (window: BrowserWindow) => {
      setSelectedWindowId(window.id)
    },
    [setSelectedWindowId],
  )

  const openSearch = useCallback(() => {
    const windowId = currentBrowserWindow?.id
    const openPopup =
      windowId === undefined
        ? chrome.action.openPopup()
        : chrome.action.openPopup({ windowId })

    void openPopup.catch((error) => {
      console.warn('Could not open the Tabby search popup', error)
    })
  }, [currentBrowserWindow?.id])

  const startGroupRename = useCallback((groupId: number) => {
    setRenamingGroupId(groupId)
  }, [])

  const endGroupRename = useCallback(() => {
    setRenamingGroupId(undefined)
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

  // Show loading skeleton while browser store is loading
  if (storeState !== 'loaded') {
    return (
      <TabManagerShell sidebar={<SidebarSkeleton />}>
        <TabListSkeleton count={12} />
      </TabManagerShell>
    )
  }

  return (
    <Profiler id="TabManager">
      <TabManagerShell
        selectionMode={selectionMode}
        overlay={
          <ModeTransitionEffect
            isMultiSelectMode={selectionMode === 'multi-select'}
          />
        }
        actionBar={
          <ActionBar
            selectedWindowId={selectedWindowId}
            onRenameGroup={startGroupRename}
            openMenuRequest={openMenuRequest}
          />
        }
        sidebar={
          <Profiler id="TabManager.TabManagerSidebarContainer">
            <TabManagerSidebarContainer
              selectedWindowId={selectedWindowId || undefined}
              onSelectWindow={onSelectWindowCallback}
              onOpenSearch={openSearch}
              onOpenSettings={openSettings}
              onOpenTarget={openTarget}
              onOpenActionMenu={requestActionMenuOpen}
            />
          </Profiler>
        }
      >
        {selectedWindowId && (
          <Profiler id="TabManager.TabItemPane">
            <TabItemPane
              browserWindowId={selectedWindowId}
              renamingGroupId={renamingGroupId}
              onRenameGroupStart={startGroupRename}
              onRenameGroupEnd={endGroupRename}
              onOpenActionMenu={requestActionMenuOpen}
            />
          </Profiler>
        )}
      </TabManagerShell>
      <TabManagerDebugLogger />
    </Profiler>
  )
}

export default TabManager
