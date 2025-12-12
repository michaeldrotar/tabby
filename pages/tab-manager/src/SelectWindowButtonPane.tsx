import {
  useBrowserWindows,
  useCurrentBrowserWindow,
  useFocusedBrowserWindow,
} from '@extension/chrome'
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
  const browserWindows = useBrowserWindows()
  const currentBrowserWindow = useCurrentBrowserWindow()
  const focusedBrowserWindow = useFocusedBrowserWindow()

  return (
    <ScrollArea
      className={cn(
        'h-full w-56 flex-shrink-0 overscroll-none border-r',
        'border-stone-200 bg-stone-100',
        'dark:border-slate-800 dark:bg-slate-950',
      )}
    >
      <div className="flex flex-col gap-2 p-2">
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
      <div className="sticky bottom-0 bg-gradient-to-t from-stone-100 to-transparent p-2 dark:from-slate-950">
        <button
          className={cn(
            'flex w-full items-center justify-center rounded-md py-2 text-sm font-medium transition-colors',
            'border border-stone-200 bg-stone-50 text-slate-700 shadow-sm hover:bg-stone-100',
            'dark:border-slate-700 dark:bg-slate-800 dark:text-neutral-200 dark:hover:bg-slate-700',
          )}
          onClick={onNewBrowserWindowClick}
        >
          New Window
        </button>
      </div>
    </ScrollArea>
  )
}
