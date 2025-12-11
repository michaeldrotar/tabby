import { useBrowserWindows, useCurrentBrowserWindow } from '@extension/chrome'
import { usePreferenceStorage } from '@extension/shared'
import { cn, ScrollArea } from '@extension/ui'
import { SelectWindowDot } from '@src/SelectWindowDot'
import type { BrowserWindow, BrowserWindowID } from '@extension/chrome'

export type SelectWindowDotPaneProps = {
  selectedBrowserWindowId?: BrowserWindowID
  onNewBrowserWindowClick?: () => void
  onSelectBrowserWindow?: (selectedBrowserWindow: BrowserWindow) => void
}

export const SelectWindowDotPane = ({
  selectedBrowserWindowId,
  onNewBrowserWindowClick,
  onSelectBrowserWindow,
}: SelectWindowDotPaneProps) => {
  const browserWindows = useBrowserWindows()
  const currentBrowserWindow = useCurrentBrowserWindow()
  const { tabManagerCompactLayout } = usePreferenceStorage()
  const isList = tabManagerCompactLayout === 'list'

  return (
    <ScrollArea
      className={cn(
        'h-full flex-shrink-0 border-r transition-all duration-300',
        isList ? 'w-48' : 'w-12',
        'border-gray-200 bg-gray-100',
        'dark:border-gray-800 dark:bg-gray-900',
      )}
    >
      <div
        className={cn(
          'flex min-h-full flex-col py-4',
          isList ? 'items-stretch px-2' : 'items-center',
        )}
      >
        <div className="flex flex-col gap-3">
          {browserWindows.map((browserWindow) => (
            <SelectWindowDot
              key={browserWindow.id}
              window={browserWindow}
              isCurrent={browserWindow.id === currentBrowserWindow?.id}
              isSelected={browserWindow.id === selectedBrowserWindowId}
              onSelect={onSelectBrowserWindow}
            />
          ))}
        </div>
      </div>
      <div className="sticky bottom-0 bg-gradient-to-t from-gray-50 to-transparent p-2 dark:from-gray-900">
        <button
          className={cn(
            'flex w-full items-center justify-center rounded-md py-2 text-sm font-medium transition-colors',
            'border border-gray-200 bg-white text-gray-700 shadow-sm hover:bg-gray-50',
            'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
          )}
          onClick={onNewBrowserWindowClick}
        >
          {isList ? 'New Window' : '+'}
        </button>
      </div>
    </ScrollArea>
  )
}
