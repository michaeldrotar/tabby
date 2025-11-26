import { Favicon, Omnibar, useOmnibar } from '@extension/ui'
import type { SearchItem } from '@extension/ui'

export const OmnibarOverlay = () => {
  const { tabs, onSearch, onSelect } = useOmnibar()

  const onClose = () => {
    window.parent.postMessage({ type: 'CLOSE_OMNIBAR' }, '*')
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
      <Omnibar
        tabs={tabs}
        onSelect={handleSelectWrapper}
        onSearch={onSearch}
        onClose={onClose}
        Favicon={Favicon}
        className="max-h-[75vh] w-[600px] max-w-[90vw] rounded-xl border border-gray-300 shadow-2xl dark:border-gray-700"
      />
    </div>
  )
}
