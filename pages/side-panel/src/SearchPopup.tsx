import { Favicon } from './Favicon'
import { TabSearch, useSearch } from '@extension/ui'
import type { SearchItem } from '@extension/ui'

type SearchPopupProps = {
  isOpen: boolean
  onClose: () => void
}

export const SearchPopup = ({ isOpen, onClose }: SearchPopupProps) => {
  const { tabs, onSearch, onSelect } = useSearch()

  const handleSelectWrapper = async (
    item: SearchItem,
    modifier?: 'new-tab' | 'new-window',
    originalWindowId?: number,
  ) => {
    await onSelect(item, modifier, originalWindowId)
    onClose()
  }

  if (!isOpen) return null

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 pt-[15vh] backdrop-blur-sm dark:bg-black/50"
      onClick={onClose}
    >
      <TabSearch
        tabs={tabs}
        onSelect={handleSelectWrapper}
        onSearch={onSearch}
        onClose={onClose}
        Favicon={Favicon}
        className="max-h-[80vh] w-full max-w-lg rounded-xl border border-gray-200 shadow-2xl dark:border-gray-700"
      />
    </div>
  )
}
