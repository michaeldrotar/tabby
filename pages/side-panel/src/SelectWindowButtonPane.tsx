import {
  useBrowserWindows,
  useCurrentBrowserWindow,
  useFocusedBrowserWindow,
} from '@extension/chrome'
import { cn } from '@extension/ui'
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
  const browserWindows = useBrowserWindows()
  const currentBrowserWindow = useCurrentBrowserWindow()
  const focusedBrowserWindow = useFocusedBrowserWindow()

  return (
    <div
      className={cn(
        'h-full w-48 flex-shrink-0 overflow-y-auto overscroll-none border-r',
        'bg-white',
        'dark:bg-gray-900',
      )}
    >
      <div className="p-2">
        {browserWindows.map((browserWindow) => (
          <SelectWindowButton
            key={browserWindow.id}
            window={browserWindow}
            isCurrent={browserWindow.id === currentBrowserWindow?.id}
            isFocused={browserWindow.id === focusedBrowserWindow?.id}
            isSelected={browserWindow.id === selectedBrowserWindowId}
            onSelect={onSelectBrowserWindow}
          />
        ))}
      </div>
      <div className="sticky bottom-0 flex h-8 w-full">
        <button
          className={cn('flex-grow', 'bg-slate-200', 'dark:bg-slate-600')}
          onClick={() => onNewBrowserWindowClick?.()}
        >
          +
        </button>
      </div>
    </div>
  )
}
