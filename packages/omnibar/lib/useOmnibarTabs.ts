import { activateTab } from '@extension/chrome/actions/tabs/activateTab'
import { focusWindow } from '@extension/chrome/actions/windows/focusWindow'
import { useBrowserTabs } from '@extension/chrome/tab/useBrowserTabs'
import { useMemo } from 'react'
import type { BrowserTab } from '@extension/chrome/tab/BrowserTab'
import type { OmnibarSearchResult } from '@extension/ui/omnibar/OmnibarSearchResult'

const toOmnibarSearchResult = (tab: BrowserTab): OmnibarSearchResult => ({
  id: tab.id,
  type: 'tab',
  title: tab.title || 'Untitled',
  url: tab.url,
  favIconUrl: tab.favIconUrl,
  windowId: tab.windowId,
  tabId: tab.id,
  lastVisitTime: tab.lastAccessed,
  execute: async () => {
    if (tab.windowId) {
      await focusWindow(tab.windowId)
    }
    await activateTab(tab.id)
  },
})

/**
 * Provides browser tabs formatted as OmnibarSearchResult for the Omnibar component.
 *
 * This hook subscribes to the reactive browser store and returns tabs
 * in the format expected by the Omnibar component.
 *
 * @example
 * const tabs = useOmnibarTabs()
 * return <Omnibar tabs={tabs} onDismiss={handleDismiss} />
 */
export const useOmnibarTabs = (): OmnibarSearchResult[] => {
  const browserTabs = useBrowserTabs()

  return useMemo(() => browserTabs.map(toOmnibarSearchResult), [browserTabs])
}
