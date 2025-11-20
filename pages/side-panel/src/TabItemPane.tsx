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
    <div key={`window-tabs-${browserWindowId}`}>
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
                        ? childItem.active
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
