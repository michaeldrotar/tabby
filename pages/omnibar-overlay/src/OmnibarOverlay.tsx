import { Omnibar } from '@extension/ui'

export const OmnibarOverlay = () => {
  const onDismiss = () => {
    window.parent.postMessage({ type: 'CLOSE_OMNIBAR' }, '*')
  }

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-[20vh]"
      onClick={onDismiss}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onDismiss()
      }}
    >
      <Omnibar
        onDismiss={onDismiss}
        className="max-h-[75vh] w-[600px] max-w-[90vw] rounded-xl border border-gray-200 shadow-2xl dark:border-gray-700"
      />
    </div>
  )
}
