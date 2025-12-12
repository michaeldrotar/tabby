import { useThemeApplicator } from '@extension/shared'
import { Omnibar } from '@extension/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

export const OmnibarOverlay = () => {
  useThemeApplicator()

  const onDismiss = () => {
    window.parent.postMessage({ type: 'CLOSE_OMNIBAR' }, '*')
  }

  return (
    <div
      className="fixed inset-0 flex items-start justify-center bg-overlay/70 pt-[20vh] backdrop-blur-sm"
      onClick={onDismiss}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onDismiss()
      }}
    >
      <QueryClientProvider client={queryClient}>
        <Omnibar
          onDismiss={onDismiss}
          className="max-h-[75vh] w-[600px] max-w-[90vw] overflow-hidden rounded-2xl border border-border/60 shadow-surface"
        />
      </QueryClientProvider>
    </div>
  )
}
