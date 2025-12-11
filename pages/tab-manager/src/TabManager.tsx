import { SearchPopup } from './SearchPopup'
import { SelectWindowButtonPane } from './SelectWindowButtonPane'
import { SelectWindowDotPane } from './SelectWindowDotPane'
import { TabItemPane } from './TabItemPane'
import { TabManagerHeader } from './TabManagerHeader'
import {
  createBrowserWindow,
  useCurrentBrowserWindow,
  useSelectedWindowId,
  useSetSelectedWindowId,
} from '@extension/chrome'
import {
  usePreferenceStorage,
  withErrorBoundary,
  withSuspense,
} from '@extension/shared'
import { cn, ErrorDisplay, LoadingSpinner, ScrollArea } from '@extension/ui'
import { useCallback, useEffect, useState } from 'react'
import type { BrowserWindow } from '@extension/chrome'

const TabManager = () => {
  console.count('TabManager.render')

  const currentBrowserWindow = useCurrentBrowserWindow()
  const selectedWindowId = useSelectedWindowId()
  const setSelectedWindowId = useSetSelectedWindowId()
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const { tabManagerViewMode } = usePreferenceStorage()

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
          'bg-gray-50 text-gray-800',
          'dark:bg-gray-800 dark:text-gray-100',
        )}
      >
        <TabManagerHeader onOpenSearch={openSearch} />

        <div className="flex flex-1 overflow-hidden overscroll-none">
          {/* Navigation Rail (Dots) */}
          {tabManagerViewMode === 'dots' && (
            <SelectWindowDotPane
              selectedBrowserWindowId={selectedWindowId || undefined}
              onSelectBrowserWindow={onSelectWindow}
              onNewBrowserWindowClick={openNewBrowserWindow}
            />
          )}

          {/* Window List (Blocks) */}
          {tabManagerViewMode === 'buttons' && (
            <SelectWindowButtonPane
              selectedBrowserWindowId={selectedWindowId || undefined}
              onSelectBrowserWindow={onSelectWindow}
              onNewBrowserWindowClick={openNewBrowserWindow}
            />
          )}

          {/* Tab List */}
          <ScrollArea
            orientation="vertical"
            className="flex-1 bg-white dark:bg-gray-950"
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
