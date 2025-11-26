import { Favicon, Omnibar, useOmnibar } from '@extension/ui'
import { useEffect } from 'react'
import type { SearchItem } from '@extension/ui'

export const OmnibarPopup = () => {
  const { tabs, onSearch, onSelect } = useOmnibar()

  // Close window on blur
  useEffect(() => {
    const handleBlur = () => {
      window.close()
    }
    window.addEventListener('blur', handleBlur)
    return () => window.removeEventListener('blur', handleBlur)
  }, [])

  const handleSelectWrapper = async (
    item: SearchItem,
    modifier?: 'new-tab' | 'new-window',
    originalWindowId?: number,
  ) => {
    await onSelect(item, modifier, originalWindowId)
    window.close()
  }

  return (
    <Omnibar
      tabs={tabs}
      onSelect={handleSelectWrapper}
      onSearch={onSearch}
      onClose={() => window.close()}
      Favicon={Favicon}
      className="h-screen w-screen"
    />
  )
}
