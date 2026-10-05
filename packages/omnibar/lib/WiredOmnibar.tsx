import { TABBY_COMMANDS, useCommandShortcuts } from '@extension/chrome/commands'
import { usePlatformInfo } from '@extension/chrome/usePlatformInfo'
import { useBrowserWindows } from '@extension/chrome/window/useBrowserWindows'
import { useCurrentBrowserWindow } from '@extension/chrome/window/useCurrentBrowserWindow'
import { Omnibar } from '@extension/ui/omnibar/Omnibar'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useOmnibarExternalSearch } from './useOmnibarExternalSearch'
import { useOmnibarGenerators } from './useOmnibarGenerators'
import { useOmnibarTabGroups } from './useOmnibarTabGroups'
import { useOmnibarTabs } from './useOmnibarTabs'
import { getWindowSwitchCommands } from './omnibarResultGenerators.js'

export type WiredOmnibarProps = {
  className?: string
  onDismiss: () => void
  /** If true, hides the "Open Tab Manager" quick action (useful when already in Tab Manager) */
  hideTabManagerAction?: boolean
}

/**
 * A fully wired Omnibar component that internally uses the business logic hooks.
 * Use this in page variants (overlay, popup, embed, tab-manager) instead of
 * the "dumb" Omnibar from @extension/ui.
 */
export const WiredOmnibar = ({
  className,
  onDismiss,
  hideTabManagerAction,
}: WiredOmnibarProps) => {
  const tabs = useOmnibarTabs()
  const browserWindows = useBrowserWindows()
  const currentBrowserWindow = useCurrentBrowserWindow()
  const groups = useOmnibarTabGroups()
  const onSearch = useOmnibarExternalSearch()
  const windowCommands = useMemo(
    () =>
      getWindowSwitchCommands(
        browserWindows,
        tabs,
        Boolean(currentBrowserWindow?.incognito),
      ),
    [browserWindows, currentBrowserWindow?.incognito, tabs],
  )
  const generators = useOmnibarGenerators(windowCommands)
  const { data: platformInfo } = usePlatformInfo()
  const { data: commandShortcuts } = useCommandShortcuts()
  const isMac = platformInfo?.os === 'mac'
  const openTabManagerShortcut =
    commandShortcuts?.[TABBY_COMMANDS.openTabManager]

  const requestedWindowId = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const id = params.get('originalWindowId')
      return id ? parseInt(id, 10) : undefined
    }
    return undefined
  }, [])

  const [lastFocusedWindowId, setLastFocusedWindowId] = useState<
    number | undefined
  >(undefined)

  useEffect(() => {
    if (requestedWindowId !== undefined) return

    let cancelled = false
    void chrome.windows
      .getLastFocused()
      .then(({ id }) => {
        if (!cancelled && id !== undefined) setLastFocusedWindowId(id)
      })
      .catch((error) => {
        console.debug('Could not determine the originating browser window', {
          error,
        })
      })

    return () => {
      cancelled = true
    }
  }, [requestedWindowId])

  const originalWindowId = requestedWindowId ?? lastFocusedWindowId

  const onOpenTabManager = useCallback(async () => {
    const windowId =
      originalWindowId ?? (await chrome.windows.getLastFocused()).id
    if (windowId !== undefined) {
      await chrome.sidePanel.open({ windowId })
    }
  }, [originalWindowId])

  return (
    <Omnibar
      className={className}
      tabs={tabs}
      groups={groups}
      onSearch={onSearch}
      generators={generators}
      onDismiss={onDismiss}
      hideTabManagerAction={hideTabManagerAction}
      onOpenTabManager={onOpenTabManager}
      openTabManagerShortcut={openTabManagerShortcut}
      originalWindowId={originalWindowId}
      isMac={isMac}
    />
  )
}
