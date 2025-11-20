import { Favicon } from './Favicon'
import { refreshBrowserTab } from '@extension/chrome'
import { cn } from '@extension/ui'
import { memo, useCallback } from 'react'
import type { BrowserTab } from '@extension/chrome'

type TabItemProps = {
  tab: BrowserTab
  isActive: boolean
}

const TabItem = ({ tab, isActive }: TabItemProps) => {
  console.count('TabItem.render')
  const isDiscarded = tab.discarded
  const handleClick = async () => {
    if (typeof tab.windowId === 'number') {
      await chrome.windows.update(tab.windowId, { focused: true })
    }
    if (typeof tab.id === 'number') {
      await chrome.tabs.update(tab.id, { active: true })
    }
  }

  const refresh = useCallback(() => {
    refreshBrowserTab(tab.id)
  }, [tab.id])

  return (
    <button
      type="button"
      className={cn(
        'group flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
        isActive
          ? 'bg-blue-100 text-blue-900 dark:bg-blue-900/40 dark:text-blue-100'
          : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800',
        !isActive && isDiscarded && 'opacity-60 grayscale',
      )}
      title={tab.url}
      onClick={handleClick}
    >
      <div
        className={cn(
          'relative flex h-4 w-4 flex-shrink-0 items-center justify-center',
          isDiscarded && 'opacity-70',
        )}
      >
        <Favicon
          pageUrl={tab.url}
          size={16}
          className={cn('h-4 w-4 transition-transform group-hover:scale-110')}
        />
        {isDiscarded && (
          <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full border border-white bg-gray-400 dark:border-gray-900" />
        )}
      </div>
      <span className={cn('flex-1 truncate', isActive && 'font-medium')}>
        {tab.highlighted ? 'H' : 'X'} {tab.index} {tab.id} {tab.title}
      </span>
      <div className="flex-grow-0">
        <button type="button" onClick={() => refresh()}>
          r
        </button>
      </div>
      {/* Optional: Close button on hover could go here */}
    </button>
  )
}

const TabItemMemo = memo(TabItem)

export { TabItemMemo as TabItem, type TabItemProps }
