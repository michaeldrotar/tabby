import { Favicon } from './Favicon'
import { useBrowserTabs } from '@extension/chrome'
import { TabSearch } from '@extension/ui'
import { useEffect } from 'react'
import type { BrowserTab } from '@extension/chrome'

export const SearchPage = () => {
  const tabs = useBrowserTabs()

  // Close window on blur
  useEffect(() => {
    const handleBlur = () => {
      window.close()
    }
    window.addEventListener('blur', handleBlur)
    return () => window.removeEventListener('blur', handleBlur)
  }, [])

  const handleSelectTab = async (tab: BrowserTab) => {
    if (typeof tab.windowId === 'number') {
      await chrome.windows.update(tab.windowId, { focused: true })
    }
    if (typeof tab.id === 'number') {
      await chrome.tabs.update(tab.id, { active: true })
    }
    window.close()
  }

  return (
    <TabSearch
      tabs={tabs}
      onSelectTab={handleSelectTab}
      onClose={() => window.close()}
      Favicon={Favicon}
      className="h-screen w-screen"
    />
  )
}
