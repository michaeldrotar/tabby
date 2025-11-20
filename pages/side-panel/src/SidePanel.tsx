import { SelectWindowButtonPane } from './SelectWindowButtonPane'
import { SelectWindowDot } from './SelectWindowDot'
import { SidePanelHeader } from './SidePanelHeader'
import { TabItemPane } from './TabItemPane'
import {
  createBrowserWindow,
  useBrowserWindows,
  useCurrentBrowserWindow,
} from '@extension/chrome'
import { withErrorBoundary, withSuspense } from '@extension/shared'
import { cn, ErrorDisplay, LoadingSpinner } from '@extension/ui'
import { useCallback, useEffect, useState } from 'react'
import type { TabItem } from './TabItem'
import type { BrowserWindow } from '@extension/chrome'

type TabItem = {
  type: 'tab'
  window: chrome.windows.Window
  tabGroup?: chrome.tabGroups.TabGroup
  tab: chrome.tabs.Tab
}

type TabGroupItem = {
  type: 'group'
  window: chrome.windows.Window
  tabGroup: chrome.tabGroups.TabGroup
  subItems: TabItem[]
}

type WindowItem = {
  window: chrome.windows.Window
  subItems: Array<TabGroupItem | TabItem>
}

const SidePanel = () => {
  console.count('SidePanel.render')

  const browserWindows = useBrowserWindows()
  const currentBrowserWindow = useCurrentBrowserWindow()
  // const tabs = useBrowserTabs()
  // const { data: groups } = useTabGroups()

  const [windowItems, setWindowItems] = useState<WindowItem[]>([])
  const [selectedWindowId, setSelectedWindowId] = useState<number | null>(null)
  const selectedWindowTabs = [] // useBrowserTabsByWindowId(selectedWindowId)

  // current active identifiers for highlighting
  const [currentTabId, setCurrentTabId] = useState<number | null>(null)
  const [currentGroupId, setCurrentGroupId] = useState<number | null>(null)

  // Build windowItems from the hook data whenever windows/tabs/groups change
  // useEffect(() => {
  //   const build = () => {
  //     const groupList = groups ?? []
  //     const winList = browserWindows ?? []
  //     const tabList = selectedWindowTabs ?? []

  //     const newWindowItems: WindowItem[] = []
  //     let lastWindowItem: WindowItem | undefined = undefined
  //     let lastTabGroupItem: TabGroupItem | undefined = undefined
  //     tabList.forEach((tab) => {
  //       if (!lastWindowItem || tab.windowId !== lastWindowItem.window.id) {
  //         const foundWindow = winList.find((win) => win.id === tab.windowId)
  //         if (!foundWindow) return // skip tabs for unknown windows
  //         lastWindowItem = {
  //           window: foundWindow,
  //           subItems: [],
  //         }
  //         newWindowItems.push(lastWindowItem)
  //       }
  //       if (tab.groupId === -1) {
  //         if (lastTabGroupItem) {
  //           lastTabGroupItem = undefined
  //         }
  //         if (!lastWindowItem) return
  //         lastWindowItem.subItems.push({
  //           type: 'tab',
  //           window: lastWindowItem.window,
  //           tab: tab,
  //         })
  //       } else {
  //         if (
  //           !lastTabGroupItem ||
  //           tab.groupId !== lastTabGroupItem.tabGroup.id
  //         ) {
  //           if (!lastWindowItem) return
  //           const foundTabGroup = groupList.find(
  //             (tg) => tg.id === (tab.groupId as number),
  //           )
  //           if (!foundTabGroup) return
  //           lastTabGroupItem = {
  //             type: 'group',
  //             window: lastWindowItem.window,
  //             tabGroup: foundTabGroup,
  //             subItems: [],
  //           }
  //           lastWindowItem.subItems.push(lastTabGroupItem)
  //         }
  //         lastTabGroupItem.subItems.push({
  //           type: 'tab',
  //           window: lastWindowItem.window,
  //           tabGroup: lastTabGroupItem.tabGroup,
  //           tab: tab,
  //         })
  //       }
  //     })

  //     setWindowItems(newWindowItems)

  //     if (!selectedWindowId) {
  //       const focused = winList.find((w) => w.focused)
  //       setSelectedWindowId(focused?.id ?? newWindowItems[0]?.window.id ?? null)
  //     }
  //   }

  //   build()
  // }, [browserWindows, selectedWindowTabs, groups, selectedWindowId])

  useEffect(() => {
    if (selectedWindowId) return
    if (!browserWindows.length) return
    setSelectedWindowId(currentBrowserWindow?.id ?? browserWindows[0].id)
  }, [selectedWindowId, browserWindows, currentBrowserWindow])

  // useEffect(() => {
  //   let mounted = true
  //   const updateActive = async () => {
  //     try {
  //       const activeTabs = await chrome.tabs.query({
  //         active: true,
  //         currentWindow: true,
  //       })
  //       const active = activeTabs[0]
  //       if (mounted) {
  //         setCurrentTabId(active?.id ?? null)
  //         setCurrentGroupId(
  //           typeof active?.groupId === 'number' ? active.groupId : -1,
  //         )
  //       }
  //     } catch {
  //       if (mounted) {
  //         setCurrentTabId(null)
  //         setCurrentGroupId(null)
  //       }
  //     }
  //   }

  //   updateActive()

  //   return () => {
  //     mounted = false
  //   }
  // }, [browserWindows, tabs])

  const onSelectWindow = useCallback(
    (window: BrowserWindow) => {
      setSelectedWindowId(window.id ?? null)
    },
    [setSelectedWindowId],
  )

  const openNewBrowserWindow = useCallback(async () => {
    console.count('SidePanel.openNewBrowserWindow')
    if (!currentBrowserWindow) {
      await createBrowserWindow()
      return
    }
    const newWindow = await createBrowserWindow({
      height: currentBrowserWindow.height,
      incognito: currentBrowserWindow.incognito,
      left: currentBrowserWindow.left,
      state: currentBrowserWindow.state,
      top: currentBrowserWindow.top,
      width: currentBrowserWindow.width,
    })
    if (newWindow) {
      chrome.sidePanel.open({ windowId: newWindow.id })
    }
  }, [currentBrowserWindow])

  return (
    <>
      <div
        className={cn(
          'flex h-screen flex-col overscroll-none font-sans text-sm',
          'bg-gray-50 text-gray-800',
          'dark:bg-gray-800 dark:text-gray-100',
        )}
      >
        <SidePanelHeader />

        <div className="flex flex-1 overflow-hidden overscroll-none">
          <SelectWindowButtonPane
            selectedBrowserWindowId={selectedWindowId || undefined}
            onSelectBrowserWindow={onSelectWindow}
            onNewBrowserWindowClick={openNewBrowserWindow}
          />

          <div
            className={cn(
              'flex h-full w-20 flex-shrink-0 items-center justify-center overflow-y-auto overscroll-none border-r',
              'bg-white',
              'dark:bg-gray-900',
            )}
          >
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-2">
              {browserWindows.map((browserWindow) => (
                <SelectWindowDot
                  key={browserWindow.id}
                  window={browserWindow}
                  isCurrent={browserWindow.id === currentBrowserWindow?.id}
                  isSelected={browserWindow.id === selectedWindowId}
                  onSelect={onSelectWindow}
                />
              ))}
            </div>
          </div>

          <div className="h-full flex-1 overflow-y-auto overscroll-none p-3">
            {/* {windowItems
              .filter((wi) => wi.window.id === selectedWindowId)
              .map((windowItem) => (
                <div key={`window-tabs-${windowItem.window.id}`}>
                  <div className="space-y-3">
                    <ol className="flex flex-col">
                      {windowItem.subItems.map((childItem) => (
                        <li
                          key={
                            childItem.type === 'tab'
                              ? childItem.tab.id
                              : childItem.tabGroup.id
                          }
                          className="flex w-full flex-col"
                        >
                          {childItem.type === 'group' && (
                            <div className={cn('flex flex-col rounded-md p-2')}>
                              <h4
                                className={cn(
                                  'mb-1 text-sm font-medium',
                                  childItem.tabGroup.color
                                    ? childItem.tabGroup.id === currentGroupId
                                      ? `text-${childItem.tabGroup.color}-600 dark:text-${childItem.tabGroup.color}-500`
                                      : `text-${childItem.tabGroup.color}-800 dark:text-${childItem.tabGroup.color}-700`
                                    : 'text-gray-700 dark:text-gray-100',
                                )}
                              >
                                {childItem.tabGroup.title || 'Unnamed Group'}
                              </h4>
                              <ol
                                className={cn(
                                  'ml-0 space-y-1 border-l-2 pl-2',
                                  childItem.tabGroup.color
                                    ? `border-l-${childItem.tabGroup.color}-600`
                                    : 'border-l-gray-600',
                                  'text-gray-700',
                                  'dark:text-gray-200',
                                )}
                              >
                                {childItem.subItems.map((tabItem) => (
                                  <li
                                    key={tabItem.tab.id}
                                    className="flex flex-col"
                                  >
                                    <div data-tabid={tabItem.tab.id}>
                                      <TabItem
                                        tab={tabItem.tab}
                                        isActive={
                                          tabItem.tab.id === currentTabId
                                        }
                                      />
                                    </div>
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}
                          {childItem.type === 'tab' && (
                            <div data-tabid={childItem.tab.id}>
                              <TabItem
                                tab={childItem.tab}
                                isActive={childItem.tab.id === currentTabId}
                              />
                            </div>
                          )}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              ))} */}
            <TabItemPane browserWindowId={selectedWindowId || undefined} />
          </div>
        </div>
      </div>
    </>
  )
}

export default withErrorBoundary(
  withSuspense(SidePanel, <LoadingSpinner />),
  ErrorDisplay,
)
