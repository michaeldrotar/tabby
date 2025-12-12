import { Omnibar } from '@extension/ui'

type SearchPopupProps = {
  isOpen: boolean
  onClose: () => void
}

export const SearchPopup = ({ isOpen, onClose }: SearchPopupProps) => {
  if (!isOpen) return null

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-overlay/70 pt-[10vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <Omnibar
        onDismiss={onClose}
        hideTabManagerAction
        className="max-h-[80vh] w-full max-w-lg overflow-hidden rounded-2xl border border-border/60 shadow-surface"
      />
    </div>
  )
}
