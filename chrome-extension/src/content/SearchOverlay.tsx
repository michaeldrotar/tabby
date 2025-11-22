import { cn, TabSearch, useSearch } from '@extension/ui'
import type { BrowserTab } from '@extension/chrome'
import type { SearchItem } from '@extension/ui'

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
