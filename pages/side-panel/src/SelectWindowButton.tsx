import { Favicon } from './Favicon'
import { WindowThumbnail } from './WindowThumbnail'
import { useBrowserTabsByWindowId } from '@extension/chrome'
import { cn } from '@extension/ui'
import { memo } from 'react'
import type { BrowserWindow } from '@extension/chrome'

type SelectWindowButtonProps = {
  window: BrowserWindow
  isCurrent: boolean
  isFocused: boolean
  isSelected: boolean
  onSelect?: (browserWindow: BrowserWindow) => void
}

const SelectWindowButton = ({
  window,
  isCurrent,
  isFocused,
  isSelected,
  onSelect,
}: SelectWindowButtonProps) => {
  console.count('SelectWindowButton.render')

  const tabs = useBrowserTabsByWindowId(window.id)

  return (
    <button
      type="button"
      onClick={() => onSelect?.(window)}
      className={cn(
        'flex w-full flex-col gap-2 rounded-lg border p-2 text-left transition-all',
        'border-gray-200 bg-white shadow-sm',
        'dark:border-gray-700 dark:bg-gray-800',
        isSelected
          ? 'border-blue-500 ring-1 ring-blue-500 dark:border-blue-400 dark:ring-blue-400'
          : 'hover:border-gray-300 dark:hover:border-gray-600',
        !isSelected && isCurrent && 'border-l-4 border-l-blue-500 pl-1.5', // Highlight current window if not selected
      )}
    >
      <div className="flex w-full items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center gap-1">
            <span
              className={cn(
                'text-xs font-medium text-gray-500 dark:text-gray-400',
                isFocused && 'font-bold text-blue-600 dark:text-blue-400',
              )}
            >
              Window {window.id}
            </span>
            {isCurrent && (
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
            )}
          </div>
          <div className="truncate text-xs text-gray-400">
            {tabs.length} tab{tabs.length === 1 ? '' : 's'}
          </div>
        </div>
        <div className="h-10 w-16 flex-shrink-0">
          <WindowThumbnail browserWindow={window} />
        </div>
      </div>

      {/* Favicon strip */}
      <div className="flex h-4 w-full gap-1 overflow-hidden opacity-70 grayscale transition-all">
        {tabs.slice(0, 8).map((tab) => (
          <Favicon key={tab.id} pageUrl={tab.url} size={14} />
        ))}
        {tabs.length > 8 && (
          <span className="text-[10px] text-gray-400">+{tabs.length - 8}</span>
        )}
      </div>
    </button>
  )
}

const SelectWindowButtonMemo = memo(SelectWindowButton)

export {
  SelectWindowButtonMemo as SelectWindowButton,
  type SelectWindowButtonProps,
}
