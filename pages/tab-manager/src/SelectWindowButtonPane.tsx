import { useBrowserWindows, useCurrentBrowserWindow } from '@extension/chrome'
import { usePreferenceStorage } from '@extension/shared'
import { cn, ScrollArea } from '@extension/ui'
import { SelectWindowButton } from '@src/SelectWindowButton'
import type { BrowserWindow, BrowserWindowID } from '@extension/chrome'

type SelectWindowButtonPaneProps = {
  selectedBrowserWindowId?: BrowserWindowID
  onNewBrowserWindowClick?: () => void
  onSelectBrowserWindow?: (selectedBrowserWindow: BrowserWindow) => void
}

export const SelectWindowButtonPane = ({
  selectedBrowserWindowId,
  onNewBrowserWindowClick,
  onSelectBrowserWindow,
}: SelectWindowButtonPaneProps) => {
  const { tabManagerShowWindowPreview } = usePreferenceStorage()

  const browserWindows = useBrowserWindows()
  const currentBrowserWindow = useCurrentBrowserWindow()

  return (
    <ScrollArea
      className={cn(
        tabManagerShowWindowPreview ? 'w-64' : 'w-48',
        'h-full flex-shrink-0 overscroll-none border-r',
        'border-gray-200 bg-gray-50',
        'dark:border-gray-800 dark:bg-gray-900',
      )}
    >
      <div className="flex flex-col gap-2 p-2">
        {browserWindows.map((browserWindow) => (
          <SelectWindowButton
            key={browserWindow.id}
            window={browserWindow}
            isCurrent={browserWindow.id === currentBrowserWindow?.id}
            isSelected={browserWindow.id === selectedBrowserWindowId}
            onSelect={onSelectBrowserWindow}
          />
        ))}
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
          New Window
        </button>
      </div>
    </ScrollArea>
  )
}
