import { SearchPopup } from './SearchPopup'
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
import { cn, ErrorDisplay, LoadingSpinner, ScrollArea } from '@extension/ui'
import { useCallback, useEffect, useState } from 'react'
import type { BrowserWindow } from '@extension/chrome'

const TabManager = () => {
  console.count('TabManager.render')

  const browserWindows = useBrowserWindows()
  const currentBrowserWindow = useCurrentBrowserWindow()
  const selectedWindowId = useSelectedWindowId()
  const setSelectedWindowId = useSetSelectedWindowId()
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isSearchOpen) {
          setIsSearchOpen(false)
        } else {
          window.close()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isSearchOpen])

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

  const openSearch = useCallback(() => {
    setIsSearchOpen(true)
  }, [])

  const closeSearch = useCallback(() => {
    setIsSearchOpen(false)
  }, [])

  return (
    <>
      <SearchPopup isOpen={isSearchOpen} onClose={closeSearch} />
      <div
        className={cn(
          'flex h-screen flex-col overscroll-none font-sans text-sm',
          'bg-stone-50 text-slate-800',
          'dark:bg-slate-900 dark:text-neutral-100',
        )}
      >
        <TabManagerHeader onOpenSearch={openSearch} />

        <div className="flex flex-1 overflow-hidden overscroll-none">
          {/* Navigation Rail (Dots) */}
          <ScrollArea
            className={cn(
              'h-full w-12 flex-shrink-0 border-r',
              'border-stone-200 bg-stone-100',
              'dark:border-slate-800 dark:bg-slate-950',
            )}
          >
            <div className="flex min-h-full flex-col items-center py-4">
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
          </ScrollArea>

          {/* Window List (Blocks) */}
          <SelectWindowButtonPane
            selectedBrowserWindowId={selectedWindowId || undefined}
            onSelectBrowserWindow={onSelectWindow}
            onNewBrowserWindowClick={openNewBrowserWindow}
          />

          {/* Tab List */}
          <ScrollArea
            orientation="vertical"
            className="flex-1 bg-stone-50 dark:bg-slate-900"
          >
            <TabItemPane browserWindowId={selectedWindowId || undefined} />
          </ScrollArea>
        </div>
      </div>
    </>
  )
}

export default withErrorBoundary(
  withSuspense(TabManager, <LoadingSpinner />),
  ErrorDisplay,
)
