import { refreshBrowserTab, useTabListItems } from '@extension/chrome'
import { cn, TabItem, getFaviconUrl } from '@extension/ui'
import { memo, useCallback } from 'react'
import type {
  BrowserTab,
  BrowserTabID,
  BrowserWindowID,
} from '@extension/chrome'

const onActivateTab = async (
  windowId: BrowserWindowID,
  tabId: BrowserTabID,
): Promise<void> => {
  await chrome.windows.update(windowId, { focused: true })
  await chrome.tabs.update(tabId, { active: true })
}

const onRefreshTab = async (tabId: BrowserTabID): Promise<void> => {
  await refreshBrowserTab(tabId)
}

const onRemoveTab = async (tabId: BrowserTabID): Promise<void> => {
  if (tabId) {
    await chrome.tabs.remove(tabId)
  }
}

const TabItemForTab = memo(({ tab }: { tab: BrowserTab }) => {
  console.count('TabItemForTab.render')

  const onActivate = useCallback(
    () => onActivateTab(tab.windowId, tab.id),
    [tab.windowId, tab.id],
  )
  const onRefresh = useCallback(() => onRefreshTab(tab.id), [tab.id])
  const onRemove = useCallback(() => onRemoveTab(tab.id), [tab.id])

  return (
    <TabItem
      tabId={tab.id}
      label={tab.title || '<Unnamed Tab>'}
      iconUrl={getFaviconUrl(tab.url || '', { size: 32 })}
      isActive={tab.active}
      isDiscarded={tab.discarded}
      isHighlighted={tab.highlighted}
      onActivate={onActivate}
      onRefresh={onRefresh}
      onRemove={onRemove}
    />
  )
})

export type TabItemPaneProps = {
  browserWindowId?: BrowserWindowID
}

export const TabItemPane = ({ browserWindowId }: TabItemPaneProps) => {
  const items = useTabListItems(browserWindowId)

  return (
    // TODO: Keep TabItemPane specific to the TabManager,
    // separate the parts out into dumb UI components here (TabList)
    <div key={`window-tabs-${browserWindowId}`} className="pb-4">
      <div className="space-y-4 p-2">
        <ol className="flex flex-col gap-1">
          {items.map((item) => {
            if (item.type === 'tab') {
              return (
                // TODO: Move li to TabListItem?
                <li key={item.tab.id} className="flex w-full flex-col">
                  <TabItemForTab tab={item.tab} />
                </li>
              )
            }

            const active = item.tabs.some((t) => t.active)

            return (
              // TODO: Re-use TabListItem
              <li key={item.group.id} className="flex w-full flex-col">
                {/* TODO: TabListGroup */}
                <div
                  className={cn(
                    'flex flex-col rounded-lg border border-transparent bg-gray-50/50 p-1 transition-colors dark:bg-gray-900/30',
                    active && 'bg-blue-50/50 dark:bg-blue-900/10',
                  )}
                >
                  <div className="mb-1 flex items-center gap-2 px-2 py-1">
                    <div
                      className={cn(
                        'h-3 w-3 rounded-full',
                        item.group.color
                          ? `bg-${item.group.color}-500`
                          : 'bg-gray-400',
                      )}
                    />
                    <h4
                      className={cn(
                        'text-xs font-bold uppercase tracking-wider opacity-80',
                        item.group.color
                          ? `text-${item.group.color}-700 dark:text-${item.group.color}-400`
                          : 'text-gray-600 dark:text-gray-400',
                      )}
                    >
                      {item.group.title || 'Group'}
                    </h4>
                  </div>
                  <ol className="flex flex-col gap-0.5 pl-2">
                    {item.tabs.map((tab) => {
                      return (
                        // TODO: TabListGroupItem or re-use TabListItem?
                        <li key={tab.id} className="flex flex-col">
                          <TabItemForTab tab={tab} />
                        </li>
                      )
                    })}
                  </ol>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}
