import { Favicon, TabSearch, useSearch } from '@extension/ui'
import type { SearchItem } from '@extension/ui'

export const SearchOverlay = () => {
  const { tabs, onSearch, onSelect } = useSearch()

  const onClose = () => {
    window.parent.postMessage({ type: 'CLOSE_SEARCH' }, '*')
  }

  const handleSelectWrapper = async (
    item: SearchItem,
    modifier?: 'new-tab' | 'new-window',
    originalWindowId?: number,
  ) => {
    await onSelect(item, modifier, originalWindowId)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-[20vh]"
      onClick={onClose}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
      }}
    >
      <TabSearch
        tabs={tabs}
        onSelect={handleSelectWrapper}
        onSearch={onSearch}
        onClose={onClose}
        Favicon={Favicon}
        className="max-h-[75vh] w-[600px] max-w-[90vw] rounded-xl border border-gray-200 shadow-2xl dark:border-gray-700"
      />
    </div>
  )
}
