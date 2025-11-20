import { Favicon } from './Favicon'
import { WindowThumbnail } from './WindowThumbnail'
import {
  useBrowserTabsByWindowId,
  useFocusedBrowserWindow,
} from '@extension/chrome'
import { cn } from '@extension/ui'
import { memo } from 'react'
import type { BrowserWindow } from '@extension/chrome'

type SelectWindowButtonProps = {
  window: BrowserWindow
  isCurrent: boolean
  isSelected: boolean
  onSelect: (browserWindow: BrowserWindow) => void
}

const SelectWindowButton = ({
  window,
  isCurrent,
  isSelected,
  onSelect,
}: SelectWindowButtonProps) => {
  console.count('SelectWindowButton.render')

  const focusedBrowserWindow = useFocusedBrowserWindow()
  const tabs = useBrowserTabsByWindowId(window.id)

  return (
    <button
      key={window.id}
      type="button"
      onClick={() => onSelect(window)}
      className={cn(
        'mb-2 flex w-full flex-col items-center justify-between gap-2 rounded px-3 py-2 text-left transition hover:scale-[1.01]',
        'border border-gray-200 bg-white text-gray-700',
        'dark:border dark:border-gray-800 dark:bg-gray-900 dark:text-gray-200',
        isSelected && 'border border-blue-400 bg-blue-50 text-blue-700',
        isSelected &&
          'dark:border dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-200',
        !isSelected && isCurrent && 'border border-blue-400',
        !isSelected && isCurrent && 'dark:border dark:border-blue-600',
      )}
    >
      <div className="flex w-full flex-row gap-2">
        <div className="flex flex-grow-0 flex-col gap-1">
          <div
            className={cn(
              'font-medium',
              focusedBrowserWindow?.id === window.id ? 'font-bold' : '',
            )}
          >
            W{window.id}
          </div>
          <div className="text-xs text-gray-400">
            {window.state} {window.type}
          </div>
          <div className="text-xs text-gray-400">{tabs.length} tabs</div>
        </div>
        <div className="flex-grow">
          <WindowThumbnail browserWindow={window} />
        </div>
      </div>
      <div className="flex h-2 w-full justify-end gap-1 overflow-hidden">
        {tabs.map((tab) => (
          <Favicon pageUrl={tab.url} size={8} />
        ))}
      </div>
    </button>
  )
}

const SelectWindowButtonMemo = memo(SelectWindowButton)

export {
  SelectWindowButtonMemo as SelectWindowButton,
  type SelectWindowButtonProps,
}
