import { useBrowserTabsByWindowId } from '@extension/chrome'
import { cn } from '@extension/ui'
import { TabItem } from '@src/TabItem'
import { useEffect, useState } from 'react'
import type { BrowserWindowID } from '@extension/chrome'

type TabItem = {
  type: 'tab'
  tabGroup?: chrome.tabGroups.TabGroup
  tab: chrome.tabs.Tab
}

type TabGroupItem = {
  type: 'group'
  tabGroup: chrome.tabGroups.TabGroup
  subItems: TabItem[]
  active: boolean
}

type WindowItem = {
  subItems: Array<TabGroupItem | TabItem>
}

export type TabItemPaneProps = {
  browserWindowId?: BrowserWindowID
}

export const TabItemPane = ({ browserWindowId }: TabItemPaneProps) => {
  console.log('TabItemPane.render')

  const tabs = useBrowserTabsByWindowId(browserWindowId)
  const [tabGroups, setTabGroups] = useState<chrome.tabGroups.TabGroup[]>(
    () => [],
  )

  useEffect(() => {
    let running = true
    const load = async () => {
      const groups = await chrome.tabGroups.query({ windowId: browserWindowId })
      if (!running) return
      setTabGroups(groups)
    }
    load()
    return () => {
      running = false
    }
  }, [browserWindowId])

  const windowItem: WindowItem = {
    subItems: tabs.reduce(
      (list, tab) => {
        if (tab.groupId) {
          const group = tabGroups.find((x) => x.id === tab.groupId)
          if (group) {
            const existingGroup = list.find((x) => x.tabGroup?.id === group.id)
            if (existingGroup) return list
            return [
              ...list,
              {
                type: 'group',
                tabGroup: group,
                subItems: tabs
                  .filter((x) => x.groupId === group.id)
                  .map((tab) => {
                    return {
                      type: 'tab',
                      tab,
                    }
                  }),
                active: tabs.find((x) => x.active) ? true : false,
              },
            ]
          }
        }
        return [
          ...list,
          {
            type: 'tab',
            tab,
          },
        ]
      },
      [] as WindowItem['subItems'],
    ),
  }

  return (
    <div key={`window-tabs-${browserWindowId}`} className="pb-4">
      <div className="space-y-4 p-2">
        <ol className="flex flex-col gap-1">
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
                <div
                  className={cn(
                    'flex flex-col rounded-lg border border-transparent bg-gray-50/50 p-1 transition-colors dark:bg-gray-900/30',
                    childItem.active && 'bg-blue-50/50 dark:bg-blue-900/10',
                  )}
                >
                  <div className="mb-1 flex items-center gap-2 px-2 py-1">
                    <div
                      className={cn(
                        'h-3 w-3 rounded-full',
                        childItem.tabGroup.color
                          ? `bg-${childItem.tabGroup.color}-500`
                          : 'bg-gray-400',
                      )}
                    />
                    <h4
                      className={cn(
                        'text-xs font-bold uppercase tracking-wider opacity-80',
                        childItem.tabGroup.color
                          ? `text-${childItem.tabGroup.color}-700 dark:text-${childItem.tabGroup.color}-400`
                          : 'text-gray-600 dark:text-gray-400',
                      )}
                    >
                      {childItem.tabGroup.title || 'Group'}
                    </h4>
                  </div>
                  <ol className="flex flex-col gap-0.5 pl-2">
                    {childItem.subItems.map((tabItem) => (
                      <li key={tabItem.tab.id} className="flex flex-col">
                        <div data-tabid={tabItem.tab.id}>
                          <TabItem
                            tab={tabItem.tab}
                            isActive={tabItem.tab.active}
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
                    isActive={childItem.tab.active}
                  />
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
