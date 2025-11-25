import { useTabListItems } from '@extension/chrome'
import { cn } from '@extension/ui'
import { TabItem } from '@src/TabItem'
import type { BrowserWindowID } from '@extension/chrome'

export type TabItemPaneProps = {
  browserWindowId?: BrowserWindowID
}

export const TabItemPane = ({ browserWindowId }: TabItemPaneProps) => {
  const items = useTabListItems(browserWindowId)

  return (
    <div key={`window-tabs-${browserWindowId}`} className="pb-4">
      <div className="space-y-4 p-2">
        <ol className="flex flex-col gap-1">
          {items.map((item) => {
            if (item.type === 'tab') {
              return (
                <li key={item.tab.id} className="flex w-full flex-col">
                  <TabItem tab={item.tab} isActive={item.tab.active} />
                </li>
              )
            }

            const active = item.tabs.some((t) => t.active)

            return (
              <li key={item.group.id} className="flex w-full flex-col">
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
                    {item.tabs.map((tab) => (
                      <li key={tab.id} className="flex flex-col">
                        <TabItem tab={tab} isActive={tab.active} />
                      </li>
                    ))}
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
