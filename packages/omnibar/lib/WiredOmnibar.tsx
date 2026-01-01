import { Omnibar } from '@extension/ui/omnibar/Omnibar'
import { useCallback, useMemo } from 'react'
import { useOmnibarExternalSearch } from './useOmnibarExternalSearch'
import { useOmnibarGenerators } from './useOmnibarGenerators'
import { useOmnibarTabs } from './useOmnibarTabs'

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
  const onSearch = useOmnibarExternalSearch()
  const generators = useOmnibarGenerators()

  const originalWindowId = useMemo(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const id = params.get('originalWindowId')
      return id ? parseInt(id, 10) : undefined
    }
    return undefined
  }, [])

  const onOpenTabManager = useCallback(async () => {
    const windowId =
      originalWindowId ||
      (await chrome.windows.getLastFocused()).id ||
      undefined
    if (windowId) {
      await chrome.sidePanel.open({ windowId })
    }
  }, [originalWindowId])

  return (
    <Omnibar
      className={className}
      tabs={tabs}
      onSearch={onSearch}
      generators={generators}
      onDismiss={onDismiss}
      hideTabManagerAction={hideTabManagerAction}
      onOpenTabManager={onOpenTabManager}
      originalWindowId={originalWindowId}
    />
  )
}
