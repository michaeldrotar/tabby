import { cn, TabSearch } from '@extension/ui'
import { useEffect, useState } from 'react'
import type { BrowserTab } from '@extension/chrome'

const SimpleFavicon = ({
  pageUrl,
  className,
}: {
  pageUrl?: string
  className?: string
}) => {
  if (!pageUrl)
    return <div className={cn('h-4 w-4 rounded bg-gray-200', className)} />

  let hostname = ''
  try {
    hostname = new URL(pageUrl).hostname
  } catch {
    return <div className={cn('h-4 w-4 rounded bg-gray-200', className)} />
  }

  const url = `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`

  return <img src={url} alt="favicon" className={cn('h-4 w-4', className)} />
}

export const SearchOverlay = ({
  onClose,
  initialTabs = [],
}: {
  onClose: () => void
  initialTabs?: BrowserTab[]
}) => {
  const [tabs, setTabs] = useState<BrowserTab[]>(initialTabs)

  useEffect(() => {
    if (initialTabs.length > 0) {
      setTabs(initialTabs)
    } else {
      // Fallback fetch tabs from background if not provided
      chrome.runtime.sendMessage({ type: 'GET_TABS' }).then((response) => {
        if (response) {
          setTabs(response)
        }
      })
    }
  }, [initialTabs])

  const handleSelectTab = async (tab: BrowserTab) => {
    // Send message to background to switch tab
    await chrome.runtime.sendMessage({
      type: 'SWITCH_TAB',
      tabId: tab.id,
      windowId: tab.windowId,
    })
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-[99999] flex items-start justify-center bg-black/20 pt-[20vh] backdrop-blur-sm"
      onClick={onClose}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <TabSearch
        tabs={tabs}
        onSelectTab={handleSelectTab}
        onClose={onClose}
        Favicon={SimpleFavicon}
        className="w-[600px] max-w-[90vw] rounded-xl border border-gray-200 shadow-2xl dark:border-gray-700"
      />
    </div>
  )
}
