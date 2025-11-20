import { Favicon } from './Favicon'
import { cn } from '@extension/ui'
import { memo } from 'react'

type TabItemProps = {
  tab: chrome.tabs.Tab
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

  return (
    <button
      type="button"
      className={cn(
        'flex w-full items-center gap-2 truncate rounded-sm px-1 py-0.5 text-left font-semibold',
        isActive
          ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200'
          : 'hover:text-blue-600 dark:hover:text-blue-300',
        !isActive &&
          isDiscarded &&
          'text-gray-400 opacity-60 dark:text-gray-500',
      )}
      title={tab.url}
      onClick={handleClick}
    >
      <div
        className={cn(
          'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-sm align-middle',
          isDiscarded && 'rounded-full border-2 border-dotted border-current',
        )}
      >
        <Favicon
          pageUrl={tab.url}
          size={isDiscarded ? 12 : 16}
          className={cn(
            isDiscarded && 'h-3 w-3 rounded-full',
            !isDiscarded && 'h-4 w-4',
          )}
        />
      </div>
      <span className="truncate">
        {tab.index} {tab.active ? 'active' : ''} {tab.title}
      </span>
    </button>
  )
}

const TabItemMemo = memo(TabItem)

export { TabItemMemo as TabItem, type TabItemProps }
