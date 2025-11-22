import { cn, TabSearch, useSearch } from '@extension/ui'
import type { BrowserTab } from '@extension/chrome'
import type { SearchItem } from '@extension/ui'

const SimpleFavicon = ({
  pageUrl,
  favIconUrl,
  className,
}: {
  pageUrl?: string
  favIconUrl?: string
  className?: string
}) => {
  // Use the _favicon helper for consistent favicon loading
  // This handles caching, fallbacks, and avoids CORS issues with direct fetching
  // It also works for chrome:// pages which we can't access directly
  const src =
    favIconUrl && !favIconUrl.startsWith('chrome')
      ? favIconUrl
      : pageUrl
        ? chrome.runtime.getURL(
            `_favicon/?pageUrl=${encodeURIComponent(pageUrl)}&size=32`,
          )
        : undefined

  if (src) {
    return <img src={src} alt="favicon" className={cn('h-8 w-8', className)} />
  }

  return <div className={cn('h-7 w-7 rounded bg-gray-200', className)} />
}

export const SearchOverlay = ({
  onClose,
}: {
  onClose: () => void
  initialTabs?: BrowserTab[]
}) => {
  const { tabs, onSearch, onSelect } = useSearch()

  const handleSelect = async (
    item: SearchItem,
    modifier?: 'new-tab' | 'new-window',
    originalWindowId?: number,
  ) => {
    await onSelect(item, modifier, originalWindowId)
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
        onSelect={handleSelect}
        onSearch={onSearch}
        onClose={onClose}
        Favicon={SimpleFavicon}
        className="max-h-[75vh] w-[600px] max-w-[90vw] rounded-xl border border-gray-200 shadow-2xl dark:border-gray-700"
      />
    </div>
  )
}
