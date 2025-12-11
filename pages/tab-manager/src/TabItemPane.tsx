import { refreshBrowserTab, useTabListItems } from '@extension/chrome'
import {
  TabItem,
  TabList,
  TabListItem,
  TabListGroup,
  getFaviconUrl,
} from '@extension/ui'
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
      label={tab.title || '<Unnamed Tab>'}
      iconUrl={getFaviconUrl(tab.url || '', { size: 32 })}
      isActive={tab.active}
      isDiscarded={tab.discarded}
      isHighlighted={tab.highlighted}
      onActivate={onActivate}
      onRefresh={onRefresh}
      onRemove={onRemove}
      data-tab-item={tab.id}
    />
  )
})

export type TabItemPaneProps = {
  browserWindowId?: BrowserWindowID
}

export const TabItemPane = ({ browserWindowId }: TabItemPaneProps) => {
  const items = useTabListItems(browserWindowId)

  return (
    <div key={`window-tabs-${browserWindowId}`} className="pb-4">
      <div className="space-y-4 p-2">
        <TabList>
          {items.map((item) => {
            if (item.type === 'tab') {
              return (
                <TabListItem key={item.tab.id}>
                  <TabItemForTab tab={item.tab} />
                </TabListItem>
              )
            }

            const active = item.tabs.some((t) => t.active)

            return (
              <TabListItem key={item.group.id}>
                <TabListGroup
                  title={item.group.title}
                  color={item.group.color}
                  isActive={active}
                >
                  {item.tabs.map((tab) => {
                    return (
                      <TabListItem key={tab.id}>
                        <TabItemForTab tab={tab} />
                      </TabListItem>
                    )
                  })}
                </TabListGroup>
              </TabListItem>
            )
          })}
        </TabList>
      </div>
    </div>
  )
}
