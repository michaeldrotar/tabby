import { Favicon } from './Favicon'
import { useBrowserTabs } from '@extension/chrome'
import { TabSearch } from '@extension/ui'
import type { BrowserTab } from '@extension/chrome'

type SearchPopupProps = {
  isOpen: boolean
  onClose: () => void
}

export const SearchPopup = ({ isOpen, onClose }: SearchPopupProps) => {
  const tabs = useBrowserTabs()

  const handleSelectTab = async (tab: BrowserTab) => {
    if (typeof tab.windowId === 'number') {
      await chrome.windows.update(tab.windowId, { focused: true })
    }
    if (typeof tab.id === 'number') {
      await chrome.tabs.update(tab.id, { active: true })
    }
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
        onSelectTab={handleSelectTab}
        onClose={onClose}
        Favicon={Favicon}
        className="w-full max-w-lg rounded-xl border border-gray-200 shadow-2xl dark:border-gray-700"
      />
    </div>
  )
}
