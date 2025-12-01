import { SelectWindowButtonPane } from './SelectWindowButtonPane'
import { SelectWindowDot } from './SelectWindowDot'
import { TabItemPane } from './TabItemPane'
import { TabManagerHeader } from './TabManagerHeader'
import {
  createBrowserWindow,
  useBrowserWindows,
  useCurrentBrowserWindow,
  useSelectedWindowId,
  useSetSelectedWindowId,
} from '@extension/chrome'
import { withErrorBoundary, withSuspense } from '@extension/shared'
import { cn, ErrorDisplay, LoadingSpinner } from '@extension/ui'
import { useCallback, useEffect } from 'react'
import type { BrowserWindow } from '@extension/chrome'

const TabManager = () => {
  console.count('TabManager.render')

  const browserWindows = useBrowserWindows()
  const currentBrowserWindow = useCurrentBrowserWindow()
  const selectedWindowId = useSelectedWindowId()
  const setSelectedWindowId = useSetSelectedWindowId()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        window.close()
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  const onSelectWindow = useCallback(
    (window: BrowserWindow) => {
      setSelectedWindowId(window.id)
    },
    [setSelectedWindowId],
  )

  const openNewBrowserWindow = useCallback(async () => {
    console.count('TabManager.openNewBrowserWindow')
    if (!currentBrowserWindow) {
      await createBrowserWindow()
      return
    }
    const newWindow = await createBrowserWindow({
      height: currentBrowserWindow.height,
      incognito: currentBrowserWindow.incognito,
      left: currentBrowserWindow.left,
      state: currentBrowserWindow.state,
      top: currentBrowserWindow.top,
      width: currentBrowserWindow.width,
    })
    if (newWindow) {
      chrome.sidePanel.open({ windowId: newWindow.id })
    }
  }, [currentBrowserWindow])

  return (
    <div
      className={cn(
        'flex h-screen flex-col overscroll-none font-sans text-sm',
        'bg-gray-50 text-gray-800',
        'dark:bg-gray-800 dark:text-gray-100',
      )}
    >
      <TabManagerHeader />

      <div className="flex flex-1 overflow-hidden overscroll-none">
        {/* Navigation Rail (Dots) */}
        <div
          className={cn(
            'flex h-full w-12 flex-shrink-0 flex-col items-center overflow-y-auto border-r py-4',
            'border-gray-200 bg-gray-100',
            'dark:border-gray-800 dark:bg-gray-900',
          )}
        >
          <div className="flex flex-col gap-3">
            {browserWindows.map((browserWindow) => (
              <SelectWindowDot
                key={browserWindow.id}
                window={browserWindow}
                isCurrent={browserWindow.id === currentBrowserWindow?.id}
                isSelected={browserWindow.id === selectedWindowId}
                onSelect={onSelectWindow}
              />
            ))}
          </div>
          <div className="mt-auto pb-2">
            {/* Placeholder for bottom actions if needed */}
          </div>
        </div>

        {/* Window List (Blocks) */}
        <SelectWindowButtonPane
          selectedBrowserWindowId={selectedWindowId || undefined}
          onSelectBrowserWindow={onSelectWindow}
          onNewBrowserWindowClick={openNewBrowserWindow}
        />

        {/* Tab List */}
        <div className="h-full flex-1 overflow-y-auto overscroll-none bg-white dark:bg-gray-950">
          <TabItemPane browserWindowId={selectedWindowId || undefined} />
        </div>
      </div>
    </div>
  )
}

export default withErrorBoundary(
  withSuspense(TabManager, <LoadingSpinner />),
  ErrorDisplay,
)
